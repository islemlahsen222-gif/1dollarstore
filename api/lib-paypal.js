// Helper to talk to PayPal's REST API (Orders v2) from the server side only.
// Client ID + Secret never reach the browser — only used here, inside serverless functions.

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET environment variables on the server.'
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

module.exports = { PAYPAL_API_BASE, getAccessToken };
