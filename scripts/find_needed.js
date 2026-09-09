const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PartNumberNormalizer = require('../src/services/partNumberNormalizer');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'storage', 'source_photos');
const GENERATED_DIR = path.join(ROOT, 'storage', 'generated_assets');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'generated', 'products.json');

const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
const byPartNumberNormalized = new Map();
const byPartNumberExact = new Map();

for (const p of products) {
  if (!byPartNumberNormalized.has(p.part_number_normalized)) {
    byPartNumberNormalized.set(p.part_number_normalized, []);
  }
  byPartNumberNormalized.get(p.part_number_normalized).push(p);
  byPartNumberExact.set(p.part_number, p);
}

function extractCandidates(filename) {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext).trim();
  const candidates = [];
  const parts = base.split('_');
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    if (/^\d+$/.test(p) && p.length <= 2) continue;
    const subMatches = p.match(/\b\d{3}[-\/]\d{5}\b/g) || p.match(/\b\d{3}[-\/][A-Za-z0-9]+\b/g);
    if (subMatches && subMatches.length > 1) {
      candidates.push(...subMatches);
    } else {
      candidates.push(p);
    }
  }
  if (!candidates.includes(base)) {
    candidates.push(base);
  }
  return candidates;
}

const sources = fs.readdirSync(SOURCE_DIR).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
const generated = new Set(fs.readdirSync(GENERATED_DIR).map(f => f.toLowerCase()));
const KNOWN_CLEAN_SOURCE_FILES = new Set(['914-60223.jpeg', 'G65-0.png']);

const pending = [];
for (const file of sources) {
  if (KNOWN_CLEAN_SOURCE_FILES.has(file)) continue;

  const filePath = path.join(SOURCE_DIR, file);
  // Check MD5 for coming soon placeholder
  const fileHash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  if (fileHash === '1d7618c715939b29dcaed14d561636e5') continue;

  const base = path.basename(file, path.extname(file));
  const hasExact = generated.has(file.toLowerCase()) || generated.has(`${base.toLowerCase()}.jpg`) || generated.has(`${base.toLowerCase()}.png`);
  if (hasExact) continue;

  const candidates = extractCandidates(file);
  let matchedProduct = null;
  let matchedCandidate = null;

  for (const cand of candidates) {
    const slashVersion = cand.replace(/-/g, '/');
    if (byPartNumberExact.has(slashVersion)) {
      matchedProduct = byPartNumberExact.get(slashVersion);
      matchedCandidate = slashVersion;
      break;
    }
    const norm = PartNumberNormalizer.normalize(cand);
    const candidateList = byPartNumberNormalized.get(norm);
    if (candidateList && candidateList.length > 0) {
      matchedProduct = candidateList[0];
      matchedCandidate = cand;
      break;
    }
  }

  if (matchedProduct) {
    // Check if matchedProduct already has an asset generated for another alias
    const candidateNorm = PartNumberNormalizer.normalize(matchedCandidate);
    const alreadyGen = Array.from(generated).some(gf => {
      const gBase = path.basename(gf, path.extname(gf));
      return PartNumberNormalizer.normalize(gBase) === candidateNorm;
    });
    if (alreadyGen) continue;

    pending.push({
      file,
      part_number: matchedProduct.part_number,
      description: matchedProduct.description || matchedProduct.name,
      category: matchedProduct.category_name
    });
  }
}

console.log(`Total source images: ${sources.length}`);
console.log(`Already in generated_assets: ${generated.size}`);
console.log(`True pending with real photos: ${pending.length}`);
console.log('Next 10 in queue:');
console.log(JSON.stringify(pending.slice(0, 10), null, 2));
