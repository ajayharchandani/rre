# ARCHITECTURE.md
## RRE International — Technical Architecture

**Version:** 1.0 — Architecture Phase
**Prepared:** 20 August 2026
**Constraint:** Hostinger Premium Shared Hosting (initial deployment)

---

## 1. Architecture Principle

> Optimize for: **Hostinger compatibility + SEO + performance + conversion + security + maintainability + low infrastructure cost + future scalability.**
> Do NOT optimize for fashionable technology.

The architecture must work on shared hosting today and migrate cleanly to VPS/cloud tomorrow — without rebuilding the application.

---

## 2. Final Stack Decision

### Why Laravel + MySQL over the Master Plan's Suggested Next.js + PostgreSQL + Meilisearch

The PROJECT_MASTER_PLAN.md (Section 34) recommended Next.js + headless CMS + PostgreSQL + Meilisearch. That stack is **not deployable on Hostinger Premium Shared Hosting** for the following hard reasons:

| Master Plan Stack | Hostinger Reality | Verdict |
|---|---|---|
| Next.js (Node server) | No persistent Node processes | ❌ Not compatible |
| PostgreSQL | MySQL only | ❌ Not available |
| Meilisearch | No persistent processes | ❌ Not compatible |
| Headless CMS (Sanity/Strapi) | Requires Node server | ❌ Not compatible |
| Redis (caching/queues) | No Redis daemon | ❌ Not available |

**Laravel + MySQL** achieves every business objective — server-rendered SEO, RFQ engine, part-number search, admin system, programmatic page generation, WhatsApp CTAs, file uploads — while being **natively compatible** with shared hosting.

**Migration path is clean:** Laravel runs identically on shared hosting, Hostinger VPS, and any cloud VM. When scale demands it, Redis, Horizon, Meilisearch, and PostgreSQL can be introduced without rebuilding the application — only configuration changes and driver swaps are required.

### Architecture Evaluation Matrix

| Criterion | Laravel + MySQL | Next.js + PostgreSQL | Verdict |
|---|---|---|---|
| Hostinger compatibility | ✅ Full | ❌ Incompatible | Laravel wins |
| SEO (server-rendered HTML) | ✅ Native Blade | ✅ SSR/SSG | Tie |
| Development speed | ✅ One framework | ⚠️ Two stacks | Laravel wins |
| Admin system | ✅ Built-in (Filament/custom) | ❌ Separate build | Laravel wins |
| RFQ engine | ✅ Native | ✅ Native | Tie |
| File uploads | ✅ Native | ✅ Native | Tie |
| Part-number search | ✅ MySQL FULLTEXT | ✅ Meilisearch | Next.js (later) |
| Database support | ✅ MySQL (Eloquent ORM) | ✅ PostgreSQL (Prisma) | Tie |
| Dynamic product pages | ✅ Blade templates | ✅ React components | Tie |
| Security | ✅ Laravel built-in CSRF/XSS | ✅ Framework-level | Tie |
| Performance on shared hosting | ✅ PHP + OPcache | ❌ Cannot deploy | Laravel wins |
| Infrastructure cost (Phase 1) | ✅ ₹0 extra (already paid) | ❌ Requires VPS | Laravel wins |
| Future scalability | ✅ Same codebase on VPS | ✅ Same codebase on cloud | Tie |
| Maintainability | ✅ One language (PHP) | ⚠️ PHP + JS + Node | Laravel wins |

**Conclusion: Laravel + MySQL is the correct architecture for this hosting environment and business stage.**

---

## 3. Final Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RRE INTERNATIONAL — STACK                       │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER              │  TECHNOLOGY              │  VERSION            │
├─────────────────────┼──────────────────────────┼─────────────────────┤
│  Language           │  PHP                     │  8.2+               │
│  Framework          │  Laravel                 │  11.x               │
│  Frontend templates │  Laravel Blade           │  11.x               │
│  Reactive UI        │  Laravel Livewire        │  3.x                │
│  Styling            │  Tailwind CSS            │  3.x (compiled)     │
│  Icons              │  Lucide (SVG sprite)     │  Latest             │
│  Asset build        │  Vite                    │  5.x (local only)   │
│  Database           │  MySQL                   │  8.0                │
│  ORM                │  Eloquent                │  Laravel 11.x       │
│  Admin panel        │  Filament                │  3.x                │
│  Search             │  MySQL FULLTEXT          │  Phase 1            │
│  Cache              │  Laravel file driver     │  Laravel 11.x       │
│  Sessions           │  Laravel file driver     │  Laravel 11.x       │
│  Queues             │  Database driver + cron  │  Laravel 11.x       │
│  Email              │  Brevo SMTP (external)   │  Laravel Mail       │
│  File storage       │  Local + Cloudflare R2   │  Phase 1            │
│  CDN / WAF          │  Cloudflare (free tier)  │  Always on          │
│  SSL                │  Let's Encrypt (free)    │  Hostinger          │
│  Analytics          │  GA4 + GTM               │  Phase 1            │
│  SEO package        │  spatie/laravel-sitemap  │  Latest             │
│                     │  artesaos/seotools       │  Latest             │
│  Testing            │  Playwright (browser)    │  Latest             │
│  Deployment         │  Git + SSH / SFTP        │  Phase 1            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Rendering Model
**Server-Side Rendering (SSR) via Laravel Blade — always.**

Every page that Google must index is rendered server-side. JavaScript is an enhancement layer, never a requirement for content visibility. This ensures:
- Full crawlability of 85,000+ part-number pages
- No JavaScript-dependent SEO risk
- Fast Time To First Byte (TTFB) on shared hosting

### 4.2 Component Strategy

| UI Type | Technology | When to Use |
|---|---|---|
| Static page structure | Blade templates | All pages |
| Reusable UI components | Blade components (`x-components`) | Navigation, cards, breadcrumbs, CTAs |
| Interactive forms (RFQ, search) | Livewire 3.x components | Multi-step forms, live search |
| Simple interactions | Alpine.js (bundled with Livewire) | Dropdowns, modals, toggles |
| Heavy interactivity | Avoid — use Livewire | N/A |
| Full SPA behaviour | ❌ Do not use | Never on this stack |

### 4.3 Styling System
- **Tailwind CSS 3.x** — utility-first, compiled to a single optimized CSS file at build time
- Custom design tokens defined in `tailwind.config.js` (brand colors, typography scale, spacing)
- **Google Fonts:** Inter (body) + optional display font — loaded via `<link rel="preconnect">` and `font-display: swap`
- **Lucide icons** — SVG sprite or inline SVGs; no icon font (avoids render-blocking)
- Dark mode: **not in Phase 1** — B2B professional light theme only

### 4.4 Asset Pipeline
- **Vite** runs locally in development only
- Production build (`npm run build`) generates compiled CSS + JS in `public/build/`
- Built assets are committed to Git or deployed via SFTP — **Vite never runs on Hostinger**
- JS bundle target: < 50KB gzipped for critical path; lazy-load non-critical JS

### 4.5 Performance Targets (Core Web Vitals)
| Metric | Target | Strategy |
|---|---|---|
| LCP | < 2.5s | CDN-served hero images; preload critical image |
| INP | < 200ms | Minimal JS; Alpine.js for interactions |
| CLS | < 0.1 | Reserved image dimensions; no layout shifts |
| TTFB | < 800ms | OPcache; file cache for repeated queries; Cloudflare CDN |
| Page weight | < 500KB | Compiled Tailwind; compressed images; deferred JS |

---

## 5. Backend Architecture

### 5.1 Laravel Application Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Frontend/          # Public-facing pages
│   │   │   ├── HomeController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── BrandController.php
│   │   │   ├── MachineController.php
│   │   │   ├── PartNumberController.php
│   │   │   ├── CountryController.php
│   │   │   ├── SearchController.php
│   │   │   ├── RfqController.php
│   │   │   └── ContentController.php
│   │   └── Admin/             # Admin panel (Filament handles most)
│   ├── Middleware/
│   │   ├── SetLocale.php
│   │   ├── TrackUtm.php       # UTM attribution persistence
│   │   └── RateLimitRfq.php   # RFQ spam protection
│   └── Requests/
│       ├── RfqRequest.php
│       └── SearchRequest.php
├── Models/                    # Eloquent models
├── Services/
│   ├── SearchService.php      # Abstracted search (swap MySQL → Meilisearch later)
│   ├── LeadScoringService.php
│   ├── WhatsAppUrlService.php # Dynamic WhatsApp message generator
│   ├── SitemapService.php
│   └── ImportService.php      # Bulk product import
├── Jobs/
│   ├── ProcessRfqNotification.php
│   ├── GenerateSitemap.php
│   └── SendLeadNotification.php
└── Console/
    └── Commands/
        ├── GenerateSitemapCommand.php
        └── ProcessQueueCommand.php
```

### 5.2 Admin Panel
**Filament 3.x** — Laravel-native admin panel.

Why Filament over a custom admin:
- Built for Laravel/Eloquent — no separate stack
- Fully functional CRUD for all entities out of the box
- Bulk import/export built-in
- Role-based access control via `spatie/laravel-permission`
- Non-technical operator friendly
- Runs on the same PHP/MySQL stack — no extra infrastructure

Filament provides admin for: Products, Categories, Brands, Machines, Models, Part Numbers, Countries, Leads, RFQs, Articles, FAQs, Case Studies, Testimonials, SEO Metadata.

### 5.3 Search Architecture

**Phase 1: MySQL FULLTEXT Search**

```sql
-- Indexes on products table
ALTER TABLE products ADD FULLTEXT INDEX ft_search (name, description, part_number, sku);
ALTER TABLE part_numbers ADD FULLTEXT INDEX ft_part_search (part_number, normalized_part_number, description);
ALTER TABLE alternative_part_numbers ADD FULLTEXT INDEX ft_alt_search (part_number, normalized_part_number);
```

Search strategy:
1. Exact match on `part_number` → highest priority
2. Exact match on `normalized_part_number` (alphanumeric only, lowercase) → high priority
3. FULLTEXT BOOLEAN MODE search across products + part_numbers → medium priority
4. LIKE prefix search on `part_number` → fallback for partial entry

**Phase 2 (On VPS): Meilisearch**
- Self-hosted Meilisearch on VPS
- `SearchService.php` abstraction means zero application code changes
- Switch driver in config only

### 5.4 Caching Strategy

```
Cache Driver: file (Hostinger shared hosting — no Redis)

Cache Layers:
├── Route-level cache      → Category/Brand/Machine pages (TTL: 6 hours)
├── Query cache            → Product list queries (TTL: 1 hour)
├── Fragment cache         → Navigation, footer, featured categories (TTL: 12 hours)
├── Sitemap cache          → Generated XML sitemaps (TTL: 24 hours)
└── Config/Route cache     → Always cached in production (php artisan optimize)

Cloudflare CDN Cache:
├── Static assets          → 1 year (fingerprinted filenames)
├── Product pages          → 1 hour (Cache-Control headers)
├── Category/Brand pages   → 4 hours
└── Homepage               → 30 minutes
```

### 5.5 Queue Architecture

**Phase 1: Database queue driver + cron-based processing**

```
Cron (every minute):
php artisan queue:work --once --queue=default

Queue jobs:
├── ProcessRfqNotification    → Send email notification to sales team
├── SendLeadAcknowledgement   → Send confirmation to enquirer
├── GenerateSitemap           → Scheduled daily at 02:00
└── CleanExpiredUploads       → Weekly cleanup of orphaned files
```

**Phase 2 (On VPS): Laravel Horizon + Redis**
- Zero application changes; config swap only

### 5.6 Session & Attribution

UTM parameters captured on first page load, stored in:
1. PHP session (server-side)
2. First-party cookie (30-day TTL)

Persisted on all RFQ and WhatsApp CTA submissions. Never lost on page navigation.

---

## 6. Database Architecture

**Full detail in:** `DATABASE_ARCHITECTURE.md`

Summary:
- **Engine:** MySQL 8.0 InnoDB
- **ORM:** Laravel Eloquent
- **Migrations:** Laravel migrations (version-controlled schema)
- **Seeders:** Demo data seeders for development only; never run in production

Key entity groups:
1. **Catalog:** products, categories, brands, machines, machine_models, part_numbers, alternative_part_numbers, compatibilities, product_images, product_documents
2. **Geography:** countries, markets
3. **Lead Generation:** leads, rfqs, rfq_items, rfq_files, lead_activities
4. **Content:** articles, faqs, case_studies, testimonials
5. **Administration:** users, roles, permissions (via spatie/laravel-permission)
6. **SEO:** seo_metadata, redirects, sitemaps

---

## 7. Storage Architecture

### Phase 1: Local Filesystem + Cloudflare R2

```
Hostinger filesystem (within inode budget):
├── /storage/app/public/
│   ├── rfq-uploads/           → RFQ file attachments (secured, not web-accessible directly)
│   └── documents/             → Product documents (datasheets, COA)

Cloudflare R2 (external object storage — free tier: 10GB/month):
├── product-images/            → All product photography
├── catalogue-pdfs/            → Downloadable catalogues
└── facility-images/           → Company/facility photos
```

Why Cloudflare R2:
- Free egress (no bandwidth cost)
- Global CDN delivery
- S3-compatible API → Laravel Filesystem integration (one config change)
- Keeps Hostinger inodes free for application files

### Phase 2 (VPS): AWS S3 or keep R2
- Laravel's `Storage` facade abstracts the driver — zero code changes

---

## 8. Email Architecture

**Provider:** Brevo (formerly Sendinblue) — free tier: 300 emails/day

**Laravel Mail configuration:**
```
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=[CLIENT INPUT REQUIRED]
MAIL_PASSWORD=[CLIENT INPUT REQUIRED]
MAIL_FROM_ADDRESS=export@rreinternational.com
```

**Email types:**
| Email | Trigger | Recipient |
|---|---|---|
| RFQ notification | RFQ submission | Sales team |
| RFQ acknowledgement | RFQ submission | Enquirer |
| Lead alert | High-score lead | Sales owner |
| File upload confirmation | BOM upload | Enquirer |

---

## 9. Analytics Architecture

**Tools:**
- Google Analytics 4 (GA4) — via GTM
- Google Tag Manager (GTM) — integration layer
- Google Search Console — organic search monitoring
- Meta Pixel — if paid social ads are run [CLIENT INPUT REQUIRED]

**GTM data layer events:**
```javascript
// Every event pushed to dataLayer, fired by GTM tags
page_view | product_view | search | part_number_search |
rfq_start | rfq_step_complete | rfq_submit |
whatsapp_click | phone_click | file_upload |
lead_generated | country_page_view | brand_page_view
```

**UTM attribution flow:**
```
Landing URL with UTM → Middleware captures → Session + Cookie stored
→ Persists across navigation → Attached to RFQ/WhatsApp submission → Stored in leads table
```

---

## 10. SEO Architecture

**Full detail in:** `SEO_ARCHITECTURE.md`

Summary:
- **Rendering:** 100% server-side — all content in HTML, no client-side rendering for indexable content
- **Meta:** `artesaos/seotools` package — unique title, description, canonical, OG per page
- **Structured data:** JSON-LD in Blade templates (Product, Organization, BreadcrumbList, FAQPage, WebSite)
- **Sitemaps:** `spatie/laravel-sitemap` — segmented by content type, auto-generated via cron
- **Robots.txt:** Custom; blocks filter/search parameter URLs
- **Canonicals:** Set on every page; faceted pages canonicalize to their parent
- **Redirects:** Database-driven redirect table; managed via Filament admin

---

## 11. Deployment Architecture

**Full detail in:** `HOSTINGER_DEPLOYMENT.md`

Summary:
- **Method:** Git push-to-deploy (hPanel Git integration) or SFTP
- **Branch:** `main` → production; `development` → staging subdomain
- **Build:** Assets built locally before commit; no build step on server
- **Environment:** `.env` file managed directly on server via SSH; never in Git
- **Cron:** Configured via hPanel Cron Jobs

---

## 12. Security Architecture

| Layer | Implementation |
|---|---|
| CSRF | Laravel built-in CSRF tokens on all forms |
| XSS | Laravel automatic HTML escaping in Blade (`{{ }}`) |
| SQL injection | Eloquent ORM parameterized queries; no raw SQL without bindings |
| Input validation | Laravel Form Requests — server-side always |
| Rate limiting | Laravel throttle middleware on RFQ, search, login endpoints |
| File uploads | MIME validation + extension whitelist + sanitized filenames + stored outside webroot |
| Authentication | Laravel Breeze/Fortify for admin; no public auth in Phase 1 |
| Authorization | spatie/laravel-permission for admin role control |
| Security headers | Set via `.htaccess`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| HTTPS | Enforced via Hostinger SSL + `.htaccess` redirect |
| Environment variables | `.env` on server only; never committed to Git |
| Spam protection | Honeypot field on RFQ form + rate limiting + optional Turnstile (Cloudflare, free) |

---

## 13. Scaling Strategy

### Phase 1 — Hostinger Premium Shared Hosting (NOW)
- Laravel + MySQL + file cache + cron queue
- Cloudflare CDN to reduce origin load
- Cloudflare R2 for images/media
- Target: < 500 daily visitors, < 50 daily RFQs

### Phase 2 — Hostinger Business / VPS (when traffic grows)
**Triggers:** > 500 concurrent visitors OR > 50 entry processes sustained OR DB > 2GB

Changes required (config only, no application rebuild):
- Add Redis → switch cache/session/queue drivers in `.env`
- Add Meilisearch → switch `SearchService` driver
- Add Laravel Horizon → replace cron queue processing
- Increase PHP memory/workers

### Phase 3 — Hostinger Cloud / External Cloud
**Triggers:** > 5,000 daily visitors OR international CDN performance required

Changes:
- Move to Hostinger Cloud or DigitalOcean/Hetzner VM
- Add read replica for MySQL
- Potentially split image storage to dedicated CDN
- Consider load balancer

**Key principle: The application codebase does not change between phases. Only infrastructure configuration changes.**

---

*End of ARCHITECTURE.md*
