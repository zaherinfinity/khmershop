import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { urls } = req.body;

  const live = [];
  for (const url of urls) {
    try {
      const resp = await axios.head(url, { timeout: 5000 });
      if (resp.status < 400) live.push(url);
    } catch (e) { /* ignore */ }
  }
  res.status(200).json({ live });
}
