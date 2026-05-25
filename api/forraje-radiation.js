const LAT = -36.905;
const LON = -58.583;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = new Date();
  const endYear = now.getFullYear() - 1; // NASA POWER no tiene datos del año en curso; pedir hasta el año anterior
  const startYear = endYear - 5;

  // NASA POWER API — community AG, monthly, solar radiation MJ/m²/day
  const url = `https://power.larc.nasa.gov/api/temporal/monthly/point`
    + `?parameters=ALLSKY_SFC_SW_DWN`
    + `&community=AG`
    + `&longitude=${LON}&latitude=${LAT}`
    + `&start=${startYear}&end=${endYear}`
    + `&format=JSON`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9 s — safe margin under Vercel 10 s limit
    let r;
    try {
      r = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    const text = await r.text();

    if (req.query.debug === '1') {
      return res.json({ status: r.status, url, body: text.slice(0, 1000) });
    }

    if (!r.ok) {
      return res.status(502).json({ error: `NASA POWER ${r.status}`, detail: text.slice(0, 200) });
    }

    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'invalid JSON', detail: text.slice(0, 200) }); }

    const raw = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN || {};

    const monthly = {};
    // Primero cargar todos los datos disponibles
    for (const [key, val] of Object.entries(raw)) {
      if (val == null || val < 0) continue;
      const year = key.slice(0, 4);
      const month = key.slice(4, 6);
      if (month === '13') continue;
      const ym = `${year}-${month}`;
      const days = new Date(parseInt(year), parseInt(month), 0).getDate();
      monthly[ym] = parseFloat((val * days).toFixed(1));
    }

    // Para meses recientes sin dato, usar promedio histórico del mismo mes calendario
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthly[ym]) continue;
      const calMonth = String(d.getMonth() + 1).padStart(2, '0');
      const historico = Object.entries(monthly)
        .filter(([k]) => k.endsWith(`-${calMonth}`) && parseInt(k.slice(0, 4)) < d.getFullYear())
        .map(([, v]) => v);
      if (historico.length > 0) {
        monthly[ym] = parseFloat((historico.reduce((a, b) => a + b, 0) / historico.length).toFixed(1));
      }
    }

    res.setHeader('Cache-Control', 'public, max-age=43200');
    res.json(monthly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
