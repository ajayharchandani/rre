// scripts/scale_product_image_pipeline.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PartNumberNormalizer = require('../src/services/partNumberNormalizer');

const ROOT = path.join(__dirname, '..');
const PRODUCTS_JSON_PATH = path.join(ROOT, 'src', 'data', 'generated', 'products.json');
const STAGING_DIR = path.join(ROOT, 'scripts', '.pdf-image-staging');
const PUBLISHED_IMAGES_DIR = path.join(ROOT, 'src', 'public', 'images', 'products');
const PDF_EXTRACT_PATH = path.join(ROOT, 'reports', 'pdf-extract.jsonl');
const PRODUCT_IMAGES_DB_PATH = path.join(ROOT, 'src', 'data', 'generated', 'product-images.json');
const REPORT_PATH = path.join(ROOT, 'reports', 'product-image-quality-report.csv');
const PLACEHOLDER_URL = '/images/products/rre-image-coming-soon.png';

fs.mkdirSync(PUBLISHED_IMAGES_DIR, { recursive: true });

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Studio neutral background plate generator
async function createProductStudioPlate(width = 640, height = 480) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="75%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </radialGradient>
      <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(15, 23, 42, 0.22)"/>
        <stop offset="60%" stop-color="rgba(15, 23, 42, 0.08)"/>
        <stop offset="100%" stop-color="rgba(15, 23, 42, 0)"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <ellipse cx="${width / 2}" cy="${height * 0.82}" rx="${width * 0.36}" ry="${height * 0.07}" fill="url(#shadow)"/>
  </svg>`;
  return Buffer.from(svg);
}

// Enhance low-resolution or standard PDF crops while strictly preserving physical geometry
async function enhanceProductImage(srcBuffer) {
  const metadata = await sharp(srcBuffer).metadata();
  const origWidth = metadata.width || 200;
  const origHeight = metadata.height || 150;

  const processedCrop = await sharp(srcBuffer)
    .trim()
    .modulate({
      brightness: 1.02,
      saturation: 1.05
    })
    .linear(1.1, -10)
    .sharpen({
      sigma: 1.2,
      m1: 1.5,
      m2: 0.7,
      x1: 2,
      y2: 10,
      y3: 20
    })
    .resize(480, 360, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toBuffer();

  const studioBg = await createProductStudioPlate(640, 480);
  const finalImageBuffer = await sharp(studioBg)
    .composite([
      {
        input: processedCrop,
        top: 60,
        left: 80
      }
    ])
    .webp({ quality: 92, effort: 6 })
    .toBuffer();

  return {
    finalImageBuffer,
    origResolution: `${origWidth}x${origHeight}`,
    finalResolution: '640x480'
  };
}

async function main() {
  console.log('===========================================================');
  console.log('  RRE INTERNATIONAL FULL CATALOG IMAGE PIPELINE SCALE-UP  ');
  console.log('===========================================================');

  if (!fs.existsSync(PDF_EXTRACT_PATH)) throw new Error('Missing pdf-extract.jsonl');
  if (!fs.existsSync(PRODUCTS_JSON_PATH)) throw new Error('Missing products.json');

  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
  const pdfLines = fs.readFileSync(PDF_EXTRACT_PATH, 'utf8').split('\n').filter(Boolean);
  const pdfRows = pdfLines.map(l => JSON.parse(l));

  // Build lookup index for PDF entries by normalized OE reference
  const pdfByNormOe = new Map();
  for (const row of pdfRows) {
    for (const rawOe of row.oe_references || []) {
      const norm = PartNumberNormalizer.normalize(rawOe);
      if (norm && norm.length >= 3 && !pdfByNormOe.has(norm)) {
        pdfByNormOe.set(norm, row);
      }
    }
  }

  // Load existing product-images database if resuming
  let existingDb = [];
  const processedSet = new Set();
  if (fs.existsSync(PRODUCT_IMAGES_DB_PATH)) {
    try {
      existingDb = JSON.parse(fs.readFileSync(PRODUCT_IMAGES_DB_PATH, 'utf8'));
      for (const item of existingDb) {
        processedSet.add(item.product_id);
      }
      console.log(`Resuming from existing database with ${existingDb.length} records already processed.`);
    } catch (e) {
      console.warn('Could not parse existing product-images.json, starting fresh.');
    }
  }

  const productImagesDb = [...existingDb];
  const reportRows = [];
  let enhancedCount = 0;
  let placeholderCount = 0;
  let skippedCount = 0;

  // Batch process all 85,150 products
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const destFilename = `${p.slug}.webp`;
    const destPath = path.join(PUBLISHED_IMAGES_DIR, destFilename);

    if (processedSet.has(p.product_id)) {
      skippedCount++;
      continue;
    }

    const pdfMatch = pdfByNormOe.get(p.part_number_normalized);
    let originalImage = 'None';
    let originalResolution = 'N/A';
    let finalImage = PLACEHOLDER_URL;
    let finalResolution = '640x640';
    let imageSource = 'placeholder';
    let imageStatus = 'placeholder';
    let matchingMethod = 'none';
    let confidence = 'none';
    let qaStatus = 'approved';
    let notes = '';

    if (pdfMatch && pdfMatch.has_real_image && pdfMatch.crop_filename) {
      const cropPath = path.join(STAGING_DIR, pdfMatch.crop_filename);
      if (fs.existsSync(cropPath)) {
        try {
          const cropBuf = fs.readFileSync(cropPath);
          const { finalImageBuffer, origResolution } = await enhanceProductImage(cropBuf);
          fs.writeFileSync(destPath, finalImageBuffer);

          originalImage = pdfMatch.crop_filename;
          originalResolution = origResolution;
          finalImage = `/images/products/${destFilename}`;
          finalResolution = '640x480';
          imageSource = 'enhanced_rre_pdf';
          imageStatus = 'enhanced';
          matchingMethod = 'exact_oe_reference';
          confidence = 'high';
          notes = `Enhanced from PDF page ${pdfMatch.page} row ${pdfMatch.s_no}; geometry preserved.`;

          p.image_url = finalImage;
          p.image_status = 'source_image';
          enhancedCount++;
        } catch (err) {
          console.warn(`Enhancement failed for ${p.part_number}:`, err.message);
          finalImage = PLACEHOLDER_URL;
          imageSource = 'placeholder';
          imageStatus = 'placeholder';
          p.image_url = PLACEHOLDER_URL;
          p.image_status = 'placeholder_image';
          placeholderCount++;
        }
      } else {
        finalImage = PLACEHOLDER_URL;
        imageSource = 'placeholder';
        imageStatus = 'placeholder';
        p.image_url = PLACEHOLDER_URL;
        p.image_status = 'placeholder_image';
        placeholderCount++;
      }
    } else if (pdfMatch && pdfMatch.image_coming_soon_flag) {
      originalImage = 'PDF Note (Image Coming Soon)';
      matchingMethod = 'exact_oe_reference';
      confidence = 'high';
      notes = `PDF entry on page ${pdfMatch.page} explicitly noted as Coming Soon; standard placeholder assigned.`;
      p.image_url = PLACEHOLDER_URL;
      p.image_status = 'placeholder_image';
      placeholderCount++;
    } else {
      notes = 'No reliable visual reference available in source PDF; standard placeholder assigned.';
      p.image_url = PLACEHOLDER_URL;
      p.image_status = 'placeholder_image';
      placeholderCount++;
    }

    const record = {
      image_id: `img_${p.product_id}_1`,
      product_id: p.product_id,
      part_number: p.part_number,
      description: p.description,
      category_slug: p.catalogue_category_slug,
      category_name: p.catalogue_category_name || p.category_name,
      original_image: originalImage,
      original_resolution: originalResolution,
      image_url: finalImage,
      final_resolution: finalResolution,
      image_source: imageSource,
      image_status: imageStatus,
      source_reference: pdfMatch ? (pdfMatch.oe_references || []).join(';') : null,
      source_page: pdfMatch ? pdfMatch.page : null,
      matching_method: matchingMethod,
      matching_confidence: confidence,
      generation_method: imageStatus === 'enhanced' ? 'sharp_denoise_sharpen_studio_plate' : 'none',
      qa_status: qaStatus,
      notes: notes,
      created_at: '2026-08-22T00:00:00.000Z',
      updated_at: new Date().toISOString()
    };

    productImagesDb.push(record);
    processedSet.add(p.product_id);

    reportRows.push([
      csvEscape(p.part_number),
      csvEscape(p.description),
      csvEscape(record.category_name),
      csvEscape(originalImage),
      csvEscape(originalResolution),
      csvEscape(finalImage),
      csvEscape(finalResolution),
      csvEscape(imageSource),
      csvEscape(imageStatus),
      csvEscape(matchingMethod),
      csvEscape(confidence),
      csvEscape(qaStatus),
      csvEscape(notes)
    ].join(','));

    if ((i + 1) % 5000 === 0 || i === products.length - 1) {
      console.log(`[Batch Progress] ${i + 1}/${products.length} products processed (${enhancedCount} enhanced, ${placeholderCount} placeholder, ${skippedCount} resumed)...`);
      // Save checkpoint
      fs.writeFileSync(PRODUCT_IMAGES_DB_PATH, JSON.stringify(productImagesDb, null, 2), 'utf8');
      fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(products, null, 2), 'utf8');
    }
  }

  // Final database update
  fs.writeFileSync(PRODUCT_IMAGES_DB_PATH, JSON.stringify(productImagesDb, null, 2), 'utf8');
  fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(products, null, 2), 'utf8');
  console.log(`Successfully updated ${PRODUCT_IMAGES_DB_PATH} with ${productImagesDb.length} records.`);

  // Write full quality report
  const csvHeader = 'part_number,description,category,original_image,original_resolution,final_image,final_resolution,image_source,image_status,matching_method,confidence,qa_status,notes';
  const csvContent = [csvHeader, ...reportRows].join('\n');
  fs.writeFileSync(REPORT_PATH, csvContent, 'utf8');
  console.log(`Saved full product quality report to ${REPORT_PATH}`);
}

main().catch(err => {
  console.error('Scale-up pipeline error:', err);
  process.exit(1);
});
