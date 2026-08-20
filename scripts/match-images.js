// scripts/match-images.js
//
// Phase 3/4: cross-references OCR'd PDF catalogue rows (reports/pdf-extract.jsonl,
// produced by run_pdf_extraction.sh) against the normalized product database
// (src/data/generated/products.json, produced by build-catalog.js) using
// EXACT normalized part-number matching only — never fuzzy/description
// matching, per the zero-hallucination rule (a wrong photo is worse than
// no photo).
//
// Run order: node scripts/build-catalog.js  ->  bash scripts/run_pdf_extraction.sh
//            ->  node scripts/match-images.js
//
// Effects:
//  - Matched products get image_status="source_image", a real photo
//    copied into src/public/images/products/{slug}.webp.
//  - Products whose PDF row is explicitly "IMAGE COMING SOON" get
//    image_status="placeholder_image" even if the OE reference matched.
//  - Every remaining product (no PDF match at all) gets
//    image_status="placeholder_image" pointing at the standardized
//    RRE placeholder graphic.
//  - Rewrites src/data/generated/products.json in place and writes
//    reports/image-mapping-report.csv per spec.

const fs = require('fs');
const path = require('path');
const PartNumberNormalizer = require('../src/services/partNumberNormalizer');

const ROOT = path.join(__dirname, '..');
const PDF_EXTRACT_PATH = path.join(ROOT, 'reports', 'pdf-extract.jsonl');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'generated', 'products.json');
const STAGING_DIR = path.join(ROOT, 'scripts', '.pdf-image-staging');
const PUBLISHED_IMAGES_DIR = path.join(ROOT, 'src', 'public', 'images', 'products');
const REPORT_PATH = path.join(ROOT, 'reports', 'image-mapping-report.csv');
const PLACEHOLDER_URL = '/images/products/rre-image-coming-soon.svg';

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  if (!fs.existsSync(PDF_EXTRACT_PATH)) {
    throw new Error(`${PDF_EXTRACT_PATH} not found — run scripts/run_pdf_extraction.sh first.`);
  }
  if (!fs.existsSync(PRODUCTS_PATH)) {
    throw new Error(`${PRODUCTS_PATH} not found — run scripts/build-catalog.js first.`);
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const byPartNumberNormalized = new Map();
  for (const p of products) {
    const key = p.part_number_normalized;
    if (!byPartNumberNormalized.has(key)) byPartNumberNormalized.set(key, []);
    byPartNumberNormalized.get(key).push(p);
  }

  const pdfLines = fs.readFileSync(PDF_EXTRACT_PATH, 'utf8').split('\n').filter(Boolean);
  const pdfRows = pdfLines.map(l => JSON.parse(l));

  fs.mkdirSync(PUBLISHED_IMAGES_DIR, { recursive: true });

  let matchedSourceImage = 0;
  let matchedPlaceholderViaComingSoon = 0;
  let pdfRowsWithNoMatch = 0;
  const matchNotes = []; // for the report, one row per PDF row processed
  const productMatchedAlready = new Set(); // product_id -> keep first/best match only

  for (const row of pdfRows) {
    let anyMatch = false;
    for (const rawOeRef of row.oe_references) {
      const normalized = PartNumberNormalizer.normalize(rawOeRef);
      if (!normalized || normalized.length < 3) continue; // too short to be a real part number (filters stray OCR noise)

      const candidates = byPartNumberNormalized.get(normalized);
      if (!candidates || candidates.length === 0) continue;

      anyMatch = true;
      for (const product of candidates) {
        if (productMatchedAlready.has(product.product_id)) continue; // keep first match, don't overwrite

        if (row.image_coming_soon_flag) {
          product.image_status = 'placeholder_image';
          product.image_url = PLACEHOLDER_URL;
          product.image_source = {
            pdf_page: row.page,
            pdf_row: row.s_no,
            oe_reference_matched: rawOeRef,
            confidence: 'exact_oe_reference_match',
            notes: 'PDF explicitly shows "IMAGE COMING SOON" for this entry; publishing standardized placeholder instead of a photo.'
          };
          productMatchedAlready.add(product.product_id);
          matchedPlaceholderViaComingSoon++;
          matchNotes.push({ row, product, outcome: 'coming_soon_in_pdf' });
        } else if (row.has_real_image && row.crop_filename) {
          const srcPath = path.join(STAGING_DIR, row.crop_filename);
          if (!fs.existsSync(srcPath)) continue;
          const destFilename = `${product.slug}.webp`;
          const destPath = path.join(PUBLISHED_IMAGES_DIR, destFilename);
          fs.copyFileSync(srcPath, destPath);

          product.image_status = 'source_image';
          product.image_url = `/images/products/${destFilename}`;
          product.image_source = {
            pdf_page: row.page,
            pdf_row: row.s_no,
            oe_reference_matched: rawOeRef,
            confidence: 'exact_oe_reference_match',
            notes: `Cropped from Jcb catalogue E.pdf page ${row.page}, matched via OE Reference.`
          };
          productMatchedAlready.add(product.product_id);
          matchedSourceImage++;
          matchNotes.push({ row, product, outcome: 'source_image' });
        }
      }
    }
    if (!anyMatch) pdfRowsWithNoMatch++;
  }

  // Everything else: no PDF match at all -> standardized placeholder
  let noMatchPlaceholder = 0;
  for (const p of products) {
    if (!productMatchedAlready.has(p.product_id)) {
      p.image_status = 'placeholder_image';
      p.image_url = PLACEHOLDER_URL;
      p.image_source = null;
      noMatchPlaceholder++;
    }
  }

  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products));

  // Image mapping report (spec section 31)
  const lines = ['part_number,description,category,source_image,source_page,image_status,image_filename,generated,confidence,notes'];
  for (const p of products) {
    const filename = p.image_status === 'source_image' ? path.basename(p.image_url) : '';
    const sourcePage = p.image_source ? p.image_source.pdf_page : '';
    const confidence = p.image_source ? p.image_source.confidence : '';
    const notes = p.image_source ? p.image_source.notes : (p.image_status === 'placeholder_image' ? 'No matching PDF entry found; standardized placeholder used.' : '');
    lines.push([
      p.part_number, p.description, p.category_code,
      p.image_status === 'source_image' ? 'yes' : 'no',
      sourcePage, p.image_status, filename, 'no', confidence, notes
    ].map(csvEscape).join(','));
  }
  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n');

  console.log('\n=== IMAGE MATCHING COMPLETE ===');
  console.log('PDF rows processed:               ', pdfRows.length);
  console.log('PDF rows with no OE-ref match:     ', pdfRowsWithNoMatch);
  console.log('Products matched to a source image:', matchedSourceImage);
  console.log('Products matched but "coming soon" in PDF:', matchedPlaceholderViaComingSoon);
  console.log('Products with no PDF match (placeholder):', noMatchPlaceholder);
  console.log('Total products:                    ', products.length);
  console.log('\nWrote:', path.relative(ROOT, REPORT_PATH));
  console.log('Updated:', path.relative(ROOT, PRODUCTS_PATH));
}

main();
