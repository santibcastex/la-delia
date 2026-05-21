const FARM_BBOX = '-58.616,-36.929,-58.548,-36.877'; // minLon,minLat,maxLon,maxLat

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { year, month, debug } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });

  const y = parseInt(year);
  const m = parseInt(month);
  const lastDay = new Date(y, m, 0).getDate();
  const pad = n => String(n).padStart(2, '0');
  const startDate = `${y}-${pad(m)}-01T00:00:00Z`;
  const endDate   = `${y}-${pad(m)}-${lastDay}T23:59:59Z`;

  // CDSE OpenSearch/RESTO catalog — public, no auth required
  const url = `https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel2/search.json`
    + `?box=${FARM_BBOX}`
    + `&startDate=${startDate}`
    + `&completionDate=${endDate}`
    + `&productType=S2MSI2A`
    + `&maxRecords=200`;

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

    if (!r.ok) return res.status(502).json({ error: `Catalog ${r.status}`, detail: text.slice(0, 300) });

    const dates = {};
    for (const item of data.features || []) {
      const p = item.properties || {};
      const dt = (p.startDate || p.datetime || '').slice(0, 10);
      if (!dt) continue;

      const cloud = Math.round(p.cloudCover ?? p['eo:cloud_cover'] ?? 100);

      if (!(dt in dates) || cloud < dates[dt]) dates[dt] = cloud;
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(dates);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
