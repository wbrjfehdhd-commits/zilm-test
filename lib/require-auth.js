// lib/require-auth.js
const { parseCookies } = require('./cookies');
const { verifySession } = require('./auth');

const COOKIE_NAME = 'ez_session';

// Returns the session payload {username, role} if valid, otherwise sends a
// 401/403 response itself and returns null — caller should just `return` when it gets null.
function requireRole(req, res, allowedRoles) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'SESSION_SECRET is not configured on the server.' });
    return null;
  }
  const cookies = parseCookies(req);
  const session = verifySession(cookies[COOKIE_NAME], secret);
  if (!session) {
    res.status(401).json({ error: 'Not signed in.' });
    return null;
  }
  if (!allowedRoles.includes(session.role)) {
    res.status(403).json({ error: 'Your role does not have access to this.' });
    return null;
  }
  return session;
}

module.exports = { requireRole, COOKIE_NAME };
