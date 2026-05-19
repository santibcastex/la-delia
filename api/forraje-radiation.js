export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const months = Math.min(60, parseInt(req.query.months || '24'));
  const lat = -36.905;
  const lon = -58.583;

  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
  endDate.setDate(endDate.getDate() - 1); // last day of previous month
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months + 1, 1);

  const fmt = d => d.toISOString().slice(0, 10);

  try {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${fmt(startDate)}&end_date=${fmt(endDate)}&daily=shortwave_radiation_sum&timezone=America%2FArgentina%2FBuenos_Aires`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'Open-Meteo error', status: r.status });
    const data = await r.json();

    const monthly = {};
    (data.daily?.time || []).forEach((date, i) => {
      const ym = date.slice(0, 7);
      const val = data.daily.shortwave_radiation_sum[i];
      if (val != null) {
        monthly[ym] = (monthly[ym] || 0) + val;
      }
    });

    res.setHeader('Cache-Control', 'public, max-age=43200');
    res.json(monthly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
