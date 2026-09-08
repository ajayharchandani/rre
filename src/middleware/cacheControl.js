// src/middleware/cacheControl.js
/**
 * Edge-cache policy for GET responses.
 *
 * Public catalogue pages are identical for every anonymous visitor, so they
 * are marked cacheable by shared/CDN caches (short s-maxage, long
 * stale-while-revalidate) while still revalidating in the browser. If a
 * downstream middleware sets a cookie (utmTracker on a first visit / new
 * campaign), that response is downgraded to `private, no-cache` — see
 * utmTracker, which calls res.set('Cache-Control', ...) after res.cookie.
 *
 * Genuinely per-request paths (search, RFQ, API, QA) are never shared-cached.
 */

const NEVER_SHARED_CACHE = [
  '/search',
  '/rfq',
  '/api/',
  '/qa/',
  '/audit'
];

module.exports = function cacheControl(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.set('Cache-Control', 'no-store');
    return next();
  }

  const path = req.path;

  if (NEVER_SHARED_CACHE.some(p => path === p || path.startsWith(p))) {
    res.set('Cache-Control', 'private, no-cache');
    return next();
  }

  // robots.txt / sitemaps regenerate cheaply and should stay fairly fresh.
  if (path === '/robots.txt' || path.startsWith('/sitemap') || path.startsWith('/sitemaps/') || path === '/llms.txt') {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    return next();
  }

  // Everything else: catalogue HTML. s-maxage keeps it at the Cloudflare edge
  // (Cache Rule = respect origin); max-age is a short browser cache. Kept to
  // 5 min so a deploy's changes surface quickly even without an explicit CDN
  // purge — stale-while-revalidate then refreshes in the background.
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
  next();
};
