// scripts/validate-catalog.js
//
// Phase 13: automated validation. Cross-checks the generated product
// database against the source Excel and against itself, and checks
// that every "source_image" product's file actually exists on disk.
// Writes reports/validation-report.md (overwriting the Phase 1-2
// version with a fuller post-image-matching report) and exits with a
// non-zero code if any hard-fail check fails, so it can gate deploys.

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.join(__dirname, '..');
const SOURCE_XLSX = path.join(ROOT, 'JCB Price list month of June 2026.xlsx');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'generated', 'products.json');
const CATEGORIES_PATH = path.join(ROOT, 'src', 'data', 'generated', 'categories.json');
const CATALOGUE_CATEGORIES_PATH = path.join(ROOT, 'src', 'data', 'generated', 'catalogue-categories.json');
const PUBLIC_DIR = path.join(ROOT, 'src', 'public');
const REPORT_PATH = path.join(ROOT, 'reports', 'validation-report.md');

function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));

  const wb = XLSX.readFile(SOURCE_XLSX);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const excelRowCount = XLSX.utils.sheet_to_json(ws, { header: 1 }).length - 1;

  const failures = [];
  const warnings = [];

  // 1. Count reconciliation
  if (products.length !== excelRowCount) {
    failures.push(`Product count mismatch: Excel has ${excelRowCount} rows, database has ${products.length} products.`);
  }

  // 2. Duplicate slugs / canonical URLs
  const slugCounts = new Map();
  const canonicalCounts = new Map();
  for (const p of products) {
    slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
    canonicalCounts.set(p.canonical_url, (canonicalCounts.get(p.canonical_url) || 0) + 1);
  }
  const dupSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1);
  const dupCanonicals = [...canonicalCounts.entries()].filter(([, n]) => n > 1);
  if (dupSlugs.length > 0) failures.push(`${dupSlugs.length} duplicate slug(s): ${dupSlugs.slice(0, 5).map(([s]) => s).join(', ')}`);
  if (dupCanonicals.length > 0) failures.push(`${dupCanonicals.length} duplicate canonical URL(s).`);

  // 3. Missing required metadata
  let missingTitle = 0, missingDesc = 0, missingCanonical = 0, missingPartNumber = 0, missingDescription = 0;
  let noindexLegit = 0;
  for (const p of products) {
    if (!p.seo_title) missingTitle++;
    if (!p.meta_description) missingDesc++;
    if (!p.canonical_url) missingCanonical++;
    if (!p.part_number) missingPartNumber++;
    if (!p.description) missingDescription++;
    if (!p.indexable) noindexLegit++;
  }
  if (missingTitle) failures.push(`${missingTitle} product(s) missing seo_title.`);
  if (missingDesc) failures.push(`${missingDesc} product(s) missing meta_description.`);
  if (missingCanonical) failures.push(`${missingCanonical} product(s) missing canonical_url.`);
  if (missingPartNumber) failures.push(`${missingPartNumber} product(s) missing part_number.`);
  if (missingDescription) failures.push(`${missingDescription} product(s) missing description.`);
  if (noindexLegit) warnings.push(`${noindexLegit} product(s) currently marked non-indexable.`);

  // 4. Category referential integrity
  const categoryCodes = new Set(categories.map(c => c.code));
  let orphanCategoryRefs = 0;
  for (const p of products) {
    if (!categoryCodes.has(p.internal_category_code)) orphanCategoryRefs++;
  }
  if (orphanCategoryRefs) failures.push(`${orphanCategoryRefs} product(s) reference an internal_category_code not present in categories.json.`);
  const emptyCategories = categories.filter(c => c.count === 0);
  if (emptyCategories.length) warnings.push(`${emptyCategories.length} categor(ies) have 0 products (would be an unreachable/orphan category page): ${emptyCategories.map(c => c.code).join(', ')}`);

  // 4b. Customer-facing catalogue-category referential integrity (Cat 1 -> real category migration)
  let catalogueCategories = [];
  let categorizedCount = 0, needsReviewCount = 0, orphanCatalogueCategoryRefs = 0, badCategoryStatus = 0;
  if (!fs.existsSync(CATALOGUE_CATEGORIES_PATH)) {
    failures.push('catalogue-categories.json not found — run "node scripts/build-category-mapping.js".');
  } else {
    catalogueCategories = JSON.parse(fs.readFileSync(CATALOGUE_CATEGORIES_PATH, 'utf8'));
    const catalogueIds = new Set(catalogueCategories.map(c => c.id));
    const liveCounts = new Map(catalogueCategories.map(c => [c.id, 0]));

    for (const p of products) {
      if (p.category_status === 'categorized') {
        categorizedCount++;
        if (!p.catalogue_category_id || !catalogueIds.has(p.catalogue_category_id)) {
          orphanCatalogueCategoryRefs++;
        } else {
          liveCounts.set(p.catalogue_category_id, liveCounts.get(p.catalogue_category_id) + 1);
        }
      } else if (p.category_status === 'needs_review') {
        needsReviewCount++;
      } else {
        badCategoryStatus++;
      }
    }

    if (orphanCatalogueCategoryRefs) failures.push(`${orphanCatalogueCategoryRefs} product(s) marked categorized but reference a catalogue_category_id not present in catalogue-categories.json.`);
    if (badCategoryStatus) failures.push(`${badCategoryStatus} product(s) have an invalid/missing category_status (expected 'categorized' or 'needs_review').`);
    if (categorizedCount + needsReviewCount !== products.length) failures.push(`Category status counts (${categorizedCount} categorized + ${needsReviewCount} needs_review = ${categorizedCount + needsReviewCount}) do not add up to total products (${products.length}).`);

    const staleCounts = catalogueCategories.filter(c => c.count !== liveCounts.get(c.id));
    if (staleCounts.length) failures.push(`${staleCounts.length} categor(ies) in catalogue-categories.json have a stale count vs. actual product data: ${staleCounts.map(c => c.name).join(', ')}. Re-run build-category-mapping.js.`);
  }

  // 5. Image status + broken file check
  const statusCounts = { source_image: 0, placeholder_image: 0, image_pending: 0, generated_image: 0 };
  let brokenImageFiles = 0;
  const brokenSamples = [];
  for (const p of products) {
    statusCounts[p.image_status] = (statusCounts[p.image_status] || 0) + 1;
    if (p.image_status === 'source_image') {
      const filePath = path.join(PUBLIC_DIR, p.image_url.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        brokenImageFiles++;
        if (brokenSamples.length < 10) brokenSamples.push(p.image_url);
      }
    }
  }
  if (brokenImageFiles) failures.push(`${brokenImageFiles} product(s) marked source_image but the file is missing on disk. Examples: ${brokenSamples.join(', ')}`);
  const placeholderPath = path.join(PUBLIC_DIR, 'images', 'products', 'rre-image-coming-soon.png');
  if (!fs.existsSync(placeholderPath)) failures.push('Standardized placeholder graphic is missing: src/public/images/products/rre-image-coming-soon.png');

  const excluded = excelRowCount - products.length;

  const lines = [
    '# RRE International — Full Validation Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Counts',
    '',
    '| Metric | Count |',
    '|---|---|',
    `| Excel data rows | ${excelRowCount} |`,
    `| Products published | ${products.length} |`,
    `| Products excluded | ${excluded} |`,
    `| Distinct internal Cat 1 codes | ${categories.length} |`,
    `| Customer-facing catalogue categories | ${catalogueCategories.length} |`,
    `| Products categorized | ${categorizedCount} |`,
    `| Products needing review (published, uncategorized) | ${needsReviewCount} |`,
    `| Duplicate slugs | ${dupSlugs.length} |`,
    `| Duplicate canonical URLs | ${dupCanonicals.length} |`,
    '',
    '## Image status distribution',
    '',
    '| Status | Count |',
    '|---|---|',
    ...Object.entries(statusCounts).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## Result',
    '',
    failures.length === 0 ? '**PASS — no hard failures.**' : `**FAIL — ${failures.length} issue(s):**`,
    ...failures.map(f => `- ${f}`),
    '',
    warnings.length ? '## Warnings (non-blocking)' : '',
    ...warnings.map(w => `- ${w}`),
    ''
  ].filter(l => l !== undefined);

  fs.writeFileSync(REPORT_PATH, lines.join('\n'));

  console.log(lines.join('\n'));
  console.log('\nWrote:', path.relative(ROOT, REPORT_PATH));

  if (failures.length > 0) process.exit(1);
}

main();
