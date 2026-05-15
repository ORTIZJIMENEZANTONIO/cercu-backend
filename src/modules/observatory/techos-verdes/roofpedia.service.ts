/**
 * RoofpediaService — orquesta jobs de detección CNN de techos verdes por alcaldía.
 *
 * Arquitectura (Opción A):
 * - Subprocess Python ejecutado on-demand desde el backend Node.
 * - Solo 1 job con status='running' por observatorio a la vez (CPU/IO bound).
 * - El subprocess escribe a `${LOG_DIR}/{publicId}.log`; el job guarda el path
 *   para que el frontend pueda hacer tail vía endpoint dedicado.
 * - Al terminar, on-exit handler copia outputs a la carpeta pública del frontend
 *   para que `/admin/roofpedia/{slug}` los pueda mostrar vía iframe.
 *
 * Variables de entorno requeridas:
 *   ROOFPEDIA_PYTHON_BIN     — path al binario Python (default: 'python3')
 *   ROOFPEDIA_REPO_PATH      — path absoluto al clon de Roofpedia (ej. /opt/roofpedia)
 *   ROOFPEDIA_LOG_DIR        — donde guardar logs (default: /var/log/roofpedia)
 *   ROOFPEDIA_PUBLIC_DEST    — carpeta `public/roofpedia/` del frontend desplegado
 *                              (default: /var/www/cercu-frontend/observatorio-techos-verdes/public/roofpedia)
 *   ROOFPEDIA_SCAN_SCRIPT    — script relativo al repo (default: tools/scan_alcaldia.py)
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs, createWriteStream } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../../ormconfig';
import {
  RoofpediaJob,
  RoofpediaJobStatus,
} from '../../../entities/observatory/RoofpediaJob';
import { AppError } from '../../../middleware/errorHandler.middleware';

const jobRepo = () => AppDataSource.getRepository(RoofpediaJob);

const PYTHON_BIN = process.env.ROOFPEDIA_PYTHON_BIN || 'python3';
const REPO_PATH = process.env.ROOFPEDIA_REPO_PATH || '/opt/roofpedia';
const LOG_DIR = process.env.ROOFPEDIA_LOG_DIR || '/var/log/roofpedia';
const PUBLIC_DEST =
  process.env.ROOFPEDIA_PUBLIC_DEST ||
  '/var/www/cercu-frontend/observatorio-techos-verdes/public/roofpedia';
const SCAN_SCRIPT = process.env.ROOFPEDIA_SCAN_SCRIPT || 'tools/scan_alcaldia.py';
const GALLERY_SCRIPT =
  process.env.ROOFPEDIA_GALLERY_SCRIPT || 'tools/build_inspection_gallery.py';

// PIDs vivos en memoria (para cancel sin tocar la DB cada vez).
const livePids = new Map<string, ChildProcess>();

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Reproduce el slug que `tools/scan_alcaldia.py` genera: `slugify().capitalize()`.
 * En Python `str.capitalize()` deja la 1ª letra en mayúscula y el resto en
 * minúsculas. Ej: "Álvaro Obregón" → "alvaro-obregon" → "Alvaro-obregon".
 * El script Python escribe outputs en `results/04Results/{pythonSlug}_Green.geojson`
 * y la galería en `results/inspection/{pythonSlug}/`.
 */
function pythonSlug(nombre: string): string {
  const s = slugify(nombre);
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// ── API ─────────────────────────────────────────────────────────────────────

export interface StartScanInput {
  observatory: string;
  alcaldiaNombre: string;
  requestedBy: string;
  costEstimateUsd?: number;
}

/**
 * Encola y arranca un scan. Falla si ya hay otro running en el mismo observatorio.
 */
export async function startScan(input: StartScanInput): Promise<RoofpediaJob> {
  const { observatory, alcaldiaNombre, requestedBy } = input;
  const alcaldiaSlug = slugify(alcaldiaNombre);

  // Lock global — 1 job running por observatorio.
  const running = await jobRepo().findOne({
    where: { observatory, status: RoofpediaJobStatus.RUNNING },
  });
  if (running) {
    throw new AppError(
      `Ya hay un análisis en curso (${running.alcaldiaNombre}, job ${running.publicId}). Espera o cancélalo antes de iniciar otro.`,
      409,
    );
  }

  await ensureDir(LOG_DIR);
  const publicId = uuidv4();
  const logPath = path.join(LOG_DIR, `${publicId}.log`);

  const job = jobRepo().create({
    publicId,
    observatory,
    alcaldiaSlug,
    alcaldiaNombre,
    status: RoofpediaJobStatus.PENDING,
    requestedBy,
    costEstimateUsd: input.costEstimateUsd ?? 0,
    logPath,
  });
  const saved = await jobRepo().save(job);

  // Disparar subprocess sin bloquear la respuesta HTTP.
  setImmediate(() => spawnScan(saved.publicId).catch((err) => {
    // No tirar el server si el spawner falla; el job queda como failed.
    // eslint-disable-next-line no-console
    console.error(`[Roofpedia] Error al arrancar job ${saved.publicId}:`, err);
  }));

  return saved;
}

/**
 * Arranca el subprocess Python y conecta listeners para actualizar el job en DB.
 */
async function spawnScan(publicId: string): Promise<void> {
  const job = await jobRepo().findOne({ where: { publicId } });
  if (!job) return;
  if (job.status !== RoofpediaJobStatus.PENDING) return;

  // Validar que el script existe antes de spawn (mensaje de error claro).
  const scriptAbs = path.join(REPO_PATH, SCAN_SCRIPT);
  try {
    await fs.access(scriptAbs);
  } catch {
    job.status = RoofpediaJobStatus.FAILED;
    job.errorMessage = `Script no encontrado: ${scriptAbs}. Configura ROOFPEDIA_REPO_PATH y ROOFPEDIA_SCAN_SCRIPT.`;
    job.finishedAt = new Date();
    await jobRepo().save(job);
    return;
  }

  const logStream = createWriteStream(job.logPath!, { flags: 'a' });
  logStream.write(
    `[${new Date().toISOString()}] Iniciando scan de ${job.alcaldiaNombre}\n`,
  );
  logStream.write(`[cmd] ${PYTHON_BIN} ${scriptAbs} ${job.alcaldiaNombre}\n`);

  const proc = spawn(PYTHON_BIN, [scriptAbs, job.alcaldiaNombre], {
    cwd: REPO_PATH,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });

  livePids.set(publicId, proc);

  job.status = RoofpediaJobStatus.RUNNING;
  job.pid = proc.pid ?? null;
  job.startedAt = new Date();
  await jobRepo().save(job);

  proc.stdout?.pipe(logStream, { end: false });
  proc.stderr?.pipe(logStream, { end: false });

  proc.on('error', async (err) => {
    logStream.write(`[error] ${err.message}\n`);
  });

  proc.on('exit', async (code, signal) => {
    livePids.delete(publicId);
    logStream.write(`[${new Date().toISOString()}] exit code=${code} signal=${signal}\n`);
    logStream.end();

    const fresh = await jobRepo().findOne({ where: { publicId } });
    if (!fresh) return;

    // No sobrescribir si fue cancelado manualmente.
    if (fresh.status === RoofpediaJobStatus.CANCELLED) return;

    fresh.finishedAt = new Date();
    fresh.pid = null;

    if (code === 0) {
      try {
        // El scan no genera la galería de inspección — la encadenamos aquí.
        await runGallery(fresh.alcaldiaNombre, fresh.logPath!);
        const result = await publishResults(fresh.alcaldiaSlug, fresh.alcaldiaNombre);
        fresh.status = RoofpediaJobStatus.DONE;
        fresh.result = result;
      } catch (err: any) {
        fresh.status = RoofpediaJobStatus.FAILED;
        fresh.errorMessage = `Scan OK pero falló post-procesamiento: ${err?.message || err}`.slice(0, 500);
      }
    } else {
      fresh.status = RoofpediaJobStatus.FAILED;
      fresh.errorMessage = `Subprocess salió con code=${code} signal=${signal ?? 'null'}. Ver log en ${fresh.logPath}.`.slice(0, 500);
    }

    await jobRepo().save(fresh);
  });
}

/**
 * Ejecuta `build_inspection_gallery.py` con el slug Python después del scan.
 * Append al mismo log file para que el frontend siga viendo progreso.
 */
async function runGallery(alcaldiaNombre: string, logPath: string): Promise<void> {
  const scriptAbs = path.join(REPO_PATH, GALLERY_SCRIPT);
  try {
    await fs.access(scriptAbs);
  } catch {
    throw new Error(`Gallery script no encontrado: ${scriptAbs}`);
  }
  const slug = pythonSlug(alcaldiaNombre);
  const logStream = createWriteStream(logPath, { flags: 'a' });
  logStream.write(`\n[${new Date().toISOString()}] Generando galería para ${slug}\n`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [scriptAbs, slug], {
      cwd: REPO_PATH,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });
    proc.stdout?.pipe(logStream, { end: false });
    proc.stderr?.pipe(logStream, { end: false });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      logStream.write(`[${new Date().toISOString()}] gallery exit=${code}\n`);
      logStream.end();
      code === 0 ? resolve() : reject(new Error(`Gallery exit code=${code}`));
    });
  });
}

/**
 * Copia outputs `${REPO_PATH}/results/inspection/{pythonSlug}` y el GeoJSON a
 * `${PUBLIC_DEST}/{frontendSlug}`. El frontend ya sirve estáticamente esa
 * carpeta. El nombre de destino usa el `frontendSlug` (URL-safe, p.ej.
 * `alvaro-obregon`), aunque la fuente esté en `Alvaro-obregon`.
 */
async function publishResults(
  frontendSlug: string,
  alcaldiaNombre: string,
): Promise<Record<string, any>> {
  const pySlug = pythonSlug(alcaldiaNombre);
  const inspectionDir = path.join(REPO_PATH, 'results', 'inspection', pySlug);
  const destDir = path.join(PUBLIC_DEST, frontendSlug);

  await copyDirRecursive(inspectionDir, destDir);

  // Copiar también el GeoJSON al lado del index.html para descarga directa.
  // El nombre del archivo en la URL pública usa el nombre canónico de la
  // alcaldía (con acentos) — coincide con lo que la página admin enlaza.
  const geojsonSrc = path.join(
    REPO_PATH,
    'results',
    '04Results',
    `${pySlug}_Green.geojson`,
  );
  let geojsonCopied = false;
  try {
    await fs.copyFile(
      geojsonSrc,
      path.join(destDir, `${alcaldiaNombre}_Green.geojson`),
    );
    geojsonCopied = true;
  } catch {
    // GeoJSON puede no existir si el modelo no detectó nada. No es fatal.
  }

  const composites = (await fs.readdir(destDir).catch(() => []))
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg')).length;

  return {
    publishedTo: destDir,
    composites,
    geojsonCopied,
    publishedAt: new Date().toISOString(),
  };
}

// ── Reads ───────────────────────────────────────────────────────────────────

export async function getJobByPublicId(publicId: string): Promise<RoofpediaJob> {
  const job = await jobRepo().findOne({ where: { publicId } });
  if (!job) throw new AppError('Job no encontrado', 404);
  return job;
}

export async function listJobs(filters: {
  observatory: string;
  status?: RoofpediaJobStatus;
  limit?: number;
}): Promise<{ items: RoofpediaJob[]; total: number }> {
  const qb = jobRepo()
    .createQueryBuilder('j')
    .where('j.observatory = :obs', { obs: filters.observatory });
  if (filters.status) qb.andWhere('j.status = :st', { st: filters.status });
  qb.orderBy('j.createdAt', 'DESC').limit(filters.limit ?? 50);
  const [items, total] = await qb.getManyAndCount();
  return { items, total };
}

export async function getRunningJob(observatory: string): Promise<RoofpediaJob | null> {
  return jobRepo().findOne({
    where: { observatory, status: RoofpediaJobStatus.RUNNING },
  });
}

/** Tail de log: últimas N líneas (default 200). */
export async function tailLog(publicId: string, lines = 200): Promise<string> {
  const job = await getJobByPublicId(publicId);
  if (!job.logPath) return '';
  try {
    const data = await fs.readFile(job.logPath, 'utf8');
    const all = data.split('\n');
    return all.slice(-lines).join('\n');
  } catch {
    return '';
  }
}

// ── Cancel ──────────────────────────────────────────────────────────────────

export async function cancelJob(publicId: string): Promise<RoofpediaJob> {
  const job = await getJobByPublicId(publicId);
  if (job.status !== RoofpediaJobStatus.RUNNING && job.status !== RoofpediaJobStatus.PENDING) {
    throw new AppError(`Job en estado ${job.status} — no se puede cancelar`, 409);
  }
  const proc = livePids.get(publicId);
  if (proc) {
    try {
      proc.kill('SIGTERM');
      // grace period antes de SIGKILL
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL');
      }, 5000);
    } catch {
      // proc ya estaba muerto
    }
    livePids.delete(publicId);
  }
  job.status = RoofpediaJobStatus.CANCELLED;
  job.finishedAt = new Date();
  job.pid = null;
  return jobRepo().save(job);
}
