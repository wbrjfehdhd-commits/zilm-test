// api/auth/login.js
const { verifyPassword, signSession, SESSION_MAX_AGE_SECONDS } = require('../../lib/auth');
const { serializeSessionCookie } = require('../../lib/cookies');
const { getAdmins } = require('../../lib/store');
const { COOKIE_NAME } = require('../../lib/require-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'SESSION_SECRET is not configured on the server.' });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  // 1. Check against the single owner account (set via env vars in the Vercel dashboard).
  const ownerUsername = process.env.OWNER_USERNAME;
  const ownerSalt = process.env.OWNER_PASSWORD_SALT;
  const ownerHash = process.env.OWNER_PASSWORD_HASH;

  if (ownerUsername && ownerSalt && ownerHash && username === ownerUsername) {
    if (verifyPassword(password, ownerSalt, ownerHash)) {
      const token = signSession({ username, role: 'owner' }, secret);
      res.setHeader('Set-Cookie', serializeSessionCookie(COOKIE_NAME, token, SESSION_MAX_AGE_SECONDS));
      res.status(200).json({ username, role: 'owner' });
      return;
    }
    res.status(401).json({ error: 'Incorrect username or password.' });
    return;
  }

  // 2. Otherwise check the dynamic admin list stored in KV (added via the Owner Panel).
  const admins = await getAdmins();
  const match = admins.find((a) => a.username === username);
  if (match && verifyPassword(password, match.salt, match.hash)) {
    const token = signSession({ username, role: match.role || 'admin' }, secret);
    res.setHeader('Set-Cookie', serializeSessionCookie(COOKIE_NAME, token, SESSION_MAX_AGE_SECONDS));
    res.status(200).json({ username, role: match.role || 'admin' });
    return;
  }

  res.status(401).json({ error: 'Incorrect username or password.' });
};
