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

async function inspectDetail() {
  const detailUrl = 'https://www.antheautoparts.com/product-details/wheel-nuts-3-4-106-40001-400-n6589-jcb-parts';
  console.log('Fetching product detail:', detailUrl);
  const res = await fetchUrl(detailUrl);
  console.log('Status code:', res.statusCode);
  
  const samplePath = path.join(__dirname, 'external_detail_sample.html');
  fs.writeFileSync(samplePath, res.body, 'utf8');
  console.log('Saved detail sample to:', samplePath);

  // Extract key elements
  const titleMatch = res.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || res.body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  console.log('Title match:', titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'N/A');

  const imgMatches = res.body.match(/https:\/\/enterprise\.saioautomotive\.com\/backend\/assets\/uploads\/products\/[^"'\s]+/g) || [];
  console.log('Found product image URLs:', Array.from(new Set(imgMatches)));
}

inspectDetail().catch(err => console.error('Error:', err));
