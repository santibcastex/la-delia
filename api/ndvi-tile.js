// Genera tiles NDVI desde Sentinel-2 L2A via CDSE Process API
// Recibe parámetros WMS estándar (BBOX, WIDTH, HEIGHT, TIME) desde Leaflet

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: { bands: 4, sampleType: "UINT8" }
  };
}
function evaluatePixel(s) {
  if (!s.dataMask) return [0, 0, 0, 0];
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-10);
  // Paleta: rojo (suelo/seco) → amarillo → verde (pasturas)
  if (ndvi < 0.0)  return [139, 69,  19,  200];
  if (ndvi < 0.15) return [220, 160,  60, 220];
  if (ndvi < 0.25) return [210, 210,  50, 220];
  if (ndvi < 0.35) return [150, 200,  50, 220];
  if (ndvi < 0.50) return [ 80, 170,  40, 220];
  return                   [ 30, 120,  20, 220];
}`;

async function getToken() {
  const res = await fetch(
    'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CDSE_CLIENT_ID || process.env.REACT_APP_CDSE_CLIENT_ID || '',
        client_secret: process.env.CDSE_CLIENT_SECRET || process.env.REACT_APP_CDSE_CLIENT_SECRET || ''
      })
    }
  );
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { BBOX, WIDTH = '256', HEIGHT = '256', TIME } = req.query;

  if (!BBOX) return res.status(400).json({ error: 'BBOX requerido' });

  // Parsear BBOX (viene en EPSG:3857 desde Leaflet WMS 1.3.0: minx,miny,maxx,maxy)
  const [minx, miny, maxx, maxy] = BBOX.split(',').map(Number);

  // Determinar rango de fechas: si TIME viene como rango lo usamos, si no los últimos 45 días
  let timeFrom, timeTo;
  if (TIME && TIME.includes('/')) {
    [timeFrom, timeTo] = TIME.split('/');
  } else if (TIME) {
    timeFrom = TIME;
    timeTo = TIME;
  } else {
    const now = new Date();
    timeTo = now.toISOString();
    const from = new Date(now);
    from.setDate(from.getDate() - 45);
    timeFrom = from.toISOString();
  }

  try {
    const token = await getToken();
    if (!token) return res.status(502).json({ error: 'No se pudo obtener token CDSE' });

    const body = {
      input: {
        bounds: {
          bbox: [minx, miny, maxx, maxy],
          properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/3857' }
        },
        data: [{
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from: timeFrom, to: timeTo },
            maxCloudCoverage: 100,
            mosaickingOrder: 'leastCC'  // prioriza menor cobertura de nubes
          }
        }]
      },
      output: {
        width: parseInt(WIDTH),
        height: parseInt(HEIGHT),
        responses: [{ identifier: 'default', format: { type: 'image/png' } }]
      },
      evalscript: EVALSCRIPT
    };

    const upstream = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const ct = upstream.headers.get('content-type') || '';
    const buf = await upstream.arrayBuffer();

    if (!ct.includes('image/')) {
      const text = Buffer.from(buf).toString('utf-8');
      console.error('NDVI Process API error:', upstream.status, text.slice(0, 400));
      return res.status(502).json({ error: 'Process API error', status: upstream.status, body: text.slice(0, 400) });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(buf));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
