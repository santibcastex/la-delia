const FARM_BBOX = [-58.616, -36.929, -58.548, -36.877];

async function getToken() {
  const res = await fetch(
    'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CDSE_CLIENT_ID || process.env.REACT_APP_CDSE_CLIENT_ID || '',
        client_secret: process.env.CDSE_CLIENT_SECRET || process.env.REACT_APP_CDSE_CLIENT_SECRET || ''
      })
    }
  );
  return (await res.json()).access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { year, month, debug } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });

  const y = parseInt(year);
  const m = parseInt(month);
  const lastDay = new Date(y, m, 0).getDate();
  const pad = n => String(n).padStart(2, '0');
  const datetime = `${y}-${pad(m)}-01T00:00:00Z/${y}-${pad(m)}-${lastDay}T23:59:59Z`;

  try {
    const token = await getToken();
    if (!token) return res.status(502).json({ error: 'No token' });

    // Sentinel Hub Catalog API — same credentials as Process API
    const r = await fetch('https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bbox: FARM_BBOX,
        datetime,
        collections: ['sentinel-2-l2a'],
        limit: 100,
        fields: { include: ['properties.datetime', 'properties.eo:cloud_cover'] }
      })
    });

    const data = await r.json();

    if (debug === '1') {
      return res.json({
        status: r.status,
        featureCount: (data.features || []).length,
        firstFeatureProperties: (data.features || [])[0]?.properties || null,
        context: data.context || null,
      });
    }

    if (!r.ok) return res.status(502).json({ error: `Catalog ${r.status}`, detail: JSON.stringify(data).slice(0, 300) });

    const dates = {};
    for (const item of data.features || []) {
      const dt = (item.properties?.datetime || '').slice(0, 10);
      if (!dt) continue;
      const cloud = Math.round(item.properties?.['eo:cloud_cover'] ?? 100);
      if (!(dt in dates) || cloud < dates[dt]) dates[dt] = cloud;
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(dates);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
