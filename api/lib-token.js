// Signs and verifies short-lived download tokens using HMAC-SHA256.
// No database needed — the token itself carries the product id + expiry,
// and the signature proves it wasn't tampered with.
//
// IMPORTANT LIMITATION (please read):
// This makes the token TIME-LIMITED (expires after DOWNLOAD_TOKEN_TTL_MINUTES),
// not strictly SINGLE-USE. Because Vercel functions are stateless, truly
// enforcing "only one download ever" requires persistent storage (e.g. Vercel
// KV / Upstash Redis) to remember which tokens were already used. If you want
// that extra layer, it can be added — ask and it can be wired in.

const crypto = require('crypto');

const TTL_MINUTES = Number(process.env.DOWNLOAD_TOKEN_TTL_MINUTES || 15);

function getSecret() {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Missing DOWNLOAD_TOKEN_SECRET environment variable on the server.');
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString('utf8');
}

function sign(productId, orderID) {
  const secret = getSecret();
  const payload = JSON.stringify({
    productId,
    orderID,
    exp: Date.now() + TTL_MINUTES * 60 * 1000
  });
  const payloadB64 = base64url(payload);
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

function verify(token) {
  const secret = getSecret();
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  // Signature must be exactly 64 lowercase hex chars (SHA-256 digest).
  // Buffer.from(x, 'hex') silently ignores trailing invalid characters,
  // so without this strict check a tampered signature like "<valid>xx"
  // would parse down to the same bytes as the valid one and pass.
  if (!/^[0-9a-f]{64}$/.test(signature)) return null;

  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSignature, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null; // signature invalid or tampered
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64));
  } catch {
    return null;
  }

  if (!payload.exp || Date.now() > payload.exp) return null; // expired

  return payload; // { productId, orderID, exp }
}

module.exports = { sign, verify, TTL_MINUTES };
