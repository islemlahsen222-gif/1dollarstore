// GET /api/download?token=...
//
// The PDF (and any other product file) lives in /files, which is NOT inside
// /public — it has no public URL of its own. The only way to receive the
// bytes is through this endpoint, and only with a valid, unexpired token
// that was issued by capture-order.js right after a verified PayPal payment.

const fs = require('fs');
const path = require('path');
const { verify } = require('./lib-token');
const { getProduct } = require('./lib-products');

module.exports = async (req, res) => {
  try {
    const token = req.query.token;
    const payload = verify(token);

    if (!payload) {
      res.status(403).send('This download link is invalid or has expired. Please contact support with your PayPal receipt.');
      return;
    }

    const product = getProduct(payload.productId);
    if (!product) {
      res.status(404).send('Product not found.');
      return;
    }

    const filePath = path.join(process.cwd(), 'files', product.file);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found on the server. Please contact support.');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(product.file).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${product.file}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(fileBuffer);
  } catch (err) {
    res.status(500).send('Server error while preparing your download.');
  }
};
