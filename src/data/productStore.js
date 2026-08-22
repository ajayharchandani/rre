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

  const bySlug = new Map();
  const byPartNumberNormalized = new Map();
  const byCatalogueCategorySlug = new Map();

  for (const category of catalogueCategories) {
    byCatalogueCategorySlug.set(category.slug, []);
  }

  for (const product of products) {
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
    return matches[0] || null;
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
