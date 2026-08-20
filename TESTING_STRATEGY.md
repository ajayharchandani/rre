# TESTING_STRATEGY.md
## RRE International — Testing Strategy

**Version:** 1.0
**Prepared:** 20 August 2026
**Primary Tool:** Playwright (browser-based end-to-end testing)

---

## 1. Testing Philosophy

- **Tests are acceptance criteria** — a feature is not complete until its tests pass
- **Test the business flow, not implementation details** — test what the user sees and does
- **No fake data in assertions** — do not assert against placeholder content
- **Mobile-first** — every user flow tested at mobile viewport before desktop
- Tests run against the staging environment before every production deployment

---

## 2. Test Stack

| Layer | Tool | Purpose |
|---|---|---|
| Browser E2E | Playwright | User flows, SEO, RFQ, search, mobile |
| Unit tests | PHPUnit (Laravel) | Services, utilities (part number normalizer, lead scorer) |
| Feature tests | PHPUnit (Laravel) | Controller responses, form validation, API endpoints |
| Visual regression | Playwright screenshots | Catch unintended UI regressions |
| Performance | Playwright + Lighthouse CI | Core Web Vitals per page type |
| Accessibility | axe-core (Playwright plugin) | WCAG AA compliance |

---

## 3. Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,           // Shared hosting staging — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],

  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://staging.rreinternational.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Mobile first
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    // Desktop
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

---

## 4. Test Suites

### 4.1 Homepage Tests

```typescript
// tests/e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {

  test('loads and displays hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RRE International/);
    await expect(page.locator('h1')).toBeVisible();
    // Hero must not be empty
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text?.length).toBeGreaterThan(10);
  });

  test('part number search bar is visible and functional', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByTestId('hero-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('335/Y1459');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/search/);
  });

  test('primary RFQ CTA is visible above the fold', async ({ page }) => {
    await page.goto('/');
    const rfqCta = page.getByTestId('hero-rfq-cta');
    await expect(rfqCta).toBeInViewport();
    await expect(rfqCta).toBeVisible();
  });

  test('WhatsApp CTA is visible', async ({ page }) => {
    await page.goto('/');
    const whatsappCta = page.getByTestId('hero-whatsapp-cta');
    await expect(whatsappCta).toBeVisible();
    // WhatsApp link must have correct href pattern
    const href = await whatsappCta.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\//);
  });

  test('product categories are displayed', async ({ page }) => {
    await page.goto('/');
    const categories = page.getByTestId('category-grid');
    await expect(categories).toBeVisible();
    const categoryLinks = categories.locator('a');
    await expect(categoryLinks).toHaveCount({ minimum: 3 });
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    const navLinks = ['/products/', '/brands/', '/machines/', '/rfq', '/contact'];
    for (const link of navLinks) {
      await page.goto('/');
      const navLink = page.locator(`nav a[href="${link}"]`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await expect(page).not.toHaveURL('/');
        await page.goBack();
      }
    }
  });

  test('mobile: sticky WhatsApp CTA visible on scroll', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    const stickyWhatsapp = page.getByTestId('sticky-whatsapp-cta');
    await expect(stickyWhatsapp).toBeVisible();
  });

  test('no placeholder/fake content visible', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').textContent();
    const forbidden = ['Lorem ipsum', 'placeholder', '[CLIENT INPUT REQUIRED]', 'DEMO DATA'];
    for (const term of forbidden) {
      expect(bodyText?.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

});
```

---

### 4.2 Search Tests

```typescript
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Part Number Search', () => {

  test('exact part number search returns results', async ({ page }) => {
    // Use a part number that exists in the test dataset
    await page.goto('/search?q=335Y1459');
    await expect(page.getByTestId('search-results')).toBeVisible();
    await expect(page.getByTestId('search-result-item').first()).toBeVisible();
  });

  test('partial part number search returns results', async ({ page }) => {
    await page.goto('/search?q=335');
    const results = page.getByTestId('search-result-item');
    await expect(results.first()).toBeVisible();
  });

  test('product name search returns results', async ({ page }) => {
    await page.goto('/search?q=hydraulic+pump');
    const results = page.getByTestId('search-result-item');
    await expect(results.first()).toBeVisible();
  });

  test('machine model search works', async ({ page }) => {
    await page.goto('/search?q=JCB+3DX');
    await expect(page.getByTestId('search-results')).toBeVisible();
  });

  test('no results shows correct empty state', async ({ page }) => {
    await page.goto('/search?q=XXXXXNONEXISTENT99999');
    await expect(page.getByTestId('search-empty-state')).toBeVisible();
    // Empty state must have a WhatsApp or RFQ CTA
    const cta = page.getByTestId('search-empty-cta');
    await expect(cta).toBeVisible();
  });

  test('search results are paginated', async ({ page }) => {
    await page.goto('/search?q=jcb');
    // If more than one page of results, pagination is visible
    const pagination = page.getByTestId('search-pagination');
    // Only assert if results fill more than one page
    const count = await page.getByTestId('search-result-item').count();
    if (count >= 10) {
      await expect(pagination).toBeVisible();
    }
  });

  test('search tracks UTM attribution correctly', async ({ page }) => {
    // UTM in URL must be preserved through to RFQ
    await page.goto('/search?q=hydraulic+pump&utm_source=google&utm_medium=cpc&utm_campaign=jcb_parts');
    const rfqLink = page.getByTestId('search-rfq-cta').first();
    if (await rfqLink.isVisible()) {
      await rfqLink.click();
      const rfqUrl = page.url();
      // UTM should be stored in session; not necessarily in URL
      // Check that the RFQ page loads successfully
      await expect(page).toHaveURL(/\/rfq/);
    }
  });

  test('mobile: search bar is accessible and keyboard works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const searchInput = page.getByTestId('hero-search-input');
    await searchInput.tap();
    await searchInput.fill('335Y');
    await expect(page.getByTestId('search-autocomplete')).toBeVisible();
  });

});
```

---

### 4.3 Product Page Tests

```typescript
// tests/e2e/product.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Page', () => {

  const testProductSlug = 'test-hydraulic-pump'; // Use a demo product slug

  test('product page loads with correct structure', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    await expect(page).not.toHaveURL('/404');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('product displays part number', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    await expect(page.getByTestId('product-part-number')).toBeVisible();
  });

  test('product displays availability badge', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const availabilityBadge = page.getByTestId('product-availability');
    await expect(availabilityBadge).toBeVisible();
    const badgeText = await availabilityBadge.textContent();
    // Must show one of the allowed availability states
    expect(['In Stock', 'Request Availability', 'Discontinued'])
      .toContain(badgeText?.trim());
  });

  test('product page does NOT display domestic pricing publicly', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const bodyText = await page.locator('body').textContent();
    // Must not display any ₹ INR pricing to international visitors
    expect(bodyText).not.toMatch(/₹\s*[\d,]+/);
    expect(bodyText?.toLowerCase()).not.toContain('mrp');
  });

  test('RFQ button opens RFQ form', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const rfqBtn = page.getByTestId('product-rfq-btn');
    await expect(rfqBtn).toBeVisible();
    await rfqBtn.click();
    await expect(page).toHaveURL(/\/rfq/);
  });

  test('WhatsApp CTA generates correct URL', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const waBtn = page.getByTestId('product-whatsapp-cta');
    await expect(waBtn).toBeVisible();
    const href = await waBtn.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    expect(href).toContain('text='); // Must have pre-filled message
  });

  test('product page has correct breadcrumbs', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const breadcrumbs = page.getByTestId('breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.locator('a').first()).toHaveText('Home');
  });

  test('product page has compatibility information', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const compatSection = page.getByTestId('product-compatibility');
    await expect(compatSection).toBeVisible();
  });

  test('reference disclaimer is visible', async ({ page }) => {
    await page.goto(`/products/${testProductSlug}`);
    const disclaimer = page.getByTestId('part-number-disclaimer');
    await expect(disclaimer).toBeVisible();
    const disclaimerText = await disclaimer.textContent();
    expect(disclaimerText?.toLowerCase()).toContain('reference');
  });

});
```

---

### 4.4 RFQ Flow Tests

```typescript
// tests/e2e/rfq.spec.ts
import { test, expect } from '@playwright/test';

test.describe('RFQ Form', () => {

  test('RFQ page loads', async ({ page }) => {
    await page.goto('/rfq');
    await expect(page).toHaveTitle(/Request.*Quote|RFQ/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('step 1: buyer identity fields visible', async ({ page }) => {
    await page.goto('/rfq');
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Company')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('WhatsApp')).toBeVisible();
    await expect(page.getByLabel('Country')).toBeVisible();
  });

  test('validation: required fields prevent progression', async ({ page }) => {
    await page.goto('/rfq');
    const nextBtn = page.getByTestId('rfq-next-btn');
    await nextBtn.click();
    // Validation errors must appear
    await expect(page.getByTestId('field-error-name')).toBeVisible();
    await expect(page.getByTestId('field-error-email')).toBeVisible();
  });

  test('validation: invalid email format rejected', async ({ page }) => {
    await page.goto('/rfq');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByTestId('rfq-next-btn').click();
    await expect(page.getByTestId('field-error-email')).toBeVisible();
  });

  test('step 1 to step 2 progression with valid data', async ({ page }) => {
    await page.goto('/rfq');
    await page.getByLabel('Name').fill('Test Buyer');
    await page.getByLabel('Company').fill('Test Company Ltd');
    await page.getByLabel('Email').fill('test@testcompany.com');
    await page.getByLabel('WhatsApp').fill('+971501234567');
    await page.getByLabel('Country').selectOption('UAE');
    await page.getByTestId('rfq-next-btn').click();
    // Should advance to step 2
    await expect(page.getByTestId('rfq-step-2')).toBeVisible();
  });

  test('file upload: valid PDF accepted', async ({ page }) => {
    await page.goto('/rfq');
    // Navigate to file upload step
    // ... (fill steps 1-3)
    const fileInput = page.getByTestId('rfq-file-upload');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'test-bom.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('dummy pdf content'),
      });
      await expect(page.getByTestId('file-upload-success')).toBeVisible();
    }
  });

  test('file upload: executable file rejected', async ({ page }) => {
    await page.goto('/rfq');
    const fileInput = page.getByTestId('rfq-file-upload');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'malware.exe',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from('MZ'),
      });
      await expect(page.getByTestId('file-upload-error')).toBeVisible();
    }
  });

  test('successful RFQ submission shows confirmation', async ({ page }) => {
    await page.goto('/rfq');
    // Fill all required fields across all steps
    await page.getByLabel('Name').fill('Test Buyer');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Country').selectOption('UAE');
    // Navigate through all steps
    await page.getByTestId('rfq-next-btn').click();
    // ... fill step 2, 3
    await page.getByTestId('rfq-submit-btn').click();
    // Confirmation page or message
    await expect(page.getByTestId('rfq-confirmation')).toBeVisible();
    await expect(page.getByTestId('rfq-reference-number')).toBeVisible();
  });

  test('honeypot field prevents spam submission', async ({ page }) => {
    await page.goto('/rfq');
    // Fill the hidden honeypot field (bots do this; humans don't see it)
    await page.locator('[name="website"]').fill('spam');
    await page.getByTestId('rfq-submit-btn').click();
    // Should not proceed or should show generic success (to fool bots)
    await expect(page.getByTestId('rfq-confirmation')).not.toBeVisible();
  });

});
```

---

### 4.5 SEO Tests

```typescript
// tests/e2e/seo.spec.ts
import { test, expect } from '@playwright/test';

const seoPages = [
  { url: '/', name: 'Homepage' },
  { url: '/products/', name: 'Products' },
  { url: '/brands/jcb', name: 'JCB Brand page' },
  { url: '/machines/jcb-3dx', name: 'JCB 3DX machine page' },
  { url: '/rfq', name: 'RFQ page' },
];

test.describe('SEO — Meta and Structure', () => {

  for (const pageConfig of seoPages) {
    test(`${pageConfig.name}: has unique title tag`, async ({ page }) => {
      await page.goto(pageConfig.url);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThanOrEqual(70);
    });

    test(`${pageConfig.name}: has meta description`, async ({ page }) => {
      await page.goto(pageConfig.url);
      const meta = page.locator('meta[name="description"]');
      await expect(meta).toHaveCount(1);
      const content = await meta.getAttribute('content');
      expect(content?.length).toBeGreaterThan(50);
      expect(content?.length).toBeLessThanOrEqual(320);
    });

    test(`${pageConfig.name}: has canonical tag`, async ({ page }) => {
      await page.goto(pageConfig.url);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = await canonical.getAttribute('href');
      expect(href).toMatch(/^https:\/\//);
    });

    test(`${pageConfig.name}: has exactly one H1`, async ({ page }) => {
      await page.goto(pageConfig.url);
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
    });

    test(`${pageConfig.name}: has Open Graph tags`, async ({ page }) => {
      await page.goto(pageConfig.url);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
    });
  }

  test('XML sitemap is accessible and valid', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('xml');
    const content = await page.content();
    expect(content).toContain('<urlset');
    expect(content).toContain('<url>');
    expect(content).toContain('<loc>');
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain('User-agent');
    expect(content).toContain('Sitemap:');
  });

  test('404 page returns correct HTTP status', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    expect(response?.status()).toBe(404);
    // Custom 404 page must show CTA, not blank page
    await expect(page.getByTestId('error-404-cta')).toBeVisible();
  });

  test('product page has Product schema markup', async ({ page }) => {
    await page.goto('/products/test-hydraulic-pump');
    const schema = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(schema || '{}');
    expect(parsed['@type']).toBe('Product');
    expect(parsed.name).toBeDefined();
  });

  test('breadcrumbs have BreadcrumbList schema', async ({ page }) => {
    await page.goto('/products/test-hydraulic-pump');
    const schemas = await page.locator('script[type="application/ld+json"]').all();
    const schemaTexts = await Promise.all(schemas.map(s => s.textContent()));
    const hasBreadcrumb = schemaTexts.some(t => t?.includes('BreadcrumbList'));
    expect(hasBreadcrumb).toBe(true);
  });

});
```

---

### 4.6 Mobile Tests

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test.describe('Mobile Experience', () => {

  test('navigation menu opens on mobile', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.getByTestId('mobile-menu-btn');
    await expect(menuBtn).toBeVisible();
    await menuBtn.tap();
    await expect(page.getByTestId('mobile-nav')).toBeVisible();
  });

  test('sticky WhatsApp CTA is always visible on mobile', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    const stickyWa = page.getByTestId('sticky-whatsapp-cta');
    await expect(stickyWa).toBeVisible();
  });

  test('RFQ form is usable on mobile', async ({ page }) => {
    await page.goto('/rfq');
    const nameField = page.getByLabel('Name');
    await expect(nameField).toBeVisible();
    // Input must be large enough to tap
    const box = await nameField.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44); // 44px minimum touch target
  });

  test('search bar is accessible on mobile homepage', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByTestId('hero-search-input');
    await expect(searchInput).toBeVisible();
    const box = await searchInput.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('product images load correctly on mobile', async ({ page }) => {
    await page.goto('/products/test-hydraulic-pump');
    const productImage = page.getByTestId('product-main-image');
    await expect(productImage).toBeVisible();
    // Ensure image has alt text
    const alt = await productImage.getAttribute('alt');
    expect(alt?.length).toBeGreaterThan(0);
    expect(alt).not.toBe('image');
  });

  test('WhatsApp CTA links open in correct format on mobile', async ({ page }) => {
    await page.goto('/products/test-hydraulic-pump');
    const waBtn = page.getByTestId('product-whatsapp-cta');
    await expect(waBtn).toBeVisible();
    const href = await waBtn.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\//);
  });

});
```

---

### 4.7 Performance Tests

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {

  test('homepage passes basic performance checks', async ({ page }) => {
    await page.goto('/');
    // Check page loads within reasonable time
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    expect(loadTime).toBeLessThan(5000); // 5s max on staging (shared hosting)
  });

  test('no render-blocking resources on critical path', async ({ page }) => {
    const blockedResources: string[] = [];
    page.on('response', response => {
      const url = response.url();
      // Flag large JS files loaded synchronously in head
      if (url.endsWith('.js') && response.status() === 200) {
        // This is a simplified check — use Lighthouse for full CWV
      }
    });
    await page.goto('/');
  });

  test('images have width and height attributes (CLS prevention)', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images.slice(0, 10)) {
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      // Images must have dimensions to prevent layout shift
      const isAboveFold = await img.isInViewport();
      if (isAboveFold) {
        expect(width || await img.evaluate(el => el.style.width)).toBeTruthy();
      }
    }
  });

});
```

---

## 5. PHPUnit Tests (Laravel)

### 5.1 Unit Tests

```php
// tests/Unit/Services/PartNumberNormalizerTest.php
class PartNumberNormalizerTest extends TestCase
{
    public function test_normalizes_with_slash(): void
    {
        $service = new PartNumberNormalizerService();
        $this->assertEquals('335y1459', $service->normalize('335/Y1459'));
    }

    public function test_normalizes_with_hyphens(): void
    {
        $service = new PartNumberNormalizerService();
        $this->assertEquals('335y1459', $service->normalize('335-Y-1459'));
    }

    public function test_normalizes_with_spaces(): void
    {
        $service = new PartNumberNormalizerService();
        $this->assertEquals('335y1459', $service->normalize('335 Y 1459'));
    }
}
```

### 5.2 Feature Tests

```php
// tests/Feature/RfqSubmissionTest.php
class RfqSubmissionTest extends TestCase
{
    public function test_valid_rfq_is_stored_in_database(): void
    {
        $response = $this->post('/rfq', [
            'name'    => 'Test Buyer',
            'email'   => 'buyer@test.com',
            'country' => 'UAE',
            'message' => 'Need hydraulic pump for JCB 3DX',
            '_token'  => csrf_token(),
        ]);
        $response->assertRedirect('/rfq/confirmation');
        $this->assertDatabaseHas('rfqs', ['lead_email' => 'buyer@test.com']);
    }

    public function test_rfq_with_invalid_email_is_rejected(): void
    {
        $response = $this->post('/rfq', [
            'name'  => 'Test',
            'email' => 'not-an-email',
        ]);
        $response->assertSessionHasErrors('email');
    }

    public function test_executable_file_upload_is_rejected(): void
    {
        $file = UploadedFile::fake()->create('malware.exe', 100, 'application/octet-stream');
        $response = $this->post('/rfq/upload', ['attachment' => $file]);
        $response->assertStatus(422);
    }
}
```

---

## 6. Pre-Production Test Checklist

Run before every production deployment:

### Functional
- [ ] Homepage loads; no 500 errors
- [ ] Part number search returns results
- [ ] Product page loads; availability badge correct; no INR prices displayed
- [ ] RFQ form: all steps accessible; validation works; submission creates DB record
- [ ] RFQ confirmation email received by sales team
- [ ] WhatsApp CTA generates correct pre-filled message
- [ ] 404 page loads; shows branded content with CTA

### SEO
- [ ] `<title>` unique on each page type
- [ ] Meta description present on all indexable pages
- [ ] `<link rel="canonical">` present and correct
- [ ] Exactly one `<h1>` per page
- [ ] `/sitemap.xml` returns 200 and valid XML
- [ ] `/robots.txt` returns 200; contains Sitemap directive
- [ ] Product schema validated at schema.org validator
- [ ] No `[CLIENT INPUT REQUIRED]` text visible in page source

### Mobile
- [ ] Navigation menu opens on mobile viewport
- [ ] Sticky WhatsApp CTA visible on scroll (mobile)
- [ ] RFQ form fields have ≥ 44px touch targets
- [ ] No horizontal scroll on any page at 375px width

### Security
- [ ] `APP_DEBUG=false` confirmed
- [ ] HTTPS enforced; HTTP redirects to HTTPS
- [ ] Security headers present (X-Frame-Options, X-Content-Type-Options)
- [ ] CSRF token present on all POST forms
- [ ] File upload rejects `.exe`, `.php`, `.sh` files

### Performance
- [ ] Homepage loads in < 5 seconds on staging
- [ ] Cloudflare CDN headers visible on static assets
- [ ] OPcache enabled (verify via phpinfo page — remove after check)

---

## 7. Test Data Policy

- Tests use **seeded demo data** — never production data
- Demo data is clearly marked `is_demo = true` in seed files
- Test database is separate from production (`rre_testing`)
- No real customer email addresses or phone numbers in test fixtures
- Test product slugs: prefix `test-` (e.g., `test-hydraulic-pump`)

---

*End of TESTING_STRATEGY.md*
