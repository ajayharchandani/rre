// src/middleware/redirects.js
/**
 * 301 / 302 Redirect Manager
 * Prevents 404s on legacy URL structures, old part number URLs, and non-canonical part slugs
 */

const ProductStore = require('../data/productStore');

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

  // /parts/{catalogue-category-slug} is the real category listing URL. Three
  // older URL shapes can still arrive here and must never resolve as a live
  // page (no duplicate/thin category pages, no internal codes surfaced):
  //   1. A legacy internal Cat 1 code slug (/parts/hln, /parts/bhl, ...) —
  //      301 to whichever single catalogue category most of that code's
  //      products landed in, or to /products when the code fans out across
  //      many categories (see legacy-category-redirects.json).
  //   2. An old per-part-number URL (/parts/{part-number-slug}) that may
  //      still be linked/indexed — send it to the canonical product URL.
  if (path.startsWith('/parts/')) {
    const rawSlug = path.substring('/parts/'.length).toLowerCase();
    if (rawSlug && !ProductStore.getCategoryBySlug(rawSlug)) {
      const legacyTarget = ProductStore.getLegacyRedirectTarget(rawSlug);
      if (legacyTarget) {
        return res.redirect(301, legacyTarget);
      }

      // Pass the raw slug (not the fully-stripped normalized form) so that
      // when several distinct real part numbers collapse to the same
      // normalized key, getProductByPartNumber can still disambiguate using
      // separator position (see productStore.js).
      const matchedProduct = ProductStore.getProductByPartNumber(rawSlug);
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
