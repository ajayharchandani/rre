# SKILLS_REQUIRED.md
## RRE International — Required Development Skills

**Version:** 1.0
**Prepared:** 20 August 2026

---

## Overview

This document defines the minimum skill set required to build, deploy, and maintain the RRE International website. Skills are rated by criticality:

- 🔴 **CRITICAL** — Blockers. Development cannot proceed without these.
- 🟡 **IMPORTANT** — Needed for quality delivery; gaps will cause rework.
- 🟢 **USEFUL** — Beneficial; can be learned during development.

---

## 1. Backend Development

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| PHP 8.2+ | Proficient | 🔴 CRITICAL | Named arguments, enums, readonly properties, fibers |
| Laravel 11.x | Proficient | 🔴 CRITICAL | Routing, middleware, Eloquent, Blade, Livewire, queues, events, policies |
| Laravel Eloquent ORM | Proficient | 🔴 CRITICAL | Relationships, scopes, eager loading, pagination, raw queries with bindings |
| Laravel Form Requests | Proficient | 🔴 CRITICAL | Server-side validation is non-negotiable |
| Laravel Mail + SMTP | Familiar | 🟡 IMPORTANT | RFQ notification emails |
| Laravel Queues (database driver) | Familiar | 🟡 IMPORTANT | Background job processing |
| Laravel Cache (file driver) | Familiar | 🟡 IMPORTANT | Page and query caching |
| Laravel Artisan Commands | Familiar | 🟡 IMPORTANT | Scheduled tasks, bulk imports |
| Filament 3.x | Familiar | 🟡 IMPORTANT | Admin panel; actively maintained Laravel ecosystem |
| spatie/laravel-permission | Familiar | 🟡 IMPORTANT | Role-based access control |
| spatie/laravel-sitemap | Familiar | 🟢 USEFUL | Programmatic sitemap generation |
| PHP file upload security | Proficient | 🔴 CRITICAL | MIME validation, path traversal prevention, secure storage |
| Composer | Proficient | 🔴 CRITICAL | Dependency management; lock file discipline |

---

## 2. Database

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| MySQL 8.0 | Proficient | 🔴 CRITICAL | Schema design, indexes, foreign keys, FULLTEXT search |
| Relational data modelling | Proficient | 🔴 CRITICAL | Normalisation, many-to-many, one-to-many, self-referencing |
| MySQL index design | Proficient | 🔴 CRITICAL | Composite indexes, covering indexes, FULLTEXT indexes |
| Query optimization | Proficient | 🟡 IMPORTANT | EXPLAIN, avoiding table scans, N+1 detection |
| Laravel migrations | Proficient | 🔴 CRITICAL | Version-controlled, reversible schema changes |
| MySQL JSON columns | Familiar | 🟡 IMPORTANT | Used for product specifications, schema markup |
| mysqldump / backup | Familiar | 🟡 IMPORTANT | Production backup and restore procedures |
| Database seeding | Familiar | 🟢 USEFUL | Demo/test data management |

---

## 3. Frontend

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| HTML5 semantic markup | Proficient | 🔴 CRITICAL | Accessibility, SEO, structured content |
| Tailwind CSS 3.x | Proficient | 🔴 CRITICAL | Utility-first; custom design system via config |
| Laravel Blade | Proficient | 🔴 CRITICAL | Components, layouts, sections, stacks |
| Laravel Livewire 3.x | Familiar | 🟡 IMPORTANT | RFQ multi-step form, live search |
| Alpine.js | Familiar | 🟡 IMPORTANT | Bundled with Livewire; used for UI interactions |
| Vite (asset bundling) | Familiar | 🟡 IMPORTANT | Local development and production builds |
| Responsive design | Proficient | 🔴 CRITICAL | Mobile-first; 375px to 1440px |
| CSS Grid / Flexbox | Proficient | 🔴 CRITICAL | Modern layout |
| Web performance | Familiar | 🟡 IMPORTANT | Lazy loading, responsive images, font loading |
| Accessibility (WCAG AA) | Familiar | 🟡 IMPORTANT | Keyboard nav, ARIA, colour contrast |
| SVG icons / sprites | Familiar | 🟢 USEFUL | Lucide icons implementation |
| JavaScript (ES2022+) | Familiar | 🟡 IMPORTANT | Minimal custom JS; Alpine.js patterns |

---

## 4. SEO & Digital Marketing

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| Technical SEO | Proficient | 🔴 CRITICAL | Canonical, robots, sitemaps, crawl budget |
| Structured data / JSON-LD | Proficient | 🔴 CRITICAL | Product, Organization, BreadcrumbList, FAQPage schemas |
| Open Graph / Twitter Cards | Familiar | 🟡 IMPORTANT | Social sharing metadata |
| Programmatic SEO | Familiar | 🔴 CRITICAL | Indexability rules; preventing thin/duplicate content |
| Google Analytics 4 (GA4) | Familiar | 🟡 IMPORTANT | Event configuration, funnel analysis |
| Google Tag Manager | Familiar | 🟡 IMPORTANT | Tag/event deployment without code changes |
| Google Search Console | Familiar | 🟡 IMPORTANT | Crawl monitoring, performance data |
| UTM attribution | Familiar | 🟡 IMPORTANT | Campaign tracking, session persistence |
| Core Web Vitals | Familiar | 🟡 IMPORTANT | LCP, INP, CLS measurement and optimisation |
| International SEO | Familiar | 🟡 IMPORTANT | Country pages, hreflang awareness, export SEO |

---

## 5. DevOps / Deployment

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| Linux command line (bash) | Familiar | 🔴 CRITICAL | SSH, file permissions, cron, log files |
| SSH / SFTP | Familiar | 🔴 CRITICAL | Deployment, file management on Hostinger |
| Git | Proficient | 🔴 CRITICAL | Branch strategy, commit conventions, protected branches |
| Shared hosting deployment | Familiar | 🔴 CRITICAL | Hostinger-specific constraints: PHP path, cron, htaccess |
| Apache `.htaccess` | Familiar | 🟡 IMPORTANT | Rewrites, redirects, security headers, PHP directives |
| Cron job configuration | Familiar | 🟡 IMPORTANT | Laravel scheduler via Hostinger cron |
| Let's Encrypt / SSL | Familiar | 🟢 USEFUL | Managed by Hostinger hPanel |
| Cloudflare (free tier) | Familiar | 🟡 IMPORTANT | DNS, CDN, caching rules, Turnstile |
| Environment variable management | Proficient | 🔴 CRITICAL | Secure `.env` discipline; never commit secrets |
| Database backup & restore | Familiar | 🟡 IMPORTANT | mysqldump, restore procedures |

---

## 6. Security

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| OWASP Top 10 awareness | Familiar | 🔴 CRITICAL | CSRF, XSS, SQL injection, file upload attacks |
| Laravel security features | Proficient | 🔴 CRITICAL | CSRF middleware, input sanitization, rate limiting |
| File upload security | Proficient | 🔴 CRITICAL | MIME validation, path traversal prevention |
| Security headers | Familiar | 🟡 IMPORTANT | X-Frame-Options, CSP, Referrer-Policy via .htaccess |
| Password security | Familiar | 🔴 CRITICAL | Laravel Bcrypt hashing; no plaintext passwords |
| Rate limiting | Familiar | 🟡 IMPORTANT | Laravel throttle middleware on public endpoints |
| Spam prevention | Familiar | 🟡 IMPORTANT | Honeypot fields; Cloudflare Turnstile |

---

## 7. Testing

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| Playwright | Familiar | 🟡 IMPORTANT | Browser E2E tests; key flows must be automated |
| PHPUnit | Familiar | 🟡 IMPORTANT | Unit and feature tests for services and validation |
| Test data management | Familiar | 🟡 IMPORTANT | Seeders, factories, test isolation |
| SEO validation | Familiar | 🟡 IMPORTANT | Schema.org validator, canonical checks |

---

## 8. Business Domain Knowledge

| Skill | Level Required | Criticality | Notes |
|---|---|---|---|
| B2B lead generation concepts | Familiar | 🟡 IMPORTANT | RFQ flows, lead scoring, attribution |
| Industrial/spare parts domain | Basic awareness | 🟢 USEFUL | Understanding part number conventions (OE, cross-ref) |
| International B2B export | Basic awareness | 🟢 USEFUL | FOB/CIF, HS codes, import documentation concepts |
| WhatsApp Business conventions | Familiar | 🟡 IMPORTANT | `wa.me` deep links, pre-filled messages |
| Incoterms awareness | Basic awareness | 🟢 USEFUL | FOB, CIF, EXW — relevant for product/RFQ copy |

---

## 9. Team Composition Recommendation

For Phase 1 (Architecture + Foundation + Core Features):

| Role | Minimum | Notes |
|---|---|---|
| Lead Full-Stack Developer (Laravel) | 1 | Must cover items marked 🔴 CRITICAL above |
| Frontend Developer (Blade/Tailwind) | 1 or same as above | Can be same person at this stage |
| SEO Architect / Reviewer | 1 (part-time) | Review programmatic SEO decisions; audit metadata |
| DevOps / Deployment Support | 1 (part-time) | Hostinger setup, cron, SSH, Cloudflare |

A single senior full-stack Laravel developer can handle Phase 1 solo if they cover the critical skill areas. SEO and DevOps can be part-time or consultant support.

**What this project does NOT require at Phase 1:**
- Node.js/React developer
- Data scientist
- Cloud infrastructure engineer
- DBA (separate role) — Eloquent + migrations handle schema management

---

*End of SKILLS_REQUIRED.md*
