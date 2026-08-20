// src/middleware/redirects.js
/**
 * 301 / 302 Redirect Manager
 * Prevents 404s on legacy URL structures, old part number URLs, and non-canonical part slugs
 */

const { products } = require('../data/catalog');
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

  // Canonical Part Slug Redirect Check for /parts/:slug
  if (path.startsWith('/parts/')) {
    const rawSlug = path.substring('/parts/'.length);
    if (rawSlug) {
      const normalized = PartNumberNormalizer.normalize(rawSlug);
      
      // Look up matching product to find canonical slug
      const matchedProduct = products.find(p => 
        p.normalizedPartNumber === normalized ||
        PartNumberNormalizer.toSlug(p.partNumber) === rawSlug.toLowerCase()
      );

      if (matchedProduct) {
        const canonicalSlug = PartNumberNormalizer.toSlug(matchedProduct.partNumber);
        if (rawSlug !== canonicalSlug) {
          return res.redirect(301, `/parts/${canonicalSlug}`);
        }
      }
    }
  }

  next();
};
