// Proxy to Argentine cattle market price data
// Sources tried in order:
// 1. Mercado Agroganadero HTML (official site, HTML table scraping)
// 2. datos.gob.ar resource_show → discover real CSV URL → parse CSV
// 3. datos.magyp.gob.ar CKAN datastore
// Cached 1 hour server-side

const CKAN_ID = 'bd15f73c-fe07-41d9-9dd9-58e3244cad59';

const CAT_MAP = {
  'novillito': 'novillito', 'novillitos': 'novillito',
  'novillo': 'novillo', 'novillos': 'novillo',
  'novillo especial': 'novillo', 'novillo 1': 'novillo', 'novillo 2': 'novillo',
  'vaquillona': 'vaquillona', 'vaquillonas': 'vaquillona', 'vaquillona especial': 'vaquillona',
  'vaca': 'vaca', 'vacas': 'vaca',
  'vaca manufactura': 'vaca', 'vaca conserva': 'vaca', 'vaca industria': 'vaca',
  'vaca c/cria': 'vaca', 'vaca con cria': 'vaca',
  'toro': 'toro', 'toros': 'toro', 'toro indice': 'toro',
  'mej': 'mej', 'media edad joven': 'mej',
  'inmag': 'inmag', 'invernada macho grande': 'inmag', 'invernada macho': 'inmag',
};

async function fetchWithTimeout(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaDelia/1.0)',
        Accept: 'text/html,application/json,text/csv,*/*',
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

// ── Source 1: Mercado Agroganadero official site (HTML table) ─────────────────
// URL serves a plain HTML table with daily prices per category
async function tryMercadoAgroganadero() {
  // haciinfo000001 = resumen general ; try multiple report IDs
  const urls = [
    'https://www.mercadoagroganadero.com.ar/dll/hacienda1.dll/haciinfo000001',
    'https://mercadodeliniers.com.ar/dll/hacienda1.dll/haciinfo000001',
    'https://www.mercadoagroganadero.com.ar/dll/hacienda6.dll/haciinfo000307',
  ];

  for (const url of urls) {
    try {
      const r = await fetchWithTimeout(url, { headers: { Accept: 'text/html' } });
      if (!r.ok) continue;
      const html = await r.text();
      const data = parseHaciendaHTML(html, url);
      if (data) return data;
    } catch (_) {}
  }
  throw new Error('Mercado Agroganadero: no data');
}

function parseHaciendaHTML(html, source) {
  // Extract all <td> text content
  const cells = [];
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = tdRe.exec(html)) !== null) {
    cells.push(m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
  }

  // Extract date from page (look for dd/mm/yyyy or yyyy-mm-dd pattern)
  const dateM = html.match(/(\d{2})\/(\d{2})\/(\d{4})/) ||
                html.match(/(\d{4})-(\d{2})-(\d{2})/);
  let fecha = '';
  if (dateM) {
    // normalize to yyyy-mm-dd
    if (dateM[0].includes('/')) {
      fecha = `${dateM[3]}-${dateM[2]}-${dateM[1]}`;
    } else {
      fecha = dateM[0];
    }
  }

  const precios = {};
  // Walk cells looking for category names followed by price values
  for (let i = 0; i < cells.length; i++) {
    const cat = cells[i].toLowerCase().replace(/\s+/g, ' ').trim();
    const key = CAT_MAP[cat];
    if (!key) continue;
    // look ahead for the first numeric cell (price)
    for (let j = i + 1; j < Math.min(i + 6, cells.length); j++) {
      const num = parseFloat(cells[j].replace(/[.$]/g, '').replace(',', '.'));
      if (num > 100 && num < 100000) {
        if (!precios[key]) precios[key] = num;
        break;
      }
    }
  }

  if (Object.keys(precios).length === 0) return null;
  return { fecha, precios, source: `Mercado Agroganadero (${source})` };
}

// ── Source 2: datos.gob.ar resource_show → discover download URL → parse CSV ──
async function tryResourceShow() {
  const showUrl = `https://www.datos.gob.ar/api/3/action/resource_show?id=${CKAN_ID}`;
  const r = await fetchWithTimeout(showUrl, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`resource_show HTTP ${r.status}`);
  const j = await r.json();
  const downloadUrl = j?.result?.url;
  if (!downloadUrl) throw new Error('resource_show: no url field');
  return await tryCSV(downloadUrl, `datos.gob.ar CSV (${downloadUrl.slice(-30)})`);
}

// ── Source 3: CKAN datastore JSON ─────────────────────────────────────────────
async function tryCKAN(baseUrl) {
  const url = `${baseUrl}/api/3/action/datastore_search?resource_id=${CKAN_ID}&limit=300&sort=fecha+desc`;
  const r = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const json = await r.json();
  if (!json.success || !json.result?.records?.length) throw new Error('empty/unavailable');

  const fields = json.result.fields || [];
  const fieldNames = fields.map(f => String(f.id || f.name || '').toLowerCase());
  const findCol = (...pats) => {
    for (const p of pats) {
      const i = fieldNames.findIndex(f => f.includes(p));
      if (i >= 0) return fields[i].id || fields[i].name;
    }
    return null;
  };
  const fechaCol  = findCol('fecha', 'date', 'periodo');
  const catCol    = findCol('categoria', 'category', 'tipo', 'clase');
  const precioCol = findCol('precio_prom', 'precio', 'price', 'valor');
  if (!fechaCol || !catCol || !precioCol) throw new Error('unexpected columns: ' + fieldNames.join(','));

  const byDate = {};
  for (const rec of json.result.records) {
    const fecha = String(rec[fechaCol] || '').slice(0, 10);
    const cat = String(rec[catCol] || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const key = CAT_MAP[cat];
    if (!fecha || !key) continue;
    const precio = parseFloat(rec[precioCol] || 0);
    if (!byDate[fecha]) byDate[fecha] = {};
    if (!byDate[fecha][key]) byDate[fecha][key] = precio;
  }
  const dates = Object.keys(byDate).sort().reverse();
  if (!dates.length) throw new Error('no matching rows after normalization');
  const fecha = dates[0];
  return { fecha, precios: byDate[fecha], source: `CKAN ${baseUrl}` };
}

// ── Source 4: direct CSV ──────────────────────────────────────────────────────
async function tryCSV(url, sourceName) {
  const r = await fetchWithTimeout(url, { headers: { Accept: 'text/csv,*/*' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV too short');

  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const findCol = (...pats) => {
    for (const p of pats) {
      const i = header.findIndex(h => h.includes(p));
      if (i >= 0) return i;
    }
    return -1;
  };
  const fechaIdx  = findCol('fecha', 'date', 'periodo');
  const catIdx    = findCol('categoria', 'category', 'tipo', 'clase');
  const precioIdx = findCol('precio_prom', 'precio', 'price', 'valor');
  if (fechaIdx < 0 || catIdx < 0 || precioIdx < 0) {
    throw new Error('CSV missing columns. Headers: ' + header.join(','));
  }

  const byDate = {};
  for (const line of lines.slice(1)) {
    const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
    const fecha = cols[fechaIdx]?.slice(0, 10);
    const cat = (cols[catIdx] || '').toLowerCase().replace(/\s+/g, ' ');
    const key = CAT_MAP[cat];
    if (!fecha || !key) continue;
    const precio = parseFloat(cols[precioIdx] || 0);
    if (!byDate[fecha]) byDate[fecha] = {};
    if (!byDate[fecha][key]) byDate[fecha][key] = precio;
  }
  const dates = Object.keys(byDate).sort().reverse();
  if (!dates.length) throw new Error('CSV no matching rows. Cats seen: ' + [...new Set(lines.slice(1,5).map(l => l.split(',')[catIdx]))].join(','));
  const fecha = dates[0];
  return { fecha, precios: byDate[fecha], source: sourceName };
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
      errors.push(`${label}: ${e.message}`);
      return null;
    }
  };

  // Try sources in order
  if (await attempt('MercadoAgroganadero', tryMercadoAgroganadero)) return;
  if (await attempt('resource_show', tryResourceShow)) return;
  if (await attempt('CKAN magyp', () => tryCKAN('https://datos.magyp.gob.ar'))) return;
  if (await attempt('CKAN datos.gob.ar', () => tryCKAN('https://www.datos.gob.ar'))) return;
  if (await attempt('CSV 5.1', () => tryCSV(
    'https://infra.datos.gob.ar/catalog/agroindustria/dataset/5/distribution/5.1/download/mercado-liniers-precio-cantidad-cabezas-promedio.csv',
    'CSV infra (5.1)'
  ))) return;

  if (debug) {
    return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible', debug: errors });
  }
  return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible' });
}
