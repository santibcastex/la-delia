const FARM_BBOX = '-58.616,-36.929,-58.548,-36.877';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { year, month, debug } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });

  const y = parseInt(year);
  const m = parseInt(month);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`;
  const to   = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59Z`;

  const url = `https://catalogue.dataspace.copernicus.eu/stac/collections/SENTINEL-2/items`
    + `?bbox=${FARM_BBOX}&datetime=${from}/${to}&limit=200`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }

    if (debug === '1') {
      return res.json({
        status: r.status,
        url,
        topLevelKeys: Object.keys(data),
        featureCount: (data.features || []).length,
        firstFeatureProperties: (data.features || [])[0]?.properties || null,
      });
    }

    if (!r.ok) return res.status(502).json({ error: `STAC ${r.status}`, detail: text.slice(0, 300) });

    const dates = {};
    for (const item of data.features || []) {
      const pt = item.properties?.['s2:product_type'] || '';
      if (pt && !pt.includes('2A')) continue;

      const dt = (item.properties?.datetime || item.properties?.start_datetime || '').slice(0, 10);
      if (!dt) continue;

      const cloud = Math.round(
        item.properties?.['eo:cloud_cover'] ??
        item.properties?.['cloudCoverPercentage'] ??
        item.properties?.['s2:cloud_cover'] ??
        100
      );

      if (!(dt in dates) || cloud < dates[dt]) dates[dt] = cloud;
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(dates);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
