import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    const params = [];

    // 1. From the current URL query string
    const parsed = new URL(url);
    parsed.searchParams.forEach((value, name) => {
      params.push({ name, value });
    });

    // 2. From all links on the page
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const linkUrl = new URL(href, url);
        linkUrl.searchParams.forEach((value, name) => {
          params.push({ name, value });
        });
      } catch (e) { /* ignore invalid URLs */ }
    });

    // 3. From forms (GET method)
    $('form[method="get"]').each((_, form) => {
      const action = $(form).attr('action') || '';
      $(form).find('input[name]').each((_, input) => {
        const name = $(input).attr('name');
        const value = $(input).attr('value') || '';
        if (name) params.push({ name, value });
      });
    });

    // Remove duplicates by (name,value) and limit
    const unique = [];
    const seen = new Set();
    for (const p of params) {
      const key = p.name + '||' + p.value;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    res.status(200).json({ params: unique.slice(0, 100) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Parameter scan failed' });
  }
}
