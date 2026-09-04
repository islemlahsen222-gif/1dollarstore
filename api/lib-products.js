// ============================================================================
// PRODUCT CATALOG — the single source of truth for prices, files and text.
//
// This file lives on the SERVER only. The browser never sees the raw price
// or the real file path — it only sees what /api/products.js chooses to
// expose. This is what makes the price tamper-proof: even if someone edits
// the page in their browser and sends a fake price, create-order.js and
// capture-order.js always re-read the real price from here.
//
// HOW TO ADD A NEW PRODUCT:
//   1. Add a new object to the `products` array below (copy an existing one).
//   2. Put its cover image in /public/covers/            (public, safe to expose)
//   3. Put its real file (PDF, zip, etc.) in /files/      (private, never public)
//   4. Deploy. It will appear automatically on both the English and Arabic
//      storefronts — no HTML/JS editing required.
// ============================================================================

const products = [
  {
    id: 'room-404',
    sku: 'SKU-001',
    price: 100, // in cents → $1.00. Always in cents to avoid floating point bugs.
    currency: 'USD',
    category: { en: 'Ebooks', ar: 'كتب إلكترونية' },
    title: {
      en: 'The Stranger in Room 404',
      ar: 'الغريب في الغرفة 404'
    },
    description: {
      en: 'A complete 62-chapter psychological horror novella. Instant PDF download after payment.',
      ar: 'رواية رعب نفسي كاملة من 62 فصلاً. تحميل PDF فوري بعد الدفع.'
    },
    cover: '/cover-room-404.jpg',
    file: 'The-Stranger-in-Room-404.pdf' // must exist inside /files
    },

  {
  id: 'power of the page',
  sku: 'SKU-002',
  price: 100,
  currency: 'USD',
  category: { en: 'Ebooks' },
  title: { en: 'The Power of the Page' },
  description: { en: 'The Power of the Page is an inspiring and practical book about the power of writing, self-expression, and turning your ideas into clear goals. It helps readers organize their thoughts, discover their potential, and take meaningful steps toward personal growth.' },
  cover: '/cover-The_Power_of_the_Page.jpg',
  file: 'The_Power_of_the_Page.pdf'
},

  {
  id: '1 Percent Better Every Day Method',
  sku: 'SKU-003',
  price: 100,
  currency: 'USD',
  category: { en: 'Ebooks' },
  title: { en: 'The 1 Percent Better Every Day Method' },
  description: { en: 'A practical guide to building habits that last, tracking daily progress and letting compounding not willpower carry you toward the person you want to become' },
  cover: '/cover-The 1 Percent Better Every Day Method.jpg',
  file: 'The 1 Percent Better Every Day Method.pdf'
},

   {
  id: 'The Art of Being Alone ',
  sku: 'SKU-004',
  price: 100,
  currency: 'USD',
  category: { en: 'Ebooks' },
  title: { en: 'The Art of Being Alone' },
  description: { en: 'A practical, inspiring guide that blends psychology, philosophy, and history to help readers transform solitude from a burden into a source of peace, clarity, and creativity' },
  cover: '/The_Art_of_Being_Alone.jpg',
  file: 'The_Art_of_Being_Alone .pdf'
},
];

function getProduct(id) {
  return products.find((p) => p.id === id) || null;
}

function listProducts() {
  return products;
}

module.exports = { products, getProduct, listProducts };
