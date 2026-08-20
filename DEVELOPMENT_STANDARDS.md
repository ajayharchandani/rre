# DEVELOPMENT_STANDARDS.md
## RRE International — Development Standards & Engineering Guidelines

**Version:** 1.0
**Prepared:** 20 August 2026
**Stack:** PHP 8.2+ / Laravel 11.x / MySQL 8.0 / Blade + Livewire / Tailwind CSS

---

> These standards apply to every line of code committed to the RRE International repository. No exceptions without documented justification.

---

## 1. Folder Structure

```
rre-international/
├── app/
│   ├── Console/
│   │   └── Commands/              # Artisan commands (one per file)
│   ├── Exceptions/
│   │   └── Handler.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Frontend/          # All public-facing controllers
│   │   │   └── Api/               # API endpoints (if/when added)
│   │   ├── Middleware/
│   │   ├── Requests/              # Form Request classes (validation)
│   │   └── Resources/             # API Resources (if/when added)
│   ├── Models/                    # Eloquent models
│   ├── Observers/                 # Model observers
│   ├── Policies/                  # Authorization policies
│   ├── Providers/                 # Service providers
│   ├── Services/                  # Business logic (not in controllers)
│   │   ├── SearchService.php
│   │   ├── LeadScoringService.php
│   │   ├── WhatsAppUrlService.php
│   │   ├── SitemapService.php
│   │   ├── ImportService.php
│   │   └── PartNumberNormalizerService.php
│   └── Jobs/                      # Queued jobs
│
├── config/                        # Laravel config files
├── database/
│   ├── migrations/                # One migration per schema change
│   ├── seeders/                   # Only demo/reference data seeders
│   └── factories/                 # Model factories (testing only)
│
├── public/
│   ├── build/                     # Compiled Vite assets (committed)
│   └── .htaccess                  # Apache rules
│
├── resources/
│   ├── css/
│   │   └── app.css                # Tailwind directives + custom CSS
│   ├── js/
│   │   └── app.js                 # Alpine.js + minimal custom JS
│   └── views/
│       ├── layouts/               # Base layouts
│       │   ├── app.blade.php      # Main frontend layout
│       │   └── admin.blade.php    # Admin layout (Filament handles its own)
│       ├── components/            # Blade x-components
│       │   ├── layout/            # nav, footer, breadcrumbs, head
│       │   ├── ui/                # buttons, badges, cards, alerts
│       │   ├── product/           # product-card, part-badge, availability-badge
│       │   ├── search/            # search-bar, search-results
│       │   ├── rfq/               # rfq-form, rfq-step-*, whatsapp-cta
│       │   └── seo/               # meta-tags, schema, og-tags
│       ├── pages/                 # Full page views
│       │   ├── home.blade.php
│       │   ├── products/
│       │   ├── brands/
│       │   ├── machines/
│       │   ├── parts/
│       │   ├── export/
│       │   ├── rfq/
│       │   └── errors/            # 404, 500, etc.
│       └── livewire/              # Livewire component views
│
├── routes/
│   ├── web.php                    # Frontend routes
│   ├── api.php                    # API routes (future)
│   └── console.php                # Scheduled commands
│
├── storage/
│   └── app/
│       ├── public/                # Publicly linked storage
│       └── private/               # RFQ uploads (NOT web-accessible)
│           └── rfq-uploads/
│
├── tests/
│   ├── Feature/                   # Feature/integration tests
│   └── Unit/                      # Unit tests
│
├── .env.example                   # Template (no real values)
├── .gitignore
├── artisan
├── composer.json
├── package.json
├── tailwind.config.js
├── vite.config.js
└── playwright.config.ts           # Browser testing config
```

---

## 2. Naming Conventions

### 2.1 PHP / Laravel

| Element | Convention | Example |
|---|---|---|
| Class names | `PascalCase` | `ProductController`, `LeadScoringService` |
| Method names | `camelCase` | `showProduct()`, `calculateScore()` |
| Variable names | `camelCase` | `$partNumber`, `$leadScore` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Config keys | `snake_case` | `whatsapp.number`, `rre.brand_name` |
| Environment vars | `UPPER_SNAKE_CASE` | `WHATSAPP_NUMBER`, `GA4_MEASUREMENT_ID` |

### 2.2 Database

| Element | Convention | Example |
|---|---|---|
| Table names | `snake_case`, plural | `products`, `machine_models`, `rfq_items` |
| Column names | `snake_case` | `part_number`, `normalized_part_number` |
| Foreign keys | `{table_singular}_id` | `brand_id`, `machine_model_id` |
| Boolean columns | `is_*` or `has_*` | `is_active`, `has_landing_page` |
| Timestamp columns | `*_at` | `created_at`, `published_at`, `deleted_at` |
| Index names | `idx_{columns}` | `idx_slug`, `idx_brand_active` |
| FULLTEXT indexes | `ft_{columns}` | `ft_product_search` |

### 2.3 Routes

| Route type | Convention | Example |
|---|---|---|
| Product page | `GET /products/{slug}` | `/products/hydraulic-pump-jcb-3dx` |
| Category | `GET /products/{categorySlug}/` | `/products/hydraulic-seal-kits/` |
| Brand | `GET /brands/{slug}` | `/brands/jcb` |
| Machine | `GET /machines/{slug}` | `/machines/jcb-3dx` |
| Model | `GET /machines/{brandSlug}/{modelSlug}` | `/machines/jcb/3dx-2011-2016` |
| Part number | `GET /parts/{normalizedPn}` | `/parts/335-y1459` |
| Country | `GET /export/{countrySlug}` | `/export/heavy-equipment-spare-parts-uae` |
| RFQ | `GET /rfq` | `/rfq` |
| Search | `GET /search` | `/search?q=hydraulic+pump+jcb` |

### 2.4 Blade / CSS

| Element | Convention | Example |
|---|---|---|
| Blade components | `kebab-case` | `<x-product-card>`, `<x-whatsapp-cta>` |
| Blade views | `kebab-case` directories and files | `resources/views/pages/products/show.blade.php` |
| CSS custom classes (rare, use Tailwind utilities) | `BEM: block__element--modifier` | `.product-card__badge--availability` |
| JS variables | `camelCase` | `partNumber`, `rfqStep` |
| Alpine.js data keys | `camelCase` | `x-data="{ isOpen: false }"` |

---

## 3. Laravel Conventions

### 3.1 Controllers
- **One controller per resource** (ProductController, BrandController, etc.)
- Controllers are thin — **no business logic in controllers**
- Controllers call Services; Services contain logic
- Use Form Requests for all input validation
- Return views or JSON; never process data inline

```php
// CORRECT
public function show(string $slug): View
{
    $product = $this->productService->findBySlugOrFail($slug);
    return view('pages.products.show', compact('product'));
}

// INCORRECT — logic in controller
public function show(string $slug): View
{
    $product = Product::where('slug', $slug)
        ->where('is_active', 1)
        ->with(['images', 'partNumbers', 'compatibilities.machineModel'])
        ->firstOrFail();
    // ... more inline logic
}
```

### 3.2 Models
- Define `$fillable` (not `$guarded = []`) — explicit mass assignment protection
- Always define `$casts` for type safety
- Always define `$dates` / `$casts` for timestamps
- Define relationships on both sides (inverse included)
- Use scopes for common query patterns (`scopeActive`, `scopeIndexable`, `scopeFeatured`)
- Never use `->all()` or `->get()` on large tables without pagination

```php
// Product Model example
class Product extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'name', 'slug', 'sku', 'part_number', 'normalized_part_number',
        'category_id', 'brand_id', 'description', 'specifications',
        'availability', 'moq', 'is_active', 'is_featured', 'is_indexable',
        'seo_title', 'seo_description',
    ];

    protected $casts = [
        'specifications' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_indexable' => 'boolean',
    ];

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeIndexable(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('is_indexable', true);
    }

    // Relationships
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
    public function images(): HasMany { return $this->hasMany(ProductImage::class)->orderBy('sort_order'); }
    public function partNumbers(): HasMany { return $this->hasMany(PartNumber::class); }
    public function compatibilities(): HasMany { return $this->hasMany(Compatibility::class); }
}
```

### 3.3 Avoiding N+1 Queries
- **Always** use eager loading when accessing relationships in loops
- Use `->with([...])` in controller/service layer, not in Blade
- Use Laravel Debugbar in development to catch N+1 queries

```php
// CORRECT
$products = Product::active()
    ->with(['category', 'brand', 'images' => fn($q) => $q->where('is_primary', true)])
    ->paginate(24);

// INCORRECT — N+1 for every product's category
$products = Product::active()->paginate(24);
// then in Blade: {{ $product->category->name }} ← triggers a query per product
```

### 3.4 Pagination
- **Always paginate** queries that could return many rows
- Default page size: 24 for product listings, 10 for search results
- Never use `->get()` on the products or part_numbers table without a `->limit()`

```php
// Always paginate product listings
$products = Product::active()->with([...])->paginate(24);

// Search results — smaller default
$results = $this->searchService->search($query, perPage: 10);
```

### 3.5 Caching
- Cache all expensive queries in controllers/services
- Use descriptive cache keys with version tags
- Always set TTL explicitly — never cache indefinitely in production

```php
// Cache example
$categories = Cache::remember('categories.active.nav', 3600 * 12, function () {
    return Category::active()->with('children')->orderBy('sort_order')->get();
});

// Invalidate on model change via Observer
public function saved(Category $category): void
{
    Cache::forget('categories.active.nav');
}
```

---

## 4. Blade Conventions

- **No PHP logic in Blade** — only display logic (`@if`, `@foreach`, `@isset`)
- Pass all data from controller; do not call models from Blade
- Use `{{ }}` for all output (XSS-escaped automatically)
- Use `{!! !!}` ONLY for trusted, sanitized HTML (e.g., rich text already sanitized server-side)
- Extract repeating patterns into Blade components (`x-components`)
- All `x-components` must be self-documenting (named props with defaults)

```blade
{{-- CORRECT --}}
<x-product-card :product="$product" :show-whatsapp="true" />

{{-- INCORRECT — logic in Blade --}}
@php
    $product = Product::where('slug', $slug)->first();
@endphp
```

### 4.1 SEO Blade Pattern
Every page that is indexable MUST include:
```blade
{{-- In <head> section of layouts/app.blade.php --}}
<title>@yield('seo_title', config('rre.default_title'))</title>
<meta name="description" content="@yield('seo_description', config('rre.default_description'))">
<link rel="canonical" href="@yield('canonical', url()->current())">
<meta property="og:title" content="@yield('og_title', config('rre.default_title'))">
<meta property="og:description" content="@yield('og_description')">
<meta property="og:url" content="@yield('canonical', url()->current())">
<meta property="og:image" content="@yield('og_image', asset('images/rre-og-default.jpg'))">
<meta property="og:type" content="website">

{{-- Structured data --}}
@stack('schema')
```

---

## 5. Livewire Conventions

Use Livewire for:
- Multi-step RFQ form
- Live part-number search (autocomplete)
- Dynamic filters on product listings

Do NOT use Livewire for:
- Static page sections (use Blade)
- Full page navigation (use standard links)
- Server polling loops (use cron instead)

```php
// Livewire component — keep lean
class PartNumberSearch extends Component
{
    public string $query = '';
    public Collection $results;

    #[Debounce(300)] // Debounce 300ms to avoid spamming DB on every keystroke
    public function search(): void
    {
        if (strlen($this->query) < 3) {
            $this->results = collect();
            return;
        }
        $this->results = app(SearchService::class)->search($this->query, perPage: 8);
    }

    public function render(): View
    {
        return view('livewire.part-number-search');
    }
}
```

---

## 6. Database Conventions

- All migrations use `up()` and `down()` — always reversible
- Never modify an existing migration that has been deployed — create a new migration
- All foreign keys have explicit `ON DELETE` rules (`CASCADE`, `SET NULL`, or `RESTRICT`)
- All timestamps are `TIMESTAMP NULL` (not `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`) — let Eloquent manage them
- Never store `NULL` in a `VARCHAR` column if an empty string is semantically correct
- All `ENUM` values documented in comments and in model `$casts`
- Index added at the same time as the column — never leave a foreign key unindexed

---

## 7. Validation

- **All user input** validated server-side using Laravel Form Requests
- No client-side-only validation — JavaScript validation is UX enhancement only
- Form Requests live in `app/Http/Requests/`
- Return structured errors for API; return redirect with errors for web forms

```php
// app/Http/Requests/RfqRequest.php
class RfqRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:150'],
            'company'       => ['nullable', 'string', 'max:200'],
            'email'         => ['required', 'email:rfc,dns', 'max:254'],
            'whatsapp'      => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9\s\-()]{7,30}$/'],
            'country'       => ['required', 'string', 'max:100'],
            'machine_brand' => ['nullable', 'string', 'max:100'],
            'machine_model' => ['nullable', 'string', 'max:150'],
            'part_number'   => ['nullable', 'string', 'max:150'],
            'description'   => ['nullable', 'string', 'max:1000'],
            'quantity'      => ['nullable', 'integer', 'min:1', 'max:999999'],
            'message'       => ['nullable', 'string', 'max:2000'],
            // File uploads
            'attachments'   => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', // 10MB
                               'mimes:pdf,xls,xlsx,csv,jpg,jpeg,png'],
        ];
    }
}
```

---

## 8. Error Handling

- All exceptions caught and logged via `app/Exceptions/Handler.php`
- Custom 404 page at `resources/views/errors/404.blade.php` — branded, with search and RFQ CTA
- Custom 500 page at `resources/views/errors/500.blade.php` — branded, no technical details exposed to user
- Never expose stack traces, file paths, or database errors to users in production (`APP_DEBUG=false`)
- Use `report()` helper to log exceptions without re-throwing when appropriate

```php
// Log and continue — don't crash the page for a non-critical failure
try {
    $this->analyticsService->trackProductView($product->id);
} catch (\Exception $e) {
    report($e); // Logs to storage/logs — does not abort request
}
```

---

## 9. Logging

- Log channel: `daily` (rotated daily; keeps last 14 days)
- Log level in production: `error` (not `debug` — reduces disk I/O on shared hosting)
- Log level in development: `debug`
- Never log PII (customer email, phone, name) in plain text in log files
- Structure log context with arrays, not string concatenation

```php
// CORRECT
Log::error('RFQ submission failed', [
    'rfq_reference' => $rfq->reference_number,
    'error' => $e->getMessage(),
]);

// INCORRECT — logs PII + no structure
Log::error('RFQ failed for ' . $request->email . ': ' . $e->getMessage());
```

---

## 10. SEO Standards

Every controller action that renders an indexable page MUST set:
```php
// In the view data returned by controller
[
    'seoTitle'       => $product->seo_title ?? $this->seoService->generateTitle($product),
    'seoDescription' => $product->seo_description ?? $this->seoService->generateDescription($product),
    'canonicalUrl'   => route('products.show', $product->slug),
    'ogImage'        => $product->primaryImage?->path ?? config('rre.og_default_image'),
    'schemaMarkup'   => $this->schemaService->forProduct($product),
]
```

**Canonical rule:** every filterable/faceted URL must have a canonical pointing to the canonical URL. Never allow duplicate content from URL parameters.

**Robots rule:** pages without sufficient unique content must have `<meta name="robots" content="noindex, follow">`. Controlled via `products.is_indexable` flag in database.

---

## 11. Accessibility

- All images must have meaningful `alt` text — not empty, not "image", not filename
- All interactive elements must be keyboard-accessible
- All form inputs must have associated `<label>` elements
- Color contrast must meet WCAG AA minimum (4.5:1 for normal text)
- WhatsApp and CTA buttons must have descriptive `aria-label` attributes
- Use semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`)
- Never remove `:focus` styles

---

## 12. Performance Standards

| Rule | Standard |
|---|---|
| Page weight (initial) | < 500KB uncompressed |
| JavaScript (critical path) | < 50KB gzipped |
| CSS (compiled Tailwind) | < 30KB gzipped |
| Images | WebP format; responsive `srcset`; lazy loading for below-fold |
| Database queries per request | ≤ 10 (monitored via Debugbar in dev) |
| Cache ALL category/brand/navigation queries | TTL ≥ 6 hours |
| Paginate ALL product list queries | Default 24 per page |
| Never load entire `products` table | EVER |

---

## 13. Security Standards

| Rule | Implementation |
|---|---|
| CSRF on all POST forms | Laravel `@csrf` directive — mandatory |
| XSS | Use `{{ }}` always; `{!! !!}` only for sanitized HTML |
| SQL injection | Use Eloquent / query builder only; no raw SQL without bindings |
| File uploads | Validate MIME + extension; store in non-web-accessible path; sanitize filename; log upload |
| Rate limiting | `throttle:10,1` on RFQ form; `throttle:30,1` on search |
| Spam | Honeypot field on RFQ; optional Cloudflare Turnstile (free) |
| Auth | Laravel Breeze; strong passwords; no default credentials |
| Secrets | `.env` file on server only; never in Git; never in code |
| Error pages | `APP_DEBUG=false` in production; custom error pages only |
| Security headers | Set in `.htaccess`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

---

## 14. Git Standards

### Branch Strategy
```
main           → Production only; protected; deployments only
development    → Integration branch; tested before merging to main
feature/*      → One branch per feature; branched from development
fix/*          → Bug fixes; branched from development (or main for hotfixes)
```

### Commit Message Format
```
type(scope): short description

Types: feat, fix, refactor, style, docs, test, chore, perf
Examples:
  feat(rfq): add multi-step form with file upload
  fix(search): correct normalized part number index query
  perf(products): add eager loading to category page query
  docs(deployment): update cron job configuration
```

### What NEVER goes in Git
```
.env              # Any environment file with real values
vendor/           # Composer dependencies (reinstalled on server)
node_modules/     # NPM dependencies
storage/logs/     # Log files
storage/framework/cache/  # Compiled cache
*.sql             # Database dumps
customer data     # Any real customer PII
```

---

## 15. Code Review Checklist

Before any PR is merged:
- [ ] No business logic in controllers
- [ ] All user input validated via Form Request
- [ ] No N+1 queries (check with Debugbar in dev)
- [ ] All queries on large tables are paginated
- [ ] No PII in logs
- [ ] `APP_DEBUG=false` compatible (no hardcoded debug output)
- [ ] All images have alt text
- [ ] All interactive elements have CSRF protection
- [ ] No credentials or secrets committed
- [ ] Blade uses `{{ }}` for all untrusted output
- [ ] File uploads validated (MIME + extension + size)
- [ ] Cache invalidation handled in model observer
- [ ] SEO metadata set for all new public pages

---

*End of DEVELOPMENT_STANDARDS.md*
