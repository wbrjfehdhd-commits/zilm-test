// api/auth/me.js
const { parseCookies } = require('../../lib/cookies');
const { verifySession } = require('../../lib/auth');
const { COOKIE_NAME } = require('../../lib/require-auth');

module.exports = async (req, res) => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'SESSION_SECRET is not configured on the server.' });
    return;
  }
  const cookies = parseCookies(req);
  const session = verifySession(cookies[COOKIE_NAME], secret);
  if (!session) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }
  res.status(200).json({ username: session.username, role: session.role });
};
