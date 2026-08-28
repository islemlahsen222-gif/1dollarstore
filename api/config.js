// GET /api/config
// Returns only the PUBLIC PayPal Client ID so the frontend can load the
// PayPal SDK. The Client Secret never leaves the server (see lib-paypal.js).

module.exports = (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;

  if (!clientId) {
    res.status(500).json({ error: 'Server not configured: missing PAYPAL_CLIENT_ID' });
    return;
  }

  res.status(200).json({ clientId });
};
