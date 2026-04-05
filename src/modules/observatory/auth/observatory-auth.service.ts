import bcrypt from "bcryptjs";
import { AppDataSource } from "../../../ormconfig";
import { ObservatoryAdmin } from "../../../entities/observatory/ObservatoryAdmin";
import { signAccessToken, signRefreshToken } from "../../../utils/jwt";
import { AppError } from "../../../middleware/errorHandler.middleware";

const repo = () => AppDataSource.getRepository(ObservatoryAdmin);

export class ObservatoryAuthService {
  async login(email: string, password: string) {
    const admin = await repo().findOne({ where: { email } });
    if (!admin) {
      throw new AppError("Credenciales invalidas", 401);
    }

    if (!admin.isActive) {
      throw new AppError("Cuenta desactivada", 403);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new AppError("Credenciales invalidas", 401);
    }

    const payload = {
      id: admin.id,
      email: admin.email,
      role: "observatory_admin",
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        observatories: admin.observatories,
      },
    };
  }

  async me(adminId: string) {
    const admin = await repo().findOne({ where: { id: adminId } });
    if (!admin) {
      throw new AppError("Admin no encontrado", 404);
    }
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      observatories: admin.observatories,
    };
  }
}
