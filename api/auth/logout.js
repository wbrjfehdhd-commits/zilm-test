// api/auth/logout.js
const { clearSessionCookie } = require('../../lib/cookies');
const { COOKIE_NAME } = require('../../lib/require-auth');

module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie(COOKIE_NAME));
  res.status(200).json({ ok: true });
};
