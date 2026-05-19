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

function latLonToMercator(lat, lon) {
  const R = 6378137;
  const x = lon * Math.PI / 180 * R;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * R;
  return [x, y];
}

function getLabel(index, value) {
  const veg = ['NDVI', 'NDVIc', 'EVI', 'NDRE', 'MSAVI'];
  if (veg.includes(index)) {
    if (value < 0.15) return 'Suelo / muy bajo';
    if (value < 0.25) return 'Vegetación muy escasa';
    if (value < 0.35) return 'Cobertura baja';
    if (value < 0.45) return 'Cobertura moderada';
    if (value < 0.55) return 'Buena cobertura';
    return 'Cobertura excelente';
  }
  if (index === 'RECI') {
    if (value < 1.0) return 'Clorofila muy baja';
    if (value < 2.0) return 'Clorofila baja';
    if (value < 3.5) return 'Clorofila moderada';
    if (value < 5.5) return 'Clorofila alta';
    return 'Clorofila muy alta';
  }
  if (index === 'NDMI') {
    if (value < -0.10) return 'Vegetación muy seca';
    if (value < 0.00)  return 'Estrés hídrico moderado';
    if (value < 0.10)  return 'Humedad baja';
    if (value < 0.20)  return 'Humedad moderada';
    if (value < 0.30)  return 'Humedad alta';
    return 'Humedad muy alta';
  }
  if (index === 'NDWI') {
    if (value < -0.20) return 'Sin agua libre';
    if (value < 0.00)  return 'Suelo húmedo';
    if (value < 0.15)  return 'Agua superficial escasa';
    if (value < 0.30)  return 'Agua moderada';
    return 'Agua abundante';
  }
  return '';
}

function parsePng(buf) {
  // PNG signature is 8 bytes, then chunks
  // Each chunk: 4 bytes length, 4 bytes type, data, 4 bytes CRC
  let offset = 8;
  let width = 0;
  let height = 0;
  const idatChunks = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data = buf.slice(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset += 4 + 4 + length + 4; // length + type + data + CRC
  }

  return { width, height, idatChunks };
}

function decodeCenterPixel(buf, index) {
  const { width, height, idatChunks } = parsePng(buf);
  const compressed = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(compressed);

  const rowStride = 1 + width * 4; // 1 filter byte + RGBA per pixel
  const centerRow = Math.floor(height / 2);
  const centerCol = Math.floor(width / 2);
  const pixelOffset = centerRow * rowStride + 1 + centerCol * 4;

  const r = raw[pixelOffset];
  const a = raw[pixelOffset + 3];

  if (a === 0) return null;

  let value;
  if (index === 'RECI') {
    value = r / 254 * 10;
  } else {
    value = r / 254 * 2 - 1;
  }

  return value;
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
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const q = req.query;
  const lat   = parseFloat(q.lat);
  const lon   = parseFloat(q.lon);
  const INDEX = (q.index || q.INDEX || 'NDVIc').toUpperCase().replace('NDVIC', 'NDVIc');
  const date  = q.date || q.DATE;

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'lat y lon requeridos' });
  }

  const evalscript = VALUE_EVALSCRIPTS[INDEX];
  if (!evalscript) {
    return res.status(400).json({ error: `Índice no soportado: ${INDEX}` });
  }

  // Convert lat/lon to EPSG:3857 and create 90m x 90m bbox
  const [cx, cy] = latLonToMercator(lat, lon);
  const bbox = [cx - 45, cy - 45, cx + 45, cy + 45];

  // 30-day time window ending on requested date
  let timeFrom, timeTo;
  if (date) {
    const end = new Date(date.includes('T') ? date : date + 'T23:59:59Z');
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
          bbox,
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
        width: 3,
        height: 3,
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

    const pngBuf = Buffer.from(buf);
    const rawValue = decodeCenterPixel(pngBuf, INDEX);

    if (rawValue === null) {
      return res.status(200).json({ value: null, label: 'Sin datos', index: INDEX });
    }

    const value = parseFloat(rawValue.toFixed(2));
    const label = getLabel(INDEX, INDEX === 'RECI' ? rawValue : value);

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).json({ value, label, index: INDEX });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
