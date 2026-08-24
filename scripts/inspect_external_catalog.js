const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RRE-Catalog-Enrichment-Agent/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) redirectUrl = `${parsed.protocol}//${parsed.hostname}${redirectUrl}`;
        return resolve(fetchUrl(redirectUrl));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

async function inspect() {
  console.log('Fetching https://www.antheautoparts.com/online-jcb-parts-catalog ...');
  const res = await fetchUrl('https://www.antheautoparts.com/online-jcb-parts-catalog');
  console.log('Status code:', res.statusCode);
  
  // Save raw sample for inspection
  const samplePath = path.join(__dirname, 'external_sample_page.html');
  fs.writeFileSync(samplePath, res.body, 'utf8');
  console.log('Saved page sample to:', samplePath);

  // Extract Categories from Sidebar
  const catRegex = /<label\s+class="contain">\s*([^<]+?)\s*<input\s+type="checkbox"\s+name="type\[\]"\s+value="(\d+)"/gi;
  let catMatch;
  const categories = [];
  while ((catMatch = catRegex.exec(res.body)) !== null) {
    const rawText = catMatch[1].trim();
    const typeValue = catMatch[2].trim();
    const countMatch = rawText.match(/\((\d+)\)/);
    const name = rawText.replace(/\s*\(\d+\)/, '').trim();
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;
    categories.push({ id: typeValue, name, count });
  }

  console.log('Extracted categories count:', categories.length);
  console.log('Categories:', categories);

  // Extract Products on Page
  const cardRegex = /<div\s+class="col-lg-4[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  const cards = res.body.match(cardRegex) || [];
  console.log('Found product cards:', cards.length);

  if (cards.length > 0) {
    console.log('\n--- SAMPLE PRODUCT CARD ---');
    console.log(cards[0].trim());
  }

  // Check pagination
  const paginationRegex = /<ul class="pagination[\s\S]*?<\/ul>/gi;
  const paginationMatch = res.body.match(paginationRegex);
  if (paginationMatch) {
    console.log('\n--- PAGINATION ---');
    console.log(paginationMatch[0]);
  }
}

inspect().catch(err => console.error('Inspection error:', err));
