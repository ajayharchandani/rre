// src/services/breadcrumbService.js
/**
 * RRE International — Centralized Breadcrumb Normalizer & Schema Generator
 * Enforces strict hierarchy, semantic HTML compliance, and 100% valid BreadcrumbList JSON-LD schema.
 */

class BreadcrumbService {
  /**
   * Sanitizes, validates, and normalizes a breadcrumb list.
   * Strips out empty labels, "/", null, undefined, and ensures absolute URL format.
   * 
   * @param {Array<{name: string, url: string}>} rawCrumbs
   * @returns {Array<{name: string, url: string}>}
   */
  static sanitize(rawCrumbs = []) {
    if (!Array.isArray(rawCrumbs)) return [];

    const cleaned = [];
    const seenUrls = new Set();

    for (const crumb of rawCrumbs) {
      if (!crumb || typeof crumb !== 'object') continue;

      let name = (crumb.name || '').trim();
      let url = (crumb.url || '').trim();

      // Reject empty, null, undefined, or "/" placeholder names
      if (!name || name === '/' || name.toLowerCase() === 'undefined' || name.toLowerCase() === 'null') {
        continue;
      }

      // Reject empty or invalid URLs
      if (!url || url.toLowerCase() === 'undefined' || url.toLowerCase() === 'null') {
        continue;
      }

      // Normalize URL: Strip query strings and hash anchors for canonical breadcrumb URLs
      url = url.split('?')[0].split('#')[0].trim();

      // Ensure leading slash for internal paths
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        url = `/${url}`;
      }

      // Remove trailing slash if length > 1 (e.g. "/products/" -> "/products")
      if (url.length > 1 && url.endsWith('/')) {
        url = url.slice(0, -1);
      }

      // If user passed "Home" with "/" in the array, skip it as Home is always the anchor root
      if ((name.toLowerCase() === 'home' || url === '/') && cleaned.length === 0) {
        continue;
      }

      // Deduplicate identical consecutive URLs
      if (seenUrls.has(url)) {
        continue;
      }

      seenUrls.add(url);
      cleaned.push({ name, url });
    }

    return cleaned;
  }

  /**
   * Generates BreadcrumbList JSON-LD structured data schema.
   * Guaranteed to match the visible breadcrumb hierarchy.
   * 
   * @param {Array<{name: string, url: string}>} breadcrumbs
   * @param {string} baseUrl
   * @returns {Object} Schema.org BreadcrumbList object
   */
  static getSchema(breadcrumbs = [], baseUrl = 'https://www.rreinternational.com') {
    const cleanBase = (baseUrl || 'https://www.rreinternational.com').replace(/\/+$/, '');
    const cleanCrumbs = this.sanitize(breadcrumbs);

    const itemListElement = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${cleanBase}/`
      }
    ];

    cleanCrumbs.forEach((crumb, index) => {
      const fullUrl = crumb.url.startsWith('http') 
        ? crumb.url 
        : `${cleanBase}${crumb.url.startsWith('/') ? crumb.url : `/${crumb.url}`}`;

      itemListElement.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": crumb.name,
        "item": fullUrl
      });
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": itemListElement
    };
  }

  /**
   * Convenience helpers for specific page types to ensure 100% consistent site-wide hierarchy
   */
  static forCategory(category) {
    return this.sanitize([
      { name: "Products", url: "/products" },
      { name: category.name || category.shortName, url: `/products/${category.slug}` }
    ]);
  }

  static forProduct(product) {
    return this.sanitize([
      { name: "Products", url: "/products" },
      { name: product.categoryName, url: `/products/${product.categorySlug}` },
      { name: product.name, url: `/products/${product.slug}` }
    ]);
  }

  static forPart(product) {
    const slug = (product.partNumber || '').replace(/[\/\s]/g, '-').toLowerCase();
    return this.sanitize([
      { name: "Products", url: "/products" },
      { name: product.categoryName, url: `/products/${product.categorySlug}` },
      { name: `Part ${product.partNumber}`, url: `/parts/${slug}` }
    ]);
  }

  static forBrand(brand) {
    return this.sanitize([
      { name: "Brands", url: "/brands" },
      { name: brand.name, url: `/brands/${brand.slug}` }
    ]);
  }

  static forMachine(machine) {
    return this.sanitize([
      { name: "Machines", url: "/machines" },
      { name: machine.name, url: `/machines/${machine.slug}` }
    ]);
  }

  static forModel(machine, model) {
    return this.sanitize([
      { name: "Machines", url: "/machines" },
      { name: machine ? machine.name : (model.brandSlug || '').toUpperCase(), url: `/machines/${machine ? machine.slug : model.machineSlug}` },
      { name: model.name, url: `/machines/${model.brandSlug}/${model.slug}` }
    ]);
  }

  static forCountry(country) {
    return this.sanitize([
      { name: "Export Markets", url: "/export" },
      { name: country.name, url: `/export/${country.slug}` }
    ]);
  }

  static forArticle(article) {
    return this.sanitize([
      { name: "Technical Guides", url: "/resources" },
      { name: article.title, url: `/resources/${article.slug}` }
    ]);
  }
}

module.exports = BreadcrumbService;
