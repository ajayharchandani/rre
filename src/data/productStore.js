// src/data/productStore.js
//
// Runtime access layer over the generated product dataset
// (src/data/generated/products.json, produced by scripts/build-catalog.js
// from the master Excel, then enriched by scripts/build-category-mapping.js
// with customer-facing catalogue-category fields). Loaded once at process
// start into indexed in-memory structures — no database, no per-request
// file I/O, no full-catalogue payload ever sent to a client.
//
// Two distinct "category" concepts live on each product — do not conflate
// them:
//   - internal_category_code: the raw Excel "Cat 1" value (HLN, BHL, ...).
//     Data-management use only. Never used as a customer-facing URL.
//   - catalogue_category_*: the real spare-parts category (Axle & Wheel
//     Parts, Bearings, ...), assigned by build-category-mapping.js from PDF
//     evidence + description classification. This is what customers browse.

const fs = require('fs');
const path = require('path');
const PartNumberNormalizer = require('../services/partNumberNormalizer');

const GENERATED_DIR = path.join(__dirname, 'generated');
const PRODUCTS_PATH = path.join(GENERATED_DIR, 'products.json');
const CATEGORIES_PATH = path.join(GENERATED_DIR, 'categories.json');
const CATALOGUE_CATEGORIES_PATH = path.join(GENERATED_DIR, 'catalogue-categories.json');
const LEGACY_REDIRECTS_PATH = path.join(GENERATED_DIR, 'legacy-category-redirects.json');

function load() {
  if (!fs.existsSync(PRODUCTS_PATH) || !fs.existsSync(CATALOGUE_CATEGORIES_PATH)) {
    throw new Error(
      `Generated catalog data not found in ${GENERATED_DIR}. ` +
      `Run "node scripts/build-catalog.js && node scripts/build-category-mapping.js" first.`
    );
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const catalogueCategories = JSON.parse(fs.readFileSync(CATALOGUE_CATEGORIES_PATH, 'utf8'));
  const internalCategoryCodes = fs.existsSync(CATEGORIES_PATH)
    ? JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'))
    : [];
  const legacyRedirects = fs.existsSync(LEGACY_REDIRECTS_PATH)
    ? JSON.parse(fs.readFileSync(LEGACY_REDIRECTS_PATH, 'utf8'))
    : {};

  // --- Indexability policy -------------------------------------------------
  // The master price list has ~85k rows but only a subset carry enough real,
  // page-specific substance to deserve their own indexable URL. A row is
  // "strong" (index, follow) when ANY of these hold, all derived from real
  // sourced data — never fabricated:
  //   1. it has a genuine product photo (not the placeholder), or
  //   2. it is mapped to a real customer-facing catalogue category, or
  //   3. its description is a real multi-word part name (>=2 words, >=12
  //      alphanumerics), or
  //   4. its description carries an OE cross-reference number in brackets,
  //      e.g. "Track Rod Link (335/Y0144)".
  // Everything else (single-word generic fasteners with no photo and no
  // category — "BOLT", "NUT", "WASHER") is noindex, follow: still reachable,
  // still passes link equity, kept out of the index and the sitemap until it
  // gains a photo, a category, or a fuller description. Tunable as GSC data
  // comes in. No product data is mutated — this is a derived runtime flag.
  const PLACEHOLDER_IMAGE_STATES = new Set(['placeholder_image', 'placeholder', 'image_pending', null, undefined, '']);
  function computeIsIndexable(p) {
    if (p.indexable === false) return false;
    if (!PLACEHOLDER_IMAGE_STATES.has(p.image_status)) return true;
    if (p.catalogue_category_slug) return true;
    const desc = String(p.description || '').trim();
    if (/\([^)]*[0-9]{2,}[^)]*\)/.test(desc)) return true;
    const words = desc.split(/\s+/).filter(Boolean);
    const alnum = desc.replace(/[^a-z0-9]/gi, '').length;
    return words.length >= 2 && alnum >= 12;
  }

  const bySlug = new Map();
  const byPartNumberNormalized = new Map();
  const byCatalogueCategorySlug = new Map();

  for (const category of catalogueCategories) {
    byCatalogueCategorySlug.set(category.slug, []);
  }

  for (const product of products) {
    product.is_indexable = computeIsIndexable(product);
    bySlug.set(product.slug, product);

    // A handful of part numbers repeat across distinct rows (different
    // category/description) — keep every product reachable by part number,
    // not just the first one.
    const key = product.part_number_normalized;
    if (!byPartNumberNormalized.has(key)) byPartNumberNormalized.set(key, []);
    byPartNumberNormalized.get(key).push(product);

    if (product.catalogue_category_slug) {
      if (!byCatalogueCategorySlug.has(product.catalogue_category_slug)) byCatalogueCategorySlug.set(product.catalogue_category_slug, []);
      byCatalogueCategorySlug.get(product.catalogue_category_slug).push(product);
    }
  }

  // Within each category, products with a real (or studio-generated) photo
  // sort ahead of ones still on the placeholder — so a buyer browsing a
  // category sees actual parts first instead of a page of "coming soon"
  // placeholders with the occasional real photo mixed in. Stable sort
  // preserves each group's original relative order.
  for (const categoryProducts of byCatalogueCategorySlug.values()) {
    categoryProducts.sort((a, b) => {
      const aHasImage = a.image_status !== 'placeholder_image' ? 0 : 1;
      const bHasImage = b.image_status !== 'placeholder_image' ? 0 : 1;
      return aHasImage - bHasImage;
    });
  }

  return { products, catalogueCategories, internalCategoryCodes, legacyRedirects, bySlug, byPartNumberNormalized, byCatalogueCategorySlug };
}

let state = load();

const ProductStore = {
  /** Reload from disk (used after re-running the build script without restarting the process). */
  reload() {
    state = load();
  },

  getAllProducts() {
    return state.products;
  },

  /** Customer-facing catalogue categories (Axle & Wheel Parts, Bearings, ...) — the ones shown in navigation, URLs, and SEO. */
  getAllCategories() {
    return state.catalogueCategories;
  },

  getCategoryBySlug(slug) {
    return state.catalogueCategories.find(c => c.slug === slug) || null;
  },

  /** Raw internal Cat 1 codes (HLN, BHL, ...) with their product counts — data-management/admin use only, never customer-facing. */
  getInternalCategoryCodes() {
    return state.internalCategoryCodes;
  },

  /** Where an old internal-code URL (e.g. /parts/hln) should 301 to, precomputed by build-category-mapping.js. */
  getLegacyRedirectTarget(codeSlugLowercase) {
    return state.legacyRedirects[codeSlugLowercase] || null;
  },

  getProductBySlug(slug) {
    return state.bySlug.get(slug) || null;
  },

  /** Returns every product sharing this part number (usually exactly one). */
  getProductsByPartNumber(rawPartNumber) {
    const key = PartNumberNormalizer.normalize(rawPartNumber);
    return state.byPartNumberNormalized.get(key) || [];
  },

  getProductByPartNumber(rawPartNumber) {
    const matches = this.getProductsByPartNumber(rawPartNumber);
    if (matches.length <= 1) return matches[0] || null;

    // Two distinct real part numbers can collapse to the same aggressively
    // stripped normalized key (e.g. "400/31300" and "4003/1300" both become
    // "40031300" once every separator is removed) — normalize() intentionally
    // ignores separator position to match formatting variants of the SAME
    // part number, but that also merges genuinely different part numbers
    // when a separator shifts by a digit. Disambiguate with toSlug(), which
    // collapses separators to a single hyphen instead of deleting them, so
    // separator position (and therefore which real part number was meant)
    // is preserved.
    const querySlug = PartNumberNormalizer.toSlug(rawPartNumber);
    const exact = matches.find(p => PartNumberNormalizer.toSlug(p.part_number) === querySlug);
    return exact || matches[0];
  },

  /**
   * Server-side paginated category listing.
   * @returns {{ products: object[], total: number, page: number, pageSize: number, totalPages: number }}
   */
  getProductsByCategory(categorySlug, { page = 1, pageSize = 48 } = {}) {
    const all = state.byCatalogueCategorySlug.get(categorySlug) || [];
    const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      products: all.slice(start, start + pageSize),
      total: all.length,
      page: safePage,
      pageSize,
      totalPages
    };
  },

  getRelatedProducts(product, limit = 4) {
    const siblings = product.catalogue_category_slug
      ? (state.byCatalogueCategorySlug.get(product.catalogue_category_slug) || [])
      : [];
    return siblings.filter(p => p.product_id !== product.product_id).slice(0, limit);
  },

  getCounts() {
    return {
      totalProducts: state.products.length,
      totalCategories: state.catalogueCategories.length
    };
  },

  /**
   * A spread of real, photographed catalogue products for showcase blocks
   * (homepage, machine hubs). Round-robins across catalogue categories so
   * the selection isn't 20 seals in a row, and only returns products with a
   * genuine studio/source photo — never the placeholder. These are RRE's
   * actual illustrated range, NOT a machine-fitment claim.
   */
  getShowcaseProducts(limit = 12) {
    const withPhoto = [];
    for (const [, list] of state.byCatalogueCategorySlug) {
      for (const p of list) {
        if (p.image_url && p.image_status && !['placeholder_image', 'placeholder', 'image_pending'].includes(p.image_status)) {
          withPhoto.push(p);
        }
      }
    }
    // round-robin by category for variety
    const byCat = new Map();
    for (const p of withPhoto) {
      const k = p.catalogue_category_slug || 'other';
      if (!byCat.has(k)) byCat.set(k, []);
      byCat.get(k).push(p);
    }
    const queues = [...byCat.values()];
    const out = [];
    let i = 0;
    while (out.length < limit && queues.some(q => q.length)) {
      const q = queues[i % queues.length];
      if (q.length) out.push(q.shift());
      i++;
    }
    return out;
  },

  /** Chunk of products for sitemap generation (0-indexed page). */
  getProductsChunk(chunkIndex, chunkSize = 10000) {
    const start = chunkIndex * chunkSize;
    return state.products.slice(start, start + chunkSize);
  },

  getProductChunkCount(chunkSize = 10000) {
    return Math.max(1, Math.ceil(state.products.length / chunkSize));
  },

  /**
   * Lightweight search across part number (exact/normalized/prefix) and
   * description. No brand/machine dimensions — those don't exist in the
   * real product data. Exact part-number matches are always ranked first.
   */
  search(rawQuery, { category = null, limit = 60 } = {}) {
    const query = (rawQuery || '').trim();
    if (!query) return { query: '', totalResults: 0, results: [], exactMatch: null };

    const normalizedQuery = PartNumberNormalizer.normalize(query);
    const queryLower = query.toLowerCase();
    const scored = [];
    let exactMatch = null;

    for (const p of state.products) {
      if (category && p.catalogue_category_slug !== category) continue;
      let score = 0;

      if (p.part_number.toLowerCase() === queryLower) {
        score = 1000;
        if (!exactMatch) exactMatch = p;
      } else if (normalizedQuery && p.part_number_normalized === normalizedQuery) {
        score = 900;
        if (!exactMatch) exactMatch = p;
      } else if (normalizedQuery.length >= 3 && p.part_number_normalized.startsWith(normalizedQuery)) {
        score = 400;
      } else if (normalizedQuery.length >= 3 && p.part_number_normalized.includes(normalizedQuery)) {
        score = 250;
      } else if (p.description.toLowerCase().includes(queryLower)) {
        score = 150;
      } else if (p.category_name.toLowerCase().includes(queryLower)) {
        score = 80;
      }

      if (score > 0) scored.push({ product: p, score });
    }

    scored.sort((a, b) => b.score - a.score);

    return {
      query,
      totalResults: scored.length,
      results: scored.slice(0, limit).map(s => s.product),
      exactMatch
    };
  }
};

module.exports = ProductStore;
