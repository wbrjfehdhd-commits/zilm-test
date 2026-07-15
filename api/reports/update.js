// api/reports/update.js
const { requireRole } = require('../../lib/require-auth');
const { getReports, saveReports } = require('../../lib/store');

const VALID_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'];

module.exports = async (req, res) => {
  const session = requireRole(req, res, ['admin', 'owner']);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, status } = req.body || {};
  if (!id || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: 'A valid id and status are required.' });
    return;
  }

  const reports = await getReports();
  const target = reports.find((r) => r.id === id);
  if (!target) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }
  target.status = status;
  target.lastUpdatedBy = session.username;
  target.lastUpdatedAt = new Date().toISOString();
  await saveReports(reports);

  res.status(200).json({ ok: true });
};
