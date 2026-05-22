const LAT = -36.905;
const LON = -58.583;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = new Date();
  const endYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const startYear = endYear - 5;

  // NASA POWER API — community AG, monthly, solar radiation MJ/m²/day
  const url = `https://power.larc.nasa.gov/api/temporal/monthly/point`
    + `?parameters=ALLSKY_SFC_SW_DWN`
    + `&community=AG`
    + `&longitude=${LON}&latitude=${LAT}`
    + `&start=${startYear}&end=${endYear}`
    + `&format=JSON`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: `NASA POWER ${r.status}`, detail: text.slice(0, 200) });
    }
    const data = await r.json();

    // Response: data.properties.parameter.ALLSKY_SFC_SW_DWN = { "201901": 18.5, ... }
    const raw = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN || {};

    const monthly = {};
    for (const [key, val] of Object.entries(raw)) {
      if (!val || val < 0) continue; // -999 = sin dato
      const year = key.slice(0, 4);
      const month = key.slice(4, 6);
      if (month === '13') continue; // mes 13 = promedio anual, ignorar
      const ym = `${year}-${month}`;
      // NASA POWER da MJ/m²/día → multiplicar por días del mes → MJ/m²/mes
      const days = new Date(parseInt(year), parseInt(month), 0).getDate();
      monthly[ym] = parseFloat((val * days).toFixed(1));
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(monthly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
