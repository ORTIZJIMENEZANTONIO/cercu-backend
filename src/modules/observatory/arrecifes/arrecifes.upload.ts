import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Capas geoespaciales: GeoJSON / Shapefile (zip) / GeoTIFF / KML / CSV / COG.
// Almacenadas en uploads/layers/ — servidas estáticas en /uploads/layers/...
// y/o vía /observatory/arrecifes/layers/:id/download (con Content-Disposition).
const layersDir = path.join(__dirname, '../../../../uploads/layers');
if (!fs.existsSync(layersDir)) fs.mkdirSync(layersDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, layersDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Mimes y extensiones aceptadas. multer reporta mime de browser (a veces vacío
// p/ shapefile zip), así que validamos también por extensión.
const allowedMimes = new Set([
  'application/json',
  'application/geo+json',
  'application/vnd.google-earth.kml+xml',
  'application/vnd.google-earth.kmz',
  'application/zip',
  'application/x-zip-compressed',
  'image/tiff',
  'text/csv',
  'text/plain',
  'application/octet-stream',
]);
const allowedExts = new Set([
  '.geojson',
  '.json',
  '.kml',
  '.kmz',
  '.zip', // shapefile bundle
  '.tif',
  '.tiff',
  '.csv',
]);

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.has(ext) || allowedMimes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato no permitido (${file.mimetype || ext}). Aceptados: GeoJSON, KML, KMZ, Shapefile (zip), GeoTIFF, CSV.`));
  }
};

export const uploadLayerFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
}).single('file');
