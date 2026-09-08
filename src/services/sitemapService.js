// src/services/sitemapService.js
const { brands, machines, machineModels, countries, resources } = require('../data/catalog');
const ProductStore = require('../data/productStore');
const SeoService = require('./seoService');

const PRODUCTS_CHUNK_SIZE = 10000;

class SitemapService {
  static getBaseUrl() {
    return SeoService.getBaseUrl();
  }

  static getToday() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Master Sitemap Index: /sitemap.xml
   */
  static getMasterSitemapIndex() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const productChunkCount = ProductStore.getProductChunkCount(PRODUCTS_CHUNK_SIZE);
    const productSitemaps = Array.from({ length: productChunkCount }, (_, i) => `${baseUrl}/sitemaps/products-${i + 1}.xml`);

    const sitemaps = [
      `${baseUrl}/sitemaps/main.xml`,
      ...productSitemaps,
      `${baseUrl}/sitemaps/categories.xml`,
      `${baseUrl}/sitemaps/brands.xml`,
      `${baseUrl}/sitemaps/machines.xml`,
      `${baseUrl}/sitemaps/models.xml`,
      `${baseUrl}/sitemaps/countries.xml`,
      `${baseUrl}/sitemaps/resources.xml`
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    sitemaps.forEach(loc => {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    });
    xml += `</sitemapindex>`;

    return xml;
  }

  /**
   * Helper to format a urlset XML
   */
  static formatUrlSet(items = []) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    items.forEach(item => {
      xml += `  <url>\n`;
      xml += `    <loc>${item.loc}</loc>\n`;
      xml += `    <lastmod>${item.lastmod || this.getToday()}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq || 'weekly'}</changefreq>\n`;
      xml += `    <priority>${item.priority || '0.7'}</priority>\n`;
      xml += `  </url>\n`;
    });
    xml += `</urlset>`;
    return xml;
  }

  /**
   * Main Static Pages: /sitemaps/main.xml
   */
  static getMainSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/products`, priority: '0.9', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/brands`, priority: '0.8', changefreq: 'weekly', lastmod: today },
      { loc: `${baseUrl}/machines`, priority: '0.8', changefreq: 'weekly', lastmod: today },
      { loc: `${baseUrl}/rfq`, priority: '0.9', changefreq: 'weekly', lastmod: today },
      { loc: `${baseUrl}/export`, priority: '0.8', changefreq: 'weekly', lastmod: today },
      { loc: `${baseUrl}/resources`, priority: '0.8', changefreq: 'weekly', lastmod: today },
      { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly', lastmod: today },
      { loc: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly', lastmod: today },
      { loc: `${baseUrl}/export-process`, priority: '0.7', changefreq: 'monthly', lastmod: today }
    ];

    return this.formatUrlSet(urls);
  }

  /**
   * Chunked Products Sitemap: /sitemaps/products-{n}.xml (1-indexed)
   * Chunked because 85,150+ product URLs exceed the practical/spec-limit
   * size for a single sitemap file.
   */
  static getProductsSitemapChunk(chunkNumber1Indexed) {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const chunk = ProductStore.getProductsChunk(chunkNumber1Indexed - 1, PRODUCTS_CHUNK_SIZE);
    const urls = chunk
      .filter(p => p.is_indexable !== false && p.indexable !== false)
      .map(product => ({
        loc: `${baseUrl}${product.canonical_url}`,
        priority: product.image_status && product.image_status !== 'placeholder_image' ? '0.7' : '0.5',
        changefreq: 'monthly',
        lastmod: today
      }));

    return this.formatUrlSet(urls);
  }

  /**
   * Categories Sitemap: /sitemaps/categories.xml — customer-facing catalogue categories at /parts/{slug}
   */
  static getCategoriesSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = ProductStore.getAllCategories().map(cat => ({
      loc: `${baseUrl}/parts/${cat.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: today
    }));

    return this.formatUrlSet(urls);
  }

  /**
   * Brands Sitemap: /sitemaps/brands.xml
   */
  static getBrandsSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = brands.map(brand => ({
      loc: `${baseUrl}/brands/${brand.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: today
    }));

    return this.formatUrlSet(urls);
  }

  /**
   * Machines Sitemap: /sitemaps/machines.xml
   */
  static getMachinesSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = machines.map(m => ({
      loc: `${baseUrl}/machines/${m.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: today
    }));

    return this.formatUrlSet(urls);
  }

  /**
   * Machine Models Sitemap: /sitemaps/models.xml
   */
  static getModelsSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = machineModels.map(m => ({
      loc: `${baseUrl}/machines/${m.brandSlug}/${m.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: today
    }));

    return this.formatUrlSet(urls);
  }

  /**
   * Countries Export Landing Pages: /sitemaps/countries.xml
   */
  static getCountriesSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = countries.map(c => ({
      loc: `${baseUrl}/export/${c.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: today
    }));

    return this.formatUrlSet(urls);
  }

  /**
   * Resource Articles Sitemap: /sitemaps/resources.xml
   */
  static getResourcesSitemap() {
    const baseUrl = this.getBaseUrl();
    const today = this.getToday();

    const urls = resources.map(r => ({
      loc: `${baseUrl}/resources/${r.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: r.publishedDate || today
    }));

    return this.formatUrlSet(urls);
  }
}

module.exports = SitemapService;
