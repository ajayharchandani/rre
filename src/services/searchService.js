// src/services/searchService.js
const { products, categories, brands, machines, machineModels, resources } = require('../data/catalog');
const PartNumberNormalizer = require('./partNumberNormalizer');

class SearchService {
  /**
   * Multi-tiered search algorithm:
   * 1. Exact Part Number match (Highest relevance)
   * 2. Normalized Part Number match
   * 3. Alternative/OE cross-reference part number match
   * 4. Product Name & SKU match
   * 5. Machine Model name/slug match
   * 6. Category match
   * 7. Keyword / Natural language search across description and specifications
   */
  static search(rawQuery, filters = {}) {
    const query = (rawQuery || '').trim();
    if (!query) {
      return {
        query: '',
        totalResults: 0,
        results: [],
        exactPartMatch: null,
        suggestions: [],
        didYouMean: null
      };
    }

    const normalizedQuery = PartNumberNormalizer.normalize(query);
    const queryLower = query.toLowerCase();
    const scoredProducts = [];

    let exactPartMatch = null;

    products.forEach(product => {
      let score = 0;
      let matchType = null;
      let matchedPartNumber = null;

      // 1. Exact primary part number match
      if (product.partNumber.toLowerCase() === queryLower) {
        score += 1000;
        matchType = 'exact_part_number';
        matchedPartNumber = product.partNumber;
        exactPartMatch = product;
      }
      // 2. Normalized part number match (e.g. "335y1459" matches "335/Y1459")
      else if (product.normalizedPartNumber === normalizedQuery) {
        score += 900;
        matchType = 'normalized_part_number';
        matchedPartNumber = product.partNumber;
        if (!exactPartMatch) exactPartMatch = product;
      }
      // 3. Alternative / OE Cross Reference numbers
      else {
        const altMatch = (product.alternativePartNumbers || []).find(alt => {
          const normAlt = PartNumberNormalizer.normalize(alt.partNumber);
          return normAlt === normalizedQuery || alt.partNumber.toLowerCase() === queryLower;
        });

        if (altMatch) {
          score += 850;
          matchType = `alternative_part_number (${altMatch.type})`;
          matchedPartNumber = altMatch.partNumber;
        }
      }

      // 4. SKU match
      if (product.sku && product.sku.toLowerCase() === queryLower) {
        score += 800;
        matchType = matchType || 'sku_match';
      }

      // 5. Partial Part Number match (prefix/contains)
      if (normalizedQuery.length >= 3) {
        if (product.normalizedPartNumber.startsWith(normalizedQuery)) {
          score += 400;
          matchType = matchType || 'part_number_prefix';
        } else if (product.normalizedPartNumber.includes(normalizedQuery)) {
          score += 300;
          matchType = matchType || 'part_number_contains';
        }
      }

      // 6. Product Name match
      if (product.name.toLowerCase().includes(queryLower)) {
        score += 250;
        matchType = matchType || 'product_name';
      }

      // 7. Machine Model compatibility match
      const machineMatch = (product.compatibleModels || []).some(modelSlug => {
        const model = machineModels.find(m => m.id === modelSlug || m.slug === modelSlug);
        if (!model) return false;
        return model.name.toLowerCase().includes(queryLower) ||
               model.slug.includes(queryLower) ||
               model.yearRange.toLowerCase().includes(queryLower) ||
               model.engineVariant.toLowerCase().includes(queryLower);
      });

      if (machineMatch || product.machineName.toLowerCase().includes(queryLower)) {
        score += 200;
        matchType = matchType || 'machine_model_compatibility';
      }

      // 8. Category match
      if (product.categoryName.toLowerCase().includes(queryLower) || product.categorySlug.includes(queryLower)) {
        score += 150;
        matchType = matchType || 'category_match';
      }

      // 9. Description and specifications full text keyword match
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      let wordHits = 0;
      queryWords.forEach(word => {
        if (product.description.toLowerCase().includes(word)) wordHits++;
        if (JSON.stringify(product.specifications).toLowerCase().includes(word)) wordHits++;
      });

      if (wordHits > 0) {
        score += wordHits * 30;
        matchType = matchType || 'keyword_content';
      }

      // Apply category filter if provided
      if (filters.category && product.categorySlug !== filters.category) {
        score = 0;
      }
      // Apply brand filter if provided
      if (filters.brand && product.brandSlug !== filters.brand) {
        score = 0;
      }

      if (score > 0) {
        scoredProducts.push({
          product,
          score,
          matchType,
          matchedPartNumber: matchedPartNumber || product.partNumber
        });
      }
    });

    // Sort by descending score
    scoredProducts.sort((a, b) => b.score - a.score);

    // Find related categories and machines matching query for structured discovery
    const matchingCategories = categories.filter(c => 
      (c.name || '').toLowerCase().includes(queryLower) || (c.description || '').toLowerCase().includes(queryLower)
    );

    const matchingMachines = machines.filter(m => 
      (m.name || '').toLowerCase().includes(queryLower) || (m.type || '').toLowerCase().includes(queryLower) || (m.description || '').toLowerCase().includes(queryLower)
    );

    const matchingResources = resources.filter(r => 
      (r.title || '').toLowerCase().includes(queryLower) || (r.excerpt || '').toLowerCase().includes(queryLower)
    );

    return {
      query,
      normalizedQuery,
      totalResults: scoredProducts.length,
      results: scoredProducts.map(sp => ({
        ...sp.product,
        searchScore: sp.score,
        matchType: sp.matchType,
        matchedPartNumber: sp.matchedPartNumber
      })),
      exactPartMatch,
      matchingCategories,
      matchingMachines,
      matchingResources,
      filtersApplied: filters
    };
  }

  /**
   * Autocomplete suggestions for instant live search dropdown
   */
  static autocomplete(rawQuery, limit = 6) {
    const query = (rawQuery || '').trim();
    if (!query || query.length < 2) return [];

    const searchResult = this.search(query);
    const suggestions = [];

    searchResult.results.slice(0, limit).forEach(item => {
      suggestions.push({
        type: 'part',
        title: `${item.partNumber} — ${item.name}`,
        subtitle: `${item.brandName} · ${item.machineName} (${item.categoryName})`,
        url: `/parts/${PartNumberNormalizer.toSlug(item.partNumber)}`,
        partNumber: item.partNumber
      });
    });

    // Add matching categories if any
    searchResult.matchingCategories.slice(0, 2).forEach(cat => {
      suggestions.push({
        type: 'category',
        title: cat.name,
        subtitle: `Browse ${cat.name} spare parts catalog`,
        url: `/products/${cat.slug}`
      });
    });

    return suggestions;
  }
}

module.exports = SearchService;
