import { AppDataSource } from '../../ormconfig';
import { User, UserRole } from '../../entities/User';
import { AppError } from '../../middleware/errorHandler.middleware';

export class UsersService {
  private userRepo = AppDataSource.getRepository(User);

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });
    if (!user) throw new AppError('User not found', 404);

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
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; dateOfBirth?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.dateOfBirth) user.dateOfBirth = data.dateOfBirth;

    return this.userRepo.save(user);
  }

  async updateProfilePicture(userId: string, filePath: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    user.profilePicture = `/uploads/${filePath}`;
    await this.userRepo.save(user);

    return { profilePicture: user.profilePicture };
  }

  async upgradeToProRole(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (user.role === UserRole.PROFESSIONAL) {
      throw new AppError('User is already a professional', 400);
    }

    user.role = UserRole.PROFESSIONAL;
    return this.userRepo.save(user);
  }
}