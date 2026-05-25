function lonLatToMercator(lon, lat) {
  const R = 6378137;
  const x = lon * Math.PI / 180 * R;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * R;
  return [x, y];
}

const FARM_BOUNDS = {
  minLat: -36.9290, maxLat: -36.8775,
  minLon: -58.6160, maxLon: -58.5480
};

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

const RAINBOW = [
  [130,  0, 90],
  [210,  0, 30],
  [240, 60,  0],
  [255,140,  0],
  [240,215,  0],
  [175,230,  0],
  [ 80,200,  0],
  [  0,155, 20],
  [  0,110, 40],
  [  0, 75, 55],
  [  0, 48, 38],
];

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
  NDVI: mkScript(
    ["B04","B08","dataMask"],
    "(s.B08-s.B04)/(s.B08+s.B04+1e-10)",
    [0.10, 0.18, 0.26, 0.34, 0.42, 0.50, 0.58, 0.65, 0.72, 0.80],
    RAINBOW
  ),
  NDVIc: mkScript(
    ["B04","B08","dataMask"],
    "(s.B08-s.B04)/(s.B08+s.B04+1e-10)",
    [0.15, 0.20, 0.25, 0.30, 0.36, 0.43, 0.50, 0.58, 0.65, 0.75],
    RAINBOW
  ),
  EVI: mkScript(
    ["B02","B04","B08","dataMask"],
    "2.5*(s.B08-s.B04)/(s.B08+6*s.B04-7.5*s.B02+1+1e-10)",
    [0.08, 0.15, 0.22, 0.30, 0.38, 0.47, 0.56, 0.65],
    RAINBOW
  ),
  NDRE: mkScript(
    ["B05","B08","dataMask"],
    "(s.B08-s.B05)/(s.B08+s.B05+1e-10)",
    [0.04, 0.08, 0.13, 0.18, 0.23, 0.29, 0.35, 0.42],
    RAINBOW
  ),
  MSAVI: mkScript(
    ["B04","B08","dataMask"],
    `(function(){const n=s.B08,r=s.B04;
      return(2*n+1-Math.sqrt(Math.pow(2*n+1,2)-8*(n-r)))/2;})()`,
    [0.05, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52, 0.60],
    RAINBOW
  ),
  MNDWI: mkScript(
    ["B03","B11","dataMask"],
    "(s.B03-s.B11)/(s.B03+s.B11+1e-10)",
    [-0.30, -0.09, 0.00, 0.12, 0.25, 0.40],
    MOISTURE
  ),
  NDMI: mkScript(
    ["B08","B11","dataMask"],
    "(s.B08-s.B11)/(s.B08+s.B11+1e-10)",
    [-0.10, 0.00, 0.08, 0.16, 0.24, 0.32],
    MOISTURE
  ),
  NDWI: mkScript(
    ["B03","B08","dataMask"],
    "(s.B03-s.B08)/(s.B03+s.B08+1e-10)",
    [-0.30, -0.15, 0.00, 0.10, 0.20, 0.35],
    MOISTURE
  ),
  NATURAL: `//VERSION=3
function setup(){return{input:[{bands:["B04","B03","B02","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}
function evaluatePixel(s){
  if(!s.dataMask)return[0,0,0,0];
  const gain=3.5,gamma=0.75;
  function adj(v){return Math.min(255,Math.round(Math.pow(Math.max(0,v*gain),gamma)*255));}
  return[adj(s.B04),adj(s.B03),adj(s.B02),255];
}`,
  SWIR: `//VERSION=3
function setup(){return{input:[{bands:["B04","B08","B11","dataMask"]}],output:{bands:4,sampleType:"UINT8"}}}
function evaluatePixel(s){
  if(!s.dataMask)return[0,0,0,0];
  return[
    Math.min(255,Math.round(s.B11*4.0*255)),
    Math.min(255,Math.round(s.B08*3.0*255)),
    Math.min(255,Math.round(s.B04*3.5*255)),
    255
  ];
}`
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
  const INDEX = (q.index || q.INDEX || 'NDVIc').toUpperCase().replace('NDVIC', 'NDVIc');
  const date  = q.date || q.DATE;

  const evalscript = EVALSCRIPTS[INDEX] || EVALSCRIPTS.NDVIc;

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

    const [xMin, yMin] = lonLatToMercator(-58.6160, -36.9290);
    const [xMax, yMax] = lonLatToMercator(-58.5480, -36.8775);

    const body = {
      input: {
        bounds: {
          bbox: [xMin, yMin, xMax, yMax],
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
        width: 1440,
        height: 1220,
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
    res.setHeader('Cache-Control', 'public, max-age=21600');
    res.setHeader('X-Farm-Bounds', JSON.stringify(FARM_BOUNDS));
    res.status(200).send(Buffer.from(buf));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
