// src/middleware/canonicalHost.js
//
// Force ONE canonical origin so Google doesn't crawl and split signals
// across duplicates:
//   1. apex host  rreinternational.com  ->  www.rreinternational.com   (301)
//   2. trailing-slash path  /x/  ->  /x   (301, any host — relative redirect
//      keeps the current scheme/host/port, so local dev is unaffected)
//
// Both cases currently return 200 on the live site; the <link rel=canonical>
// already points at the www / no-slash form, so this only makes that
// authoritative. One hop, no chains.

const CANONICAL_HOST = 'www.rreinternational.com';

module.exports = function canonicalHost(req, res, next) {
  const host = (req.headers.host || '').toLowerCase().split(':')[0];
  const path = req.path;
  const query = req.originalUrl.slice(path.length); // '' or '?...'
  const trailingSlash = path.length > 1 && path.endsWith('/');

  if (host === 'rreinternational.com') {
    const cleanPath = trailingSlash ? path.replace(/\/+$/, '') : path;
    return res.redirect(301, `https://${CANONICAL_HOST}${cleanPath}${query}`);
  }

  if (trailingSlash) {
    return res.redirect(301, `${path.replace(/\/+$/, '')}${query}`);
  }

  next();
};
