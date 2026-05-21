// Returns available Sentinel-2 L2A acquisition dates for the farm bbox in a given month.
// Uses the public CDSE STAC catalog (no auth required).

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

  // Try SENTINEL-2-L2A first, fall back to SENTINEL-2
  const collections = ['SENTINEL-2-L2A', 'SENTINEL-2'];

  for (const collection of collections) {
    const url = `https://catalogue.dataspace.copernicus.eu/stac/collections/${collection}/items`
      + `?bbox=${FARM_BBOX}&datetime=${from}/${to}&limit=200`;

    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      const text = await r.text();

      if (!r.ok) {
        console.error(`STAC ${collection} error ${r.status}:`, text.slice(0, 300));
        continue;
      }

      let data;
      try { data = JSON.parse(text); } catch {
        console.error(`STAC ${collection} invalid JSON:`, text.slice(0, 200));
        continue;
      }

      // Debug mode: return raw response so we can inspect it
      if (debug === '1') {
        return res.json({
          collection,
          url,
          status: r.status,
          featureCount: (data.features || []).length,
          firstFeature: (data.features || [])[0] || null,
          keys: Object.keys(data)
        });
      }

      const features = data.features || data.items || [];

      if (features.length === 0) {
        console.log(`STAC ${collection}: 0 features for ${from}/${to}`);
        continue;
      }

      const dates = {};
      for (const item of features) {
        // Filter L2A if using generic SENTINEL-2 collection
        if (collection === 'SENTINEL-2') {
          const pt = item.properties?.['s2:product_type'] || '';
          if (pt && !pt.includes('2A')) continue;
        }

        const dt = (item.properties?.datetime || item.properties?.start_datetime || '').slice(0, 10);
        if (!dt) continue;

        const cloud = Math.round(
          item.properties?.['eo:cloud_cover'] ??
          item.properties?.['cloudCoverPercentage'] ??
          item.properties?.['s2:cloud_cover'] ??
          100
        );

        if (!(dt in dates) || cloud < dates[dt]) {
          dates[dt] = cloud;
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.json(dates);

    } catch (e) {
      console.error(`STAC ${collection} fetch error:`, e.message);
    }
  }

  // Both collections failed
  res.status(502).json({ error: 'CDSE STAC unreachable' });
}
