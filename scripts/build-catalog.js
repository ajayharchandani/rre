// scripts/build-catalog.js
//
// Phase 1-2: Data extraction and normalization.
//
// Reads the master Excel product database and produces a normalized,
// indexable product dataset plus audit/validation reports. This is the
// ONLY place allowed to read the source .xlsx — everything downstream
// (routes, services, views) reads the generated JSON via productStore.js.
//
// Usage: node scripts/build-catalog.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const PartNumberNormalizer = require('../src/services/partNumberNormalizer');

const ROOT = path.join(__dirname, '..');
const SOURCE_XLSX = path.join(ROOT, 'JCB Price list month of June 2026.xlsx');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'generated');
const REPORTS_DIR = path.join(ROOT, 'reports');
const CATEGORY_REVIEW_CSV = path.join(REPORTS_DIR, 'category-mapping-review.csv');

const EXPECTED_HEADER = ['Part no.', 'Description', 'MRP', 'HSN', 'GST', 'Cat 1'];

function slugifyDescription(desc) {
  return String(desc || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[\/\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '');
}

function stableId(partNumber, description, categoryCode) {
  return crypto
    .createHash('sha1')
    .update(`${partNumber}||${description}||${categoryCode}`)
    .digest('hex')
    .slice(0, 16);
}

// Reads any previously reviewed category name mappings so re-runs don't
// clobber names the client has already confirmed.
function loadReviewedCategoryNames() {
  const map = new Map();
  if (!fs.existsSync(CATEGORY_REVIEW_CSV)) return map;
  const lines = fs.readFileSync(CATEGORY_REVIEW_CSV, 'utf8').split(/\r?\n/).filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const [code, , , confirmedName] = cols;
    if (code && confirmedName && confirmedName.trim()) {
      map.set(code, confirmedName.trim());
    }
  }
  return map;
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  console.log('Reading source workbook:', SOURCE_XLSX);
  if (!fs.existsSync(SOURCE_XLSX)) {
    throw new Error(`Source Excel file not found at ${SOURCE_XLSX}`);
  }

  const wb = XLSX.readFile(SOURCE_XLSX, { cellText: false, cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

  const header = rows[0].map(h => String(h).trim());
  for (let i = 0; i < EXPECTED_HEADER.length; i++) {
    if (header[i] !== EXPECTED_HEADER[i]) {
      throw new Error(
        `Unexpected header at column ${i}: found "${header[i]}", expected "${EXPECTED_HEADER[i]}". ` +
        `Source workbook structure may have changed — aborting rather than guessing.`
      );
    }
  }

  const dataRows = rows.slice(1);
  const totalExcelRows = dataRows.length;

  const reviewedCategoryNames = loadReviewedCategoryNames();

  const products = [];
  const categoryStats = new Map(); // code -> { count }
  const slugCounts = new Map();
  const excluded = [];
  const migrationRows = [];

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const excelRowNum = i + 2; // account for header row, 1-indexed
    const rawPart = r[0];
    const rawDesc = r[1];
    const rawMrp = r[2];
    const rawHsn = r[3];
    const rawGst = r[4];
    const rawCat = r[5];

    const partNumber = rawPart === null || rawPart === undefined ? '' : String(rawPart).trim();
    const description = rawDesc === null || rawDesc === undefined ? '' : String(rawDesc).trim();

    // Zero-hallucination guard: a row must have both a part number and a
    // description to be a valid, presentable product. Per the audit this
    // never actually happens in this workbook (0 empty Part No. / Description),
    // but the check stays so a future re-run can't silently publish junk.
    if (!partNumber || !description) {
      excluded.push({ excelRowNum, partNumber, description, reason: 'missing part_number or description' });
      continue;
    }

    const mrpNum = Number(rawMrp);
    const mrp = Number.isFinite(mrpNum) ? mrpNum : null;

    let categoryCodeRaw = rawCat === null || rawCat === undefined ? '' : String(rawCat).trim();
    if (categoryCodeRaw === '0') categoryCodeRaw = '';
    const categoryCode = categoryCodeRaw || 'UNCATEGORIZED';

    const partNumberNormalized = PartNumberNormalizer.normalize(partNumber);
    const partSlug = PartNumberNormalizer.toSlug(partNumber);
    const descSlug = slugifyDescription(description);

    let slug = descSlug ? `${partSlug}-${descSlug}` : partSlug;
    const existingCount = slugCounts.get(slug) || 0;
    if (existingCount > 0) {
      slugCounts.set(slug, existingCount + 1);
      slug = `${slug}-${existingCount + 1}`;
    } else {
      slugCounts.set(slug, 1);
    }

    const categoryName = reviewedCategoryNames.get(categoryCode) || categoryCode;

    const productId = stableId(partNumber, description, categoryCode);

    const seoTitle = `JCB ${description} | Part No. ${partNumber} | RRE International`.slice(0, 160);
    const metaDescription = `${description}, Part No. ${partNumber}. View product details and enquiry options from RRE International.`.slice(0, 300);
    const canonicalUrl = `/products/${slug}`;

    const product = {
      product_id: productId,
      part_number: partNumber,
      part_number_normalized: partNumberNormalized,
      description,
      mrp,
      show_price: false,
      hsn: rawHsn === null || rawHsn === undefined ? '' : String(rawHsn).trim(),
      gst: rawGst === null || rawGst === undefined ? null : Number(rawGst),
      category_code: categoryCode,
      category_name: categoryName,
      slug,
      image_status: 'image_pending',
      image_url: null,
      image_source: null,
      source: 'xlsx:JCB Price list month of June 2026.xlsx',
      source_row: excelRowNum,
      seo_title: seoTitle,
      meta_description: metaDescription,
      canonical_url: canonicalUrl,
      indexable: true,
      created_at: null,
      updated_at: null
    };

    products.push(product);

    const catStat = categoryStats.get(categoryCode) || { code: categoryCode, name: categoryName, count: 0 };
    catStat.count++;
    categoryStats.set(categoryCode, catStat);

    migrationRows.push([
      partNumber, description, mrp, product.hsn, product.gst, categoryCode, slug,
      product.image_status, product.indexable, canonicalUrl, 'migrated', ''
    ]);
  }

  // Timestamp all products with a single build time (deterministic per-run, not per-row)
  const now = new Date().toISOString();
  for (const p of products) { p.created_at = now; p.updated_at = now; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, 'products.json'), JSON.stringify(products));

  const categories = Array.from(categoryStats.values())
    .sort((a, b) => b.count - a.count)
    .map(c => ({
      code: c.code,
      name: c.name,
      slug: c.code.toLowerCase(),
      count: c.count,
      verified: reviewedCategoryNames.has(c.code)
    }));
  fs.writeFileSync(path.join(OUT_DIR, 'categories.json'), JSON.stringify(categories, null, 2));

  // Category mapping review CSV (only regenerate rows that aren't already
  // confirmed, so client edits to previous runs are preserved)
  const catCsvLines = ['category_code,product_count,current_display_name,confirmed_name'];
  for (const c of categories) {
    catCsvLines.push([c.code, c.count, c.name, reviewedCategoryNames.get(c.code) || ''].map(csvEscape).join(','));
  }
  fs.writeFileSync(CATEGORY_REVIEW_CSV, catCsvLines.join('\n') + '\n');

  // Product migration report (spec section 32)
  const migCsvLines = ['part_number,description,mrp,hsn,gst,category,slug,image_status,indexable,canonical_url,migration_status,notes'];
  for (const row of migrationRows) {
    migCsvLines.push(row.map(csvEscape).join(','));
  }
  fs.writeFileSync(path.join(REPORTS_DIR, 'product-migration-report.csv'), migCsvLines.join('\n') + '\n');

  // Excluded rows report (should be empty)
  if (excluded.length > 0) {
    const exCsvLines = ['excel_row,part_number,description,reason'];
    for (const e of excluded) {
      exCsvLines.push([e.excelRowNum, e.partNumber, e.description, e.reason].map(csvEscape).join(','));
    }
    fs.writeFileSync(path.join(REPORTS_DIR, 'excluded-rows-report.csv'), exCsvLines.join('\n') + '\n');
  }

  // Validation report
  const duplicateSlugs = Array.from(slugCounts.entries()).filter(([, n]) => n > 1);
  const validation = [
    `# RRE International — Product Migration Validation Report`,
    ``,
    `Generated: ${now}`,
    `Source: ${path.basename(SOURCE_XLSX)}`,
    ``,
    `| Metric | Count |`,
    `|---|---|`,
    `| Excel data rows | ${totalExcelRows} |`,
    `| Products published | ${products.length} |`,
    `| Products excluded | ${excluded.length} |`,
    `| Distinct categories | ${categories.length} |`,
    `| Products with confirmed category names | ${categories.filter(c => c.verified).length} of ${categories.length} |`,
    `| Slugs that required disambiguation suffix | ${duplicateSlugs.length} |`,
    ``,
    excluded.length === 0
      ? `**All ${totalExcelRows} Excel rows were published. Zero exclusions.**`
      : `**${excluded.length} row(s) excluded — see excluded-rows-report.csv for exact reasons.**`,
    ``,
    `## Notes`,
    `- \`show_price\` is set to \`false\` on every product per client decision: MRP is stored exactly as sourced but not shown publicly until an export pricing methodology is confirmed.`,
    `- \`image_status\` is set to \`image_pending\` for all products pending Phase 3 (PDF image matching) and Phase 4 (placeholder assignment).`,
    `- \`category_name\` defaults to the raw \`category_code\` until confirmed via reports/category-mapping-review.csv.`,
    ``
  ].join('\n');
  fs.writeFileSync(path.join(REPORTS_DIR, 'validation-report.md'), validation);

  console.log('\n=== BUILD COMPLETE ===');
  console.log('Excel data rows:      ', totalExcelRows);
  console.log('Products published:   ', products.length);
  console.log('Products excluded:    ', excluded.length);
  console.log('Distinct categories:  ', categories.length);
  console.log('Slug disambiguations: ', duplicateSlugs.length, duplicateSlugs);
  console.log('\nWrote:');
  console.log(' -', path.relative(ROOT, path.join(OUT_DIR, 'products.json')));
  console.log(' -', path.relative(ROOT, path.join(OUT_DIR, 'categories.json')));
  console.log(' -', path.relative(ROOT, CATEGORY_REVIEW_CSV));
  console.log(' -', path.relative(ROOT, path.join(REPORTS_DIR, 'product-migration-report.csv')));
  console.log(' -', path.relative(ROOT, path.join(REPORTS_DIR, 'validation-report.md')));
}

main();
