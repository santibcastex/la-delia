// Returns available Sentinel-2 L2A acquisition dates for the farm bbox in a given month.
// Uses the public CDSE STAC catalog (no auth required).

const FARM_BBOX = '-58.616,-36.929,-58.548,-36.877';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });

  const y = parseInt(year);
  const m = parseInt(month);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`;
  const to   = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59Z`;

  // Use the L2A-specific collection; avoid unsupported sortby parameter
  const url = `https://catalogue.dataspace.copernicus.eu/stac/collections/SENTINEL-2-L2A/items`
    + `?bbox=${FARM_BBOX}&datetime=${from}/${to}&limit=200`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) {
      const text = await r.text();
      console.error('STAC error', r.status, text.slice(0, 200));
      return res.status(502).json({ error: `STAC ${r.status}`, detail: text.slice(0, 200) });
    }
    const data = await r.json();

    const dates = {};
    for (const item of data.features || []) {
      const dt = (item.properties?.datetime || '').slice(0, 10);
      if (!dt) continue;

      // Cloud cover — try all known CDSE property names
      const cloud = Math.round(
        item.properties['eo:cloud_cover'] ??
        item.properties['cloudCoverPercentage'] ??
        item.properties['s2:cloud_cover'] ??
        100
      );

      if (!(dt in dates) || cloud < dates[dt]) {
        dates[dt] = cloud;
      }
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(dates);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
