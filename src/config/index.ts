import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'cercu',
    password: process.env.DB_PASSWORD || 'cercu_dev_2024',
    database: process.env.DB_DATABASE || 'cercu_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  otp: {
    mock: process.env.OTP_MOCK === 'true',
    mockCode: process.env.OTP_MOCK_CODE || '1234',
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',').map(s => s.trim()),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  observatory: {
    adminEmail: process.env.OBS_ADMIN_EMAIL || 'admin@observatorio.cdmx',
    adminPassword: process.env.OBS_ADMIN_PASSWORD || '',
    adminName: process.env.OBS_ADMIN_NAME || 'Admin Observatorios',
  },
};