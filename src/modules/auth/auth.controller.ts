import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async requestOtp(req: Request, res: Response) {
    const result = await authService.requestOtp(req.body.phone);
    res.json({ success: true, data: result });
  }

  async verifyOtp(req: Request, res: Response) {
    const { phone, code, name, email, dateOfBirth } = req.body;
    const result = await authService.verifyOtp(phone, code, name, email, dateOfBirth);
    res.json({ success: true, data: result });
  }

  async googleAuth(req: Request, res: Response) {
    const { credential, name, dateOfBirth } = req.body;
    const result = await authService.googleLogin(credential, name, dateOfBirth);
    res.json({ success: true, data: result });
  }

  async refresh(req: Request, res: Response) {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: result });
  }

  async logout(req: Request, res: Response) {
    const result = await authService.logout(req.user!.id, req.body.refreshToken);
    res.json({ success: true, data: result });
  }

  async me(req: Request, res: Response) {
    const result = await authService.getMe(req.user!.id);
    res.json({ success: true, data: result });
  }
}