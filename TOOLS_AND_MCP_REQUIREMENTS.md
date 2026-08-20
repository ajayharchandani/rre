# TOOLS_AND_MCP_REQUIREMENTS.md
## RRE International — Required Tools, Extensions & MCP Servers

**Version:** 1.0
**Prepared:** 20 August 2026

---

## 1. Local Development Environment

### 1.1 Required Software (Developer Workstation)

| Tool | Version | Purpose | Required |
|---|---|---|---|
| PHP | 8.2+ | Local development runtime | ✅ YES |
| Composer | 2.x | PHP dependency management | ✅ YES |
| MySQL | 8.0+ | Local database | ✅ YES |
| Node.js | 20 LTS | Vite asset build + Playwright | ✅ YES |
| npm | 10+ | JS dependency management | ✅ YES |
| Git | 2.40+ | Version control | ✅ YES |
| SSH client | Any | Hostinger server access | ✅ YES |
| FileZilla (SFTP) | Latest | File transfers to Hostinger | ✅ YES |

### 1.2 Local PHP Setup (Windows)

**Option A — Laragon (Recommended for Windows):**
- Download: https://laragon.org/
- Includes PHP 8.2+, MySQL 8.0, Apache/Nginx, Composer, Git
- One-click setup; no manual configuration
- Switch PHP versions easily

**Option B — PHP + MySQL separately:**
```powershell
# Check PHP
php -v  # Must show 8.2+

# Check Composer
composer -V

# Check MySQL
mysql --version
```

### 1.3 Laravel Setup
```bash
# Install Laravel installer globally
composer global require laravel/installer

# Create new project
laravel new rre-international
cd rre-international

# Or clone existing repo
git clone [repo_url] rre-international
cd rre-international
composer install
npm install
cp .env.example .env
php artisan key:generate
```

---

## 2. Required Laravel Packages (Composer)

### 2.1 Production Dependencies

```json
{
  "require": {
    "php": "^8.2",
    "laravel/framework": "^11.0",
    "laravel/tinker": "^2.9",

    // Admin panel
    "filament/filament": "^3.0",

    // Role-based access control
    "spatie/laravel-permission": "^6.0",

    // SEO
    "artesaos/seotools": "^1.3",
    "spatie/laravel-sitemap": "^7.0",

    // File uploads & media
    "spatie/laravel-medialibrary": "^11.0",

    // Slug generation
    "spatie/laravel-sluggable": "^3.6",

    // Activity log (for lead_activities)
    "spatie/laravel-activitylog": "^4.8",

    // Laravel Livewire
    "livewire/livewire": "^3.0",

    // Honeypot spam protection
    "spatie/laravel-honeypot": "^4.3",

    // Data backup (optional: for DB backup command)
    "spatie/laravel-backup": "^8.6"
  }
}
```

### 2.2 Development Dependencies

```json
{
  "require-dev": {
    "fakerphp/faker": "^1.23",
    "laravel/breeze": "^2.0",
    "laravel/pint": "^1.13",
    "laravel/sail": "^1.26",
    "mockery/mockery": "^1.6",
    "nunomaduro/collision": "^8.0",
    "phpunit/phpunit": "^11.0",
    "barryvdh/laravel-debugbar": "^3.13"
  }
}
```

---

## 3. Required NPM Packages

### 3.1 Production Build Dependencies

```json
{
  "devDependencies": {
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "vite": "^5.0.0",
    "laravel-vite-plugin": "^1.0.0",
    "@alpinejs/focus": "^3.13.5",
    "alpinejs": "^3.13.5"
  },
  "dependencies": {}
}
```

### 3.2 Testing Tools (NPM)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@axe-core/playwright": "^4.9.0"
  }
}
```

---

## 4. VS Code Extensions (Recommended)

| Extension | Publisher | Purpose |
|---|---|---|
| PHP Intelephense | bmewburn | PHP code intelligence |
| Laravel Blade Snippets | onecentlin | Blade syntax highlighting + snippets |
| Laravel Artisan | ryannaddy | Run Artisan commands from VS Code |
| Tailwind CSS IntelliSense | bradlc | Tailwind class autocomplete |
| Prettier | esbenp | Code formatting |
| Laravel Pint | open-southeners | PHP code style (Laravel's own formatter) |
| GitLens | gitkraken | Enhanced Git history and blame |
| DotENV | mikestead | `.env` file syntax highlighting |
| MySQL Shell for VS Code | Oracle | Database browsing + query runner |
| Playwright Test for VS Code | ms-playwright | Run Playwright tests in editor |
| Error Lens | usernamehw | Inline error display |
| GitHub Copilot | GitHub | AI code assistance (optional) |

### 4.1 VS Code Settings for This Project

```json
// .vscode/settings.json (committed to repo)
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[php]": {
    "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
  },
  "tailwindCSS.includeLanguages": {
    "blade": "html"
  },
  "files.associations": {
    "*.blade.php": "blade"
  },
  "intelephense.stubs": [
    "apache", "bcmath", "calendar", "Core", "ctype",
    "curl", "date", "dom", "fileinfo", "filter",
    "gd", "hash", "iconv", "json", "mbstring",
    "mysql", "mysqli", "openssl", "pcre", "PDO",
    "pdo_mysql", "session", "tokenizer", "xml", "zip"
  ]
}
```

---

## 5. Browser Developer Tools

| Tool | Purpose | Required |
|---|---|---|
| Chrome DevTools | Performance, network, responsive testing | ✅ YES |
| Firefox DevTools | Cross-browser validation | ✅ YES |
| Chrome Lighthouse | Core Web Vitals measurement | ✅ YES |
| axe DevTools (Chrome extension) | Accessibility auditing | 🟡 Recommended |
| Schema Markup Validator | https://validator.schema.org | ✅ YES — validate all JSON-LD |
| Google Rich Results Test | https://search.google.com/test/rich-results | ✅ YES |
| Open Graph debugger | https://developers.facebook.com/tools/debug/ | 🟡 Recommended |
| Google Search Console | Crawl monitoring, search performance | ✅ YES |

---

## 6. External Services & Accounts

### 6.1 Required Now (Phase 1)

| Service | Purpose | Cost | Setup Required |
|---|---|---|---|
| Hostinger hPanel | Hosting management | Already paid | Verify SSH, cron, PHP config |
| Cloudflare (free) | CDN, DNS, WAF, Turnstile | Free | Add domain to Cloudflare |
| Cloudflare R2 | Image/file storage (10GB free/month) | Free (up to 10GB egress) | Create R2 bucket, API keys |
| Brevo (free tier) | Transactional email (300/day free) | Free initially | Create account, SMTP credentials |
| Google Analytics 4 | Traffic analytics | Free | Create GA4 property |
| Google Tag Manager | Tag management | Free | Create GTM container |
| Google Search Console | SEO monitoring | Free | Verify domain ownership |
| GitHub (private repo) | Version control | Free (private repos) | Create org/repo |

### 6.2 Required Before Launch

| Service | Purpose | Cost | Notes |
|---|---|---|---|
| WhatsApp Business | Official export desk number | Free app | **[CLIENT INPUT REQUIRED]** — confirm number |
| Domain registration | `rreinternational.com` | ~₹800/year | Already referenced in client catalogue |
| SSL Certificate | HTTPS | Free (Hostinger Let's Encrypt) | Already included |

### 6.3 Required Later (Future Phases)

| Service | Purpose | When Needed |
|---|---|---|
| Meta Pixel | Paid social ads attribution | If/when paid social campaigns run |
| Google Ads | PPC campaign tracking | If/when paid search campaigns run |
| CRM (HubSpot/Pipedrive/Zoho) | Lead management system | Phase 6+ when lead volume justifies |
| Meta WhatsApp Cloud API | Automated WhatsApp responses | Phase 2 when lead volume justifies |
| n8n (self-hosted) | Workflow automation | Phase 2 with CRM integration |
| Meilisearch (self-hosted) | Advanced part-number search | After migration to VPS |
| Redis | Cache/queue upgrade | After migration to VPS |
| Laravel Horizon | Queue monitoring | After Redis + VPS migration |
| Semrush / Ahrefs | Keyword research | Phase 1 SEO planning |
| BrowserStack / LambdaTest | Cross-device testing | Optional; Playwright covers most |

---

## 7. MCP Servers

> MCP (Model Context Protocol) servers extend AI assistant capabilities for specific workflows.

### 7.1 Required MCPs

| MCP | Purpose | When to Use |
|---|---|---|
| **Playwright MCP** | Browser automation; run tests; verify pages in browser | Running E2E tests; checking live pages; verifying SEO metadata; testing RFQ forms |
| **Filesystem MCP** | Read/write project files | Code generation; reviewing existing files |

### 7.2 Useful MCPs

| MCP | Purpose | When to Use |
|---|---|---|
| **GitHub MCP** | Repository management; PR creation; branch management | When Git workflow is established and PRs need review |
| **MySQL MCP** | Direct database querying | Database inspection; schema verification; query testing |
| **Fetch MCP** | HTTP requests to external APIs | Testing WhatsApp deep links; verifying sitemaps; checking external services |

### 7.3 MCPs NOT Required for This Project

| MCP | Reason Not Needed |
|---|---|
| Docker MCP | No Docker on Hostinger shared hosting |
| Kubernetes MCP | No Kubernetes at this stage |
| Elasticsearch MCP | Using MySQL FULLTEXT search in Phase 1 |
| Redis MCP | No Redis on shared hosting |
| AWS MCP | Using Cloudflare R2 and Hostinger; not AWS |
| Vercel MCP | Not using Vercel; using Hostinger |

---

## 8. Playwright Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install chromium firefox webkit

# Run tests
npx playwright test

# Run specific suite
npx playwright test tests/e2e/homepage.spec.ts

# Run mobile tests only
npx playwright test --project=mobile-chrome

# Generate test report
npx playwright show-report
```

### 8.1 Playwright MCP Configuration (for AI-assisted testing)

```json
// mcp_config.json — add to Antigravity MCP config
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/test", "--ui"],
    "env": {
      "TEST_BASE_URL": "https://staging.rreinternational.com"
    }
  }
}
```

---

## 9. Code Quality Tools

### 9.1 Laravel Pint (PHP code style)

```bash
# Check code style
./vendor/bin/pint --test

# Fix code style
./vendor/bin/pint
```

```json
// pint.json
{
  "preset": "laravel",
  "rules": {
    "ordered_imports": true,
    "no_unused_imports": true
  }
}
```

### 9.2 PHPUnit Configuration

```xml
<!-- phpunit.xml -->
<php>
  <env name="APP_ENV" value="testing"/>
  <env name="DB_CONNECTION" value="mysql"/>
  <env name="DB_DATABASE" value="rre_testing"/>
  <env name="CACHE_DRIVER" value="array"/>
  <env name="QUEUE_CONNECTION" value="sync"/>
  <env name="SESSION_DRIVER" value="array"/>
</php>
```

---

## 10. Version Control Tools

| Tool | Purpose |
|---|---|
| Git (CLI) | All version control operations |
| GitHub | Remote repository hosting (private) |
| GitHub Actions | Optional: automated Playwright tests on PR |
| `.editorconfig` | Consistent file formatting across editors |

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true

[*.{json,js,ts,css}]
indent_size = 2

[*.blade.php]
indent_size = 4
```

---

*End of TOOLS_AND_MCP_REQUIREMENTS.md*
