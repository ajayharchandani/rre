// scripts/batch_local_studio_generator.js
/**
 * RRE International — Zero-Quota Local Digital Studio Generation Engine
 *
 * Automatically transforms watermarked supplier product photos into
 * authentic, high-resolution, watermark-free studio photography assets
 * mounted on standardized RRE neutral plates.
 *
 * Uses local Node.js + Sharp image processing — requires zero external API quota.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const PartNumberNormalizer = require('../src/services/partNumberNormalizer');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'storage', 'source_photos');
const GENERATED_DIR = path.join(ROOT, 'storage', 'generated_assets');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'generated', 'products.json');

const PLACEHOLDER_MD5 = '1d7618c715939b29dcaed14d561636e5';
const KNOWN_CLEAN_FILES = new Set(['914-60223.jpeg', 'G65-0.png']);

// Parse command line arguments
const args = process.argv.slice(2);
let limit = null;
let runAll = false;

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--all') {
    runAll = true;
  }
}

if (!limit && !runAll) {
  limit = 25; // default pilot batch size
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

function getStudioPlateSvg(size = 800) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="78%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </radialGradient>
      <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(15,23,42,0.20)"/>
        <stop offset="60%" stop-color="rgba(15,23,42,0.06)"/>
        <stop offset="100%" stop-color="rgba(15,23,42,0)"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <ellipse cx="${size / 2}" cy="${size * 0.85}" rx="${size * 0.38}" ry="${size * 0.08}" fill="url(#shadow)"/>
  </svg>`;
}

async function processSourceImage(srcPath, destPath) {
  const meta = await sharp(srcPath).metadata();
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const processed = Buffer.from(data);

  // Define center watermark vertical bounds (typically between 28% and 72% of height)
  const wmTop = Math.floor(height * 0.28);
  const wmBottom = Math.floor(height * 0.72);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * channels;
    const inWmBand = y >= wmTop && y <= wmBottom;

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * channels;
      const r = processed[idx];
      const g = processed[idx + 1];
      const b = processed[idx + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const diff = maxC - minC;
      const brightness = (r + g + b) / 3;

      // 1. Clear background & internal apertures (washers, holes, spaces)
      if (brightness > 205 && diff < 24) {
        // Pure background area: make transparent
        processed[idx] = 255;
        processed[idx + 1] = 255;
        processed[idx + 2] = 255;
        processed[idx + 3] = 0;
      } else if (brightness > 185 && diff < 16) {
        // Feathered anti-aliasing edge
        const alpha = Math.floor(((205 - brightness) / 20) * 255);
        processed[idx + 3] = Math.max(0, Math.min(255, alpha));
      } else if (inWmBand) {
        // 2. In-band watermark suppression on the product itself
        // The watermark is a semi-transparent light overlay.
        // On darker/medium tones, it creates a subtle shift towards grey/white.
        // We gently attenuate highlights that match the watermark overlay profile:
        if (diff < 12 && brightness > 140 && brightness <= 185) {
          // Attenuate light grey overlay haze on darker metal/rubber
          const factor = 0.88;
          processed[idx] = Math.round(r * factor);
          processed[idx + 1] = Math.round(g * factor);
          processed[idx + 2] = Math.round(b * factor);
        }
      }
    }
  }

  // Convert raw processed buffer back to sharp image
  const cutoutPngBuffer = await sharp(processed, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  // Trim transparent bounding box around the component
  let trimmedBuffer;
  try {
    trimmedBuffer = await sharp(cutoutPngBuffer)
      .trim()
      .toBuffer();
  } catch (err) {
    // If trimming fails (e.g. empty or solid), fallback to full cutout
    trimmedBuffer = cutoutPngBuffer;
  }

  // Studio Plate configuration
  const targetSize = 800;
  const plateSvg = getStudioPlateSvg(targetSize);

  // Enhance product: slight contrast increase, sharpen fine details (threads, edges, stamped text)
  const productOnPlate = await sharp(trimmedBuffer)
    .modulate({ brightness: 1.02, saturation: 1.06 })
    .linear(1.08, -8) // slight contrast boost
    .sharpen({ sigma: 1.0, m1: 1.2, m2: 0.8 })
    .resize(Math.round(targetSize * 0.82), Math.round(targetSize * 0.82), {
      fit: 'inside',
      withoutEnlargement: false
    })
    .toBuffer();

  // Composite onto studio plate and save as master high-res JPEG
  await sharp(Buffer.from(plateSvg))
    .composite([{ input: productOnPlate, gravity: 'center' }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(destPath);
}

async function main() {
  console.log('===============================================================');
  console.log('  RRE INTERNATIONAL — ZERO-QUOTA LOCAL STUDIO GENERATOR');
  console.log('===============================================================');
  console.log(`Source Folder:    ${SOURCE_DIR}`);
  console.log(`Generated Folder: ${GENERATED_DIR}`);
  console.log(`Execution Mode:   ${runAll ? 'FULL RUN (ALL PENDING)' : `PILOT BATCH (LIMIT = ${limit})`}\n`);

  fs.mkdirSync(GENERATED_DIR, { recursive: true });

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

  const sources = fs.readdirSync(SOURCE_DIR).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  const generated = new Set(fs.readdirSync(GENERATED_DIR).map(f => f.toLowerCase()));

  const pending = [];
  for (const file of sources) {
    if (KNOWN_CLEAN_FILES.has(file)) continue;

    const filePath = path.join(SOURCE_DIR, file);
    const fileHash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
    if (fileHash === PLACEHOLDER_MD5) continue;

    const base = path.basename(file, path.extname(file));
    const hasExact = generated.has(file.toLowerCase()) ||
                     generated.has(`${base.toLowerCase()}.jpg`) ||
                     generated.has(`${base.toLowerCase()}.png`);
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
        category: matchedProduct.category_name,
        candidates
      });
    }
  }

  console.log(`Total Source Files:        ${sources.length}`);
  console.log(`Already in Generated Dir:  ${generated.size}`);
  console.log(`Total Pending Match Queue: ${pending.length}`);

  const batch = limit ? pending.slice(0, limit) : pending;
  console.log(`Processing Batch Size:     ${batch.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    const srcPath = path.join(SOURCE_DIR, item.file);
    const destFileName = `${path.basename(item.file, path.extname(item.file))}.jpg`;
    const destPath = path.join(GENERATED_DIR, destFileName);

    try {
      await processSourceImage(srcPath, destPath);

      // Create alias copies for multi-part candidate filenames
      for (const cand of item.candidates) {
        const aliasFileName = `${cand.replace(/\//g, '-')}.jpg`;
        const aliasPath = path.join(GENERATED_DIR, aliasFileName);
        if (!fs.existsSync(aliasPath)) {
          fs.copyFileSync(destPath, aliasPath);
        }
      }

      successCount++;
      const pct = Math.round(((i + 1) / batch.length) * 100);
      console.log(`[${i + 1}/${batch.length}] (${pct}%) ✓ Processed & Mounted: ${item.part_number} (${item.description}) -> ${destFileName}`);
    } catch (err) {
      failCount++;
      console.error(`[${i + 1}/${batch.length}] ✗ Failed: ${item.file} - ${err.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log(`  BATCH COMPLETE: ${successCount} generated, ${failCount} failed`);
  console.log('===============================================================');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processSourceImage };
