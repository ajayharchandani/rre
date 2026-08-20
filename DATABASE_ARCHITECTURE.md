# DATABASE_ARCHITECTURE.md
## RRE International — MySQL Database Architecture

**Version:** 1.0
**Prepared:** 20 August 2026
**Engine:** MySQL 8.0 InnoDB
**ORM:** Laravel Eloquent

---

## 1. Design Principles

1. **Normalized first** — avoid redundant data; denormalize only with a proven performance reason
2. **Index every foreign key** — no unindexed joins
3. **Index every query predicate** — no table scans on production queries
4. **Never store pricing as-is** — domestic MRP values from the JCB price list must not be exposed publicly without the client's export pricing methodology decision
5. **Paginate everything** — never load the full 85,000+ row product catalog into memory
6. **Soft deletes** — use `deleted_at` on all business entities (products, leads, rfqs) to allow recovery
7. **Audit trail** — use `created_at`, `updated_at` on all tables

---

## 2. Entity Relationship Overview

```
CATALOG DOMAIN
──────────────
brands ──< machines ──< machine_models
   ↓              ↓              ↓
categories    products ────────────────────────────────────────────────┐
   ↓           ├── product_images                                       │
part_numbers   ├── product_documents                                    │
   │           └── alternative_part_numbers                            │
   └─────────────────────────────────────────────────────────────────── compatibilities
                                                                       (part ↔ machine_model)

GEOGRAPHY DOMAIN
────────────────
countries ──< markets
    └──< country_product_relationships ──> products

LEAD GENERATION DOMAIN
───────────────────────
leads ──< rfqs ──< rfq_items ──> products
               └── rfq_files
leads ──< lead_activities

CONTENT DOMAIN
──────────────
articles | faqs | case_studies | testimonials | seo_metadata | redirects

ADMIN DOMAIN
────────────
users ──< roles ──< permissions (via spatie/laravel-permission)
```

---

## 3. Table Schemas

### 3.1 CATALOG DOMAIN

---

#### `brands`
```sql
CREATE TABLE brands (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    description     TEXT,
    logo_path       VARCHAR(500),
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    -- SEO
    seo_title       VARCHAR(160),
    seo_description VARCHAR(320),
    canonical_url   VARCHAR(500),
    -- Timestamps
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,
    INDEX idx_slug (slug),
    INDEX idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Verified brands from PROJECT_MASTER_PLAN.md:** JCB, CAT 424, Case 770 (confirmed). Komatsu, Kobelco, Hyundai, Volvo, Tata Hitachi, Doosan, Sany (excavator fitment only — **[CLIENT INPUT REQUIRED]** before brand pages are built).

---

#### `categories`
```sql
CREATE TABLE categories (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    parent_id       BIGINT UNSIGNED NULL,               -- Self-referencing for sub-categories
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(180) NOT NULL UNIQUE,
    description     TEXT,
    image_path      VARCHAR(500),
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    -- SEO
    seo_title       VARCHAR(160),
    seo_description VARCHAR(320),
    -- Timestamps
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Verified Level-1 categories** (from RRE catalogue): Axle & Wheel Parts · Pivot Pins · Bushes & Sleeves · Gear & Transmission Parts · Casting Parts, Flanges & Water Pumps · Cabin, Electrical & Rubber/Plastic Parts · Hydraulic Seal Kits · Cylinder Assemblies · Circlips, Adaptors & Others · Engine Parts · Wear Pads/Wear Slides · Excavator Pins · Excavator Collar Bushes · Excavator Track Bush · and others from RRE catalogue **[CLIENT INPUT REQUIRED: confirm final category names]**.

---

#### `machines`
```sql
CREATE TABLE machines (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    brand_id        BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,              -- e.g. "JCB 3DX", "Case 770"
    slug            VARCHAR(180) NOT NULL UNIQUE,
    description     TEXT,
    image_path      VARCHAR(500),
    machine_type    ENUM('backhoe_loader','excavator','wheel_loader','other') DEFAULT 'backhoe_loader',
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    -- SEO
    seo_title       VARCHAR(160),
    seo_description VARCHAR(320),
    -- Timestamps
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    INDEX idx_brand (brand_id),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `machine_models`
```sql
-- Critical: same machine different year/engine takes different parts
-- Verified from RRE seal-kit data: JCB 3DX has pre-2011, 2011-2016, 2016-2020, 2016-2025 variants
CREATE TABLE machine_models (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    machine_id      BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,              -- e.g. "JCB 3DX 2011-2016 Kirloskar Engine"
    slug            VARCHAR(200) NOT NULL UNIQUE,
    year_from       SMALLINT UNSIGNED,                  -- e.g. 2011
    year_to         SMALLINT UNSIGNED,                  -- e.g. 2016 (NULL = current)
    engine_variant  VARCHAR(100),                       -- e.g. "Kirloskar", "JCB Engine", "Wipro"
    description     TEXT,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    -- Timestamps
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    INDEX idx_machine (machine_id),
    INDEX idx_slug (slug),
    INDEX idx_years (year_from, year_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `products`
```sql
CREATE TABLE products (
    id                      BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    category_id             BIGINT UNSIGNED NOT NULL,
    brand_id                BIGINT UNSIGNED,             -- Primary brand (nullable: cross-brand parts)
    name                    VARCHAR(255) NOT NULL,
    slug                    VARCHAR(300) NOT NULL UNIQUE,
    sku                     VARCHAR(100) UNIQUE,         -- RRE internal SKU e.g. "RRE/001"
    part_number             VARCHAR(150),                -- Primary OE part number e.g. "335/Y1459"
    normalized_part_number  VARCHAR(150),                -- Alphanumeric only, lowercase: "335y1459"
    description             TEXT,
    specifications          JSON,                        -- Key-value pairs: {"material":"bronze","od":"50mm"}
    availability            ENUM('in_stock','request_availability','discontinued') DEFAULT 'request_availability',
    moq                     SMALLINT UNSIGNED DEFAULT 1, -- Minimum order quantity
    hsn_code                VARCHAR(20),                 -- From JCB price list
    gst_percentage          DECIMAL(5,2),               -- From JCB price list (domestic ref only)
    -- Pricing: NEVER display domestic MRP publicly. Store for internal reference only.
    internal_mrp_inr        DECIMAL(12,2),               -- Domestic MRP — internal use ONLY
    -- Indexing / Visibility
    is_active               TINYINT(1) NOT NULL DEFAULT 1,
    is_featured             TINYINT(1) NOT NULL DEFAULT 0,
    is_indexable            TINYINT(1) NOT NULL DEFAULT 0, -- Controls search engine indexing
    indexability_reason     VARCHAR(255),               -- Why page is/isn't indexed
    -- SEO
    seo_title               VARCHAR(160),
    seo_description         VARCHAR(320),
    canonical_url           VARCHAR(500),
    structured_data         JSON,
    -- Timestamps
    sort_order              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    view_count              BIGINT UNSIGNED DEFAULT 0,
    created_at              TIMESTAMP NULL,
    updated_at              TIMESTAMP NULL,
    deleted_at              TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    INDEX idx_slug (slug),
    INDEX idx_sku (sku),
    INDEX idx_part_number (part_number),
    INDEX idx_normalized_pn (normalized_part_number),
    INDEX idx_category (category_id),
    INDEX idx_brand (brand_id),
    INDEX idx_availability (availability),
    INDEX idx_active_indexable (is_active, is_indexable),
    INDEX idx_featured (is_featured),
    FULLTEXT INDEX ft_product_search (name, description, part_number, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `part_numbers`
```sql
-- Dedicated part number table for the 85,000+ JCB SKU dataset
-- Separate from products to allow many-to-one relationships
CREATE TABLE part_numbers (
    id                      BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id              BIGINT UNSIGNED,             -- Link to product (nullable until matched)
    brand_id                BIGINT UNSIGNED NOT NULL,
    category_code           VARCHAR(20),                 -- Raw price list code: HLN, BHL, TRD, etc.
    part_number             VARCHAR(150) NOT NULL,       -- Exact as in price list: "335/Y1459"
    normalized_part_number  VARCHAR(150) NOT NULL,       -- Search-normalized: "335y1459"
    description             VARCHAR(500),
    internal_mrp_inr        DECIMAL(12,2),               -- Internal reference ONLY — never display publicly
    hsn_code                VARCHAR(20),
    gst_percentage          DECIMAL(5,2),
    is_active               TINYINT(1) NOT NULL DEFAULT 1,
    source                  VARCHAR(50) DEFAULT 'jcb_pricelist_jun2026', -- Track data source
    created_at              TIMESTAMP NULL,
    updated_at              TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    UNIQUE INDEX idx_pn_brand (part_number, brand_id),
    INDEX idx_normalized (normalized_part_number),
    INDEX idx_product (product_id),
    INDEX idx_brand (brand_id),
    INDEX idx_category_code (category_code),
    FULLTEXT INDEX ft_part_search (part_number, normalized_part_number, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `alternative_part_numbers`
```sql
CREATE TABLE alternative_part_numbers (
    id                      BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id              BIGINT UNSIGNED NOT NULL,
    part_number             VARCHAR(150) NOT NULL,
    normalized_part_number  VARCHAR(150) NOT NULL,
    type                    ENUM('oe','cross_ref','rre_internal','superseded') DEFAULT 'oe',
    notes                   VARCHAR(255),
    created_at              TIMESTAMP NULL,
    updated_at              TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_part_number (part_number),
    INDEX idx_normalized (normalized_part_number),
    FULLTEXT INDEX ft_alt_search (part_number, normalized_part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `compatibilities`
```sql
-- Many-to-many: products ↔ machine_models
CREATE TABLE compatibilities (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id          BIGINT UNSIGNED NOT NULL,
    machine_model_id    BIGINT UNSIGNED NOT NULL,
    fit_type            ENUM('direct_fit','cross_ref','with_modification') DEFAULT 'direct_fit',
    notes               VARCHAR(500),
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (machine_model_id) REFERENCES machine_models(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_product_model (product_id, machine_model_id),
    INDEX idx_model (machine_model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `product_images`
```sql
CREATE TABLE product_images (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id  BIGINT UNSIGNED NOT NULL,
    path        VARCHAR(500) NOT NULL,        -- CDN URL or relative path
    alt_text    VARCHAR(255),
    is_primary  TINYINT(1) NOT NULL DEFAULT 0,
    sort_order  SMALLINT UNSIGNED DEFAULT 0,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_primary (product_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `product_documents`
```sql
CREATE TABLE product_documents (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id  BIGINT UNSIGNED NOT NULL,
    name        VARCHAR(255) NOT NULL,
    path        VARCHAR(500) NOT NULL,
    type        ENUM('datasheet','certificate','drawing','manual','other') DEFAULT 'datasheet',
    file_size   INT UNSIGNED,                -- Bytes
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3.2 GEOGRAPHY DOMAIN

---

#### `countries`
```sql
CREATE TABLE countries (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    iso_code        CHAR(2) NOT NULL UNIQUE,              -- ISO 3166-1 alpha-2
    region          VARCHAR(100),                         -- e.g. "Middle East", "Africa", "Southeast Asia"
    flag_emoji      VARCHAR(10),
    is_active       TINYINT(1) NOT NULL DEFAULT 0,        -- Only activate confirmed-serviceable markets
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    has_landing_page TINYINT(1) NOT NULL DEFAULT 0,       -- Only if sufficient unique content exists
    -- Country-specific content
    port_info       TEXT,                                 -- Port names, logistics notes
    transit_time    VARCHAR(100),                         -- e.g. "12-15 days"
    import_notes    TEXT,                                 -- Import documentation notes
    local_demand    TEXT,                                 -- Market-specific demand context
    -- SEO
    seo_title       VARCHAR(160),
    seo_description VARCHAR(320),
    -- Timestamps
    sort_order      SMALLINT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    INDEX idx_slug (slug),
    INDEX idx_iso (iso_code),
    INDEX idx_active (is_active),
    INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Target markets** (pending client confirmation per PROJECT_MASTER_PLAN.md Section 42.I): UAE, Saudi Arabia, Qatar, Oman, Kuwait, Bahrain, Nigeria, Kenya, Ghana, Tanzania, Zambia, Uganda, South Africa, Bangladesh, Indonesia, Philippines, Australia.

---

### 3.3 LEAD GENERATION DOMAIN

---

#### `leads`
```sql
CREATE TABLE leads (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid                CHAR(36) NOT NULL UNIQUE,          -- Public-facing lead ID
    -- Contact
    name                VARCHAR(150) NOT NULL,
    company             VARCHAR(200),
    email               VARCHAR(254) NOT NULL,
    whatsapp            VARCHAR(30),
    country_id          BIGINT UNSIGNED,
    country_raw         VARCHAR(100),                      -- Free-text country if not in countries table
    buyer_type          ENUM('distributor','dealer','contractor','fleet_owner','other') DEFAULT 'other',
    -- Attribution (UTM persisted from session)
    utm_source          VARCHAR(150),
    utm_medium          VARCHAR(150),
    utm_campaign        VARCHAR(150),
    utm_term            VARCHAR(150),
    utm_content         VARCHAR(150),
    landing_page        VARCHAR(500),
    referrer            VARCHAR(500),
    first_touch_source  VARCHAR(150),
    last_touch_source   VARCHAR(150),
    device_type         ENUM('mobile','tablet','desktop','unknown') DEFAULT 'unknown',
    gclid               VARCHAR(200),                      -- Google Click ID
    fbclid              VARCHAR(200),                      -- Meta Click ID
    -- Lead quality
    lead_score          TINYINT UNSIGNED DEFAULT 0,        -- 0-100
    lead_band           ENUM('hot','warm','cold','unqualified') DEFAULT 'cold',
    -- Status
    status              ENUM('new','contacted','qualified','quoted','negotiating','won','lost','spam') DEFAULT 'new',
    sales_owner_id      BIGINT UNSIGNED,
    notes               TEXT,
    follow_up_at        TIMESTAMP NULL,
    -- Source
    source_type         ENUM('rfq','whatsapp','contact_form','phone','other') DEFAULT 'rfq',
    -- Timestamps
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,
    deleted_at          TIMESTAMP NULL,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
    FOREIGN KEY (sales_owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_uuid (uuid),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_lead_band (lead_band),
    INDEX idx_created (created_at),
    INDEX idx_follow_up (follow_up_at),
    INDEX idx_sales_owner (sales_owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `rfqs`
```sql
CREATE TABLE rfqs (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    lead_id             BIGINT UNSIGNED NOT NULL,
    reference_number    VARCHAR(50) NOT NULL UNIQUE,       -- e.g. "RFQ-2026-00001"
    -- Requirement
    machine_brand       VARCHAR(100),
    machine_model       VARCHAR(150),
    destination_country VARCHAR(100),
    urgency             ENUM('asap','within_week','within_month','no_rush') DEFAULT 'within_month',
    shipping_preference VARCHAR(100),                      -- e.g. "Sea freight", "Air freight"
    message             TEXT,
    purchase_timeline   VARCHAR(100),
    -- Status
    status              ENUM('received','reviewing','quoted','accepted','declined','expired') DEFAULT 'received',
    quoted_at           TIMESTAMP NULL,
    -- Timestamps
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_lead (lead_id),
    INDEX idx_reference (reference_number),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `rfq_items`
```sql
CREATE TABLE rfq_items (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    rfq_id          BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED,                       -- Nullable: may not match a known product yet
    part_number     VARCHAR(150),                          -- As entered by buyer
    description     VARCHAR(500),
    quantity        INT UNSIGNED,
    unit            VARCHAR(50) DEFAULT 'pieces',
    notes           VARCHAR(500),
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_rfq (rfq_id),
    INDEX idx_product (product_id),
    INDEX idx_part_number (part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `rfq_files`
```sql
CREATE TABLE rfq_files (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    rfq_id          BIGINT UNSIGNED NOT NULL,
    original_name   VARCHAR(255) NOT NULL,                 -- Sanitized original filename
    stored_name     VARCHAR(255) NOT NULL,                 -- UUID-based stored filename
    path            VARCHAR(500) NOT NULL,                 -- Storage path (not web-accessible)
    mime_type       VARCHAR(100) NOT NULL,
    file_size       INT UNSIGNED NOT NULL,                 -- Bytes
    file_type       ENUM('pdf','excel','csv','image','other') DEFAULT 'other',
    uploaded_at     TIMESTAMP NULL,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
    INDEX idx_rfq (rfq_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `lead_activities`
```sql
CREATE TABLE lead_activities (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    lead_id     BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED,                           -- Null = system event
    type        ENUM('created','contacted','note_added','status_changed','quote_sent','follow_up_set','won','lost') NOT NULL,
    notes       TEXT,
    metadata    JSON,                                      -- Additional context
    created_at  TIMESTAMP NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lead (lead_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3.4 CONTENT DOMAIN

---

#### `articles`
```sql
CREATE TABLE articles (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    author_id       BIGINT UNSIGNED,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(300) NOT NULL UNIQUE,
    excerpt         TEXT,
    content         LONGTEXT,
    featured_image  VARCHAR(500),
    status          ENUM('draft','published','archived') DEFAULT 'draft',
    published_at    TIMESTAMP NULL,
    -- SEO
    seo_title       VARCHAR(160),
    seo_description VARCHAR(320),
    schema_markup   JSON,
    -- Timestamps
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_status_published (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `faqs`
```sql
CREATE TABLE faqs (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50),                               -- 'product','brand','category','general'
    entity_id   BIGINT UNSIGNED,                           -- Polymorphic relation
    question    VARCHAR(500) NOT NULL,
    answer      TEXT NOT NULL,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    sort_order  SMALLINT UNSIGNED DEFAULT 0,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `seo_metadata`
```sql
CREATE TABLE seo_metadata (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    entity_type     VARCHAR(50) NOT NULL,                  -- 'product','category','brand','machine','country'
    entity_id       BIGINT UNSIGNED NOT NULL,
    seo_title       VARCHAR(160),
    seo_description VARCHAR(320),
    og_title        VARCHAR(160),
    og_description  VARCHAR(320),
    og_image        VARCHAR(500),
    canonical_url   VARCHAR(500),
    robots          VARCHAR(100) DEFAULT 'index,follow',
    schema_markup   JSON,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    UNIQUE INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### `redirects`
```sql
CREATE TABLE redirects (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    from_url        VARCHAR(500) NOT NULL,
    to_url          VARCHAR(500) NOT NULL,
    type            SMALLINT UNSIGNED DEFAULT 301,          -- 301 or 302
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    hit_count       BIGINT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    INDEX idx_from_url (from_url(191)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3.5 ADMINISTRATION DOMAIN

```sql
-- Managed by spatie/laravel-permission package
-- Tables auto-created by package migration:
--   users, roles, permissions, model_has_roles, model_has_permissions, role_has_permissions

-- Core users table (Laravel default + extended)
CREATE TABLE users (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(254) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at   TIMESTAMP NULL,
    remember_token  VARCHAR(100),
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Indexing Strategy

### 4.1 Critical Indexes (Query Pattern Analysis)

| Query Pattern | Table | Index |
|---|---|---|
| Part number exact search | `part_numbers` | `idx_normalized` on `normalized_part_number` |
| Part number FULLTEXT search | `part_numbers` | `ft_part_search` FULLTEXT |
| Product by slug (URL routing) | `products` | `idx_slug` UNIQUE |
| Product by SKU | `products` | `idx_sku` UNIQUE |
| Product by part number | `products` | `idx_part_number` |
| Products by category (paginated) | `products` | `idx_category` |
| Products by brand (paginated) | `products` | `idx_brand` |
| Active + indexable products | `products` | `idx_active_indexable` composite |
| Parts compatible with machine model | `compatibilities` | `idx_model` |
| Leads by status + date | `leads` | `idx_status` + `idx_created` |
| Leads by follow-up date | `leads` | `idx_follow_up` |
| Redirects lookup (middleware) | `redirects` | `idx_from_url` |
| FAQs by entity | `faqs` | `idx_entity` composite |

### 4.2 Part Number Normalization Function

```php
// app/Services/PartNumberNormalizerService.php
public function normalize(string $partNumber): string
{
    // Remove all non-alphanumeric characters
    // Convert to lowercase
    // Example: "335/Y1459" → "335y1459"
    //          "JCB-335/Y" → "jcb335y"
    return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $partNumber));
}
```

This normalized value is stored alongside the raw part number and indexed, enabling fast partial-match searches without case/punctuation sensitivity.

### 4.3 Search Query Pattern (Phase 1 MySQL)

```sql
-- Multi-strategy part number search (executed in order of priority)

-- 1. Exact match on normalized part number (fastest)
SELECT p.*, pn.part_number FROM products p
JOIN part_numbers pn ON pn.product_id = p.id
WHERE pn.normalized_part_number = :normalized_query
LIMIT 20;

-- 2. Prefix match (partial entry: "335/Y")
SELECT p.*, pn.part_number FROM products p
JOIN part_numbers pn ON pn.product_id = p.id
WHERE pn.normalized_part_number LIKE :prefix_query  -- "335y%"
LIMIT 20;

-- 3. FULLTEXT product search
SELECT p.*, MATCH(p.name, p.description, p.part_number) 
    AGAINST(:query IN BOOLEAN MODE) AS relevance
FROM products p
WHERE MATCH(p.name, p.description, p.part_number) AGAINST(:query IN BOOLEAN MODE)
  AND p.is_active = 1
ORDER BY relevance DESC
LIMIT 20;

-- 4. Alternative part numbers
SELECT p.* FROM products p
JOIN alternative_part_numbers apn ON apn.product_id = p.id
WHERE apn.normalized_part_number = :normalized_query
LIMIT 10;
```

---

## 5. Estimated Database Size (Phase 1)

| Table | Estimated Rows | Estimated Size |
|---|---|---|
| `part_numbers` | 85,150 (JCB price list) | ~50 MB |
| `products` | ~5,000 initially | ~10 MB |
| `alternative_part_numbers` | ~15,000 | ~15 MB |
| `compatibilities` | ~20,000 | ~10 MB |
| `categories` | ~50 | < 1 MB |
| `brands` | ~10 | < 1 MB |
| `machines` | ~20 | < 1 MB |
| `machine_models` | ~40 | < 1 MB |
| `countries` | ~250 | < 1 MB |
| `leads` + `rfqs` | ~500/month | < 5 MB/year |
| **Total Phase 1** | | **~100 MB** |

Well within the 3 GB Hostinger MySQL limit. Scale headroom is significant.

---

## 6. Migration Order (Laravel)

```
1.  create_users_table
2.  create_roles_permissions_tables (spatie)
3.  create_brands_table
4.  create_categories_table
5.  create_machines_table
6.  create_machine_models_table
7.  create_products_table
8.  create_part_numbers_table
9.  create_alternative_part_numbers_table
10. create_compatibilities_table
11. create_product_images_table
12. create_product_documents_table
13. create_countries_table
14. create_leads_table
15. create_rfqs_table
16. create_rfq_items_table
17. create_rfq_files_table
18. create_lead_activities_table
19. create_articles_table
20. create_faqs_table
21. create_seo_metadata_table
22. create_redirects_table
```

---

*End of DATABASE_ARCHITECTURE.md*
