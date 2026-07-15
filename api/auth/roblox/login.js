// api/auth/roblox/login.js
const { signSession } = require('../../../lib/auth');
const { buildAuthorizeUrl } = require('../../../lib/roblox');
const { serializeSessionCookie } = require('../../../lib/cookies');

module.exports = async (req, res) => {
  const secret = process.env.SESSION_SECRET;
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const redirectUri = process.env.ROBLOX_REDIRECT_URI;

  if (!secret || !clientId || !redirectUri) {
    res.status(500).send(
      'Roblox login is not fully configured yet. Make sure SESSION_SECRET, ROBLOX_CLIENT_ID, ' +
      'ROBLOX_CLIENT_SECRET, and ROBLOX_REDIRECT_URI are all set in your Vercel env vars.'
    );
    return;
  }

  // Short-lived, signed CSRF token. We both send it to Roblox as `state` and store it in
  // a cookie, then require both to match on the way back — protects against forged callbacks.
  const state = signSession({ purpose: 'roblox-oauth-state' }, secret);
  res.setHeader('Set-Cookie', serializeSessionCookie('ez_oauth_state', state, 600));
  res.writeHead(302, { Location: buildAuthorizeUrl(state) });
  res.end();
};
