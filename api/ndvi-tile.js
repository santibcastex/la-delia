// Paleta compartida para pasturas pampeanas: suelo → seco → moderado → bueno → excelente
// Los thresholds se ajustan por índice según su rango típico en esta región
const PALETTE = [
  [110, 55,  15, 220],  // suelo desnudo / muy degradado
  [195, 115, 40, 220],  // muy escaso
  [225, 205, 45, 220],  // escaso
  [145, 195, 50, 220],  // moderado
  [65,  155, 35, 220],  // bueno
  [25,  100, 15, 220],  // excelente
];

const EVALSCRIPTS = {
  // NDVI: (NIR-Red)/(NIR+Red) — índice general, rango -1 a 1
  NDVI: `//VERSION=3
function setup(){return{input:[{bands:["B04","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}
function evaluatePixel(s){
  if(!s.dataMask)return[0,0,0,0];
  const v=(s.B08-s.B04)/(s.B08+s.B04+1e-10);
  if(v<0.10)return[110,55,15,220];
  if(v<0.20)return[195,115,40,220];
  if(v<0.32)return[225,205,45,220];
  if(v<0.45)return[145,195,50,220];
  if(v<0.60)return[65,155,35,220];
  return[25,100,15,220];
}`,

  // EVI: mejor discriminación en pasturas densas, menos afectado por suelo y atmósfera
  // EVI = 2.5 * (NIR-Red) / (NIR + 6*Red - 7.5*Blue + 1)
  EVI: `//VERSION=3
function setup(){return{input:[{bands:["B02","B04","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}
function evaluatePixel(s){
  if(!s.dataMask)return[0,0,0,0];
  const v=2.5*(s.B08-s.B04)/(s.B08+6*s.B04-7.5*s.B02+1+1e-10);
  if(v<0.10)return[110,55,15,220];
  if(v<0.20)return[195,115,40,220];
  if(v<0.32)return[225,205,45,220];
  if(v<0.45)return[145,195,50,220];
  if(v<0.60)return[65,155,35,220];
  return[25,100,15,220];
}`,

  // NDRE: (NIR-RedEdge)/(NIR+RedEdge) — muy sensible a clorofila, detecta stress temprano
  // Rango útil en pasturas: 0.05 a 0.40 (más estrecho que NDVI)
  NDRE: `//VERSION=3
function setup(){return{input:[{bands:["B05","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}
function evaluatePixel(s){
  if(!s.dataMask)return[0,0,0,0];
  const v=(s.B08-s.B05)/(s.B08+s.B05+1e-10);
  if(v<0.05)return[110,55,15,220];
  if(v<0.10)return[195,115,40,220];
  if(v<0.18)return[225,205,45,220];
  if(v<0.25)return[145,195,50,220];
  if(v<0.33)return[65,155,35,220];
  return[25,100,15,220];
}`,
};

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

  const q = req.query;
  const BBOX  = q.BBOX  || q.bbox;
  const WIDTH  = q.WIDTH  || q.width  || '256';
  const HEIGHT = q.HEIGHT || q.height || '256';
  const TIME   = q.TIME   || q.time;
  const INDEX  = (q.INDEX || q.index || 'NDVI').toUpperCase();

  if (!BBOX) return res.status(400).json({ error: 'BBOX requerido', query: q });

  const evalscript = EVALSCRIPTS[INDEX] || EVALSCRIPTS.NDVI;
  const [minx, miny, maxx, maxy] = BBOX.split(',').map(Number);

  // Ventana de 30 días hasta la fecha elegida (S2 revisita ~5 días)
  let timeFrom, timeTo;
  if (TIME) {
    const endDate = TIME.includes('/') ? TIME.split('/')[1] : TIME.replace('T00:00:00Z', 'T23:59:59Z');
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    timeFrom = start.toISOString();
    timeTo   = end.toISOString();
  } else {
    const now = new Date();
    timeTo = now.toISOString();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
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
            mosaickingOrder: 'leastCC'
          }
        }]
      },
      output: {
        width: parseInt(WIDTH),
        height: parseInt(HEIGHT),
        responses: [{ identifier: 'default', format: { type: 'image/png' } }]
      },
      evalscript
    };

    const upstream = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const ct = upstream.headers.get('content-type') || '';
    const buf = await upstream.arrayBuffer();

    if (!ct.includes('image/')) {
      const text = Buffer.from(buf).toString('utf-8');
      console.error('Process API error:', upstream.status, text.slice(0, 400));
      return res.status(502).json({ error: 'Process API error', status: upstream.status, body: text.slice(0, 400) });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(buf));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
