// src/routes/web.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { organization, categories, brands, machines, machineModels, products, countries, resources } = require('../data/catalog');
const SearchService = require('../services/searchService');
const PartNumberNormalizer = require('../services/partNumberNormalizer');
const SeoService = require('../services/seoService');
const InternalLinkingService = require('../services/internalLinkingService');
const SitemapService = require('../services/sitemapService');
const WhatsAppService = require('../services/whatsAppService');
const LeadScoringService = require('../services/leadScoringService');
const OrphanAuditService = require('../services/orphanAuditService');
const BreadcrumbService = require('../services/breadcrumbService');

// Multer storage configuration for RFQ file uploads
const uploadDir = path.join(__dirname, '../../storage/rfq-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `rfq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Excel, CSV, JPG, PNG'));
    }
  }
});

// Helper to provide global template context
function getGlobalContext(req) {
  return {
    organization,
    allCategories: categories,
    allBrands: brands,
    allMachines: machines,
    allCountries: countries,
    currentPath: req.path,
    attribution: req.attribution || {},
    orgSchema: SeoService.getOrganizationSchema(),
    websiteSchema: SeoService.getWebSiteSchema()
  };
}

// ----------------------------------------------------
// 1. HOMEPAGE
// ----------------------------------------------------
router.get('/', (req, res) => {
  const seo = SeoService.getMeta({
    title: "RRE International — Heavy Equipment & Earthmoving Spare Parts Manufacturer & Exporter India",
    description: "ISO 9001:2015 certified manufacturer & exporter of replacement spare parts for JCB 3DX, 4DX, Caterpillar 424, Case 770 & Komatsu excavators. 85,000+ parts catalog.",
    path: '/',
    schema: [
      SeoService.getOrganizationSchema(),
      SeoService.getWebSiteSchema(),
      SeoService.getFaqSchema([
        {
          question: "What machinery brands does RRE International manufacture parts for?",
          answer: "RRE International specializes in precision aftermarket replacement parts for JCB (3DX, 4DX, JS series), Caterpillar (424 series), Case (770 series), and Komatsu excavators (PC series wear parts)."
        },
        {
          question: "Is RRE International an ISO certified manufacturer?",
          answer: "Yes, RRE International operates under ISO 9001:2015 Certification (Certificate No. ECI/2512/2983) with in-house CNC machining, induction hardening, and quality testing facilities in Delhi NCR, India."
        },
        {
          question: "How can international buyers request a wholesale export quotation?",
          answer: "Buyers can submit part numbers or a Bill of Materials (BOM) via our multi-step RFQ form or connect directly with our export desk on WhatsApp (+91 97190 48494) for fast FOB / CIF pricing."
        }
      ])
    ]
  });

  res.render('pages/home', {
    ...getGlobalContext(req),
    seo,
    featuredCategories: categories.slice(0, 6),
    featuredBrands: brands,
    featuredMachines: machines,
    featuredProducts: products,
    products: products,
    featuredCountries: countries,
    recentResources: resources.slice(0, 3)
  });
});

// ----------------------------------------------------
// 2. ROBOTS.TXT
// ----------------------------------------------------
router.get('/robots.txt', (req, res) => {
  const baseUrl = SeoService.getBaseUrl();
  const robotsTxt = `User-agent: *
Allow: /

# Protected private endpoints
Disallow: /admin
Disallow: /admin/
Disallow: /rfq/private
Disallow: /api/private
Disallow: /search?*
Disallow: /*?*sort=*
Disallow: /*?*filter=*

# Legitimate AI & Search Crawlers Allowed for Public Content
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Applebot
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.type('text/plain').send(robotsTxt);
});

// ----------------------------------------------------
// 3. SITEMAPS
// ----------------------------------------------------
router.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(SitemapService.getMasterSitemapIndex());
});

router.get('/sitemaps/:sitemap.xml', (req, res, next) => {
  const name = req.params.sitemap;
  let xml = null;

  switch (name) {
    case 'main': xml = SitemapService.getMainSitemap(); break;
    case 'products': xml = SitemapService.getProductsSitemap(); break;
    case 'categories': xml = SitemapService.getCategoriesSitemap(); break;
    case 'brands': xml = SitemapService.getBrandsSitemap(); break;
    case 'machines': xml = SitemapService.getMachinesSitemap(); break;
    case 'models': xml = SitemapService.getModelsSitemap(); break;
    case 'parts': xml = SitemapService.getPartsSitemap(); break;
    case 'countries': xml = SitemapService.getCountriesSitemap(); break;
    case 'resources': xml = SitemapService.getResourcesSitemap(); break;
    default: return next();
  }

  res.type('application/xml').send(xml);
});

// ----------------------------------------------------
// 4. LLMS.TXT (AI Overview Resource)
// ----------------------------------------------------
router.get('/llms.txt', (req, res) => {
  const baseUrl = SeoService.getBaseUrl();
  const content = `# RRE International — Enterprise Knowledge Summary for AI Agents
Organization: ${organization.name}
Legal Entity: ${organization.legalName}
Certification: ${organization.certification.title} (${organization.certification.certificateNumber})
Headquarters: ${organization.address.street}, ${organization.address.city}, ${organization.address.country}
Website: ${baseUrl}
Contact: ${organization.contact.email} / WhatsApp: ${organization.contact.phoneDisplay}

## Core Capabilities
- Manufacturer & Exporter of heavy earthmoving equipment replacement spare parts.
- Catalog Scope: Over 85,000 reference part numbers across JCB, Caterpillar, Case, and Komatsu machinery.
- Product Lines: Hydraulic Seal Kits, Induction Hardened Pivot Pins, Bronze Bushes, Transmission Gears & Crown Wheel Pinions, Hydraulic Tandem Pumps, Water Pumps, Excavator Undercarriage Wear Components.

## Major Machine Platforms Supported
- JCB 3DX, 4DX Backhoe Loaders (Pre-2011, 2011-2016, 2016-2020 EcoMAX, 2021+ Plus/Super)
- JCB JS200, JS210 Tracked Excavators
- Caterpillar 424, 424B Backhoe Loaders
- Case 770, 770EX King Series Backhoe Loaders
- Komatsu PC200, PC210 Excavator Wear Components

## Inquiries & Quotation
- Direct Web RFQ: ${baseUrl}/rfq
- Direct WhatsApp Export Desk: ${baseUrl}/rfq
`;
  res.type('text/plain').send(content);
});

// ----------------------------------------------------
// 5. SEARCH ENGINE
// ----------------------------------------------------
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  const searchResults = SearchService.search(query, {
    category: req.query.category,
    brand: req.query.brand
  });

  const seo = SeoService.getMeta({
    title: query ? `Search: "${query}" — Part Numbers & Spare Parts` : "Search Spare Parts & Part Numbers",
    description: "Search 85,000+ heavy equipment spare parts by part number, OE reference, machine model, or product name.",
    path: req.originalUrl,
    robots: 'noindex, follow',
    breadcrumbs: [{ name: query ? `Search: ${query}` : "Search", url: "/search" }]
  });

  res.render('pages/search', {
    ...getGlobalContext(req),
    seo,
    searchResults,
    query
  });
});

// ----------------------------------------------------
// 6. PRODUCTS & CATEGORIES HUB
// ----------------------------------------------------
router.get('/products', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Heavy Equipment Spare Parts Categories & Catalog",
    description: "Browse heavy earthmoving equipment replacement spare parts by category: Hydraulic Seal Kits, Pivot Pins, Bushes, Gears, Pumps, and Axle components.",
    path: '/products',
    breadcrumbs: [{ name: "Products", url: "/products" }],
    schema: [
      SeoService.getBreadcrumbSchema([{ name: "Products", url: "/products" }])
    ]
  });

  res.render('pages/products-hub', {
    ...getGlobalContext(req),
    seo,
    categories,
    featuredProducts: products
  });
});

// ----------------------------------------------------
// 7. DYNAMIC CATEGORY OR PRODUCT DETAIL
// ----------------------------------------------------
router.get('/products/:slug', (req, res, next) => {
  const slug = req.params.slug;

  // Check if it matches a Category
  const category = categories.find(c => c.slug === slug);
  if (category) {
    const categoryProducts = products.filter(p => p.categorySlug === category.slug);
    const internalLinks = InternalLinkingService.getLinksForCategory(category);

    const seo = SeoService.getMeta({
      title: category.metaTitle,
      description: category.metaDescription,
      path: `/products/${category.slug}`,
      breadcrumbs: BreadcrumbService.forCategory(category)
    });

    return res.render('pages/category-detail', {
      ...getGlobalContext(req),
      seo,
      category,
      categoryProducts,
      internalLinks
    });
  }

  // Check if it matches a Product
  const product = products.find(p => p.slug === slug);
  if (product) {
    const internalLinks = InternalLinkingService.getLinksForProduct(product);
    const whatsAppUrl = WhatsAppService.buildUrl({
      productName: product.name,
      partNumber: product.partNumber,
      machineModel: product.machineName,
      sourceUrl: SeoService.buildCanonical(`/products/${product.slug}`)
    });

    const seo = SeoService.getMeta({
      title: product.metaTitle,
      description: product.metaDescription,
      path: `/products/${product.slug}`,
      breadcrumbs: BreadcrumbService.forProduct(product),
      schema: [
        SeoService.getProductSchema(product),
        SeoService.getFaqSchema(product.faqs)
      ].filter(Boolean)
    });

    return res.render('pages/product-detail', {
      ...getGlobalContext(req),
      seo,
      product,
      internalLinks,
      whatsAppUrl
    });
  }

  next();
});

// ----------------------------------------------------
// 8. DEDICATED PART NUMBER PAGES (/parts/:slug)
// ----------------------------------------------------
router.get('/parts/:partSlug', (req, res, next) => {
  const partSlug = req.params.partSlug.toLowerCase();
  const normalizedSlug = PartNumberNormalizer.normalize(partSlug);

  // Find product with matching part number
  const product = products.find(p => 
    PartNumberNormalizer.toSlug(p.partNumber) === partSlug ||
    p.normalizedPartNumber === normalizedSlug ||
    (p.alternativePartNumbers || []).some(alt => PartNumberNormalizer.normalize(alt.partNumber) === normalizedSlug)
  );

  if (!product) {
    return next();
  }

  const internalLinks = InternalLinkingService.getLinksForProduct(product);
  const whatsAppUrl = WhatsAppService.buildUrl({
    productName: product.name,
    partNumber: product.partNumber,
    machineModel: product.machineName,
    sourceUrl: SeoService.buildCanonical(`/parts/${PartNumberNormalizer.toSlug(product.partNumber)}`),
    intent: 'rfq_quick'
  });

  const seo = SeoService.getMeta({
    title: `Part No. ${product.partNumber} — ${product.name} | RRE International`,
    description: `Detailed technical specifications, machine compatibility and export availability for Part Number ${product.partNumber} (${product.name}). Compatible with ${product.machineName}.`,
    path: `/parts/${PartNumberNormalizer.toSlug(product.partNumber)}`,
    breadcrumbs: BreadcrumbService.forPart(product),
    schema: [
      SeoService.getProductSchema(product),
      SeoService.getFaqSchema(product.faqs)
    ].filter(Boolean)
  });

  res.render('pages/part-detail', {
    ...getGlobalContext(req),
    seo,
    product,
    internalLinks,
    whatsAppUrl
  });
});

// ----------------------------------------------------
// 9. BRANDS HUB & BRAND DETAIL
// ----------------------------------------------------
router.get('/brands', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Heavy Equipment Machinery Brands — Replacement Parts",
    description: "Verified replacement spare parts manufacturer for JCB, Caterpillar, Case, and Komatsu construction machinery from India.",
    path: '/brands',
    breadcrumbs: [{ name: "Brands", url: "/brands" }]
  });

  res.render('pages/brands-hub', {
    ...getGlobalContext(req),
    seo,
    brands
  });
});

router.get('/brands/:slug', (req, res, next) => {
  const brand = brands.find(b => b.slug === req.params.slug);
  if (!brand) return next();

  const brandMachines = machines.filter(m => m.brandSlug === brand.slug);
  const brandProducts = products.filter(p => p.brandSlug === brand.slug);
  const internalLinks = InternalLinkingService.getLinksForBrand(brand);

  const seo = SeoService.getMeta({
    title: brand.metaTitle,
    description: brand.metaDescription,
    path: `/brands/${brand.slug}`,
    breadcrumbs: BreadcrumbService.forBrand(brand)
  });

  res.render('pages/brand-detail', {
    ...getGlobalContext(req),
    seo,
    brand,
    brandMachines,
    brandProducts,
    internalLinks
  });
});

// ----------------------------------------------------
// 10. MACHINES & MACHINE MODELS
// ----------------------------------------------------
router.get('/machines', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Earthmoving & Construction Equipment Models — Spare Parts",
    description: "Browse spare parts availability by machine model: JCB 3DX, 4DX, JS200, Caterpillar 424, Case 770, and Komatsu PC200.",
    path: '/machines',
    breadcrumbs: [{ name: "Machines", url: "/machines" }]
  });

  res.render('pages/machines-hub', {
    ...getGlobalContext(req),
    seo,
    machines
  });
});

router.get('/machines/:slug', (req, res, next) => {
  const machine = machines.find(m => m.slug === req.params.slug);
  if (!machine) return next();

  const models = machineModels.filter(m => m.machineSlug === machine.slug);
  const machineProducts = products.filter(p => p.machineSlug === machine.slug);

  const seo = SeoService.getMeta({
    title: machine.metaTitle,
    description: machine.metaDescription,
    path: `/machines/${machine.slug}`,
    breadcrumbs: BreadcrumbService.forMachine(machine)
  });

  res.render('pages/machine-detail', {
    ...getGlobalContext(req),
    seo,
    machine,
    models,
    machineProducts
  });
});

router.get('/machines/:brandSlug/:modelSlug', (req, res, next) => {
  const { brandSlug, modelSlug } = req.params;
  const model = machineModels.find(m => m.brandSlug === brandSlug && m.slug === modelSlug);
  if (!model) return next();

  const machine = machines.find(m => m.slug === model.machineSlug);
  const internalLinks = InternalLinkingService.getLinksForModel(model);

  const seo = SeoService.getMeta({
    title: `${model.name} Spare Parts Exporter | RRE International`,
    description: `Complete replacement spare parts catalog for ${model.name} (${model.yearRange}, ${model.engineVariant}). Seal kits, pins, bushes, and transmission spares.`,
    path: `/machines/${brandSlug}/${modelSlug}`,
    breadcrumbs: BreadcrumbService.forModel(machine, model)
  });

  res.render('pages/model-detail', {
    ...getGlobalContext(req),
    seo,
    model,
    machine,
    internalLinks
  });
});

// ----------------------------------------------------
// 11. EXPORT MARKETS & COUNTRY LANDING PAGES
// ----------------------------------------------------
router.get('/export', (req, res) => {
  const seo = SeoService.getMeta({
    title: "International Export Destinations & Global Shipping | RRE International",
    description: "Exporting heavy earthmoving machinery spare parts from India to UAE, Saudi Arabia, Qatar, Nigeria, Kenya, South Africa, and worldwide.",
    path: '/export',
    breadcrumbs: [{ name: "Export Markets", url: "/export" }]
  });

  res.render('pages/export-hub', {
    ...getGlobalContext(req),
    seo,
    countries
  });
});

router.get('/export/:countrySlug', (req, res, next) => {
  const countrySlug = req.params.countrySlug.toLowerCase();
  
  // Direct country match (e.g. /export/uae)
  let country = countries.find(c => c.slug === countrySlug);

  // Combination match (e.g. /export/jcb-spare-parts-uae)
  if (!country && countrySlug.includes('-')) {
    const matched = countries.find(c => countrySlug.endsWith(c.slug));
    if (matched) {
      country = matched;
    }
  }

  if (!country) return next();

  const internalLinks = InternalLinkingService.getLinksForCountry(country);
  const whatsAppUrl = WhatsAppService.buildUrl({
    destinationCountry: country.name,
    intent: 'rfq_quick',
    sourceUrl: SeoService.buildCanonical(`/export/${country.slug}`)
  });

  const seo = SeoService.getMeta({
    title: country.metaTitle,
    description: country.metaDescription,
    path: `/export/${country.slug}`,
    breadcrumbs: BreadcrumbService.forCountry(country),
    schema: [
      SeoService.getFaqSchema(country.faqs)
    ].filter(Boolean)
  });

  res.render('pages/country-detail', {
    ...getGlobalContext(req),
    seo,
    country,
    internalLinks,
    whatsAppUrl
  });
});

// ----------------------------------------------------
// 12. CONTENT HUB / RESOURCES
// ----------------------------------------------------
router.get('/resources', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Heavy Equipment Spare Parts Technical & Sourcing Guides | RRE",
    description: "Authoritative engineering guides on JCB 3DX seal kit selection, OEM vs aftermarket metallurgy, and importing machinery parts from India.",
    path: '/resources',
    breadcrumbs: [{ name: "Resources", url: "/resources" }]
  });

  res.render('pages/resources-hub', {
    ...getGlobalContext(req),
    seo,
    resources
  });
});

router.get('/resources/:slug', (req, res, next) => {
  const article = resources.find(r => r.slug === req.params.slug);
  if (!article) return next();

  const seo = SeoService.getMeta({
    title: article.metaTitle,
    description: article.metaDescription,
    path: `/resources/${article.slug}`,
    type: 'article',
    publishedTime: article.publishedDate,
    breadcrumbs: BreadcrumbService.forArticle(article),
    schema: [
      SeoService.getArticleSchema(article)
    ]
  });

  res.render('pages/article-detail', {
    ...getGlobalContext(req),
    seo,
    article,
    relatedArticles: resources.filter(r => r.id !== article.id)
  });
});

// ----------------------------------------------------
// 13. RFQ ENGINE (4-Step Multi-Stage Flow)
// ----------------------------------------------------
router.get('/rfq', (req, res) => {
  const prefill = {
    partNumber: req.query.part || '',
    productName: req.query.product || '',
    machineModel: req.query.machine || '',
    quantity: req.query.qty || '1',
    country: req.query.country || ''
  };

  const seo = SeoService.getMeta({
    title: "Request Export Quotation (RFQ) — Heavy Machinery Spare Parts",
    description: "Submit your spare parts requirement or upload Bill of Materials (BOM) for fast CIF / FOB export pricing. Direct manufacturer supply from India.",
    path: '/rfq',
    breadcrumbs: [{ name: "Request for Quotation", url: "/rfq" }]
  });

  res.render('pages/rfq', {
    ...getGlobalContext(req),
    seo,
    prefill
  });
});

router.post('/rfq', upload.array('attachments', 5), (req, res) => {
  const body = req.body || {};
  const files = req.files || [];

  // 1. Calculate Lead Score & Band
  const scoreData = LeadScoringService.calculate({
    name: body.name,
    email: body.email,
    company: body.company,
    country: body.country,
    buyerType: body.buyer_type,
    partNumber: body.part_number,
    machineModel: body.machine_model,
    quantity: body.quantity,
    urgency: body.urgency,
    website: body.website, // Honeypot field
    files: files
  });

  // Generate Reference ID
  const refId = `RRE-RFQ-${Date.now().toString().slice(-6)}`;

  // Store in memory / session for demo purposes
  const rfqRecord = {
    refId,
    timestamp: new Date().toISOString(),
    customer: {
      name: body.name,
      company: body.company || 'N/A',
      email: body.email,
      whatsapp: body.whatsapp || 'N/A',
      country: body.country,
      buyerType: body.buyer_type || 'other'
    },
    requirement: {
      machineBrand: body.machine_brand,
      machineModel: body.machine_model,
      partNumber: body.part_number,
      description: body.description,
      quantity: body.quantity || 1,
      urgency: body.urgency || 'within_month',
      shippingMethod: body.shipping_method || 'sea_freight',
      message: body.message
    },
    files: files.map(f => ({ originalName: f.originalname, size: f.size })),
    score: scoreData,
    attribution: req.attribution || {}
  };

  // Redirect to confirmation with reference code
  res.redirect(`/rfq/confirmation?ref=${refId}&score=${scoreData.score}&band=${scoreData.band}`);
});

router.get('/rfq/confirmation', (req, res) => {
  const refId = req.query.ref || 'RRE-RFQ-SUBMITTED';
  const band = req.query.band || 'warm';

  const seo = SeoService.getMeta({
    title: "RFQ Submitted Successfully — RRE International",
    description: "Thank you for submitting your quotation request to RRE International. Our export engineering team is reviewing your requirement.",
    path: '/rfq/confirmation',
    robots: 'noindex, nofollow'
  });

  res.render('pages/rfq-confirmation', {
    ...getGlobalContext(req),
    seo,
    refId,
    band
  });
});

// ----------------------------------------------------
// 14. STATIC PAGES (About, Export Process, Contact, Legal)
// ----------------------------------------------------
router.get('/about', (req, res) => {
  const seo = SeoService.getMeta({
    title: "About RRE International — Manufacturing Facility & ISO Certification",
    description: "Learn about RRE International: 40+ years engineering heritage, ISO 9001:2015 certified manufacturing facility, precision CNC machining, and global export desk in Delhi, India.",
    path: '/about',
    breadcrumbs: [{ name: "About Us", url: "/about" }],
    schema: [SeoService.getOrganizationSchema()]
  });

  res.render('pages/about', {
    ...getGlobalContext(req),
    seo
  });
});

router.get('/export-process', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Export Process & International Shipping Workflow | RRE",
    description: "Learn how RRE International handles container consolidation, VCI anti-rust oceanic packaging, customs documentation, and sea freight from Indian ports.",
    path: '/export-process',
    breadcrumbs: [{ name: "Export Process", url: "/export-process" }]
  });

  res.render('pages/export-process', {
    ...getGlobalContext(req),
    seo
  });
});

router.get('/contact', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Contact RRE International — Export Sales Desk & Delhi Facility",
    description: "Get in touch with RRE International export desk in Mori Gate, Delhi. Phone, WhatsApp, email, and location details for international B2B inquiries.",
    path: '/contact',
    breadcrumbs: [{ name: "Contact", url: "/contact" }]
  });

  res.render('pages/contact', {
    ...getGlobalContext(req),
    seo
  });
});

router.get('/privacy', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Privacy Policy | RRE International",
    description: "RRE International B2B data privacy and cookie policy.",
    path: '/privacy',
    robots: 'noindex, follow',
    breadcrumbs: [{ name: "Privacy Policy", url: "/privacy" }]
  });
  res.render('pages/privacy', { ...getGlobalContext(req), seo });
});

router.get('/terms', (req, res) => {
  const seo = SeoService.getMeta({
    title: "Terms of Export Sale & Incoterms | RRE International",
    description: "Terms and conditions of international spare parts supply, FOB / CIF Incoterms, warranty, and payment terms.",
    path: '/terms',
    robots: 'noindex, follow',
    breadcrumbs: [{ name: "Terms of Sale", url: "/terms" }]
  });
  res.render('pages/terms', { ...getGlobalContext(req), seo });
});

router.get('/disclaimer', (req, res) => {
  const seo = SeoService.getMeta({
    title: "OEM Trademark & Part Number Reference Disclaimer | RRE",
    description: "Official statement regarding OEM brand names, part numbers, and cross-reference compatibility for aftermarket replacement parts.",
    path: '/disclaimer',
    robots: 'noindex, follow',
    breadcrumbs: [{ name: "Trademark Disclaimer", url: "/disclaimer" }]
  });
  res.render('pages/disclaimer', { ...getGlobalContext(req), seo });
});

// ----------------------------------------------------
// 15. INTERNAL SEO & ORPHAN AUDIT DASHBOARD
// ----------------------------------------------------
router.get('/audit', (req, res) => {
  const auditReport = OrphanAuditService.runFullAudit();

  const seo = SeoService.getMeta({
    title: "Internal SEO & Link Health Audit Dashboard",
    description: "Live system audit report of canonicals, internal linking graph, orphan URLs, and JSON-LD schema.",
    path: '/audit',
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: "SEO Audit Dashboard", url: "/audit" }]
  });

  res.render('pages/audit-dashboard', {
    ...getGlobalContext(req),
    seo,
    auditReport
  });
});

// ----------------------------------------------------
// 16. API ENDPOINTS
// ----------------------------------------------------
router.get('/api/search/autocomplete', (req, res) => {
  const query = req.query.q || '';
  const suggestions = SearchService.autocomplete(query);
  res.json({ query, suggestions });
});

router.get('/api/audit/orphans', (req, res) => {
  res.json(OrphanAuditService.runFullAudit());
});

module.exports = router;
