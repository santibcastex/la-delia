// Proxy to Argentine cattle market price data
// Source 1: datos.magyp.gob.ar CKAN — Mercado de Liniers monthly summary
// Source 2: datos.gob.ar CKAN — mirror of same dataset
// Source 3: infra.datos.gob.ar — direct CSV download
// Cached 1 hour server-side

const CKAN_ID = 'bd15f73c-fe07-41d9-9dd9-58e3244cad59';

// Map Spanish category names → internal keys used in the app
const CAT_MAP = {
  'novillito': 'novillito',
  'novillitos': 'novillito',
  'novillo': 'novillo',
  'novillos': 'novillo',
  'novillo especial': 'novillo',
  'novillo 1': 'novillo',
  'novillo 2': 'novillo',
  'vaquillona': 'vaquillona',
  'vaquillonas': 'vaquillona',
  'vaquillona especial': 'vaquillona',
  'vaca': 'vaca',
  'vacas': 'vaca',
  'vaca manufactura': 'vaca',
  'vaca conserva': 'vaca',
  'vaca industria': 'vaca',
  'vaca c/cria': 'vaca',
  'vaca con cria': 'vaca',
  'toro': 'toro',
  'toros': 'toro',
  'toro indice': 'toro',
  'mej': 'mej',
  'media edad joven': 'mej',
  'inmag': 'inmag',
  'invernada macho grande': 'inmag',
  'invernada macho': 'inmag',
};

async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json, text/csv, */*',
        'User-Agent': 'Mozilla/5.0',
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

function normalizeCKANRecords(records, fields) {
  // Build lowercase field index
  const fieldNames = fields.map(f => String(f.id || f.name || '').toLowerCase());

  const findCol = (...patterns) => {
    for (const p of patterns) {
      const i = fieldNames.findIndex(f => f.includes(p));
      if (i >= 0) return fields[i].id || fields[i].name;
    }
    return null;
  };

  const fechaCol  = findCol('fecha', 'date', 'periodo', 'anio', 'año');
  const catCol    = findCol('categoria', 'category', 'tipo', 'raza', 'clase', 'denominacion');
  const precioCol = findCol('precio_prom', 'precio', 'price', 'valor', 'importe');

  if (!fechaCol || !catCol || !precioCol) return null;

  // Aggregate by date → category → latest price
  const byDate = {};
  for (const rec of records) {
    const fecha = String(rec[fechaCol] || '').slice(0, 10);
    if (!fecha) continue;
    const cat = String(rec[catCol] || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const key = CAT_MAP[cat];
    if (!key) continue;
    const precio = parseFloat(rec[precioCol] || 0);
    if (!byDate[fecha]) byDate[fecha] = {};
    if (!byDate[fecha][key]) byDate[fecha][key] = precio; // keep first per date (sorted desc)
  }

  const dates = Object.keys(byDate).sort().reverse();
  if (!dates.length) return null;
  const fecha = dates[0];
  return { fecha, precios: byDate[fecha] };
}

async function tryCKAN(baseUrl) {
  // Try datastore first (JSON rows), then fallback to CSV stream
  const url = `${baseUrl}/api/3/action/datastore_search?resource_id=${CKAN_ID}&limit=300&sort=fecha+desc`;
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const json = await r.json();
  if (!json.success || !json.result?.records?.length) throw new Error('empty result');
  const norm = normalizeCKANRecords(json.result.records, json.result.fields || []);
  if (!norm) throw new Error('normalize failed — unexpected columns');
  return { ...norm, source: `CKAN (${baseUrl})` };
}

async function tryCSV(url, sourceName) {
  const r = await fetchWithTimeout(url, { headers: { Accept: 'text/csv' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV empty');

  // Parse header
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

  if (fechaIdx < 0 || catIdx < 0 || precioIdx < 0) throw new Error('CSV missing columns');

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
  if (!dates.length) throw new Error('CSV no matching rows');
  const fecha = dates[0];
  return { fecha, precios: byDate[fecha], source: sourceName };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const debug = req.query?.debug === '1';
  const errors = [];

  if (!debug) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  }

  // 1. CKAN datastore JSON — Ministry of Agriculture portal
  try {
    const d = await tryCKAN('https://datos.magyp.gob.ar');
    return res.status(200).json({ ok: true, ...d });
  } catch (e) { errors.push(`CKAN magyp: ${e.message}`); }

  // 2. CKAN mirror on main open-data portal
  try {
    const d = await tryCKAN('https://www.datos.gob.ar');
    return res.status(200).json({ ok: true, ...d });
  } catch (e) { errors.push(`CKAN datos.gob.ar: ${e.message}`); }

  // 3. Direct CSV download (infra.datos.gob.ar)
  const csvUrls = [
    ['https://infra.datos.gob.ar/catalog/agroindustria/dataset/5/distribution/5.1/download/mercado-liniers-precio-cantidad-cabezas-promedio.csv', 'CSV (5.1)'],
    ['https://infra.datos.gob.ar/catalog/agroindustria/dataset/131/distribution/131.1/download/precios-hacienda-en-pie.csv', 'CSV (131.1)'],
    // Also try resource_show to discover the real download URL
    [`https://www.datos.gob.ar/api/3/action/resource_show?id=${CKAN_ID}`, 'resource_show'],
  ];
  for (const [url, name] of csvUrls) {
    try {
      if (name === 'resource_show') {
        // Use resource_show to find the actual download URL then fetch CSV
        const r = await fetchWithTimeout(url);
        if (r.ok) {
          const j = await r.json();
          const downloadUrl = j?.result?.url;
          if (downloadUrl) {
            const d = await tryCSV(downloadUrl, 'CSV (resource_show)');
            return res.status(200).json({ ok: true, ...d });
          }
        }
        throw new Error('resource_show no url');
      } else {
        const d = await tryCSV(url, name);
        return res.status(200).json({ ok: true, ...d });
      }
    } catch (e) { errors.push(`${name}: ${e.message}`); }
  }

  if (debug) {
    return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible', debug: errors });
  }
  return res.status(503).json({ ok: false, error: 'Fuente de datos no disponible' });
}
