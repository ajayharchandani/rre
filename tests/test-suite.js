// tests/test-suite.js
const http = require('http');
const app = require('../src/server');

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
  console.log('  RRE INTERNATIONAL — PRODUCTION VERIFICATION TEST SUITE');
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
    // 1. Homepage
    const home = await request('/');
    assert(home.status === 200, 'Homepage returns HTTP 200');
    assert(home.body.includes('<h1>') || home.body.includes('<h1 class="hero-title">'), 'Homepage has H1 element');
    assert(home.body.includes('ISO 9001:2015'), 'Homepage displays ISO 9001:2015 certification');
    assert(home.body.includes('https://schema.org'), 'Homepage contains JSON-LD schema');
    assert(home.body.includes('Organization'), 'Homepage has Organization schema');

    // 2. Robots.txt
    const robots = await request('/robots.txt');
    assert(robots.status === 200, 'robots.txt returns HTTP 200');
    assert(robots.body.includes('User-agent: *'), 'robots.txt contains User-agent: *');
    assert(robots.body.includes('Disallow: /admin'), 'robots.txt disallows /admin');
    assert(robots.body.includes('User-agent: Googlebot'), 'robots.txt allows Googlebot');
    assert(robots.body.includes('User-agent: OAI-SearchBot'), 'robots.txt allows OAI-SearchBot');
    assert(robots.body.includes('User-agent: Claude-User'), 'robots.txt allows Claude-User');
    assert(robots.body.includes('Sitemap:'), 'robots.txt points to sitemap.xml');

    // 3. XML Sitemaps
    const sitemapIndex = await request('/sitemap.xml');
    assert(sitemapIndex.status === 200, 'sitemap.xml returns HTTP 200');
    assert(sitemapIndex.headers['content-type'].includes('xml'), 'sitemap.xml has XML content type');
    assert(sitemapIndex.body.includes('<sitemapindex'), 'sitemap.xml has valid <sitemapindex> tag');
    assert(sitemapIndex.body.includes('sitemaps/products.xml'), 'sitemap.xml references products sitemap');
    assert(sitemapIndex.body.includes('sitemaps/parts.xml'), 'sitemap.xml references parts sitemap');

    const productsSitemap = await request('/sitemaps/products.xml');
    assert(productsSitemap.status === 200, 'sitemaps/products.xml returns HTTP 200');
    assert(productsSitemap.body.includes('<urlset'), 'products sitemap has <urlset> tag');
    assert(productsSitemap.body.includes('tandem-hydraulic-gear-pump-jcb-3dx-335-y1459'), 'products sitemap contains product URLs');

    // 4. LLMs.txt AI Resource
    const llms = await request('/llms.txt');
    assert(llms.status === 200, 'llms.txt returns HTTP 200');
    assert(llms.body.includes('RRE International'), 'llms.txt contains Organization info');

    // 5. Part Number Search & Multi-Tier Normalization
    const searchExact = await request('/search?q=335/Y1459');
    assert(searchExact.status === 200, 'Search with slash returns HTTP 200');
    assert(searchExact.body.includes('Exact Part Number Match Found'), 'Search identifies exact part number');
    assert(searchExact.body.includes('noindex'), 'Search page correctly sets noindex robots directive');

    const searchNormalized = await request('/search?q=335y1459');
    assert(searchNormalized.status === 200, 'Search with normalized string returns HTTP 200');
    assert(searchNormalized.body.includes('335/Y1459'), 'Search matches normalized part number to 335/Y1459');

    // 6. Product Detail Page
    const productPage = await request('/products/tandem-hydraulic-gear-pump-jcb-3dx-335-y1459');
    assert(productPage.status === 200, 'Product page returns HTTP 200');
    assert(productPage.body.includes('Tandem Main Hydraulic Gear Pump'), 'Product page contains H1 title');
    assert(productPage.body.includes('335/Y1459'), 'Product page contains Part Number');
    assert(productPage.body.includes('"@type": "Product"'), 'Product page includes Product JSON-LD schema');
    assert(productPage.body.includes('https://wa.me/'), 'Product page includes WhatsApp CTA link');
    assert(productPage.body.includes('BreadcrumbList'), 'Product page includes BreadcrumbList schema');

    // 7. Dedicated Part Number Page (/parts/335-y1459)
    const partPage = await request('/parts/335-y1459');
    assert(partPage.status === 200, 'Part Number page returns HTTP 200');
    assert(partPage.body.includes('Part Number <span style="color: #fbbf24;">335/Y1459</span>') || partPage.body.includes('335/Y1459'), 'Part Number page displays part number in H1');
    assert(partPage.body.includes('Quick Reference: What is Part Number'), 'Part Number page answers direct search intent');
    assert(partPage.body.includes('Machine Model Compatibility'), 'Part Number page lists compatible models');

    // 8. Brand & Machine Pages
    const brandPage = await request('/brands/jcb');
    assert(brandPage.status === 200, 'Brand JCB page returns HTTP 200');
    assert(brandPage.body.includes('JCB is a registered trademark'), 'Brand page displays disclaimer');

    const machinePage = await request('/machines/jcb-3dx');
    assert(machinePage.status === 200, 'Machine JCB 3DX page returns HTTP 200');
    assert(machinePage.body.includes('Production Year & Engine Variants'), 'Machine page lists year/engine variants');

    const modelPage = await request('/machines/jcb/3dx-2011-2016');
    assert(modelPage.status === 200, 'Machine Model 2011-2016 page returns HTTP 200');
    assert(modelPage.body.includes('JCB DieselMAX'), 'Model page displays engine specs');

    // 9. Country Export Landing Page
    const countryPage = await request('/export/uae');
    assert(countryPage.status === 200, 'Country UAE page returns HTTP 200');
    assert(countryPage.body.includes('Jebel Ali Port'), 'Country page displays port info');
    assert(countryPage.body.includes('3 – 5 Days') || countryPage.body.includes('3 - 5 Days'), 'Country page displays sea transit time');

    // 10. Technical Resource / Guide Page
    const resourcePage = await request('/resources/how-to-identify-correct-jcb-3dx-hydraulic-seal-kit-by-year');
    assert(resourcePage.status === 200, 'Resource guide returns HTTP 200');
    assert(resourcePage.body.includes('"@type": "Article"'), 'Resource guide has Article JSON-LD schema');

    // 11. RFQ Flow
    const rfqPage = await request('/rfq');
    assert(rfqPage.status === 200, 'RFQ page returns HTTP 200');
    assert(rfqPage.body.includes('Step 1: Your Contact Information'), 'RFQ page displays step wizard');

    // 12. 301 Redirects
    const redirectLegacy = await request('/jcb-parts');
    assert(redirectLegacy.status === 301, 'Legacy /jcb-parts redirects with 301');
    assert(redirectLegacy.headers.location === '/brands/jcb', 'Legacy /jcb-parts redirects to /brands/jcb');

    const redirectSlug = await request('/parts/335Y1459');
    assert(redirectSlug.status === 301, 'Uppercase /parts/335Y1459 redirects to normalized slug');
    assert(redirectSlug.headers.location === '/parts/335-y1459', 'Slug redirects to /parts/335-y1459');

    // 13. 404 Error Page
    const notFound = await request('/non-existent-random-url-998877');
    assert(notFound.status === 404, 'Non-existent URL returns HTTP 404');
    assert(notFound.body.includes('404'), '404 page displays branded 404 error');
    assert(notFound.body.includes('Search'), '404 page includes search bar');

    // 14. Orphan Page & Link Graph Health Audit
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
