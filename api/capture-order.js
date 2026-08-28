// POST /api/capture-order   body: { orderID, productId }
//
// SECURITY NOTE: after PayPal confirms the capture, this endpoint re-checks
// that the captured amount + currency EXACTLY match the server-side catalog
// price for productId. If someone tampered with anything client-side, this
// check fails closed and no download token is issued.

const { getAccessToken, PAYPAL_API_BASE } = require('./lib-paypal');
const { getProduct } = require('./lib-products');
const { sign } = require('./lib-token');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { orderID, productId } = req.body || {};
    const product = getProduct(productId);

    if (!product || !orderID) {
      res.status(400).json({ error: 'Missing or unknown product/order' });
      return;
    }

    const accessToken = await getAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      res.status(502).json({ error: 'PayPal capture failed', details: captureData });
      return;
    }

    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const expectedAmount = (product.price / 100).toFixed(2);

    const paymentIsValid =
      captureData.status === 'COMPLETED' &&
      capture &&
      capture.status === 'COMPLETED' &&
      capture.amount?.value === expectedAmount &&
      capture.amount?.currency_code === product.currency;

    if (!paymentIsValid) {
      res.status(402).json({ error: 'Payment could not be verified for this product/amount' });
      return;
    }

    const token = sign(product.id, orderID);

    res.status(200).json({
      token,
      downloadUrl: `/api/download?token=${encodeURIComponent(token)}`,
      title: product.title.en
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
