// api/reports/submit.js
const { getReports, saveReports } = require('../../lib/store');
const crypto = require('crypto');

const VALID_TYPES = ['report', 'unban', 'wiki-ticket'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const type = VALID_TYPES.includes(body.type) ? body.type : 'report';

  // Keep only expected fields — never trust the whole body blindly.
  const entry = {
    id: crypto.randomUUID(),
    type,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reportedUsername: type === 'report' ? String(body.reportedUsername || '').slice(0, 100) : undefined,
    reporterUsername: type === 'report' ? String(body.reporterUsername || '').slice(0, 100) : undefined,
    category: type === 'report' ? String(body.category || '').slice(0, 100) : undefined,
    description: type === 'report' ? String(body.description || '').slice(0, 2000) : undefined,
    evidenceUrl: type === 'report' ? String(body.evidenceUrl || '').slice(0, 500) : undefined,
    bannedUsername: type === 'unban' ? String(body.bannedUsername || '').slice(0, 100) : undefined,
    discordTag: type === 'unban' ? String(body.discordTag || '').slice(0, 100) : undefined,
    banReason: type === 'unban' ? String(body.banReason || '').slice(0, 200) : undefined,
    appealText: type === 'unban' ? String(body.appealText || '').slice(0, 2000) : undefined,
    // wiki-ticket fields (Found an error / Wiki Suggestions / Wiki Editing request)
    wikiCategory: type === 'wiki-ticket' ? String(body.category || 'Other').slice(0, 60) : undefined,
    pageUrl: type === 'wiki-ticket' ? String(body.pageUrl || '').slice(0, 200) : undefined,
    message: type === 'wiki-ticket' ? String(body.message || '').slice(0, 2000) : undefined,
    contact: type === 'wiki-ticket' ? String(body.contact || '').slice(0, 100) : undefined,
  };

  if (type === 'report' && (!entry.reportedUsername || !entry.reporterUsername || !entry.description)) {
    res.status(400).json({ error: 'Missing required report fields.' });
    return;
  }
  if (type === 'unban' && (!entry.bannedUsername || !entry.appealText)) {
    res.status(400).json({ error: 'Missing required unban fields.' });
    return;
  }
  if (type === 'wiki-ticket' && !entry.message) {
    res.status(400).json({ error: 'Missing required wiki ticket fields.' });
    return;
  }

  const reports = await getReports();
  reports.unshift(entry);
  await saveReports(reports);

  res.status(200).json({ ok: true, id: entry.id });
};
