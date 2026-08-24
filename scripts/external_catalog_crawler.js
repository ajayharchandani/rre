// scripts/external_catalog_crawler.js
/**
 * RRE International — Controlled External Catalog Crawler (Phase 2)
 *
 * Discovers and stages reference product data and images from:
 * https://www.antheautoparts.com/online-jcb-parts-catalog
 *
 * Features:
 * - Configurable request delay (rate-limiting)
 * - Automatic retry with exponential backoff
 * - Timeout handling
 * - Custom User-Agent header
 * - Checkpoint / resume capability
 * - Category-level and pagination awareness
 * - Zero-pollution: outputs strictly to storage/external_catalog/ staging files
 * - Zero modification of RRE production database or routes
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const STAGING_DIR = path.join(ROOT_DIR, 'storage', 'external_catalog');
const STAGING_OUTPUT_FILE = path.join(STAGING_DIR, 'staging_anthe_jcb.json');
const CATEGORIES_OUTPUT_FILE = path.join(STAGING_DIR, 'categories_discovered.json');
const CHECKPOINT_FILE = path.join(STAGING_DIR, '.crawler_checkpoint.json');
const CRAWL_LOG_FILE = path.join(STAGING_DIR, 'crawl_log.json');

const BASE_CATALOG_URL = 'https://www.antheautoparts.com/online-jcb-parts-catalog';

const CONFIG = {
  requestDelayMs: 350,       // Delay between requests
  requestJitterMs: 150,      // Randomized jitter
  timeoutMs: 15000,          // 15 seconds per request
  maxRetries: 3,             // Max retry attempts per URL
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 RRE-Enrichment-Agent/1.0',
  maxPagesPerCategory: 50    // Safety limit
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWithRetry(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: CONFIG.timeoutMs
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = `${parsed.protocol}//${parsed.hostname}${loc}`;
        return resolve(fetchWithRetry(loc, attempt));
      }

      if (res.statusCode >= 500 && attempt <= CONFIG.maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`[HTTP ${res.statusCode}] Retrying ${url} in ${backoff}ms (Attempt ${attempt}/${CONFIG.maxRetries})...`);
        return sleep(backoff).then(() => fetchWithRetry(url, attempt + 1)).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('timeout', () => {
      req.destroy();
      if (attempt <= CONFIG.maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`[Timeout] Retrying ${url} in ${backoff}ms (Attempt ${attempt}/${CONFIG.maxRetries})...`);
        return sleep(backoff).then(() => fetchWithRetry(url, attempt + 1)).then(resolve).catch(reject);
      }
      reject(new Error(`Timeout fetching ${url} after ${CONFIG.maxRetries} attempts`));
    });

    req.on('error', (err) => {
      if (attempt <= CONFIG.maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`[Error: ${err.message}] Retrying ${url} in ${backoff}ms (Attempt ${attempt}/${CONFIG.maxRetries})...`);
        return sleep(backoff).then(() => fetchWithRetry(url, attempt + 1)).then(resolve).catch(reject);
      }
      reject(err);
    });

    req.end();
  });
}

function parseCategories(html) {
  const catRegex = /<label\s+class="contain">\s*([^<]+?)\s*<input\s+type="checkbox"\s+name="type\[\]"\s+value="(\d+)"/gi;
  let match;
  const categories = [];
  while ((match = catRegex.exec(html)) !== null) {
    const rawText = match[1].trim();
    const id = match[2].trim();
    const countMatch = rawText.match(/\((\d+)\)/);
    const name = rawText.replace(/\s*\(\d+\)/, '').trim();
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;
    categories.push({ id, name, count });
  }
  return categories;
}

function parseProductCards(html, categoryName, categoryId, pageUrl) {
  const products = [];
  // Split on car-block-four containers
  const blocks = html.split(/<div\s+class="car-block-four/i).slice(1);

  for (const block of blocks) {
    // 1. Product Detail URL
    const urlMatch = block.match(/<figure[^>]*>\s*<a\s+href="([^"]+)"/i);
    const productUrl = urlMatch ? urlMatch[1].trim() : null;

    // 2. Image URL
    const imgMatch = block.match(/<img\s+src="([^"]+)"/i);
    let imageUrl = imgMatch ? imgMatch[1].trim() : null;
    if (imageUrl && imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;

    // 3. Product Name / Title
    const titleMatch = block.match(/<h6[^>]*class="title"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h6>/i);
    let productName = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 4. Ref OEM Numbers
    const oemMatch = block.match(/Ref\.\s*OEM\s*No\.?:?\s*([^<\n\r]+)/i);
    let partNumbers = [];
    if (oemMatch) {
      const rawOem = oemMatch[1].trim();
      partNumbers = rawOem
        .split(/[,;]+/)
        .map(p => p.trim())
        .filter(p => Boolean(p) && p !== '-' && p !== 'N/A' && p.toLowerCase() !== 'null');
    }

    if (productName || partNumbers.length > 0) {
      products.push({
        source: "Anthe Auto Parts",
        source_url: pageUrl,
        product_url: productUrl,
        product_name: productName,
        part_numbers: partNumbers,
        category: categoryName,
        category_id: categoryId,
        image_urls: imageUrl ? [imageUrl] : [],
        scraped_at: new Date().toISOString()
      });
    }
  }

  return products;
}

function parseTotalPages(html) {
  const pageLinks = html.match(/page=(\d+)/g) || [];
  let maxPage = 1;
  for (const pl of pageLinks) {
    const p = parseInt(pl.replace('page=', ''), 10);
    if (Number.isInteger(p) && p > maxPage) maxPage = p;
  }
  return maxPage;
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    } catch (e) {
      return { completedCategories: [], completedPages: {}, products: [] };
    }
  }
  return { completedCategories: [], completedPages: {}, products: [] };
}

function saveCheckpoint(data) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function runCrawler() {
  console.log('=====================================================');
  console.log('  RRE INTERNATIONAL — EXTERNAL CATALOG CRAWLER (PHASE 2)');
  console.log('  Target: ' + BASE_CATALOG_URL);
  console.log('=====================================================');

  fs.mkdirSync(STAGING_DIR, { recursive: true });

  const startTime = Date.now();
  const crawlLogs = {
    started_at: new Date().toISOString(),
    categories_found: 0,
    pages_crawled: 0,
    products_extracted: 0,
    unique_part_numbers_discovered: 0,
    unique_images_discovered: 0,
    errors: []
  };

  // Step 1: Initial Seed Request to Discover Categories
  console.log('\n[1/4] Fetching category directory...');
  const initRes = await fetchWithRetry(BASE_CATALOG_URL);
  if (initRes.statusCode !== 200) {
    throw new Error(`Failed to reach base catalog. HTTP Status: ${initRes.statusCode}`);
  }

  const categories = parseCategories(initRes.body);
  console.log(`Discovered ${categories.length} categories on external catalog.`);
  fs.writeFileSync(CATEGORIES_OUTPUT_FILE, JSON.stringify(categories, null, 2), 'utf8');
  crawlLogs.categories_found = categories.length;

  const checkpoint = loadCheckpoint();
  const stagedProductsMap = new Map(); // key: unique product identifier (product_url or part_numbers)

  // Restore previous checkpoint if available
  if (checkpoint.products && Array.isArray(checkpoint.products)) {
    for (const p of checkpoint.products) {
      const key = p.product_url || (p.part_numbers.join('|') + '_' + p.product_name);
      stagedProductsMap.set(key, p);
    }
  }

  console.log(`[Checkpoint] Loaded ${stagedProductsMap.size} existing staged products.`);

  // Step 2: Crawl Category by Category
  console.log('\n[2/4] Starting category-aware paginated crawl...');
  
  for (let cIdx = 0; cIdx < categories.length; cIdx++) {
    const cat = categories[cIdx];
    if (cat.count === 0) {
      console.log(`  - [${cIdx + 1}/${categories.length}] Skipping "${cat.name}" (0 items)`);
      continue;
    }

    if (checkpoint.completedCategories && checkpoint.completedCategories.includes(cat.id)) {
      console.log(`  - [${cIdx + 1}/${categories.length}] Category "${cat.name}" already completed in checkpoint.`);
      continue;
    }

    console.log(`\n  ► [${cIdx + 1}/${categories.length}] Crawling Category "${cat.name}" (Expected: ~${cat.count} items)...`);

    // First page of category
    const catPage1Url = `${BASE_CATALOG_URL}?type%5B%5D=${cat.id}&page=1`;
    let page1Res;
    try {
      page1Res = await fetchWithRetry(catPage1Url);
    } catch (err) {
      console.error(`    ✗ Error fetching ${catPage1Url}:`, err.message);
      crawlLogs.errors.push({ url: catPage1Url, error: err.message });
      continue;
    }

    crawlLogs.pages_crawled++;
    const totalPages = Math.min(parseTotalPages(page1Res.body), CONFIG.maxPagesPerCategory);
    console.log(`    Discovered ${totalPages} page(s) for "${cat.name}".`);

    // Parse page 1
    const p1Items = parseProductCards(page1Res.body, cat.name, cat.id, catPage1Url);
    for (const item of p1Items) {
      const key = item.product_url || (item.part_numbers.join('|') + '_' + item.product_name);
      if (!stagedProductsMap.has(key)) stagedProductsMap.set(key, item);
    }
    console.log(`    Page 1: Parsed ${p1Items.length} products.`);

    // Crawl subsequent pages if any
    for (let page = 2; page <= totalPages; page++) {
      const pageUrl = `${BASE_CATALOG_URL}?type%5B%5D=${cat.id}&page=${page}`;
      
      // Delay with jitter
      const delay = CONFIG.requestDelayMs + Math.floor(Math.random() * CONFIG.requestJitterMs);
      await sleep(delay);

      try {
        const pageRes = await fetchWithRetry(pageUrl);
        crawlLogs.pages_crawled++;
        const items = parseProductCards(pageRes.body, cat.name, cat.id, pageUrl);
        for (const item of items) {
          const key = item.product_url || (item.part_numbers.join('|') + '_' + item.product_name);
          if (!stagedProductsMap.has(key)) stagedProductsMap.set(key, item);
        }
        console.log(`    Page ${page}/${totalPages}: Parsed ${items.length} products.`);
      } catch (err) {
        console.error(`    ✗ Error on ${pageUrl}:`, err.message);
        crawlLogs.errors.push({ url: pageUrl, error: err.message });
      }
    }

    // Update Checkpoint after each category
    const completedList = checkpoint.completedCategories || [];
    completedList.push(cat.id);
    checkpoint.completedCategories = completedList;
    checkpoint.products = Array.from(stagedProductsMap.values());
    saveCheckpoint(checkpoint);
  }

  // Step 3: Global Catalog Crawl (All-parts fallback to ensure 100% complete coverage)
  console.log('\n[3/4] Running global index verification check...');
  const masterPage1Url = `${BASE_CATALOG_URL}?page=1`;
  const m1Res = await fetchWithRetry(masterPage1Url);
  const globalTotalPages = parseTotalPages(m1Res.body);
  console.log(`Global catalog reports ${globalTotalPages} total pages.`);

  for (let gPage = 1; gPage <= globalTotalPages; gPage++) {
    const gUrl = `${BASE_CATALOG_URL}?page=${gPage}`;
    const delay = CONFIG.requestDelayMs + Math.floor(Math.random() * CONFIG.requestJitterMs);
    await sleep(delay);

    try {
      const gRes = await fetchWithRetry(gUrl);
      crawlLogs.pages_crawled++;
      const gItems = parseProductCards(gRes.body, 'General JCB Parts', '0', gUrl);
      for (const item of gItems) {
        const key = item.product_url || (item.part_numbers.join('|') + '_' + item.product_name);
        if (!stagedProductsMap.has(key)) {
          stagedProductsMap.set(key, item);
        }
      }
    } catch (err) {
      console.warn(`    Warning on global page ${gPage}:`, err.message);
    }
  }

  // Step 4: Final Compilation and Staging Output
  console.log('\n[4/4] Finalizing staged dataset...');
  const finalStagedProducts = Array.from(stagedProductsMap.values());

  const allPartNumbers = new Set();
  const allImages = new Set();

  for (const p of finalStagedProducts) {
    p.part_numbers.forEach(pn => allPartNumbers.add(pn.trim()));
    p.image_urls.forEach(img => allImages.add(img.trim()));
  }

  crawlLogs.completed_at = new Date().toISOString();
  crawlLogs.duration_seconds = Math.round((Date.now() - startTime) / 1000);
  crawlLogs.products_extracted = finalStagedProducts.length;
  crawlLogs.unique_part_numbers_discovered = allPartNumbers.size;
  crawlLogs.unique_images_discovered = allImages.size;

  fs.writeFileSync(STAGING_OUTPUT_FILE, JSON.stringify(finalStagedProducts, null, 2), 'utf8');
  fs.writeFileSync(CRAWL_LOG_FILE, JSON.stringify(crawlLogs, null, 2), 'utf8');

  // Remove checkpoint upon clean completion
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  console.log('\n=====================================================');
  console.log('  CRAWL COMPLETE — PHASE 2 STAGING SUMMARY');
  console.log('=====================================================');
  console.log(`  ✓ Total Products Discovered: ${finalStagedProducts.length}`);
  console.log(`  ✓ Unique Part / OEM Numbers: ${allPartNumbers.size}`);
  console.log(`  ✓ Reference Image URLs:      ${allImages.size}`);
  console.log(`  ✓ Total Categories:          ${categories.length}`);
  console.log(`  ✓ Pages Crawled:             ${crawlLogs.pages_crawled}`);
  console.log(`  ✓ Total Duration:            ${crawlLogs.duration_seconds}s`);
  console.log(`  ✓ Staging Dataset Saved To:  ${STAGING_OUTPUT_FILE}`);
  console.log('=====================================================\n');

  return {
    productCount: finalStagedProducts.length,
    partNumberCount: allPartNumbers.size,
    imageCount: allImages.size,
    categoryCount: categories.length
  };
}

if (require.main === module) {
  runCrawler()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Crawler Fatal Error:', err);
      process.exit(1);
    });
}

module.exports = { runCrawler, fetchWithRetry, parseCategories, parseProductCards };
