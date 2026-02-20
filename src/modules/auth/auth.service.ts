import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { AppDataSource } from '../../ormconfig';
import { User, UserRole, AuthProvider } from '../../entities/User';
import { OtpCode } from '../../entities/OtpCode';
import { RefreshToken } from '../../entities/RefreshToken';
import { Wallet } from '../../entities/Wallet';
import { config } from '../../config';
import { normalizePhoneMX } from '../../utils/phone';
import { signAccessToken, signRefreshToken, verifyToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler.middleware';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private otpRepo = AppDataSource.getRepository(OtpCode);
  private refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
  private walletRepo = AppDataSource.getRepository(Wallet);

  async requestOtp(phone: string) {
    const normalizedPhone = normalizePhoneMX(phone);

    // Check rate limit: max 5 OTPs per phone per hour (skip in dev)
    if (process.env.NODE_ENV !== 'development') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await this.otpRepo
        .createQueryBuilder('otp')
        .where('otp.phone = :phone', { phone: normalizedPhone })
        .andWhere('otp.createdAt > :oneHourAgo', { oneHourAgo })
        .getCount();

      if (recentCount >= 5) {
        throw new AppError('Too many OTP requests. Try again in an hour.', 429);
      }
    }

    // Generate code (mock: always 1234)
    const code = config.otp.mock ? config.otp.mockCode : Math.floor(1000 + Math.random() * 9000).toString();

    const otp = this.otpRepo.create({
      phone: normalizedPhone,
      code,
      expiresAt: new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000),
    });
    await this.otpRepo.save(otp);

    return { message: 'OTP sent successfully', phone: normalizedPhone };
  }

  async verifyOtp(phone: string, code: string, name?: string, email?: string, dateOfBirth?: string) {
    const normalizedPhone = normalizePhoneMX(phone);

    const otp = await this.otpRepo.findOne({
      where: { phone: normalizedPhone, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new AppError('No pending OTP found', 400);
    }

    if (process.env.NODE_ENV !== 'development' && otp.attempts >= 3) {
      throw new AppError('Too many attempts. Request a new OTP.', 429);
    }

    if (new Date() > otp.expiresAt) {
      throw new AppError('OTP expired', 400);
    }

    if (otp.code !== code) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      throw new AppError('Invalid OTP code', 400);
    }

    // Mark OTP as used
    otp.used = true;
    await this.otpRepo.save(otp);

    // Find or create user
    let user = await this.userRepo.findOne({
      where: { phone: normalizedPhone },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = this.userRepo.create({
        id: uuidv4(),
        phone: normalizedPhone,
        name: name || null,
        email: email || null,
        dateOfBirth: dateOfBirth || null,
        authProvider: AuthProvider.PHONE,
        role: UserRole.USER,
        phoneVerified: true,
        isActive: true,
      });
      user = await this.userRepo.save(user);

      // Create wallet for new user
      const wallet = this.walletRepo.create({
        userId: user.id,
        balance: 0,
        totalLoaded: 0,
        totalSpent: 0,
      });
      await this.walletRepo.save(wallet);
    } else {
      if (!user.phoneVerified) {
        user.phoneVerified = true;
        await this.userRepo.save(user);
      }
    }

    // Generate tokens
    const tokenPayload = { id: user.id, phone: user.phone, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token hash
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
      isNewUser,
    };
  }

  async googleLogin(credential: string, name?: string, dateOfBirth?: string) {
    const client = new OAuth2Client(config.google.clientId);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError('Invalid Google credential', 401);
    }

    if (!payload || !payload.sub) {
      throw new AppError('Invalid Google token payload', 401);
    }

    const googleId = payload.sub;
    const googleEmail = payload.email || null;
    const googleName = payload.name || name || null;
    const googlePicture = payload.picture || null;

    // Find user by googleId or email
    let user = await this.userRepo.findOne({ where: { googleId } });
    if (!user && googleEmail) {
      user = await this.userRepo.findOne({ where: { email: googleEmail } });
    }

    let isNewUser = false;
    if (!user) {
      // Create new user
      isNewUser = true;
      user = this.userRepo.create({
        id: uuidv4(),
        phone: `google_${googleId}`,
        name: googleName,
        email: googleEmail,
        dateOfBirth: dateOfBirth || null,
        googleId,
        authProvider: AuthProvider.GOOGLE,
        profilePicture: googlePicture,
        role: UserRole.USER,
        phoneVerified: false,
        isActive: true,
      });
      user = await this.userRepo.save(user);

      // Create wallet
      const wallet = this.walletRepo.create({
        userId: user.id,
        balance: 0,
        totalLoaded: 0,
        totalSpent: 0,
      });
      await this.walletRepo.save(wallet);
    } else {
      // Link Google to existing account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = AuthProvider.GOOGLE;
      }
      if (googlePicture && !user.profilePicture) {
        user.profilePicture = googlePicture;
      }
      if (googleEmail && !user.email) {
        user.email = googleEmail;
      }
      await this.userRepo.save(user);
    }

    // Generate tokens
    const tokenPayload = { id: user.id, phone: user.phone, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
      isNewUser,
    };
  }

  async refreshTokens(refreshToken: string) {
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    // Find valid stored token
    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId: decoded.id, revoked: false },
    });

    let validToken = null;
    for (const st of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, st.tokenHash);
      if (isMatch) {
        validToken = st;
        break;
      }
    }

    if (!validToken) {
      throw new AppError('Refresh token not found or revoked', 401);
    }

    // Revoke old token (rotation)
    validToken.revoked = true;
    await this.refreshTokenRepo.save(validToken);

    const user = await this.userRepo.findOne({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Issue new pair
    const tokenPayload = { id: user.id, phone: user.phone, role: user.role };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    const tokenHash = await bcrypt.hash(newRefreshToken, 10);
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken: string) {
    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId, revoked: false },
    });

    for (const st of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, st.tokenHash);
      if (isMatch) {
        st.revoked = true;
        await this.refreshTokenRepo.save(st);
        break;
      }
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: [
        'professionalProfile',
        'professionalProfile.categories',
        'professionalProfile.categories.category',
        'professionalProfile.scheduleSlots',
        'wallet',
      ],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const profile = user.professionalProfile;

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      authProvider: user.authProvider,
      profilePicture: user.profilePicture,
      role: user.role,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
      isFlagged: user.isFlagged,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      hasProfessionalProfile: !!profile,
      professionalOnboardingStatus: profile?.onboardingStatus || null,
      professionalProfile: profile
        ? {
            id: profile.id,
            businessName: profile.businessName,
            description: profile.description,
            rating: Number(profile.rating),
            completedJobs: profile.completedJobs,
            onboardingStatus: profile.onboardingStatus,
            isAvailable: profile.isAvailable,
            serviceRadiusKm: profile.serviceRadiusKm,
            badges: profile.badges,
            categories: profile.categories.map((pc) => ({
              id: pc.category.id,
              name: pc.category.name,
              icon: pc.category.icon,
            })),
            scheduleSlots: profile.scheduleSlots.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          }
        : null,
      createdAt: user.createdAt,
    };
  }
}