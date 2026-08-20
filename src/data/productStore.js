// src/data/productStore.js
//
// Runtime access layer over the generated product dataset
// (src/data/generated/products.json + categories.json, produced by
// scripts/build-catalog.js from the master Excel). Loaded once at process
// start into indexed in-memory structures — no database, no per-request
// file I/O, no full-catalogue payload ever sent to a client.

const fs = require('fs');
const path = require('path');
const PartNumberNormalizer = require('../services/partNumberNormalizer');

const GENERATED_DIR = path.join(__dirname, 'generated');
const PRODUCTS_PATH = path.join(GENERATED_DIR, 'products.json');
const CATEGORIES_PATH = path.join(GENERATED_DIR, 'categories.json');

function load() {
  if (!fs.existsSync(PRODUCTS_PATH) || !fs.existsSync(CATEGORIES_PATH)) {
    throw new Error(
      `Generated catalog data not found in ${GENERATED_DIR}. ` +
      `Run "node scripts/build-catalog.js" first.`
    );
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));

  const bySlug = new Map();
  const byPartNumberNormalized = new Map();
  const byCategoryCode = new Map();

  for (const category of categories) {
    byCategoryCode.set(category.code, []);
  }

  for (const product of products) {
    bySlug.set(product.slug, product);

    // A handful of part numbers repeat across distinct rows (different
    // category/description) — keep every product reachable by part number,
    // not just the first one.
    const key = product.part_number_normalized;
    if (!byPartNumberNormalized.has(key)) byPartNumberNormalized.set(key, []);
    byPartNumberNormalized.get(key).push(product);

    if (!byCategoryCode.has(product.category_code)) byCategoryCode.set(product.category_code, []);
    byCategoryCode.get(product.category_code).push(product);
  }

  return { products, categories, bySlug, byPartNumberNormalized, byCategoryCode };
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

  getAllCategories() {
    return state.categories;
  },

  getCategoryByCode(code) {
    return state.categories.find(c => c.code === code) || null;
  },

  getCategoryBySlug(slug) {
    return state.categories.find(c => c.slug === slug) || null;
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
  getProductsByCategory(categoryCode, { page = 1, pageSize = 48 } = {}) {
    const all = state.byCategoryCode.get(categoryCode) || [];
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
    const siblings = state.byCategoryCode.get(product.category_code) || [];
    return siblings.filter(p => p.product_id !== product.product_id).slice(0, limit);
  },

  getCounts() {
    return {
      totalProducts: state.products.length,
      totalCategories: state.categories.length
    };
  }
};

module.exports = ProductStore;
