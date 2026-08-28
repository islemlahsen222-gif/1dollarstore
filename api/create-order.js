// POST /api/create-order   body: { productId }
//
// SECURITY NOTE: the amount charged is ALWAYS looked up from the server-side
// catalog (lib-products.js) using productId — never trusted from the client.
// Even if someone edits the page and sends a fake price, this endpoint
// ignores it completely.

const { getAccessToken, PAYPAL_API_BASE } = require('./lib-paypal');
const { getProduct } = require('./lib-products');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { productId } = req.body || {};
    const product = getProduct(productId);

    if (!product) {
      res.status(400).json({ error: 'Unknown product' });
      return;
    }

    const accessToken = await getAccessToken();
    const amountValue = (product.price / 100).toFixed(2);

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: product.id,
            description: product.title.en.slice(0, 127),
            amount: {
              currency_code: product.currency,
              value: amountValue
            }
          }
        ]
      })
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      res.status(502).json({ error: 'PayPal order creation failed', details: orderData });
      return;
    }

    res.status(200).json({ id: orderData.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
