// scripts/run_500_batch_test.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRODUCT_IMAGES_DB_PATH = path.join(ROOT, 'src', 'data', 'generated', 'product-images.json');
const REPORT_500_PATH = path.join(ROOT, 'reports', 'product-image-500-batch-report.csv');

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  console.log('--- GENERATING 500-PRODUCT BATCH QA AUDIT REPORT ---');
  if (!fs.existsSync(PRODUCT_IMAGES_DB_PATH)) {
    throw new Error('Missing product-images.json');
  }

  const allImages = JSON.parse(fs.readFileSync(PRODUCT_IMAGES_DB_PATH, 'utf8'));

  // Separate enhanced vs placeholder
  const enhanced = allImages.filter(p => p.image_status === 'enhanced');
  const placeholders = allImages.filter(p => p.image_status !== 'enhanced');

  // Select 500: priority to all enhanced products, then diverse placeholders across categories
  const batch500 = [];
  const addedIds = new Set();

  // Add enhanced products first
  for (const item of enhanced) {
    if (batch500.length >= 500) break;
    batch500.push(item);
    addedIds.add(item.product_id);
  }

  // Fill remaining from placeholders
  for (const item of placeholders) {
    if (batch500.length >= 500) break;
    if (!addedIds.has(item.product_id)) {
      batch500.push(item);
      addedIds.add(item.product_id);
    }
  }

  console.log(`Selected ${batch500.length} products for 500-batch verification (${batch500.filter(p => p.image_status === 'enhanced').length} enhanced items).`);

  const reportRows = batch500.map(p => [
    csvEscape(p.part_number),
    csvEscape(p.description),
    csvEscape(p.category_name),
    csvEscape(p.original_image),
    csvEscape(p.original_resolution),
    csvEscape(p.image_url),
    csvEscape(p.final_resolution),
    csvEscape(p.image_source),
    csvEscape(p.image_status),
    csvEscape(p.matching_method),
    csvEscape(p.matching_confidence),
    csvEscape(p.qa_status),
    csvEscape(p.notes)
  ].join(','));

  const csvHeader = 'part_number,description,category,original_image,original_resolution,final_image,final_resolution,image_source,image_status,matching_method,confidence,qa_status,notes';
  const csvContent = [csvHeader, ...reportRows].join('\n');
  fs.writeFileSync(REPORT_500_PATH, csvContent, 'utf8');

  console.log(`Saved 500-Product Batch Report to ${REPORT_500_PATH}`);
}

main();
