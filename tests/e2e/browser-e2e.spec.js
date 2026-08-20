// tests/e2e/browser-e2e.spec.js
const { test, expect } = require('@playwright/test');

test.describe('RRE International — End-to-End User & SEO Experience', () => {

  test('1. Homepage Loads with SEO Tags, Hero Search, and ISO Certification', async ({ page }) => {
    await page.goto('/');
    
    // Check title and meta
    await expect(page).toHaveTitle(/RRE International/);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /ISO 9001:2015/);

    // Verify H1 element
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Replacement Spare Parts for Heavy Earthmoving Machinery');

    // Verify Search Engine Input
    const searchInput = page.locator('.hero-section .search-input').first();
    await expect(searchInput).toBeVisible();

    // Verify WhatsApp and RFQ CTAs
    const rfqCta = page.locator('a[href="/rfq"]').first();
    await expect(rfqCta).toBeVisible();

    const waCta = page.locator('a[href^="https://wa.me/"]').first();
    await expect(waCta).toBeVisible();
  });

  test('2. Live Search Autocomplete and Results Navigation', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('.hero-section .search-input').first();
    await searchInput.fill('335');
    await page.waitForTimeout(600); // Debounce wait

    // Autocomplete dropdown should be populated
    const dropdown = page.locator('.hero-section .autocomplete-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('335/Y1459');

    // Click through to the Part Number page
    const item = dropdown.locator('a.autocomplete-item').first();
    await item.click();

    await expect(page).toHaveURL(/\/parts\/335-y1459/);
    await expect(page.locator('h1')).toContainText('335/Y1459');
  });

  test('3. Dedicated Part Number Page Structure and Intent Answer', async ({ page }) => {
    await page.goto('/parts/335-y1459');

    // Verify direct answer box
    await expect(page.locator('text=Quick Reference: What is Part Number 335/Y1459?')).toBeVisible();
    await expect(page.locator('main').getByText('Tandem Main Hydraulic Gear Pump').first()).toBeVisible();

    // Verify machine model compatibility
    await expect(page.locator('main a', { hasText: 'JCB 3DX' }).first()).toBeVisible();

    // Verify WhatsApp deep link contains part number
    const waButton = page.locator('main a.btn-whatsapp').first();
    const href = await waButton.getAttribute('href');
    expect(href).toContain('335%2FY1459');
  });

  test('4. Product Detail Page with Specifications and Breadcrumbs', async ({ page }) => {
    await page.goto('/products/tandem-hydraulic-gear-pump-jcb-3dx-335-y1459');

    await expect(page.locator('h1')).toContainText('Tandem Main Hydraulic Gear Pump');
    await expect(page.locator('.spec-table')).toBeVisible();
    await expect(page.locator('text=Displacement (Front / Rear)')).toBeVisible();

    // Verify Breadcrumbs
    const breadcrumbs = page.locator('.breadcrumb-list');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText('Home');
    await expect(breadcrumbs).toContainText('Hydraulic Pumps & Valves');
  });

  test('5. Multi-Step RFQ Form Submission Flow', async ({ page }) => {
    await page.goto('/rfq?part=335/Y1459');

    // Step 1: Contact
    await page.fill('input[name="name"]', 'Ahmed Al-Mansoor');
    await page.fill('input[name="company"]', 'Gulf Earthmoving Equipment LLC');
    await page.fill('input[name="email"]', 'ahmed@gulfmachinery.ae');
    await page.fill('input[name="whatsapp"]', '+971501234567');
    await page.selectOption('select[name="country"]', 'United Arab Emirates');
    await page.click('.js-rfq-next');

    // Step 2: Parts
    await expect(page.locator('.rfq-step-panel[data-step="2"]')).toBeVisible();
    await expect(page.locator('input[name="part_number"]')).toHaveValue('335/Y1459');
    await page.click('.rfq-step-panel[data-step="2"] .js-rfq-next');

    // Step 3: Logistics
    await expect(page.locator('.rfq-step-panel[data-step="3"]')).toBeVisible();
    await page.fill('input[name="destination_port"]', 'Jebel Ali Port, Dubai');
    await page.click('.rfq-step-panel[data-step="3"] .js-rfq-next');

    // Step 4: Submit via RFQ form submit button
    await expect(page.locator('.rfq-step-panel[data-step="4"]')).toBeVisible();
    await page.click('.js-rfq-wizard button[type="submit"]');

    // Confirmation page
    await expect(page).toHaveURL(/\/rfq\/confirmation/);
    await expect(page.locator('h1')).toContainText('Quotation Request Submitted Successfully');
    await expect(page.locator('text=RRE-RFQ-').first()).toBeVisible();
  });

  test('6. Mobile Viewport Navigation and Sticky CTA', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile sticky bottom CTA must be visible
    const stickyBar = page.locator('#mobile-sticky-bar');
    await expect(stickyBar).toBeVisible();

    // Mobile menu toggle
    const toggle = page.locator('.js-mobile-menu-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    const drawer = page.locator('.js-mobile-nav-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Catalog & Categories');
  });

  test('7. 404 Error Page Handles Invalid URLs Gracefully', async ({ page }) => {
    await page.goto('/unknown-parts-random-404-check');
    await expect(page.locator('h1')).toContainText('Page or Part Number Not Found');
    await expect(page.locator('main .search-input')).toBeVisible();
  });

});
