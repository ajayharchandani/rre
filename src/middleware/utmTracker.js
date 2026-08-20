// src/middleware/utmTracker.js
/**
 * Attribution & UTM Tracking Middleware
 * Preserves first-touch and last-touch attribution across user sessions
 */

module.exports = function utmTracker(req, res, next) {
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const referrer = req.get('Referrer') || req.get('Referer') || 'direct';

  // Read existing attribution from cookie
  let attribution = {};
  try {
    if (req.cookies && req.cookies.rre_attribution) {
      attribution = JSON.parse(req.cookies.rre_attribution);
    }
  } catch (e) {
    attribution = {};
  }

  const query = req.query || {};
  const hasNewUtm = query.utm_source || query.utm_medium || query.utm_campaign || query.gclid || query.fbclid;

  // First-touch initialization
  if (!attribution.firstTouch) {
    attribution.firstTouch = {
      landingPage: currentUrl,
      referrer: referrer,
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

  // Last-touch update if new campaign parameters exist
  if (hasNewUtm) {
    attribution.lastTouch = {
      page: currentUrl,
      referrer: referrer,
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

  // Save to cookie (30 days TTL)
  res.cookie('rre_attribution', JSON.stringify(attribution), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false, // Accessible to clientside analytics tracking as well
    sameSite: 'lax'
  });

  // Make attribution available to all templates and routes
  res.locals.attribution = attribution;
  req.attribution = attribution;

  next();
};
