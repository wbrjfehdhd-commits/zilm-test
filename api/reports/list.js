// api/reports/list.js
const { requireRole } = require('../../lib/require-auth');
const { getReports } = require('../../lib/store');

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['admin', 'owner']);
  if (!session) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const reports = await getReports();
  res.status(200).json({ reports });
};
