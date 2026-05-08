// Token JWT-bearer para Google Earth Engine REST API. Usado por
// `remote-sensing.service.ts` y `coastalIntrusion.service.ts` (Fase 2 NDBI).
// Devuelve null si las credenciales no están configuradas en .env — los
// llamadores deben tratar null como "GEE no disponible" y degradar.
import crypto from 'crypto';
import { config } from '../config';

export const getGEEToken = async (): Promise<string | null> => {
  if (!config.gee.serviceAccountKey || !config.gee.projectId) return null;
  try {
    const key = JSON.parse(config.gee.serviceAccountKey);
    const now = Math.floor(Date.now() / 1000);

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/earthengine',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(key.private_key, 'base64url');

    const jwt = `${header}.${payload}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json() as any;
    return data?.access_token || null;
  } catch (e) {
    console.warn('[GEE] Token error:', (e as Error).message);
    return null;
  }
};
