declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone?: string;
        email?: string;
        role: string;
        adminRole?: 'superadmin' | 'admin' | 'editor';
        adminObservatories?: string[];
      };
    }
  }
}

export {};