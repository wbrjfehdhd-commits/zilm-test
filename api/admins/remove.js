// api/admins/remove.js
const { requireRole } = require('../../lib/require-auth');
const { getAdmins, saveAdmins } = require('../../lib/store');

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['owner']);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username } = req.body || {};
  if (!username) {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }

  const admins = await getAdmins();
  const next = admins.filter((a) => a.username !== username);
  if (next.length === admins.length) {
    res.status(404).json({ error: 'Admin not found.' });
    return;
  }
  await saveAdmins(next);

  res.status(200).json({ ok: true });
};
