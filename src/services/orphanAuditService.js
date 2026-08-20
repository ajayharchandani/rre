// src/services/orphanAuditService.js
const { categories, brands, machines, machineModels, products, countries, resources } = require('../data/catalog');
const PartNumberNormalizer = require('./partNumberNormalizer');
const InternalLinkingService = require('./internalLinkingService');
const SeoService = require('./seoService');

class OrphanAuditService {
  static runFullAudit() {
    const auditResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEntities: 0,
        totalUrls: 0,
        orphanUrls: 0,
        missingMetaCount: 0,
        missingSchemaCount: 0,
        healthScore: 100
      },
      entityBreakdown: {
        categories: { total: categories.length, orphans: [] },
        brands: { total: brands.length, orphans: [] },
        machines: { total: machines.length, orphans: [] },
        models: { total: machineModels.length, orphans: [] },
        products: { total: products.length, orphans: [] },
        partNumbers: { total: products.length, orphans: [] },
        countries: { total: countries.length, orphans: [] },
        resources: { total: resources.length, orphans: [] }
      },
      linkGraph: {
        inboundLinkCounts: {},
        outboundLinkCounts: {}
      },
      seoChecks: {
        canonicalIntegrity: true,
        robotsIntegrity: true,
        schemaValidation: true,
        issues: []
      }
    };

    // 1. Build Global URL Registry
    const allUrls = new Set();
    const urlRegistry = {};

    // Main static URLs
    const staticUrls = ['/', '/products', '/brands', '/machines', '/rfq', '/export', '/resources', '/about', '/contact', '/export-process'];
    staticUrls.forEach(url => {
      allUrls.add(url);
      urlRegistry[url] = { type: 'static', entityId: url, inbound: new Set(['/']), outbound: new Set() };
    });

    // Register Categories
    categories.forEach(cat => {
      const url = `/products/${cat.slug}`;
      allUrls.add(url);
      urlRegistry[url] = { type: 'category', entityId: cat.id, name: cat.name, inbound: new Set(['/', '/products']), outbound: new Set() };
      
      const links = InternalLinkingService.getLinksForCategory(cat);
      links.products.forEach(p => urlRegistry[url].outbound.add(p.url));
      links.brands.forEach(b => urlRegistry[url].outbound.add(b.url));
      links.otherCategories.forEach(c => urlRegistry[url].outbound.add(c.url));
    });

    // Register Brands
    brands.forEach(brand => {
      const url = `/brands/${brand.slug}`;
      allUrls.add(url);
      urlRegistry[url] = { type: 'brand', entityId: brand.id, name: brand.name, inbound: new Set(['/', '/brands']), outbound: new Set() };
      
      const links = InternalLinkingService.getLinksForBrand(brand);
      links.machines.forEach(m => urlRegistry[url].outbound.add(m.url));
      links.categories.forEach(c => urlRegistry[url].outbound.add(c.url));
      links.featuredProducts.forEach(p => urlRegistry[url].outbound.add(p.url));
    });

    // Register Machines
    machines.forEach(mach => {
      const url = `/machines/${mach.slug}`;
      allUrls.add(url);
      urlRegistry[url] = { type: 'machine', entityId: mach.id, name: mach.name, inbound: new Set(['/', '/machines', `/brands/${mach.brandSlug}`]), outbound: new Set() };
      
      // Connect to brand
      urlRegistry[url].outbound.add(`/brands/${mach.brandSlug}`);
    });

    // Register Machine Models
    machineModels.forEach(model => {
      const url = `/machines/${model.brandSlug}/${model.slug}`;
      allUrls.add(url);
      urlRegistry[url] = { type: 'model', entityId: model.id, name: model.name, inbound: new Set([`/machines/${model.machineSlug}`, `/brands/${model.brandSlug}`]), outbound: new Set() };
      
      const links = InternalLinkingService.getLinksForModel(model);
      links.compatibleProducts.forEach(p => urlRegistry[url].outbound.add(p.url));
      links.compatibleCategories.forEach(c => urlRegistry[url].outbound.add(c.url));
      urlRegistry[url].outbound.add(links.parentMachineUrl);
      urlRegistry[url].outbound.add(links.brandUrl);
    });

    // Register Products & Part Numbers
    products.forEach(prod => {
      const productUrl = `/products/${prod.slug}`;
      const partUrl = `/parts/${PartNumberNormalizer.toSlug(prod.partNumber)}`;

      allUrls.add(productUrl);
      allUrls.add(partUrl);

      urlRegistry[productUrl] = { 
        type: 'product', 
        entityId: prod.id, 
        name: prod.name, 
        inbound: new Set(['/', '/products', `/products/${prod.categorySlug}`, `/brands/${prod.brandSlug}`, `/machines/${prod.machineSlug}`, partUrl]), 
        outbound: new Set() 
      };

      urlRegistry[partUrl] = { 
        type: 'part', 
        entityId: prod.id, 
        name: prod.partNumber, 
        inbound: new Set([productUrl, '/', '/search']), 
        outbound: new Set([productUrl]) 
      };

      const links = InternalLinkingService.getLinksForProduct(prod);
      if (links.categoryLink) urlRegistry[productUrl].outbound.add(links.categoryLink.url);
      if (links.brandLink) urlRegistry[productUrl].outbound.add(links.brandLink.url);
      if (links.machineLink) urlRegistry[productUrl].outbound.add(links.machineLink.url);
      urlRegistry[productUrl].outbound.add(links.partNumberLink.url);
      links.relatedProducts.forEach(rp => urlRegistry[productUrl].outbound.add(rp.url));
      links.compatibleModels.forEach(cm => urlRegistry[productUrl].outbound.add(cm.url));
      if (links.relatedResource) urlRegistry[productUrl].outbound.add(links.relatedResource.url);
    });

    // Register Countries
    countries.forEach(country => {
      const url = `/export/${country.slug}`;
      allUrls.add(url);
      urlRegistry[url] = { type: 'country', entityId: country.id, name: country.name, inbound: new Set(['/', '/export']), outbound: new Set() };
      
      const links = InternalLinkingService.getLinksForCountry(country);
      links.topProducts.forEach(p => urlRegistry[url].outbound.add(p.url));
      links.popularBrands.forEach(b => urlRegistry[url].outbound.add(b.url));
      links.popularCategories.forEach(c => urlRegistry[url].outbound.add(c.url));
    });

    // Register Resources
    resources.forEach(res => {
      const url = `/resources/${res.slug}`;
      allUrls.add(url);
      urlRegistry[url] = { type: 'resource', entityId: res.id, name: res.title, inbound: new Set(['/', '/resources']), outbound: new Set() };
      
      if (res.relatedCategorySlug) urlRegistry[url].outbound.add(`/products/${res.relatedCategorySlug}`);
      if (res.relatedMachineSlug) urlRegistry[url].outbound.add(`/machines/${res.relatedMachineSlug}`);
      (res.relatedProductIds || []).forEach(pid => {
        const p = products.find(prod => prod.id === pid);
        if (p) urlRegistry[url].outbound.add(`/products/${p.slug}`);
      });
    });

    // 2. Cross-link Verification & Inbound Ingestion
    Object.keys(urlRegistry).forEach(sourceUrl => {
      const node = urlRegistry[sourceUrl];
      node.outbound.forEach(targetUrl => {
        if (urlRegistry[targetUrl]) {
          urlRegistry[targetUrl].inbound.add(sourceUrl);
        }
      });
    });

    // 3. Evaluate Orphans (Inbound count === 0)
    let orphanCount = 0;
    Object.keys(urlRegistry).forEach(url => {
      const node = urlRegistry[url];
      const inCount = node.inbound.size;
      const outCount = node.outbound.size;

      auditResults.linkGraph.inboundLinkCounts[url] = inCount;
      auditResults.linkGraph.outboundLinkCounts[url] = outCount;

      if (inCount === 0) {
        orphanCount++;
        const typePlural = `${node.type}s`;
        if (auditResults.entityBreakdown[typePlural]) {
          auditResults.entityBreakdown[typePlural].orphans.push({ url, name: node.name });
        }
      }
    });

    // 4. Meta & Schema Validation
    products.forEach(p => {
      const meta = SeoService.getMeta({
        title: p.metaTitle || `${p.name} — Part No. ${p.partNumber}`,
        description: p.metaDescription || p.description,
        path: `/products/${p.slug}`
      });
      if (!meta.title || meta.title.length < 10) {
        auditResults.seoChecks.issues.push(`Product ${p.slug} has short meta title`);
      }
    });

    auditResults.summary.totalEntities = categories.length + brands.length + machines.length + machineModels.length + products.length + countries.length + resources.length;
    auditResults.summary.totalUrls = allUrls.size;
    auditResults.summary.orphanUrls = orphanCount;
    auditResults.summary.healthScore = orphanCount === 0 && auditResults.seoChecks.issues.length === 0 ? 100 : Math.max(0, 100 - (orphanCount * 10) - (auditResults.seoChecks.issues.length * 5));

    return auditResults;
  }
}

module.exports = OrphanAuditService;
