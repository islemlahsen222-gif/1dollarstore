// GET /api/products?lang=en|ar
// Returns only the PUBLIC fields of each product (no file path, price is
// formatted read-only text). The frontend renders its grid entirely from
// this response, so adding a product to lib-products.js is enough — no
// HTML/JS changes needed on the storefront.

const { listProducts } = require('./lib-products');

module.exports = (req, res) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  const data = listProducts().map((p) => ({
    id: p.id,
    sku: p.sku,
    price: (p.price / 100).toFixed(2),
    currency: p.currency,
    category: p.category[lang] || p.category.en,
    title: p.title[lang] || p.title.en,
    description: p.description[lang] || p.description.en,
    cover: p.cover
  }));

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).json(data);
};
