import 'reflect-metadata';
import { createApp } from './app';
import { config } from './config';
import { AppDataSource } from './ormconfig';
import { initCronJobs } from './jobs';

// Capturamos errores globales para que un job background que crashea (ej.
// detector costero) deje stack trace en pm2 logs en lugar de matar el proceso
// silenciosamente y dejar a los clientes con polling 502 → 404.
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // No salimos — Node 15+ por default sí mata el proceso, lo cual reinicia
  // PM2 y pierde los jobs en memoria. Aquí lo logueamos pero seguimos.
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Sí salimos en este caso — el estado del proceso es inconsistente.
  // PM2 reinicia y los clientes ven 502 momentáneo + 404 al re-polling
  // (ya manejado en el frontend del detector con recargar la lista).
  process.exit(1);
});

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