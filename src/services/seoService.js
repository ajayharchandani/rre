// src/services/seoService.js
const { organization } = require('../data/catalog');
const BreadcrumbService = require('./breadcrumbService');

class SeoService {
  static getBaseUrl() {
    return process.env.APP_URL || 'https://www.rreinternational.com';
  }

  /**
   * Build absolute canonical URL ensuring consistent protocol, hostname, and trailing slash format
   */
  static buildCanonical(path = '/') {
    const base = this.getBaseUrl().replace(/\/+$/, '');
    let cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Strip query parameters and hashes from canonical URLs
    cleanPath = cleanPath.split('?')[0].split('#')[0];
    // Preserve root slash or clean trailing slash for standardized URLs
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }
    return `${base}${cleanPath}`;
  }

  /**
   * Generate complete meta object for any page type
   */
  static getMeta(options = {}) {
    const {
      title,
      description,
      path = '/',
      image = '/images/rre-og-default.jpg',
      type = 'website',
      robots = 'index, follow',
      publishedTime,
      modifiedTime,
      breadcrumbs = [],
      schema = []
    } = options;

    const baseUrl = this.getBaseUrl();
    const canonical = this.buildCanonical(path);
    const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;

    const defaultTitle = `${organization.name} — Heavy Equipment & Earthmoving Spare Parts Manufacturer & Exporter India`;
    const finalTitle = title 
      ? (title.includes(organization.name) ? title : `${title} | ${organization.name}`)
      : defaultTitle;

    const defaultDesc = `ISO 9001:2015 certified Indian manufacturer & exporter of earthmoving machinery spare parts for JCB 3DX, CAT 424, Case 770 & Komatsu excavators. 85,000+ parts in catalog.`;
    const finalDesc = description || defaultDesc;

    // Sanitize breadcrumbs through centralized BreadcrumbService
    const cleanBreadcrumbs = BreadcrumbService.sanitize(breadcrumbs);

    // Build schemas array
    let schemas = Array.isArray(schema) ? [...schema] : (schema ? [schema] : []);

    // If breadcrumbs exist and BreadcrumbList schema is not already explicitly added, auto-generate it
    const hasBreadcrumbSchema = schemas.some(s => s && s['@type'] === 'BreadcrumbList');
    if (cleanBreadcrumbs.length > 0 && !hasBreadcrumbSchema) {
      schemas.push(BreadcrumbService.getSchema(cleanBreadcrumbs, baseUrl));
    }

    return {
      title: finalTitle,
      description: finalDesc,
      canonical,
      robots,
      openGraph: {
        title: finalTitle,
        description: finalDesc,
        url: canonical,
        siteName: organization.name,
        image: fullImageUrl,
        type: type
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description: finalDesc,
        image: fullImageUrl
      },
      publishedTime,
      modifiedTime,
      breadcrumbs: cleanBreadcrumbs,
      schemas
    };
  }

  /**
   * Schema 1: Organization Schema
   */
  static getOrganizationSchema() {
    const baseUrl = this.getBaseUrl();
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": organization.name,
      "legalName": organization.legalName,
      "url": baseUrl,
      "logo": `${baseUrl}/images/rre-logo.png`,
      "foundingDate": String(organization.established),
      "founder": {
        "@type": "Person",
        "name": organization.founder
      },
      "description": `${organization.tagline}. ${organization.certification.title} (${organization.certification.certificateNumber}) specializing in high-precision aftermarket replacement parts for JCB, Caterpillar, Case, and Komatsu earthmoving equipment.`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": organization.address.street,
        "addressLocality": organization.address.city,
        "addressRegion": organization.address.state,
        "postalCode": organization.address.postalCode,
        "addressCountry": organization.address.countryCode
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": organization.contact.phoneDisplay.split('/')[0].trim(),
          "contactType": "export sales desk",
          "areaServed": ["AE", "SA", "QA", "OM", "KW", "BH", "NG", "KE", "ZA", "ID", "BD", "Worldwide"],
          "availableLanguage": ["en", "hi"]
        }
      ],
      "hasCredential": {
        "@type": "EducationalOccupationalCredential",
        "name": organization.certification.title,
        "credentialCategory": "certification",
        "recognizedBy": {
          "@type": "Organization",
          "name": organization.certification.issuingBody
        }
      },
      "knowsAbout": [
        "JCB 3DX Spare Parts",
        "Hydraulic Cylinder Seal Kits",
        "Heavy Equipment Pivot Pins and Hardened Bushes",
        "Crown Wheel Pinions and Transmission Gears",
        "Earthmoving Machinery Parts Export from India"
      ]
    };
  }

  /**
   * Schema 2: WebSite Schema with SearchAction
   */
  static getWebSiteSchema() {
    const baseUrl = this.getBaseUrl();
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      "url": baseUrl,
      "name": organization.name,
      "description": organization.tagline,
      "publisher": {
        "@id": `${baseUrl}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  /**
   * Schema 3: BreadcrumbList Schema
   */
  static getBreadcrumbSchema(items = []) {
    return BreadcrumbService.getSchema(items, this.getBaseUrl());
  }

  /**
   * Schema 4: Product Schema
   * Built only from verified fields on the normalized product record
   * (src/data/generated/products.json). No brand/availability/rating
   * claims are made — those don't exist in the source data.
   */
  static getProductSchema(product) {
    const baseUrl = this.getBaseUrl();
    const productUrl = `${baseUrl}/products/${product.slug}`;
    const imageUrl = product.image_url
      ? (product.image_url.startsWith('http') ? product.image_url : `${baseUrl}${product.image_url}`)
      : null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${productUrl}#product`,
      "name": product.description,
      "description": product.meta_description || product.description,
      "sku": product.part_number,
      "mpn": product.part_number,
      "manufacturer": {
        "@id": `${baseUrl}/#organization`
      },
      "category": product.category_name
    };

    if (imageUrl) schema.image = imageUrl;

    if (product.show_price && product.mrp) {
      schema.offers = {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "INR",
        "price": String(product.mrp),
        "seller": { "@id": `${baseUrl}/#organization` }
      };
    }

    return schema;
  }

  /**
   * Schema 5: FAQPage Schema
   */
  static getFaqSchema(faqs = []) {
    if (!faqs || faqs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  /**
   * Schema 6: Article Schema
   */
  static getArticleSchema(article) {
    const baseUrl = this.getBaseUrl();
    const articleUrl = `${baseUrl}/resources/${article.slug}`;

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${articleUrl}#article`,
      "headline": article.title,
      "description": article.excerpt,
      "author": {
        "@type": "Organization",
        "name": article.author || organization.name,
        "url": baseUrl
      },
      "publisher": {
        "@id": `${baseUrl}/#organization`
      },
      "datePublished": article.publishedDate,
      "dateModified": article.publishedDate,
      "mainEntityOfPage": articleUrl,
      "image": `${baseUrl}/images/resources/${article.slug}.jpg`
    };
  }
}

module.exports = SeoService;
