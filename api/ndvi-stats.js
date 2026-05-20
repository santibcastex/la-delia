import zlib from 'zlib';

const VALUE_EVALSCRIPTS = {
  NDVI:  `//VERSION=3\nfunction setup(){return{input:[{bands:["B04","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=(s.B08-s.B04)/(s.B08+s.B04+1e-10);return[Math.round((v+1)/2*254),0,0,255];}`,
  NDVIc: `//VERSION=3\nfunction setup(){return{input:[{bands:["B04","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=(s.B08-s.B04)/(s.B08+s.B04+1e-10);return[Math.round((v+1)/2*254),0,0,255];}`,
  EVI:   `//VERSION=3\nfunction setup(){return{input:[{bands:["B02","B04","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=2.5*(s.B08-s.B04)/(s.B08+6*s.B04-7.5*s.B02+1+1e-10);return[Math.round((v+1)/2*254),0,0,255];}`,
  NDRE:  `//VERSION=3\nfunction setup(){return{input:[{bands:["B05","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=(s.B08-s.B05)/(s.B08+s.B05+1e-10);return[Math.round((v+1)/2*254),0,0,255];}`,
  MSAVI: `//VERSION=3\nfunction setup(){return{input:[{bands:["B04","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const n=s.B08,r=s.B04;const v=(2*n+1-Math.sqrt(Math.pow(2*n+1,2)-8*(n-r)))/2;return[Math.round((v+1)/2*254),0,0,255];}`,
  RECI:  `//VERSION=3\nfunction setup(){return{input:[{bands:["B05","B07","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=Math.min(10,Math.max(0,s.B07/(s.B05+1e-10)-1));return[Math.round(v/10*254),0,0,255];}`,
  NDMI:  `//VERSION=3\nfunction setup(){return{input:[{bands:["B08","B11","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=(s.B08-s.B11)/(s.B08+s.B11+1e-10);return[Math.round((v+1)/2*254),0,0,255];}`,
  NDWI:  `//VERSION=3\nfunction setup(){return{input:[{bands:["B03","B08","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}\nfunction evaluatePixel(s){if(!s.dataMask)return[0,0,0,0];const v=(s.B03-s.B08)/(s.B03+s.B08+1e-10);return[Math.round((v+1)/2*254),0,0,255];}`,
};

function parsePng(buf) {
  let offset = 8, width = 0, height = 0;
  const idatChunks = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data = buf.slice(offset + 8, offset + 8 + length);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); }
    else if (type === 'IDAT') idatChunks.push(data);
    else if (type === 'IEND') break;
    offset += 4 + 4 + length + 4;
  }
  return { width, height, idatChunks };
}

function decodeMeanValue(buf, index) {
  const { width, height, idatChunks } = parsePng(buf);
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const rowStride = 1 + width * 4;
  let sum = 0, count = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const off = row * rowStride + 1 + col * 4;
      const r = raw[off], a = raw[off + 3];
      if (a > 0) {
        sum += index === 'RECI' ? r / 254 * 10 : r / 254 * 2 - 1;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : null;
}

// Compute output image dimensions for a polygon, targeting ~20m/pixel, clamped 24–256
function polygonDimensions(ring) {
  const lons = ring.map(p => p[0]);
  const lats = ring.map(p => p[1]);
  const dLon = Math.max(...lons) - Math.min(...lons);
  const dLat = Math.max(...lats) - Math.min(...lats);
  const R = 6371000;
  const latMid = (Math.max(...lats) + Math.min(...lats)) / 2;
  const wm = dLon * Math.PI / 180 * R * Math.cos(latMid * Math.PI / 180);
  const hm = dLat * Math.PI / 180 * R;
  const TARGET = 20;
  return {
    w: Math.max(24, Math.min(256, Math.round(wm / TARGET))),
    h: Math.max(24, Math.min(256, Math.round(hm / TARGET)))
  };
}

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
  return (await res.json()).access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { points, polygons, index: indexRaw, date } = req.body;
  const INDEX = (indexRaw || 'NDVIc').toUpperCase().replace('NDVIC', 'NDVIc');
  const evalscript = VALUE_EVALSCRIPTS[INDEX];

  // Accept either polygons (preferred) or legacy points
  const items = polygons || points;
  if (!evalscript || !Array.isArray(items)) return res.status(400).json({ error: 'params invalid' });

  let timeFrom, timeTo;
  if (date) {
    const end = new Date(date + 'T23:59:59Z');
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    timeFrom = start.toISOString();
    timeTo = end.toISOString();
  } else {
    const now = new Date();
    timeTo = now.toISOString();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    timeFrom = from.toISOString();
  }

  const token = await getToken();
  if (!token) return res.status(502).json({ error: 'No token' });

  const results = await Promise.all(items.map(async (item) => {
    const nombre = item.nombre;

    let boundsObj, w, h;

    if (item.coordinates) {
      // Full polygon geometry — use actual ring for pixel-accurate mean
      const ring = item.coordinates; // [[lon,lat], ...]
      const dims = polygonDimensions(ring);
      w = dims.w;
      h = dims.h;
      boundsObj = {
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        },
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' }
      };
    } else {
      // Legacy fallback: centroid + 200m bbox
      const { lat, lon } = item;
      const R = 6378137;
      const cx = lon * Math.PI / 180 * R;
      const cy = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * R;
      const HALF = 200;
      w = 7; h = 7;
      boundsObj = {
        bbox: [cx - HALF, cy - HALF, cx + HALF, cy + HALF],
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/3857' }
      };
    }

    const body = {
      input: {
        bounds: boundsObj,
        data: [{ type: 'sentinel-2-l2a', dataFilter: { timeRange: { from: timeFrom, to: timeTo }, maxCloudCoverage: 100, mosaickingOrder: 'leastCC' } }]
      },
      output: { width: w, height: h, responses: [{ identifier: 'default', format: { type: 'image/png' } }] },
      evalscript
    };

    try {
      const up = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!up.headers.get('content-type')?.includes('image/')) return { nombre, value: null };
      const value = decodeMeanValue(Buffer.from(await up.arrayBuffer()), INDEX);
      return { nombre, value: value !== null ? parseFloat(value.toFixed(3)) : null };
    } catch {
      return { nombre, value: null };
    }
  }));

  const stats = {};
  results.forEach(r => { stats[r.nombre] = r.value; });

  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json(stats);
}
