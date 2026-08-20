// src/middleware/redirects.js
/**
 * 301 / 302 Redirect Manager
 * Prevents 404s on legacy URL structures, old part number URLs, and non-canonical part slugs
 */

const ProductStore = require('../data/productStore');
const PartNumberNormalizer = require('../services/partNumberNormalizer');

const redirectMap = {
  // Legacy paths
  '/product-catalogue': '/products',
  '/catalog': '/products',
  '/jcb-parts': '/brands/jcb',
  '/jcb-3dx-parts': '/machines/jcb-3dx',
  '/contact-us': '/contact',
  '/about-us': '/about',
  '/request-quote': '/rfq',
  '/quote': '/rfq',
  '/export-to-uae': '/export/uae',
  '/export-to-saudi': '/export/saudi-arabia',
  '/export-to-nigeria': '/export/nigeria',
  '/export-to-kenya': '/export/kenya'
};

module.exports = function redirectMiddleware(req, res, next) {
  const path = req.path;

  // Direct map check
  if (redirectMap[path]) {
    return res.redirect(301, redirectMap[path]);
  }

  // /parts/{code} is now the real category listing URL. But an older
  // per-part-number URL scheme (/parts/{part-number-slug}) may have been
  // linked/indexed previously — if the slug isn't a real category code but
  // does resolve to a real part number, send it to the current canonical
  // product URL instead of 404ing.
  if (path.startsWith('/parts/')) {
    const rawSlug = path.substring('/parts/'.length).toLowerCase();
    if (rawSlug && !ProductStore.getCategoryBySlug(rawSlug)) {
      const normalized = PartNumberNormalizer.normalize(rawSlug);
      const matchedProduct = ProductStore.getProductByPartNumber(normalized);
      if (matchedProduct) {
        return res.redirect(301, matchedProduct.canonical_url);
      }
    }
  }

  // Old ambiguous /products/{category-slug} URLs are gone now that
  // categories live at /parts/{code}; if the slug happens to match a real
  // category code, forward it there instead of 404ing.
  if (path.startsWith('/products/')) {
    const rawSlug = path.substring('/products/'.length).toLowerCase();
    const category = ProductStore.getCategoryBySlug(rawSlug);
    if (category && !ProductStore.getProductBySlug(rawSlug)) {
      return res.redirect(301, `/parts/${category.slug}`);
    }
  }

  next();
};
