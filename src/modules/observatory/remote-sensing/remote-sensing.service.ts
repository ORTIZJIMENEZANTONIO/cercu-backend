import { config } from '../../../config';
import crypto from 'crypto';

interface IndicesRequest {
  lat: number;
  lng: number;
  alcaldia?: string;
  radio?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

interface IndicesResponse {
  fuente: 'google_earth_engine' | 'sentinel_hub' | 'datos_locales';
  indices: {
    ndvi: number | null;
    evi: number | null;
    savi: number | null;
    ndwi: number | null;
    lst: number | null;
  };
  serie?: Array<{ fecha: string; indices: Record<string, number> }>;
  calidad: { confianza: number; resolucionM: number; metodo: string };
  timestamp: string;
}

export class RemoteSensingService {
  async getIndices(req: IndicesRequest): Promise<IndicesResponse> {
    // 1. Google Earth Engine
    const gee = await this.queryGEE(req);
    if (gee) return gee;

    // 2. Sentinel Hub
    const sh = await this.querySentinelHub(req);
    if (sh) return sh;

    // 3. Fallback local
    return this.getLocalFallback(req);
  }

  private async queryGEE(req: IndicesRequest): Promise<IndicesResponse | null> {
    if (!config.gee.serviceAccountKey || !config.gee.projectId) return null;

    try {
      const token = await this.getGEEToken();
      if (!token) return null;

      const fechaFin = req.fechaFin || new Date().toISOString().split('T')[0];
      const fechaInicio = req.fechaInicio || (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; })();

      // Earth Engine REST API — compute median reflectance over the AOI
      const res = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${config.gee.projectId}/value:compute`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expression: {
              functionInvocationValue: {
                functionName: 'Image.reduceRegion',
                arguments: {
                  image: {
                    functionInvocationValue: {
                      functionName: 'Image.select',
                      arguments: {
                        input: {
                          functionInvocationValue: {
                            functionName: 'ImageCollection.median',
                            arguments: {
                              collection: {
                                functionInvocationValue: {
                                  functionName: 'ImageCollection.filterDate',
                                  arguments: {
                                    collection: {
                                      functionInvocationValue: {
                                        functionName: 'ImageCollection.filterBounds',
                                        arguments: {
                                          collection: { constantValue: 'COPERNICUS/S2_SR_HARMONIZED' },
                                          geometry: {
                                            functionInvocationValue: {
                                              functionName: 'Geometry.Point',
                                              arguments: { coordinates: { constantValue: [req.lng, req.lat] } },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    start: { constantValue: fechaInicio },
                                    end: { constantValue: fechaFin },
                                  },
                                },
                              },
                            },
                          },
                        },
                        bandSelectors: { constantValue: ['B2', 'B3', 'B4', 'B8'] },
                      },
                    },
                  },
                  reducer: { constantValue: 'mean' },
                  geometry: {
                    functionInvocationValue: {
                      functionName: 'Geometry.Point',
                      arguments: { coordinates: { constantValue: [req.lng, req.lat] } },
                    },
                  },
                  scale: { constantValue: 10 },
                },
              },
            },
          }),
          signal: AbortSignal.timeout(60000),
        },
      );

      const data = await res.json() as any;
      if (data?.result) {
        const r = data.result;
        const nir = (r.B8 || 0) / 10000;
        const red = (r.B4 || 0) / 10000;
        const blue = (r.B2 || 0) / 10000;
        const green = (r.B3 || 0) / 10000;

        return {
          fuente: 'google_earth_engine',
          indices: {
            ndvi: nir + red > 0 ? +((nir - red) / (nir + red)).toFixed(4) : null,
            evi: +(2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)).toFixed(4),
            savi: +(((nir - red) / (nir + red + 0.5)) * 1.5).toFixed(4),
            ndwi: green + nir > 0 ? +((green - nir) / (green + nir)).toFixed(4) : null,
            lst: null, // LST requires separate Landsat query
          },
          calidad: { confianza: 0.93, resolucionM: 10, metodo: `Google Earth Engine + Sentinel-2 SR (${fechaInicio} a ${fechaFin})` },
          timestamp: new Date().toISOString(),
        };
      }
      return null;
    } catch (e) {
      console.warn('[GEE] Error:', (e as Error).message);
      return null;
    }
  }

  private async getGEEToken(): Promise<string | null> {
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
  }

  private async querySentinelHub(req: IndicesRequest): Promise<IndicesResponse | null> {
    if (!config.sentinelHub.clientId || !config.sentinelHub.clientSecret) return null;

    try {
      // Get OAuth token
      const tokenRes = await fetch('https://services.sentinel-hub.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${config.sentinelHub.clientId}&client_secret=${config.sentinelHub.clientSecret}`,
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenData?.access_token) {
        console.warn('[Sentinel Hub] Auth failed:', tokenData?.error || tokenRes.status);
        return null;
      }
      console.log('[Sentinel Hub] Token obtenido OK');

      const fechaFin = req.fechaFin || new Date().toISOString().split('T')[0];
      const fechaInicio = req.fechaInicio || (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; })();

      const evalscript = `//VERSION=3
function setup(){return{input:[{bands:["B02","B03","B04","B08","SCL"],units:"DN"}],output:[{id:"ndvi",bands:1,sampleType:"FLOAT32"},{id:"evi",bands:1,sampleType:"FLOAT32"},{id:"savi",bands:1,sampleType:"FLOAT32"},{id:"ndwi",bands:1,sampleType:"FLOAT32"}]}}
function evaluatePixel(s){let scl=s.SCL;if(scl===3||scl===8||scl===9||scl===10)return{ndvi:[NaN],evi:[NaN],savi:[NaN],ndwi:[NaN]};let nir=s.B08/10000,red=s.B04/10000,blue=s.B02/10000,green=s.B03/10000;return{ndvi:[(nir-red)/(nir+red+1e-4)],evi:[2.5*(nir-red)/(nir+6*red-7.5*blue+1)],savi:[((nir-red)/(nir+red+.5))*1.5],ndwi:[(green-nir)/(green+nir+1e-4)]}}`;

      const statRes = await fetch('https://services.sentinel-hub.com/api/v1/statistics', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            data: [{ type: 'sentinel-2-l2a', dataFilter: { timeRange: { from: `${fechaInicio}T00:00:00Z`, to: `${fechaFin}T23:59:59Z` }, maxCloudCoverage: 20 } }],
            bounds: { geometry: { type: 'Point', coordinates: [req.lng, req.lat] }, properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' } },
          },
          aggregation: { timeRange: { from: `${fechaInicio}T00:00:00Z`, to: `${fechaFin}T23:59:59Z` }, aggregationInterval: { of: 'P1M' }, evalscript, resx: 10, resy: 10 },
        }),
        signal: AbortSignal.timeout(30000),
      });

      const statData = await statRes.json() as any;
      if (!statData?.data) {
        console.warn('[Sentinel Hub] Statistics failed:', JSON.stringify(statData).slice(0, 300));
      }
      if (statData?.data?.[0]?.outputs) {
        const latest = statData.data[statData.data.length - 1].outputs;
        return {
          fuente: 'sentinel_hub',
          indices: {
            ndvi: latest.ndvi?.bands?.B0?.stats?.mean ?? null,
            evi: latest.evi?.bands?.B0?.stats?.mean ?? null,
            savi: latest.savi?.bands?.B0?.stats?.mean ?? null,
            ndwi: latest.ndwi?.bands?.B0?.stats?.mean ?? null,
            lst: null,
          },
          serie: statData.data.map((d: any) => ({
            fecha: d.interval.from.split('T')[0],
            indices: {
              ndvi: d.outputs.ndvi?.bands?.B0?.stats?.mean ?? 0,
              evi: d.outputs.evi?.bands?.B0?.stats?.mean ?? 0,
              savi: d.outputs.savi?.bands?.B0?.stats?.mean ?? 0,
              ndwi: d.outputs.ndwi?.bands?.B0?.stats?.mean ?? 0,
            },
          })),
          calidad: { confianza: 0.90, resolucionM: 10, metodo: 'Sentinel Hub Statistical API + Sentinel-2 L2A' },
          timestamp: new Date().toISOString(),
        };
      }
      return null;
    } catch (e) {
      console.warn('[Sentinel Hub] Error:', (e as Error).message);
      return null;
    }
  }

  private getLocalFallback(req: IndicesRequest): IndicesResponse {
    return {
      fuente: 'datos_locales',
      indices: { ndvi: null, evi: null, savi: null, ndwi: null, lst: null },
      calidad: { confianza: 0, resolucionM: 0, metodo: 'Sin datos. Configurar GEE_SERVICE_ACCOUNT_KEY o SENTINEL_HUB_CLIENT_ID en .env' },
      timestamp: new Date().toISOString(),
    };
  }
}
