// api/wiki/list.js
const { getWikiPages } = require('../../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const pages = await getWikiPages();
  const summary = pages
    .map(({ slug, title, updatedAt }) => ({ slug, title, updatedAt }))
    .sort((a, b) => a.title.localeCompare(b.title));
  res.status(200).json({ pages: summary });
};
