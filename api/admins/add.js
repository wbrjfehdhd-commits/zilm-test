// api/admins/add.js
const crypto = require('crypto');
const { requireRole } = require('../../lib/require-auth');
const { getAdmins, saveAdmins } = require('../../lib/store');

const ALLOWED_ROLES = ['admin', 'moderator']; // owner is fixed via env vars, not creatable here

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['owner']);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password, role } = req.body || {};
  if (!username || !password || !ALLOWED_ROLES.includes(role)) {
    res.status(400).json({ error: 'Username, password, and a valid role (admin/moderator) are required.' });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  const admins = await getAdmins();
  if (admins.some((a) => a.username === username)) {
    res.status(409).json({ error: 'That username already exists.' });
    return;
  }

  // Hash immediately — the plaintext password never gets stored or logged anywhere.
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');

  admins.push({
    username: String(username).slice(0, 100),
    salt,
    hash,
    role,
    addedAt: new Date().toISOString(),
    addedBy: session.username,
  });
  await saveAdmins(admins);

  res.status(200).json({ ok: true });
};
