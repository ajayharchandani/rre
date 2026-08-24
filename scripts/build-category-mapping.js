// scripts/build-category-mapping.js
//
// Phase 2 of the catalog build (runs after build-catalog.js).
//
// Replaces the "Cat 1 code = customer category" bug with a real
// product -> customer-facing catalogue-category mapping, built from two
// evidence sources, applied in priority order:
//
//   1. PDF OE-reference match (HIGH confidence): reports/pdf-extract.jsonl
//      carries real section headings from the JCB catalogue PDF and, for
//      each product line under a heading, its OE part number. Where an
//      Excel product's normalized part number matches one of those OE
//      references, its category is taken directly from the PDF section.
//
//   2. Description keyword classification (MEDIUM confidence): for every
//      product NOT covered by #1, an ordered keyword ruleset
//      (src/data/categoryTaxonomy.js) is matched against the product
//      description. First rule to match wins.
//
//   Anything matched by neither path is left uncategorized
//   (category_status = 'needs_review') but stays fully published,
//   searchable, and indexable — no product is dropped.
//
// The internal Cat 1 code is preserved on every product as
// internal_category_code for data-management use; it is never used as the
// customer-facing category or exposed in category URLs.
//
// Usage: node scripts/build-category-mapping.js

const fs = require('fs');
const path = require('path');
const PartNumberNormalizer = require('../src/services/partNumberNormalizer');
const { CATEGORIES, HEADER_ALIASES, KEYWORD_RULES, normalizeHeaderText } = require('../src/data/categoryTaxonomy');

const ROOT = path.join(__dirname, '..');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'generated', 'products.json');
const PDF_EXTRACT_PATH = path.join(ROOT, 'reports', 'pdf-extract.jsonl');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'generated');
const REPORTS_DIR = path.join(ROOT, 'reports');

const REDIRECT_MAJORITY_THRESHOLD = 0.6; // an internal code redirects straight to a category only if >=60% of its products landed there

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ---------------------------------------------------------------------
// Step 1: Build normalized-part-number -> categoryId map from the PDF
// ---------------------------------------------------------------------
function buildPdfCategoryMap() {
  const lines = fs.readFileSync(PDF_EXTRACT_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l => JSON.parse(l));

  // True section-header rows use "RRE" as a sentinel OE reference (the
  // extraction pipeline's marker for "this line has no part number, it's
  // a heading"). Every other s_no === null row is a real product line
  // where OCR simply missed the printed serial number.
  const isHeaderRow = r => Array.isArray(r.oe_references) && r.oe_references.length === 1 && r.oe_references[0] === 'RRE';

  // Page -> active categoryId, built from header transitions in page order.
  const pageToCategory = new Map();
  let currentCategoryId = null;
  const unmatchedHeaders = new Set();
  for (const r of rows) {
    if (isHeaderRow(r)) {
      const normalized = normalizeHeaderText(r.part_details);
      const mapped = HEADER_ALIASES[normalized];
      if (mapped) {
        currentCategoryId = mapped;
      } else {
        unmatchedHeaders.add(r.part_details);
      }
    }
    if (currentCategoryId && !pageToCategory.has(r.page)) {
      pageToCategory.set(r.page, currentCategoryId);
    }
  }

  // Manual overrides for confirmed sections whose PDF pages carry no OCR'd
  // heading row of their own — each evidenced directly by the product
  // descriptions on those pages (see reports/category-migration-report.md
  // for the full page-level trail). Without these, pageToCategory's
  // "carry the last-seen header forward" logic silently bleeds the
  // PREVIOUS section's category onto these pages' products, since it has
  // no way to detect a section boundary the OCR missed.
  //
  //   - Page 22: BUCKET 12/18/24/30, TOOTH POINT, SIDE CUTTER
  //     (was defaulting to the prior section, "Brake Parts")
  //   - Page 66: HEADLAMP, INDICATOR LIGHT LENS, REAR LIGHT
  //     (was defaulting to "Hydraulic / Pump Drive")
  //   - Pages 30-32: WINDOW HANDLE, DOOR LATCH, DOOR HANDLE, GAS STRUT,
  //     CABIN MOUNTING SET, BATTERY ISOLATOR SWITCH — this is the true
  //     start of the Cabin Parts section; the OCR'd "CABIN PARTS" header
  //     wasn't captured until page 33, so these 3 pages were defaulting to
  //     the prior section, "Bushes / Bearing Liners" (confirmed via
  //     src/data/generated/products.json: 17 products described purely as
  //     door/window/cabin hardware were tagged bushes-bearing-liners).
  //   - Pages 73-74: OIL PUMP SEAL, KING POST CARRIAGE SEAL, DOWTY SEAL,
  //     WIPER SEAL, SEAL KIT VALVE STEERING — the true start of the
  //     Seals/O-Rings/Seal Kits section; the OCR'd header wasn't captured
  //     until page 75, so these 2 pages were defaulting to the prior
  //     section, "Pins" (this is the exact "Pins category contains
  //     unrelated seals" defect reported for Phase 3 — 17 products
  //     described purely as SEAL/SEAL KIT/O-RING were tagged `pins`).
  //   - Pages 90-91: TRANSMISSION FRICTION PLATE, LAYSHAFT, GEAR 3RD,
  //     COUNTER PLATE — the true start of the Transmission & Gear Parts
  //     section; the OCR'd header wasn't captured until page 92, so these
  //     2 pages were defaulting to the prior section, "Torque Converter"
  //     (confirmed: 14 transmission gear/friction-plate products were
  //     tagged torque-converter).
  pageToCategory.set(22, 'bucket-parts');
  pageToCategory.set(66, 'light-lenses');
  pageToCategory.set(30, 'cabin-parts');
  pageToCategory.set(31, 'cabin-parts');
  pageToCategory.set(32, 'cabin-parts');
  pageToCategory.set(73, 'seals-seal-kits');
  pageToCategory.set(74, 'seals-seal-kits');
  pageToCategory.set(90, 'transmission-gear-parts');
  pageToCategory.set(91, 'transmission-gear-parts');

  const oeToCategory = new Map();
  let conflicts = 0;
  let productLines = 0;
  let linesWithOe = 0;

  for (const r of rows) {
    if (isHeaderRow(r)) continue;
    productLines++;
    const refs = Array.isArray(r.oe_references) ? r.oe_references : [];
    if (refs.length === 0) continue;
    const categoryId = pageToCategory.get(r.page);
    if (!categoryId) continue;

    for (const ref of refs) {
      if (!ref || ref === 'RRE' || /COMING\s?SOON|CONING|CORSINE/i.test(ref)) continue; // OCR noise placeholders, not real part numbers
      const normalized = PartNumberNormalizer.normalize(ref);
      if (!normalized) continue;
      linesWithOe++;
      const existing = oeToCategory.get(normalized);
      if (existing && existing !== categoryId) {
        conflicts++;
        continue; // keep first-seen mapping; don't overwrite with a conflicting one
      }
      oeToCategory.set(normalized, categoryId);
    }
  }

  return {
    oeToCategory,
    stats: {
      totalPdfLines: rows.length,
      headerRows: rows.filter(isHeaderRow).length,
      productLines,
      linesWithOeReference: linesWithOe,
      distinctOeMapped: oeToCategory.size,
      unmatchedHeaderTexts: Array.from(unmatchedHeaders),
      conflicts
    }
  };
}

// ---------------------------------------------------------------------
// Step 2: Keyword classification fallback
// ---------------------------------------------------------------------
function classifyByKeyword(description) {
  const text = String(description || '').toUpperCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) return rule.categoryId;
  }
  return null;
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
function main() {
  console.log('Loading PDF category evidence:', PDF_EXTRACT_PATH);
  const { oeToCategory, stats: pdfStats } = buildPdfCategoryMap();
  console.log('  PDF product lines:', pdfStats.productLines, '| with OE reference:', pdfStats.linesWithOeReference, '| distinct part numbers mapped:', pdfStats.distinctOeMapped);
  if (pdfStats.unmatchedHeaderTexts.length) {
    console.log('  NOTE: unmatched header texts (not in HEADER_ALIASES):', pdfStats.unmatchedHeaderTexts);
  }

  console.log('Loading products:', PRODUCTS_PATH);
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  console.log('  Products loaded:', products.length);

  const categoryById = new Map(CATEGORIES.map(c => [c.id, c]));
  const categoryCounts = new Map(CATEGORIES.map(c => [c.id, 0]));
  const categoryCodeDistribution = new Map(); // internal_category_code -> Map(categoryId -> count)

  let pdfMatched = 0;
  let keywordMatched = 0;
  let needsReview = 0;

  for (const p of products) {
    const internalCode = p.internal_category_code;

    let categoryId = oeToCategory.get(p.part_number_normalized) || null;
    let source = null;
    let confidence = null;

    if (categoryId) {
      source = 'pdf_oe_match';
      confidence = 'high';
      pdfMatched++;
    } else {
      categoryId = classifyByKeyword(p.description);
      if (categoryId) {
        source = 'keyword_match';
        confidence = 'medium';
        keywordMatched++;
      }
    }

    if (categoryId) {
      const cat = categoryById.get(categoryId);
      p.catalogue_category_id = cat.id;
      p.catalogue_category_name = cat.name;
      p.catalogue_category_slug = cat.id;
      p.category_status = 'categorized';
      p.category_source = source;
      p.category_confidence = confidence;
      p.category_name = cat.name; // customer-facing display value — was previously == internal code
      categoryCounts.set(cat.id, categoryCounts.get(cat.id) + 1);
    } else {
      p.catalogue_category_id = null;
      p.catalogue_category_name = null;
      p.catalogue_category_slug = null;
      p.category_status = 'needs_review';
      p.category_source = null;
      p.category_confidence = null;
      p.category_name = 'Category under review';
      needsReview++;
    }

    if (!categoryCodeDistribution.has(internalCode)) categoryCodeDistribution.set(internalCode, new Map());
    const dist = categoryCodeDistribution.get(internalCode);
    const key = categoryId || '__needs_review__';
    dist.set(key, (dist.get(key) || 0) + 1);
  }

  console.log('\n=== CATEGORIZATION RESULT ===');
  console.log('PDF OE match (high confidence):     ', pdfMatched);
  console.log('Keyword match (medium confidence):  ', keywordMatched);
  console.log('Needs review (uncategorized):       ', needsReview);
  console.log('Total:                              ', pdfMatched + keywordMatched + needsReview, '/', products.length);

  // --- Write updated products.json ---
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products));

  // --- Write catalogue-categories.json (dynamic counts) ---
  // This file also carries image metadata (image_url/image_source/
  // image_status/image_alt/created_at) added later by the image pipeline —
  // fields this script has no knowledge of. Merge into the existing file by
  // id instead of overwriting wholesale, so re-running the category mapping
  // never clobbers image work done since the last run.
  const categoriesOutPath = path.join(OUT_DIR, 'catalogue-categories.json');
  const existingCategories = fs.existsSync(categoriesOutPath)
    ? JSON.parse(fs.readFileSync(categoriesOutPath, 'utf8'))
    : [];
  const existingById = new Map(existingCategories.map(c => [c.id, c]));

  const nowIso = new Date().toISOString();
  const catalogueCategories = CATEGORIES
    .map(c => {
      const existing = existingById.get(c.id) || {};
      const count = categoryCounts.get(c.id);
      return {
        ...existing,
        id: c.id,
        name: c.name,
        slug: c.id,
        description: c.description,
        count,
        updated_at: existing.count === count ? existing.updated_at : nowIso
      };
    })
    .sort((a, b) => b.count - a.count);
  fs.writeFileSync(categoriesOutPath, JSON.stringify(catalogueCategories, null, 2));

  // --- Legacy internal-code -> redirect target map ---
  const legacyRedirects = {};
  for (const [code, dist] of categoryCodeDistribution.entries()) {
    const total = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    let best = null;
    let bestCount = 0;
    for (const [catId, count] of dist.entries()) {
      if (catId !== '__needs_review__' && count > bestCount) { best = catId; bestCount = count; }
    }
    const slug = code.toLowerCase();
    if (best && bestCount / total >= REDIRECT_MAJORITY_THRESHOLD) {
      legacyRedirects[slug] = `/parts/${best}`;
    } else {
      legacyRedirects[slug] = '/products';
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'legacy-category-redirects.json'), JSON.stringify(legacyRedirects, null, 2));

  // --- Category migration report (spec section 25) ---
  const totalProducts = products.length;
  const withImage = products.filter(p => p.image_status === 'source_image').length;

  const catRows = catalogueCategories.map(c => {
    const codes = Array.from(categoryCodeDistribution.entries())
      .filter(([, dist]) => dist.has(c.id))
      .map(([code]) => code)
      .sort();
    const productsInCat = products.filter(p => p.catalogue_category_id === c.id);
    const withImg = productsInCat.filter(p => p.image_status === 'source_image').length;
    return `| ${c.name} | ${codes.join(', ')} | ${c.count} | ${withImg} | ${c.count - withImg} |`;
  });

  const seoUrlCount = catalogueCategories.filter(c => c.count > 0).length;

  const report = [
    '# RRE International — Category Migration Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Sources: JCB Price list month of June 2026.xlsx (master), Jcb catalogue E.pdf (category evidence, via reports/pdf-extract.jsonl)`,
    '',
    '## 1. Mapping Method Summary',
    '',
    '| Method | Confidence | Product Count |',
    '|---|---|---|',
    `| PDF OE-reference match (direct evidence from catalogue PDF) | high | ${pdfMatched} |`,
    `| Description keyword classification (fallback ruleset) | medium | ${keywordMatched} |`,
    `| Unresolved — kept published, flagged for manual review | n/a | ${needsReview} |`,
    '',
    '## 2. CATEGORY REPORT',
    '',
    '| Category | Internal Cat 1 Codes Contributing | Product Count | With Real Image | Without Image (placeholder) |',
    '|---|---|---|---|---|',
    ...catRows,
    '',
    '## 3. PRODUCT REPORT',
    '',
    '| Metric | Count |',
    '|---|---|',
    `| Total Excel records | ${totalProducts} |`,
    `| Total unique products | ${totalProducts} |`,
    `| Products categorized (catalogue_category assigned) | ${pdfMatched + keywordMatched} |`,
    `| Products needing review (category_status = needs_review) | ${needsReview} |`,
    `| Products excluded from database | 0 |`,
    `| Products with a real source image | ${withImage} |`,
    `| Products on placeholder image | ${totalProducts - withImage} |`,
    '',
    '**All products remain published and searchable regardless of category_status — none were removed from the database.**',
    '',
    '## 4. SEO REPORT',
    '',
    '| Metric | Count |',
    '|---|---|',
    `| Indexable category URLs (/parts/{slug}) | ${seoUrlCount} |`,
    `| Indexable product URLs (/products/{slug}) | ${totalProducts} |`,
    `| Legacy internal-code URLs redirected (301, not indexed) | ${Object.keys(legacyRedirects).length} |`,
    `| Canonical URLs | 1 per product/category (self-canonical) |`,
    `| Sitemap-listed URLs | ${seoUrlCount + totalProducts} |`,
    '',
    '## 5. PDF Evidence Extraction Stats',
    '',
    '| Metric | Count |',
    '|---|---|',
    `| Total PDF extract lines | ${pdfStats.totalPdfLines} |`,
    `| True section-header lines | ${pdfStats.headerRows} |`,
    `| Product lines | ${pdfStats.productLines} |`,
    `| Product lines with an OE reference | ${pdfStats.linesWithOeReference} |`,
    `| Distinct part numbers resolved to a category from the PDF | ${pdfStats.distinctOeMapped} |`,
    `| Conflicting OE-to-category mappings (kept first-seen) | ${pdfStats.conflicts} |`,
    '',
    '## 6. Internal Code -> Category Distribution',
    '',
    'Confirms no internal Cat 1 code was force-mapped to a single category where its',
    'products actually span several — each code\'s products were categorized individually.',
    '',
    '| Internal Code | Total Products | Categories Represented | Legacy URL Redirect Target |',
    '|---|---|---|---|',
    ...Array.from(categoryCodeDistribution.entries())
      .sort((a, b) => {
        const totalA = Array.from(a[1].values()).reduce((x, y) => x + y, 0);
        const totalB = Array.from(b[1].values()).reduce((x, y) => x + y, 0);
        return totalB - totalA;
      })
      .map(([code, dist]) => {
        const total = Array.from(dist.values()).reduce((a, b) => a + b, 0);
        const catCount = Array.from(dist.keys()).filter(k => k !== '__needs_review__').length;
        return `| ${code} | ${total} | ${catCount} | ${legacyRedirects[code.toLowerCase()]} |`;
      }),
    ''
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'category-migration-report.md'), report);

  console.log('\nWrote:');
  console.log(' -', path.relative(ROOT, PRODUCTS_PATH), '(enriched with catalogue_category_* fields)');
  console.log(' -', path.relative(ROOT, path.join(OUT_DIR, 'catalogue-categories.json')));
  console.log(' -', path.relative(ROOT, path.join(OUT_DIR, 'legacy-category-redirects.json')));
  console.log(' -', path.relative(ROOT, path.join(REPORTS_DIR, 'category-migration-report.md')));
}

main();
