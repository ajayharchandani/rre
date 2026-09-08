// src/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

const securityMiddleware = require('./middleware/security');
const redirectMiddleware = require('./middleware/redirects');
const utmTracker = require('./middleware/utmTracker');
const webRoutes = require('./routes/web');
const SeoService = require('./services/seoService');
const { organization, categories, brands, machines } = require('./data/catalog');

const app = express();
const PORT = process.env.PORT || 3000;

// Site-wide template config. GA4 measurement ID and the Search Console
// verification token are public values (the GA4 tag is visible in page
// source; the GSC token is published in DNS), so they are safe defaults in
// code. An env var of the same name overrides them if ever needed.
// Primary Search Console verification is the DNS TXT record on the apex
// domain; the meta tag below additionally covers a URL-prefix property.
app.locals.site = {
  ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || 'G-VXNCSCEESK',
  gscVerification: process.env.GSC_VERIFICATION_TOKEN || 'Hxi4VhuJ8K_MKQ02NAF-nn30yWDcr0D9JQLwGIkrKxM',
  bingVerification: process.env.BING_VERIFICATION_TOKEN || '',
  defaultOgImage: '/images/rre-og-default.jpg'
};

// View engine setup with express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing and cookies
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

// Static assets
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// Middlewares
app.use(securityMiddleware);
app.use(redirectMiddleware);
app.use(utmTracker);

// Web routes
app.use('/', webRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404);
  const seo = SeoService.getMeta({
    title: "404 Page Not Found — RRE International",
    description: "The page or part number you requested could not be found on RRE International. Search 85,000+ spare parts or contact our export desk.",
    path: req.originalUrl,
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: "Page Not Found", url: req.originalUrl }]
  });

  res.render('pages/404', {
    organization,
    allCategories: categories,
    allBrands: brands,
    allMachines: machines,
    currentPath: req.path,
    attribution: req.attribution || {},
    seo,
    requestedUrl: req.originalUrl
  });
});

// 500 Server Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500);
  const seo = SeoService.getMeta({
    title: "500 Server Error — RRE International",
    description: "An unexpected error occurred. Please try again or reach our engineering desk directly on WhatsApp.",
    path: req.originalUrl,
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: "Server Error", url: req.originalUrl }]
  });

  res.render('pages/500', {
    organization,
    allCategories: categories,
    allBrands: brands,
    allMachines: machines,
    currentPath: req.path,
    attribution: req.attribution || {},
    seo,
    error: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  RRE International Platform Running at: http://localhost:${PORT}`);
    console.log(`  SEO, AEO/GEO, Search & RFQ Engine Active`);
    console.log(`====================================================`);
  });
}

module.exports = app;
