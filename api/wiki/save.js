// api/wiki/save.js
const { requireRole } = require('../../lib/require-auth');
const { getWikiPages, saveWikiPages } = require('../../lib/store');

function slugify(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['owner', 'wiki-editor']);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { title, body, existingSlug } = req.body || {};
  if (!title || !body) {
    res.status(400).json({ error: 'Title and body are required.' });
    return;
  }

  const pages = await getWikiPages();
  const slug = existingSlug || slugify(title);
  if (!slug) {
    res.status(400).json({ error: 'Could not generate a URL slug from that title.' });
    return;
  }

  const existingIndex = pages.findIndex((p) => p.slug === slug);
  const now = new Date().toISOString();

  const entry = {
    slug,
    title: String(title).slice(0, 150),
    body: String(body).slice(0, 20000),
    updatedAt: now,
    updatedBy: session.username,
    createdAt: existingIndex >= 0 ? pages[existingIndex].createdAt : now,
    createdBy: existingIndex >= 0 ? pages[existingIndex].createdBy : session.username,
  };

  if (existingIndex >= 0) {
    pages[existingIndex] = entry;
  } else {
    // Slug collision with a different page (two different titles slugified the same way).
    if (pages.some((p) => p.slug === slug)) {
      res.status(409).json({ error: 'A page with that URL slug already exists. Try a different title.' });
      return;
    }
    pages.push(entry);
  }

  await saveWikiPages(pages);
  res.status(200).json({ ok: true, slug });
};
