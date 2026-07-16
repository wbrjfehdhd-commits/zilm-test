// api/wiki/upload-image.js
const { requireRole } = require('../../lib/require-auth');
const { put } = require('@vercel/blob');

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['owner', 'wiki-editor']);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({ error: 'Image uploads are not configured on the server yet (missing Blob storage).' });
    return;
  }

  const { filename, dataUrl } = req.body || {};
  if (!filename || !dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    res.status(400).json({ error: 'A filename and image data are required.' });
    return;
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: 'Could not read that image data.' });
    return;
  }
  const mimeType = match[1];
  if (!ALLOWED_TYPES.includes(mimeType)) {
    res.status(400).json({ error: 'Only PNG, JPEG, WEBP, or GIF images are allowed.' });
    return;
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_BYTES) {
    res.status(400).json({ error: 'Image is too large — 4MB max.' });
    return;
  }

  try {
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const blob = await put(`wiki/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType: mimeType,
    });
    res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed on the server.' });
  }
};
