// src/services/partNumberNormalizer.js
/**
 * Part Number Normalization and Matching Engine
 * Supports:
 * - "335/Y1459" -> "335y1459" (database normalized index)
 * - "335/Y1459" -> "335-y1459" (clean URL slug)
 * - Exact matching, normalized matching, prefix/partial matching, alternative OE cross-referencing
 */

class PartNumberNormalizer {
  /**
   * Convert any user input or raw part number into standardized lowercase alphanumeric
   * e.g. "335/Y1459" -> "335y1459"
   * e.g. "991-00147" -> "99100147"
   * e.g. "02/100073" -> "02100073"
   */
  static normalize(partNumber) {
    if (!partNumber || typeof partNumber !== 'string') return '';
    return partNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Convert part number into a clean, search-engine-friendly URL slug
   * e.g. "335/Y1459" -> "335-y1459"
   * e.g. "991/00147" -> "991-00147"
   * e.g. "458/M1047" -> "458-m1047"
   */
  static toSlug(partNumber) {
    if (!partNumber || typeof partNumber !== 'string') return '';
    return partNumber
      .toLowerCase()
      .trim()
      .replace(/[\/\s\_]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-');
  }

  /**
   * Standardized display formatting for part numbers
   */
  static formatForDisplay(partNumber) {
    if (!partNumber || typeof partNumber !== 'string') return '';
    return partNumber.toUpperCase().trim();
  }

  /**
   * Generate common input variations for search fuzzy matching
   */
  static getVariations(query) {
    const raw = (query || '').trim();
    const normalized = this.normalize(raw);
    const slug = this.toSlug(raw);
    
    const variations = new Set([
      raw,
      normalized,
      slug,
      raw.toUpperCase(),
      raw.toLowerCase(),
      raw.replace(/[\/\-\s]/g, '')
    ]);

    // Handle slash variants if query has slash or hyphen
    if (raw.includes('-')) {
      variations.add(raw.replace(/\-/g, '/'));
    }
    if (raw.includes('/')) {
      variations.add(raw.replace(/\//g, '-'));
    }

    return Array.from(variations).filter(Boolean);
  }
}

module.exports = PartNumberNormalizer;
