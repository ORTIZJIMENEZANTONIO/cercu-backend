import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  entities: [__dirname + '/entities/**/*.{ts,js}'],
  migrations: [__dirname + '/migrations/**/*.{ts,js}'],
  charset: 'utf8mb4_unicode_ci',
  extra: {
    connectionLimit: 10,
  },
});