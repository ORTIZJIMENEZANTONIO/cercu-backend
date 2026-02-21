import 'reflect-metadata';
import { createApp } from './app';
import { config } from './config';
import { AppDataSource } from './ormconfig';
import { initCronJobs } from './jobs';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    initCronJobs();

    const app = createApp();

    app.listen(config.port, () => {
      console.log(`CERCU API running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();