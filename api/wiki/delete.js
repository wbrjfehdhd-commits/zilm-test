// api/wiki/delete.js
const { requireRole } = require('../../lib/require-auth');
const { getWikiPages, saveWikiPages } = require('../../lib/store');

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['owner', 'wiki-editor']);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { slug } = req.body || {};
  if (!slug) {
    res.status(400).json({ error: 'Missing slug.' });
    return;
  }

  const pages = await getWikiPages();
  const next = pages.filter((p) => p.slug !== slug);
  if (next.length === pages.length) {
    res.status(404).json({ error: 'Page not found.' });
    return;
  }
  await saveWikiPages(next);
  res.status(200).json({ ok: true });
};
