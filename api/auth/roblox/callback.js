// api/auth/roblox/callback.js
const { verifySession, signSession, SESSION_MAX_AGE_SECONDS } = require('../../../lib/auth');
const { exchangeCodeForToken, getRobloxUserInfo } = require('../../../lib/roblox');
const { serializeSessionCookie, clearSessionCookie, parseCookies } = require('../../../lib/cookies');
const { COOKIE_NAME } = require('../../../lib/require-auth');

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

module.exports = async (req, res) => {
  const secret = process.env.SESSION_SECRET;
  const { code, state, error } = req.query || {};

  if (error) {
    redirect(res, '/login.html?error=' + encodeURIComponent(error));
    return;
  }
  if (!code || !state || !secret) {
    redirect(res, '/login.html?error=missing_params');
    return;
  }

  const cookies = parseCookies(req);
  const stateCookie = cookies['ez_oauth_state'];
  const statePayload = verifySession(state, secret);

  // Both the signature AND the cookie must match — confirms this is the same browser
  // that started the flow, not a replayed or forged callback URL.
  if (!statePayload || !stateCookie || state !== stateCookie) {
    redirect(res, '/login.html?error=invalid_state');
    return;
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const profile = await getRobloxUserInfo(tokenData.access_token);

    const sessionToken = signSession(
      {
        username: profile.preferred_username || profile.name || `Roblox_${profile.sub}`,
        robloxId: profile.sub,
        role: 'player',
      },
      secret
    );

    res.setHeader('Set-Cookie', [
      serializeSessionCookie(COOKIE_NAME, sessionToken, SESSION_MAX_AGE_SECONDS),
      clearSessionCookie('ez_oauth_state'),
    ]);
    redirect(res, '/index.html?login=success');
  } catch (err) {
    redirect(res, '/login.html?error=roblox_failed');
  }
};
