// api/wiki/get.js
const { getWikiPages } = require('../../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { slug } = req.query || {};
  if (!slug) {
    res.status(400).json({ error: 'Missing slug.' });
    return;
  }
  const pages = await getWikiPages();
  const page = pages.find((p) => p.slug === slug);
  if (!page) {
    res.status(404).json({ error: 'Page not found.' });
    return;
  }
  res.status(200).json({ page });
};
