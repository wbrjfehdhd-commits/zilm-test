// api/admins/list.js
const { requireRole } = require('../../lib/require-auth');
const { getAdmins } = require('../../lib/store');

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['owner']);
  if (!session) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const admins = await getAdmins();
  // Strip salt/hash before this ever reaches the browser.
  const safe = admins.map(({ username, role, addedAt, addedBy }) => ({ username, role, addedAt, addedBy }));
  res.status(200).json({ admins: safe });
};
