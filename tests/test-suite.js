// tests/test-suite.js
const http = require('http');
const app = require('../src/server');
const ProductStore = require('../src/data/productStore');

const PORT = 3099;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('  RRE INTERNATIONAL — PRODUCTION & SEO REGRESSION SUITE');
  console.log('=====================================================');

  server = app.listen(PORT);
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} — ${details}`);
      failed++;
    }
  }

  try {
    // 1. Homepage & Global SEO
    const home = await request('/');
    assert(home.status === 200, 'Homepage returns HTTP 200');
    assert(home.body.includes('ISO 9001:2015'), 'Homepage displays ISO 9001:2015 certification');
    assert(home.body.includes('https://schema.org'), 'Homepage contains JSON-LD schema');
    assert(home.body.includes('"@type": "Organization"'), 'Homepage has Organization schema');
    assert(home.body.includes('"@type": "WebSite"'), 'Homepage has WebSite schema');

    // 2. Robots.txt Directives
    const robots = await request('/robots.txt');
    assert(robots.status === 200, 'robots.txt returns HTTP 200');
    assert(robots.body.includes('User-agent: *'), 'robots.txt contains User-agent: *');
    assert(robots.body.includes('Disallow: /admin'), 'robots.txt disallows /admin');
    assert(robots.body.includes('User-agent: Googlebot'), 'robots.txt allows Googlebot');
    assert(robots.body.includes('User-agent: OAI-SearchBot'), 'robots.txt allows OAI-SearchBot');
    assert(robots.body.includes('User-agent: Claude-User'), 'robots.txt allows Claude-User');
    assert(robots.body.includes('Sitemap:'), 'robots.txt points to sitemap.xml');

    // 3. XML Sitemaps (Index + Chunked Product Sitemaps + Category Sitemaps)
    const sitemapIndex = await request('/sitemap.xml');
    assert(sitemapIndex.status === 200, 'sitemap.xml returns HTTP 200');
    assert(sitemapIndex.headers['content-type'].includes('xml'), 'sitemap.xml has XML content type');
    assert(sitemapIndex.body.includes('<sitemapindex'), 'sitemap.xml has valid <sitemapindex> tag');
    assert(sitemapIndex.body.includes('sitemaps/products-1.xml'), 'sitemap.xml references chunked products sitemap');
    assert(sitemapIndex.body.includes('sitemaps/categories.xml'), 'sitemap.xml references categories sitemap');

    const productsSitemap1 = await request('/sitemaps/products-1.xml');
    assert(productsSitemap1.status === 200, 'sitemaps/products-1.xml returns HTTP 200');
    assert(productsSitemap1.body.includes('<urlset'), 'products sitemap has <urlset> tag');
    assert(productsSitemap1.body.includes('/products/'), 'products sitemap contains /products/ URLs');

    const categoriesSitemap = await request('/sitemaps/categories.xml');
    assert(categoriesSitemap.status === 200, 'sitemaps/categories.xml returns HTTP 200');
    assert(categoriesSitemap.body.includes('/parts/hoses'), 'categories sitemap contains /parts/hoses');

    // 4. LLMs.txt AI Resource
    const llms = await request('/llms.txt');
    assert(llms.status === 200, 'llms.txt returns HTTP 200');
    assert(llms.body.includes('RRE International'), 'llms.txt contains Organization info');

    // 5. Part Number Search & Multi-Tier Normalization
    const searchExact = await request('/search?q=335/Y1459');
    assert(searchExact.status === 200, 'Search with slash returns HTTP 200');
    assert(searchExact.body.includes('335/Y1459'), 'Search matches exact part number');
    assert(searchExact.body.includes('noindex'), 'Search page correctly sets noindex robots directive');

    const searchNormalized = await request('/search?q=335y1459');
    assert(searchNormalized.status === 200, 'Search with normalized string returns HTTP 200');
    assert(searchNormalized.body.includes('335/Y1459'), 'Search matches normalized part number to 335/Y1459');

    // 6. Real Product Detail Page
    const sampleProduct = ProductStore.getProductByPartNumber('335/Y1459') || ProductStore.getAllProducts()[0];
    const productPage = await request(`/products/${sampleProduct.slug}`);
    assert(productPage.status === 200, `Product page (/products/${sampleProduct.slug}) returns HTTP 200`);
    assert(productPage.body.includes(sampleProduct.part_number), 'Product page contains Part Number');
    assert(productPage.body.includes('"@type": "Product"'), 'Product page includes Product JSON-LD schema');
    assert(productPage.body.includes('https://wa.me/'), 'Product page includes WhatsApp CTA link');
    assert(productPage.body.includes('BreadcrumbList'), 'Product page includes BreadcrumbList schema');

    // 7. Category Pages & High-Resolution Asset Integration
    const productsHub = await request('/products');
    assert(productsHub.status === 200, 'Products Hub (/products) returns HTTP 200');
    assert(productsHub.body.includes('hoses.webp'), 'Products Hub displays verified category images');

    const categoryPage = await request('/parts/hoses');
    assert(categoryPage.status === 200, 'Category page (/parts/hoses) returns HTTP 200');
    assert(categoryPage.body.includes('Hoses Spare Parts'), 'Category page displays category title');
    assert(categoryPage.body.includes('hoses.webp'), 'Category page displays verified high-resolution banner image');
    assert(categoryPage.body.includes('BreadcrumbList'), 'Category page contains Breadcrumb schema');

    const sealsCat = await request('/parts/seals-seal-kits');
    assert(sealsCat.status === 200, 'Category page (/parts/seals-seal-kits) returns HTTP 200');
    assert(sealsCat.body.includes('seals-seal-kits.webp'), 'Seals category displays verified image');

    // 8. Brand & Machine Pages
    const brandPage = await request('/brands/jcb');
    assert(brandPage.status === 200, 'Brand JCB page returns HTTP 200');
    assert(brandPage.body.includes('JCB is a registered trademark') || brandPage.body.includes('disclaimer'), 'Brand page displays trademark disclaimer');

    const machinePage = await request('/machines/jcb-3dx');
    assert(machinePage.status === 200, 'Machine JCB 3DX page returns HTTP 200');

    const modelPage = await request('/machines/jcb/3dx-2011-2016');
    assert(modelPage.status === 200, 'Machine Model page returns HTTP 200');

    // 9. Country Export Landing Page
    const countryPage = await request('/export/uae');
    assert(countryPage.status === 200, 'Country UAE page returns HTTP 200');
    assert(countryPage.body.includes('Jebel Ali Port'), 'Country page displays port info');

    // 10. Technical Resource / Guide Page
    const resourcePage = await request('/resources/how-to-identify-correct-jcb-3dx-hydraulic-seal-kit-by-year');
    assert(resourcePage.status === 200, 'Resource guide returns HTTP 200');
    assert(resourcePage.body.includes('"@type": "Article"'), 'Resource guide has Article JSON-LD schema');

    // 11. RFQ Flow
    const rfqPage = await request('/rfq');
    assert(rfqPage.status === 200, 'RFQ page returns HTTP 200');
    assert(rfqPage.body.includes('Request Export Quote') || rfqPage.body.includes('Contact Information'), 'RFQ page displays wizard');

    // 12. 301 Redirects
    const redirectLegacy = await request('/jcb-parts');
    assert(redirectLegacy.status === 301, 'Legacy /jcb-parts redirects with 301');
    assert(redirectLegacy.headers.location === '/brands/jcb', 'Legacy /jcb-parts redirects to /brands/jcb');

    // 13. 404 Error Page
    const notFound = await request('/non-existent-random-url-998877');
    assert(notFound.status === 404, 'Non-existent URL returns HTTP 404');
    assert(notFound.body.includes('404'), '404 page displays branded 404 error');

    // 14. Catalog API Endpoints (Phase 6 Integration)
    const apiCategories = await request('/api/catalog/categories');
    assert(apiCategories.status === 200, 'API /api/catalog/categories returns HTTP 200');
    const apiCatData = JSON.parse(apiCategories.body);
    assert(apiCatData.totalCategories === 26, `API returns 26 verified categories (Found: ${apiCatData.totalCategories})`);

    const apiProducts = await request('/api/catalog/products?pageSize=10');
    assert(apiProducts.status === 200, 'API /api/catalog/products returns HTTP 200');
    const apiProdData = JSON.parse(apiProducts.body);
    assert(apiProdData.total === 85150, `API reports 85,150 total catalog products (Found: ${apiProdData.total})`);

    const apiSingle = await request('/api/catalog/products/335-y1459');
    assert(apiSingle.status === 200, 'API /api/catalog/products/335-y1459 returns HTTP 200');

    const apiImageStatus = await request('/api/catalog/image-status');
    assert(apiImageStatus.status === 200, 'API /api/catalog/image-status returns HTTP 200');
    const apiStatusData = JSON.parse(apiImageStatus.body);
    assert(apiStatusData.categoriesVerifiedImages === 26, `All 26 categories verified in image status API`);

    // 15. Orphan Page & Link Graph Health Audit
    const audit = await request('/api/audit/orphans');
    assert(audit.status === 200, 'Audit API returns HTTP 200');
    const auditData = JSON.parse(audit.body);
    assert(auditData.summary.orphanUrls === 0, `Zero orphan pages in link graph (Found: ${auditData.summary.orphanUrls})`);
    assert(auditData.summary.healthScore === 100, `Audit health score is 100% (Score: ${auditData.summary.healthScore})`);

  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    server.close();
    console.log('=====================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
