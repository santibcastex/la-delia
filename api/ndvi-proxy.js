// Proxy para tiles WMS de Sentinel Hub — pasa el token via Authorization header
// evitando problemas de CORS y de cómo Leaflet transforma los parámetros custom
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { token, ...wmsParams } = req.query;

  if (!token) return res.status(401).json({ error: 'token requerido' });

  const base = `https://sh.dataspace.copernicus.eu/ogc/wms/${process.env.CDSE_INSTANCE_ID || '54afbc0c-becd-4db7-85f8-041c93af8475'}`;
  const url = new URL(base);
  Object.entries(wmsParams).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    const contentType = upstream.headers.get('content-type') || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
