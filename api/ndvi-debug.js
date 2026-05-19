export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 1. Obtener token
  let token, tokenError;
  try {
    const tokenRes = await fetch(
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
    const tokenData = await tokenRes.json();
    token = tokenData.access_token;
    if (!token) tokenError = tokenData;
  } catch (e) {
    tokenError = e.message;
  }

  if (!token) {
    return res.status(500).json({ step: 'auth', error: tokenError });
  }

  const instanceId = process.env.CDSE_INSTANCE_ID || '54afbc0c-becd-4db7-85f8-041c93af8475';
  const headers = { Authorization: `Bearer ${token}` };

  // 2. GetCapabilities — lista layers disponibles
  let capInfo;
  try {
    const capRes = await fetch(
      `https://sh.dataspace.copernicus.eu/ogc/wms/${instanceId}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`,
      { headers }
    );
    const capText = await capRes.text();
    // Extraer nombres de layers del XML
    const layerNames = [...capText.matchAll(/<Layer[^>]*>[\s\S]*?<Name>([^<]+)<\/Name>/g)].map(m => m[1]);
    capInfo = { status: capRes.status, layers: layerNames, excerpt: capText.slice(0, 800) };
  } catch (e) {
    capInfo = { error: e.message };
  }

  // 3. GetMap sobre la estancia — rango amplio de fechas para asegurar datos
  let tileInfo;
  try {
    const mapUrl = new URL(`https://sh.dataspace.copernicus.eu/ogc/wms/${instanceId}`);
    const params = {
      SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0',
      LAYERS: 'NDVI', FORMAT: 'image/png', TRANSPARENT: 'true',
      CRS: 'EPSG:4326',
      BBOX: '-36.93,-58.62,-36.87,-58.55',  // lat,lon para WMS 1.3.0
      WIDTH: '256', HEIGHT: '256',
      TIME: '2026-04-01T00:00:00Z/2026-05-19T23:59:59Z',
      MAXCC: '100'
    };
    Object.entries(params).forEach(([k, v]) => mapUrl.searchParams.set(k, v));

    const mapRes = await fetch(mapUrl.toString(), { headers });
    const mapCT = mapRes.headers.get('content-type') || '';
    const buf = await mapRes.arrayBuffer();

    if (mapCT.includes('image/')) {
      tileInfo = { ok: true, contentType: mapCT, sizeBytes: buf.byteLength, status: mapRes.status };
    } else {
      tileInfo = { ok: false, contentType: mapCT, body: Buffer.from(buf).toString('utf-8').slice(0, 800), status: mapRes.status };
    }
  } catch (e) {
    tileInfo = { error: e.message };
  }

  res.status(200).json({ tokenOk: true, instanceId, capabilities: capInfo, testTile: tileInfo });
}
