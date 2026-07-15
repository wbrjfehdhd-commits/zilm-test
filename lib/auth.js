// lib/auth.js
// Zero-dependency password hashing + signed session tokens using Node's built-in crypto.
// Nothing here ever stores a plaintext password. Sessions are stateless, signed cookies —
// tampering with the payload invalidates the signature.

const crypto = require('crypto');

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hour session

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Verify a plaintext password against a stored scrypt hash+salt (both hex strings).
// Generate these locally with scripts/hash-password.mjs — never store the plaintext.
function verifyPassword(plain, saltHex, hashHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = crypto.scryptSync(plain, salt, 64);
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString('utf8');
}

// Sign a small JSON payload into a compact token: base64url(payload).base64url(hmac)
function signSession(payload, secret) {
  const body = JSON.stringify({ ...payload, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 });
  const encoded = base64url(body);
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

// Verify + decode a session token. Returns the payload object, or null if invalid/expired/tampered.
function verifySession(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
  if (!sig || !timingSafeEqual(sig, expectedSig)) return null;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encoded));
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

module.exports = { verifyPassword, signSession, verifySession, SESSION_MAX_AGE_SECONDS };
