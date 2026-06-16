export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { items, operation } = req.body;

  const results = [];
  for (const item of items) {
    try {
      let endpoint, payload;
      if (operation === 'find') {
        endpoint = '/api/find';
        payload = { domain: item, limit: 20 };
      } else if (operation === 'analyze') {
        endpoint = '/api/analyze';
        payload = { url: item };
      } else if (operation === 'params') {
        endpoint = '/api/params';
        payload = { url: item };
      } else {
        throw new Error('Unknown operation');
      }

      const response = await fetch(`${req.headers.origin}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      results.push({ url: item, ...data, status: response.status });
    } catch (e) {
      results.push({ url: item, error: e.message });
    }
  }
  res.status(200).json({ results });
}
