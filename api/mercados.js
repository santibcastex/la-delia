// Proxy to Argentine cattle market price data (losnumerosdelagro)
// Cached 1 hour server-side to avoid hammering the source
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  const candidates = [
    'https://losnumerosdelagro.vercel.app/api/ganado',
    'https://losnumerosdelagro.vercel.app/api/ganaderia',
    'https://losnumerosdelagro.vercel.app/api/liniers',
    'https://losnumerosdelagro.vercel.app/api/precios-ganado',
  ];

  for (const url of candidates) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (r.ok) {
        const ct = r.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await r.json();
          return res.status(200).json({ ok: true, source: url, data });
        }
      }
    } catch (_) { /* try next */ }
  }

  return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible' });
}
