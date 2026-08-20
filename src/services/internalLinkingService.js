// src/services/internalLinkingService.js
const { categories, brands, machines, machineModels, products, countries, resources } = require('../data/catalog');
const PartNumberNormalizer = require('./partNumberNormalizer');

class InternalLinkingService {
  /**
   * Get related links for a Product page
   */
  static getLinksForProduct(product) {
    const category = categories.find(c => c.slug === product.categorySlug);
    const brand = brands.find(b => b.slug === product.brandSlug);
    const machine = machines.find(m => m.slug === product.machineSlug);
    
    // Related products in the same category
    const relatedProducts = products
      .filter(p => p.id !== product.id && p.categorySlug === product.categorySlug)
      .slice(0, 4);

    // Related models
    const compatibleModelObjects = (product.compatibleModels || []).map(modelSlug => {
      return machineModels.find(m => m.id === modelSlug || m.slug === modelSlug);
    }).filter(Boolean);

    // Contextual resource guide
    const relatedResource = resources.find(r => 
      r.relatedCategorySlug === product.categorySlug ||
      (r.relatedProductIds || []).includes(product.id)
    );

    // Top export countries
    const topExportCountries = countries.slice(0, 4);

    return {
      categoryLink: category ? { name: category.name, url: `/products/${category.slug}` } : null,
      brandLink: brand ? { name: brand.name, url: `/brands/${brand.slug}` } : null,
      machineLink: machine ? { name: machine.name, url: `/machines/${machine.slug}` } : null,
      partNumberLink: { name: product.partNumber, url: `/parts/${PartNumberNormalizer.toSlug(product.partNumber)}` },
      relatedProducts: relatedProducts.map(p => ({
        name: p.name,
        partNumber: p.partNumber,
        url: `/products/${p.slug}`,
        categoryName: p.categoryName
      })),
      compatibleModels: compatibleModelObjects.map(m => ({
        name: m.name,
        url: `/machines/${m.brandSlug}/${m.slug}`
      })),
      relatedResource: relatedResource ? {
        title: relatedResource.title,
        url: `/resources/${relatedResource.slug}`
      } : null,
      exportCountries: topExportCountries.map(c => ({
        name: c.name,
        url: `/export/${c.slug}`
      }))
    };
  }

  /**
   * Get related links for a Category page
   */
  static getLinksForCategory(category) {
    const categoryProducts = products.filter(p => p.categorySlug === category.slug);
    const relatedBrands = brands.filter(b => 
      categoryProducts.some(p => p.brandSlug === b.slug)
    );
    const otherCategories = categories.filter(c => c.id !== category.id).slice(0, 6);

    return {
      products: categoryProducts.map(p => ({
        name: p.name,
        partNumber: p.partNumber,
        url: `/products/${p.slug}`,
        brandName: p.brandName,
        machineName: p.machineName
      })),
      brands: relatedBrands.map(b => ({
        name: b.name,
        url: `/brands/${b.slug}`
      })),
      otherCategories: otherCategories.map(c => ({
        name: c.name,
        url: `/products/${c.slug}`
      }))
    };
  }

  /**
   * Get related links for a Brand page
   */
  static getLinksForBrand(brand) {
    const brandMachines = machines.filter(m => m.brandSlug === brand.slug);
    const brandProducts = products.filter(p => p.brandSlug === brand.slug);
    const brandCategories = categories.filter(c => 
      brandProducts.some(p => p.categorySlug === c.slug)
    );

    return {
      machines: brandMachines.map(m => ({
        name: m.name,
        type: m.type,
        url: `/machines/${m.slug}`
      })),
      categories: brandCategories.map(c => ({
        name: c.name,
        url: `/products/${c.slug}`
      })),
      featuredProducts: brandProducts.slice(0, 6).map(p => ({
        name: p.name,
        partNumber: p.partNumber,
        url: `/products/${p.slug}`
      }))
    };
  }

  /**
   * Get related links for a Machine Model page
   */
  static getLinksForModel(model) {
    const compatibleProducts = products.filter(p => 
      (p.compatibleModels || []).includes(model.id) || (p.compatibleModels || []).includes(model.slug)
    );

    const relatedCategories = categories.filter(c => 
      compatibleProducts.some(p => p.categorySlug === c.slug)
    );

    return {
      compatibleProducts: compatibleProducts.map(p => ({
        name: p.name,
        partNumber: p.partNumber,
        url: `/products/${p.slug}`,
        categoryName: p.categoryName
      })),
      compatibleCategories: relatedCategories.map(c => ({
        name: c.name,
        url: `/products/${c.slug}`
      })),
      parentMachineUrl: `/machines/${model.machineSlug}`,
      brandUrl: `/brands/${model.brandSlug}`
    };
  }

  /**
   * Get related links for a Country page
   */
  static getLinksForCountry(country) {
    const topProducts = products.slice(0, 6);
    const relevantBrands = brands.filter(b => (country.popularBrands || []).includes(b.name));
    const relevantCategories = categories.filter(c => (country.popularCategories || []).includes(c.name));

    return {
      topProducts: topProducts.map(p => ({
        name: p.name,
        partNumber: p.partNumber,
        url: `/products/${p.slug}`,
        categoryName: p.categoryName
      })),
      popularBrands: relevantBrands.map(b => ({
        name: b.name,
        url: `/brands/${b.slug}`
      })),
      popularCategories: relevantCategories.map(c => ({
        name: c.name,
        url: `/products/${c.slug}`
      })),
      exportGuideUrl: `/resources/how-to-import-heavy-equipment-spare-parts-from-india`
    };
  }
}

module.exports = InternalLinkingService;
