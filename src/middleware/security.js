// src/middleware/security.js
/**
 * Security & Crawler Header Middleware
 * Sets safe headers, protects private endpoints, and ensures search bots can crawl public pages
 */

module.exports = function securityMiddleware(req, res, next) {
  // Protect against clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Basic XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Block private routes from search engine indexing
  const path = req.path;
  if (path.startsWith('/admin') || path.startsWith('/rfq/private') || path.startsWith('/api/private')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  next();
};
