// PM2 ecosystem para cercu-backend (puerto 3003).
//
// Uso en el VPS:
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup    # auto-arranque al boot del servidor
//
// Heap de Node:
// El detector de invasión costera (arrecifes) procesa miles de polígonos
// turf en memoria (zofemat union × buildings × 12 reefs). Con el heap default
// de V8 (~1.5 GB en Node 20+) basta, pero subirlo a 2GB da margen para futuros
// jobs (snapshots, batch NDBI, scrapers de noticias).
//
// `max_memory_restart` es el LÍMITE DURO de PM2 — si el proceso pasa de ahí,
// pm2 lo mata y reinicia. Lo dejamos por encima del heap para que no compita.

module.exports = {
  apps: [
    {
      name: 'cercu-backend',
      script: 'dist/index.js',
      cwd: '/var/www/cercu-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
      },
      // Sube el heap de V8 a 2GB para dejar espacio al detector + scrapers +
      // batch endpoints de NASA POWER.
      node_args: '--max-old-space-size=2048',

      // PM2 mata el proceso si supera 2.5GB residentes — protege al VPS de un
      // OOM que se lleve por delante a otros servicios (frontends, mysql).
      max_memory_restart: '2500M',

      // Reinicio exponencial si el proceso peta repetidamente — evita loops.
      max_restarts: 10,
      min_uptime: 10_000,         // 10s mínimo "vivo" para contar como exitoso
      restart_delay: 4_000,       // espera 4s antes de reintentar

      // Logs a PM2 con timestamps.
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/var/log/pm2/cercu-backend-out-0.log',
      error_file: '/var/log/pm2/cercu-backend-error-0.log',
      merge_logs: true,
    },
  ],
}
