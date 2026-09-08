// src/middleware/utmTracker.js
/**
 * Attribution & UTM Tracking Middleware
 *
 * Preserves first-touch and last-touch attribution across sessions WITHOUT
 * defeating shared/CDN caching:
 *   - Search-engine and social crawlers get no Set-Cookie at all, so their
 *     responses stay edge-cacheable.
 *   - For real visitors the cookie is written only when it materially
 *     changes (first ever visit, or a new campaign parameter) — not on every
 *     page view. `visitCount` / `lastSeen` are updated in-memory for the
 *     current request (so an RFQ still captures them) but no longer force a
 *     Set-Cookie on every hit.
 */

const BOT_UA = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|redditbot|whatsapp|telegrambot|discordbot|googlebot|bingbot|duckduckbot|baiduspider|yandex|applebot|petalbot|ahrefs|semrush|mj12bot|dotbot|gptbot|oai-searchbot|chatgpt|claude|perplexity|ccbot|google-extended|amazonbot/i;

// Machine-readable / infrastructure endpoints — never attach a visitor
// cookie to these, so they stay shared-cacheable.
const NO_COOKIE_PATHS = /^\/(robots\.txt|llms\.txt|sitemap|sitemaps\/|favicon\.ico)/;

module.exports = function utmTracker(req, res, next) {
  const ua = req.get('user-agent') || '';
  const isBot = BOT_UA.test(ua);

  const query = req.query || {};
  const hasNewUtm = !!(query.utm_source || query.utm_medium || query.utm_campaign || query.gclid || query.fbclid);

  // Bots, and requests for SEO infrastructure files: never touch cookies
  // (keeps the response cacheable), give routes an empty attribution object.
  if (isBot || NO_COOKIE_PATHS.test(req.path)) {
    req.attribution = {};
    res.locals.attribution = {};
    return next();
  }

  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const referrer = req.get('Referrer') || req.get('Referer') || 'direct';

  let attribution = {};
  let hadCookie = false;
  try {
    if (req.cookies && req.cookies.rre_attribution) {
      attribution = JSON.parse(req.cookies.rre_attribution);
      hadCookie = true;
    }
  } catch (e) {
    attribution = {};
  }

  if (!attribution.firstTouch) {
    attribution.firstTouch = {
      landingPage: currentUrl,
      referrer,
      timestamp: new Date().toISOString(),
      utmSource: query.utm_source || 'organic',
      utmMedium: query.utm_medium || (referrer.includes('google') ? 'organic' : 'direct'),
      utmCampaign: query.utm_campaign || '',
      utmTerm: query.utm_term || '',
      utmContent: query.utm_content || '',
      gclid: query.gclid || '',
      fbclid: query.fbclid || ''
    };
  }

  if (hasNewUtm) {
    attribution.lastTouch = {
      page: currentUrl,
      referrer,
      timestamp: new Date().toISOString(),
      utmSource: query.utm_source || '',
      utmMedium: query.utm_medium || '',
      utmCampaign: query.utm_campaign || '',
      utmTerm: query.utm_term || '',
      utmContent: query.utm_content || '',
      gclid: query.gclid || '',
      fbclid: query.fbclid || ''
    };
  }

  attribution.visitCount = (attribution.visitCount || 0) + 1;
  attribution.lastSeen = new Date().toISOString();

  // Only persist when it's the first visit or a new campaign touch — a plain
  // repeat page view does not rewrite the cookie, so those responses can be
  // cached at the edge.
  if (!hadCookie || hasNewUtm) {
    res.cookie('rre_attribution', JSON.stringify(attribution), {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax'
    });
    // A response that sets a cookie must not be stored by a shared cache.
    res.set('Cache-Control', 'private, no-cache');
  }

  res.locals.attribution = attribution;
  req.attribution = attribution;

  next();
};
