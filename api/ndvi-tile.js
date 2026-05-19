// Paleta arcoíris para máxima discriminación visual (similar a OneSoil)
// v = valor del índice, t = thresholds, c = colores RGB
function mkScript(bands, expr, thresholds, colors) {
  const bandsStr = JSON.stringify(bands);
  const tStr = JSON.stringify(thresholds);
  const cStr = JSON.stringify(colors);
  return `//VERSION=3
function setup(){return{input:[{bands:${bandsStr}}],output:{bands:4,sampleType:"UINT8"}}}
function evaluatePixel(s){
  if(!s.dataMask)return[0,0,0,0];
  const v=${expr};
  const t=${tStr},c=${cStr};
  for(let i=0;i<t.length;i++)if(v<t[i])return[...c[i],220];
  return[...c[c.length-1],220];
}`;
}

// Paleta arcoíris: magenta→rojo→naranja→amarillo→verde claro→verde
const RAINBOW = [
  [130,  0, 90],  // muy bajo — suelo desnudo
  [210,  0, 30],  // bajo
  [240, 60,  0],  // bajo-medio
  [255,140,  0],  // medio-bajo
  [240,215,  0],  // medio
  [175,230,  0],  // medio-alto
  [ 80,200,  0],  // alto
  [  0,155, 20],  // muy alto
  [  0,100, 50],  // excelente
];

// Paleta verde para índices de agua/humedad: marrón→azul
const MOISTURE = [
  [160, 90, 30],
  [200,145, 60],
  [230,200,100],
  [200,220,180],
  [100,190,200],
  [ 30,140,210],
  [  0, 80,170],
];

const EVALSCRIPTS = {
  // NDVI estándar — thresholds calibrados para pampa bonaerense
  NDVI: mkScript(
    ["B04","B08","dataMask"],
    "(s.B08-s.B04)/(s.B08+s.B04+1e-10)",
    [0.10, 0.18, 0.26, 0.34, 0.42, 0.50, 0.58, 0.66],
    RAINBOW
  ),

  // NDVI contrastado — mismo índice, paleta arcoíris con rango comprimido
  // En otoño/invierno pampeano el rango real es ~0.15-0.55, lo usamos completo
  NDVIc: mkScript(
    ["B04","B08","dataMask"],
    "(s.B08-s.B04)/(s.B08+s.B04+1e-10)",
    [0.15, 0.20, 0.25, 0.30, 0.36, 0.43, 0.50, 0.58],
    RAINBOW
  ),

  // EVI — mejor en pasturas densas, corrige suelo y atmósfera
  EVI: mkScript(
    ["B02","B04","B08","dataMask"],
    "2.5*(s.B08-s.B04)/(s.B08+6*s.B04-7.5*s.B02+1+1e-10)",
    [0.08, 0.15, 0.22, 0.30, 0.38, 0.47, 0.56, 0.65],
    RAINBOW
  ),

  // NDRE — sensible a clorofila / estrés temprano
  NDRE: mkScript(
    ["B05","B08","dataMask"],
    "(s.B08-s.B05)/(s.B08+s.B05+1e-10)",
    [0.04, 0.08, 0.13, 0.18, 0.23, 0.29, 0.35, 0.42],
    RAINBOW
  ),

  // MSAVI — mejor que NDVI en vegetación escasa / suelo expuesto
  MSAVI: mkScript(
    ["B04","B08","dataMask"],
    `(function(){const n=s.B08,r=s.B04;
      return(2*n+1-Math.sqrt(Math.pow(2*n+1,2)-8*(n-r)))/2;})()`,
    [0.05, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52, 0.60],
    RAINBOW
  ),

  // RECI — índice de clorofila por red-edge, muy preciso para biomasa
  RECI: mkScript(
    ["B05","B07","dataMask"],
    "s.B07/(s.B05+1e-10)-1",
    [0.5, 1.0, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5],
    RAINBOW
  ),

  // NDMI — humedad de la vegetación: (NIR-SWIR)/(NIR+SWIR)
  NDMI: mkScript(
    ["B08","B11","dataMask"],
    "(s.B08-s.B11)/(s.B08+s.B11+1e-10)",
    [-0.10, 0.00, 0.08, 0.16, 0.24, 0.32],
    MOISTURE
  ),

  // NDWI — presencia de agua libre: (Green-NIR)/(Green+NIR)
  NDWI: mkScript(
    ["B03","B08","dataMask"],
    "(s.B03-s.B08)/(s.B03+s.B08+1e-10)",
    [-0.30, -0.15, 0.00, 0.10, 0.20, 0.35],
    MOISTURE
  ),
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
  const BBOX   = q.BBOX  || q.bbox;
  const WIDTH  = q.WIDTH  || q.width  || '256';
  const HEIGHT = q.HEIGHT || q.height || '256';
  const TIME   = q.TIME   || q.time;
  const INDEX  = (q.INDEX || q.index || 'NDVIc').toUpperCase().replace('NDVIC','NDVIc');

  if (!BBOX) return res.status(400).json({ error: 'BBOX requerido', query: q });

  const evalscript = EVALSCRIPTS[INDEX] || EVALSCRIPTS.NDVIc;
  const [minx, miny, maxx, maxy] = BBOX.split(',').map(Number);

  // Ventana de 30 días hasta la fecha elegida
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
