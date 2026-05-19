export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'token requerido' });

  const instanceId = process.env.CDSE_INSTANCE_ID || '54afbc0c-becd-4db7-85f8-041c93af8475';

  // 1. GetCapabilities
  const capUrl = `https://sh.dataspace.copernicus.eu/ogc/wms/${instanceId}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;
  const capRes = await fetch(capUrl, { headers: { Authorization: `Bearer ${token}` } });
  const capText = await capRes.text();

  // 2. GetMap test con bbox de la estancia (EPSG:4326 en WMS 1.3.0 → lat,lon order)
  const mapUrl = new URL(`https://sh.dataspace.copernicus.eu/ogc/wms/${instanceId}`);
  mapUrl.searchParams.set('SERVICE', 'WMS');
  mapUrl.searchParams.set('REQUEST', 'GetMap');
  mapUrl.searchParams.set('VERSION', '1.3.0');
  mapUrl.searchParams.set('LAYERS', 'NDVI');
  mapUrl.searchParams.set('FORMAT', 'image/png');
  mapUrl.searchParams.set('TRANSPARENT', 'true');
  mapUrl.searchParams.set('CRS', 'EPSG:4326');
  mapUrl.searchParams.set('BBOX', '-36.93,-58.62,-36.87,-58.55');
  mapUrl.searchParams.set('WIDTH', '256');
  mapUrl.searchParams.set('HEIGHT', '256');
  mapUrl.searchParams.set('TIME', '2026-05-01T00:00:00Z/2026-05-19T23:59:59Z');
  mapUrl.searchParams.set('MAXCC', '100');

  const mapRes = await fetch(mapUrl.toString(), { headers: { Authorization: `Bearer ${token}` } });
  const mapCT = mapRes.headers.get('content-type') || '';
  let mapInfo;
  if (mapCT.includes('image/')) {
    const buf = await mapRes.arrayBuffer();
    mapInfo = { contentType: mapCT, sizeBytes: buf.byteLength, status: mapRes.status };
  } else {
    mapInfo = { contentType: mapCT, body: (await mapRes.text()).slice(0, 800), status: mapRes.status };
  }

  res.status(200).json({
    capabilities: {
      status: capRes.status,
      excerpt: capText.slice(0, 1500)
    },
    testTile: mapInfo
  });
}
