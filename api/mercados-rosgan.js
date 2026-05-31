// Proxy for entresurcosycorralesya.com breeding cattle prices (cría)
// Source: ajax-modulo-vientre.php — weighted average by lot count
// Prices in ARS/cabeza (per head), cached 1 hour server-side

const BASE = 'https://www.entresurcosycorralesya.com';

async function fetchWithTimeout(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaDelia/1.0)',
        Accept: 'text/html, */*',
        Referer: `${BASE}/vientres.html`,
        ...(opts.headers || {}),
      },
    });
    clearTimeout(t);
    return r;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

// Parse Argentine number format: "1.585.764" → 1585764
function parsePrecio(str) {
  return parseInt((str || '').replace(/\./g, '').replace(/,\d*$/, '').trim(), 10) || 0;
}

// Normalize diacritics to match "preñez" → "prenez", "cría" → "cria"
function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function criaKey(cat) {
  const n = norm(cat);
  if (n.includes('con cr')) return 'vaca_cria';   // "con Cría" / "con cria"
  if (n.includes('prenez')) return 'vientre_pren'; // "Preñez" → normalized
  return null;
}

async function tryVientres() {
  const r = await fetchWithTimeout(`${BASE}/ajax-modulo-vientre.php?desde=&hasta=`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();

  // Parse <tr> rows → weighted average per category bucket
  const buckets = {};
  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim());
    if (cells.length < 3) continue;

    const key = criaKey(cells[0]);
    if (!key) continue;

    const qty = parsePrecio(cells[1]);    // Cantidad
    const precio = parsePrecio(cells[2]); // Prom. Bulto

    if (qty > 0 && precio > 0) {
      if (!buckets[key]) buckets[key] = { sum: 0, qty: 0 };
      buckets[key].sum += qty * precio;
      buckets[key].qty += qty;
    }
  }

  if (Object.keys(buckets).length === 0) throw new Error('no categories matched');

  const precios = {};
  for (const [key, { sum, qty }] of Object.entries(buckets)) {
    precios[key] = Math.round(sum / qty);
  }

  return { fecha: new Date().toISOString().slice(0, 7), precios, source: 'Entre Surcos y Corrales' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const debug = req.query?.debug === '1';
  if (!debug) res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  try {
    const d = await tryVientres();
    return res.status(200).json({ ok: true, tipo: 'cria', ...d });
  } catch (e) {
    if (debug) return res.status(503).json({ ok: false, error: e.message });
    return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible' });
  }
}
