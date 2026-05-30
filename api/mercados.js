// Proxy to Argentine cattle market price data
// Primary source: deCampoaCampo.com /gh_funciones.php?function=getListadoPreciosGordo
// (Liniers market — prices include 10.5% IVA, stored as $/kg vivo + IVA)
// Cached 1 hour server-side

const DCAC_URL = 'https://www.decampoacampo.com/gh_funciones.php?function=getListadoPreciosGordo';

// Map deCampoaCampo category names → internal keys
// Categories contain weight ranges like "Novillitos hasta 390 Kg."
// We take the first match per key (highest-valued / lightest range usually listed first)
function catKey(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('novillito'))  return 'novillito';
  if (n.includes('novillo'))    return 'novillo';
  if (n.includes('vaquillona')) return 'vaquillona';
  if (n.includes('vaca'))       return 'vaca';
  if (n.includes('toro'))       return 'toro';
  if (n.includes('mej') || n.includes('media edad joven')) return 'mej';
  if (n.includes('inmag') || n.includes('invernada macho')) return 'inmag';
  return null;
}

async function fetchWithTimeout(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaDelia/1.0)',
        Accept: 'application/json, text/html, */*',
        Referer: 'https://www.decampoacampo.com/__dcac/outside/liniers/precios',
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

// ── Source 1: deCampoaCampo JSON endpoint ─────────────────────────────────────
async function tryDCaC() {
  const r = await fetchWithTimeout(DCAC_URL);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const json = await r.json();
  if (!json.data || !Array.isArray(json.data)) throw new Error('unexpected shape: ' + JSON.stringify(json).slice(0, 100));

  // Parse date: json.hoy is like "27/05/2026" (DD/MM/YYYY)
  let fecha = '';
  if (json.hoy) {
    const [d, m, y] = json.hoy.split('/');
    fecha = `${y}-${m?.padStart(2,'0')}-${d?.padStart(2,'0')}`;
  }

  // Aggregate by category (first occurrence wins — highest weight category)
  const precios = {};
  for (const item of json.data) {
    const key = catKey(item.categoria || '');
    if (!key || precios[key]) continue;
    const precio = parseFloat(item.precio_semana_1);
    if (precio > 0) {
      // Prices are $/kg + 10.5% IVA → divide to get $/kg sin IVA
      precios[key] = Math.round(precio / 1.105);
    }
  }

  if (Object.keys(precios).length === 0) throw new Error('no categories matched');
  return { fecha, precios, source: 'deCampoaCampo / Liniers' };
}

// ── Source 2: deCampoaCampo HTML scraper (fallback if JSON changes) ───────────
async function tryDCaCHTML() {
  const r = await fetchWithTimeout('https://www.decampoacampo.com/__dcac/outside/liniers/precios', {
    headers: { Accept: 'text/html' },
  });
  if (!r.ok) throw new Error(`HTML HTTP ${r.status}`);
  const html = await r.text();

  // Extract date
  const dateM = html.match(/Ventas del (\d{2})\/(\d{2})\/(\d{4})/);
  const fecha = dateM ? `${dateM[3]}-${dateM[2]}-${dateM[1]}` : '';

  // Extract inline price data from HTML table cells rendered by JS
  // (won't contain prices since they're loaded async — but try anyway)
  const cells = [];
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = tdRe.exec(html)) !== null) {
    cells.push(m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
  }

  const precios = {};
  for (let i = 0; i < cells.length; i++) {
    const key = catKey(cells[i]);
    if (!key || precios[key]) continue;
    for (let j = i + 1; j < Math.min(i + 5, cells.length); j++) {
      const num = parseFloat(cells[j].replace(/\./g, '').replace(',', '.'));
      if (num > 500 && num < 200000) {
        precios[key] = Math.round(num / 1.105);
        break;
      }
    }
  }

  if (Object.keys(precios).length === 0) throw new Error('HTML: no prices extracted');
  return { fecha, precios, source: 'deCampoaCampo HTML / Liniers' };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const debug = req.query?.debug === '1';
  if (!debug) res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  const errors = [];

  const attempt = async (label, fn) => {
    try {
      const d = await fn();
      return res.status(200).json({ ok: true, ...d });
    } catch (e) {
      errors.push(`[${label}] ${e.message}`);
      return null;
    }
  };

  if (await attempt('DCaC JSON', tryDCaC)) return;
  if (await attempt('DCaC HTML', tryDCaCHTML)) return;

  if (debug) {
    return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible', debug: errors });
  }
  return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible' });
}
