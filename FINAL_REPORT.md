# RRE INTERNATIONAL — FINAL ARCHITECTURE REPORT

**Prepared:** 20 August 2026
**Lead Architect Role:** Lead Software Architect / Senior Full-Stack Developer / DevOps Engineer / SEO Architect / CRO Engineer
**Based on:** PROJECT_MASTER_PLAN.md (Draft v1.0, 19 August 2026) + Hostinger Premium audit

---

## HOSTINGER COMPATIBILITY

> **✅ COMPATIBLE**

Laravel 11.x + MySQL 8.0 + Blade + Livewire + Tailwind CSS is **fully deployable** on Hostinger Premium Shared Hosting. All required PHP extensions are available. SSH, Git deployment, cron jobs, free SSL, and CDN integration are all confirmed. Primary constraints (no Redis, 20 entry processes, 600K inodes, no persistent processes) are manageable through architecture decisions — not blockers.

The master plan's originally suggested stack (Next.js + PostgreSQL + Meilisearch) is **NOT compatible** with this hosting environment and has been replaced with the Laravel stack, which is technically superior for Hostinger deployment while meeting all the same business objectives.

---

## RECOMMENDED STACK

| Layer | Technology | Version |
|---|---|---|
| **Language** | PHP | 8.2+ |
| **Framework** | Laravel | 11.x |
| **Database** | MySQL | 8.0 |
| **ORM** | Laravel Eloquent | (included) |
| **Frontend templates** | Laravel Blade | (included) |
| **Reactive UI** | Laravel Livewire | 3.x |
| **Styling** | Tailwind CSS | 3.x (compiled locally) |
| **Icons** | Lucide SVG sprite | Latest |
| **Asset build** | Vite | 5.x (local only — never runs on Hostinger) |
| **Admin panel** | Filament | 3.x |
| **Access control** | spatie/laravel-permission | 6.x |
| **SEO** | artesaos/seotools + spatie/laravel-sitemap | Latest |
| **Cache** | Laravel file driver | (included) |
| **Queue** | Laravel database driver + cron | (included) |
| **Search (Phase 1)** | MySQL FULLTEXT indexes | (included) |
| **Email** | Brevo SMTP (external) | Free tier |
| **File/image CDN** | Cloudflare R2 | Free (10GB/month) |
| **WAF / CDN** | Cloudflare | Free tier |
| **SSL** | Let's Encrypt (Hostinger) | Free, auto-renew |
| **Analytics** | GA4 + GTM | Free |
| **Testing** | Playwright | Latest |
| **Deployment** | Git push-to-deploy / SFTP | Hostinger hPanel |

---

## REQUIRED PHP EXTENSIONS

Extensions that must be enabled in **hPanel → PHP Configuration → Extensions:**

```
bcmath    ctype     curl      dom
fileinfo  gd        intl      json
mbstring  openssl   pdo       pdo_mysql
tokenizer xml       zip
```

All are available on Hostinger Premium. Enable and verify before first deployment.

**OPcache:** Confirm enabled in hPanel PHP Options (should be default). Critical for Laravel performance on shared hosting.

---

## REQUIRED MCPs

Only the following MCPs are necessary for this project:

| MCP | Why Required |
|---|---|
| **Playwright MCP** | Browser automation for E2E testing; verify live pages; SEO metadata checks; RFQ form testing |
| **Filesystem MCP** | Read/write project code files during development |

**Optional but useful:**
- **MySQL MCP** — direct DB querying during development
- **GitHub MCP** — PR and branch management

**Not needed:** Docker, Kubernetes, Elasticsearch, Redis, Vercel, AWS MCPs.

---

## EXTERNAL SERVICES

### Required NOW (Before Development Starts)

| Service | Purpose | Cost |
|---|---|---|
| Hostinger hPanel (already owned) | Hosting, SSH, cron, MySQL | ✅ Paid |
| GitHub (private repo) | Version control | Free |
| Cloudflare (free tier) | CDN, DNS, WAF | Free |
| Cloudflare R2 | Image & file storage | Free (10GB egress/month) |
| Brevo (formerly Sendinblue) | Transactional email SMTP | Free (300 emails/day) |
| Google Analytics 4 | Traffic and conversion analytics | Free |
| Google Tag Manager | Tag/event management | Free |
| Google Search Console | SEO crawl monitoring | Free |

### Required BEFORE LAUNCH (Client Must Confirm)

| Service | Purpose | Notes |
|---|---|---|
| WhatsApp Business number | Export desk enquiries | **[CLIENT INPUT REQUIRED]** — personal numbers in catalogue must NOT be used publicly |
| Official export email | RFQ notifications | **[CLIENT INPUT REQUIRED]** |
| Domain: rreinternational.com | Primary domain | Referenced in catalogue; confirm ownership |

### Required LATER (Future Phases)

| Service | When | Approximate Cost |
|---|---|---|
| Semrush or Ahrefs | Phase 1 SEO keyword research | ₹8,500–₹25,000/month |
| CRM (HubSpot/Zoho/Pipedrive) | When lead volume justifies; Phase 6+ | ₹0–₹5,000/month |
| Meta Pixel | If paid social ads launched | Free (ad spend separate) |
| Google Ads conversion tracking | If PPC launched | Free (ad spend separate) |
| Meta WhatsApp Cloud API | Phase 2 WhatsApp automation | ₹0 (pay-per-message at volume) |
| n8n (self-hosted) | Workflow automation with CRM | Free self-hosted on VPS |
| Meilisearch (self-hosted) | Advanced search after VPS migration | Free self-hosted |
| Redis | Cache/queue after VPS migration | Free self-hosted |

---

## ESTIMATED INFRASTRUCTURE COST

> All estimates in INR. Exchange rates approximate as of August 2026.

### Initial / Month 1

| Item | Cost/Month (INR) |
|---|---|
| Hostinger Premium Shared Hosting | ₹0 (already paid — amortised) |
| Domain (rreinternational.com) | ₹0 (already referenced; ~₹800/year if not owned) |
| Cloudflare (free tier) | ₹0 |
| Cloudflare R2 (free: 10GB) | ₹0 |
| Brevo email (300/day free) | ₹0 |
| GA4 + GTM + Search Console | ₹0 |
| GitHub (free private repos) | ₹0 |
| **Total Phase 1 infrastructure** | **₹0/month** |

### Expected Low-Traffic Phase (< 500 visitors/day)

| Item | Cost/Month (INR) |
|---|---|
| Hostinger Premium (annual plan amortised) | ~₹250 |
| Cloudflare Pro (optional upgrade for advanced WAF) | ₹1,650 (or stay on free) |
| Brevo (paid plan if > 300 emails/day) | ₹1,300 |
| Domain renewal | ~₹67 |
| **Total** | **~₹250–₹3,300/month** |

### Expected Medium-Traffic Phase (500–5,000 visitors/day)

At this scale, upgrading to Hostinger Business or VPS becomes necessary:

| Item | Cost/Month (INR) |
|---|---|
| Hostinger Business Shared (or VPS 2) | ₹500–₹1,500 |
| Cloudflare Pro | ₹1,650 |
| Brevo or Postmark (higher volume) | ₹2,500 |
| CRM (Zoho CRM or HubSpot Starter) | ₹0–₹5,000 |
| **Total** | **~₹4,650–₹10,650/month** |

### Scale Stage (5,000+ visitors/day; full lead pipeline)

| Item | Cost/Month (INR) |
|---|---|
| Hostinger Cloud / VPS KVM 4 | ₹3,000–₹6,000 |
| Cloudflare Pro or Business | ₹1,650–₹16,500 |
| Managed email (Postmark) | ₹5,000 |
| CRM (HubSpot Professional) | ₹35,000+ |
| Meilisearch (self-hosted on VPS) | ₹0 additional |
| Redis (self-hosted on VPS) | ₹0 additional |
| Semrush / Ahrefs (ongoing SEO) | ₹8,500–₹25,000 |
| **Total** | **~₹50,000–₹90,000/month** |

> [!NOTE]
> The significant jump at scale stage is driven by CRM and SEO tooling costs — not infrastructure. Core application infrastructure remains low-cost on Laravel + MySQL even at scale.

---

## RISKS

| # | Risk | Severity | Status |
|---|---|---|---|
| 1 | **Brand scope overclaiming** — publishing brand pages for Komatsu/Volvo/others before client confirms what is genuinely stocked | HIGH | ⚠️ Open — CLIENT INPUT REQUIRED (Section 42.D) |
| 2 | **Domestic MRP published as export pricing** — the 85,150-row JCB price list contains INR domestic prices; these must NEVER be displayed to international buyers | HIGH | ⚠️ Open — pricing methodology unresolved (Section 42.F) |
| 3 | **Inode exhaustion** — 85K products × multiple images + Laravel cache files could approach the 600K inode limit | HIGH | Mitigated by Cloudflare R2 for images; must be monitored |
| 4 | **Entry process exhaustion (20 concurrent PHP)** — under real traffic spikes, uncached pages will return 503 | HIGH | Mitigated by Cloudflare page caching + file cache; monitor under load |
| 5 | **WhatsApp personal number exposure** — personal mobile numbers in catalogue must not become the public export desk line | MEDIUM | ⚠️ Open — CLIENT INPUT REQUIRED (Section 42.R) |
| 6 | **ISO 9001:2015 certificate expiry** — current expiry 15 Nov 2028; must be monitored and not displayed as current if expired | MEDIUM | Manageable; track renewal date |
| 7 | **Two entity names** (RRE International vs Raj Rajeshwari Enterprises) creating buyer confusion or legal ambiguity | MEDIUM | ⚠️ Open — CLIENT INPUT REQUIRED (Section 42.A) |
| 8 | **Thin content from programmatic pages** — auto-generating pages for 85K part numbers without unique content creates index bloat | MEDIUM | Mitigated by `is_indexable` flag + programmatic SEO governance rules in DATABASE_ARCHITECTURE.md |
| 9 | **Queue processing delay** — no Supervisor means queue jobs run via cron; max ~60s delay | LOW | Acceptable for email notifications; not real-time |
| 10 | **Weekly-only automated backups on Premium plan** — daily backup not confirmed | LOW | Supplement with cron-based mysqldump + Cloudflare R2 offsite |

---

## BLOCKERS

Only genuine blockers — items that will stop Phase 1 development from proceeding:

| # | Blocker | Resolution |
|---|---|---|
| 1 | **Brand and category scope unresolved** (PROJECT_MASTER_PLAN Section 10 / 42.D) | Client must confirm which brands are genuinely stocked/manufactured before any brand pages are built or taxonomy is finalized |
| 2 | **Export pricing methodology unresolved** (Section 42.F) | Cannot display any prices on the site without a confirmed FOB/export pricing methodology — site can launch with "Request Availability" only, but pricing display is blocked |
| 3 | **WhatsApp Business number unconfirmed** (Section 42.R) | All WhatsApp CTAs require a confirmed, official export desk number — development can proceed with a placeholder, but no live testing is possible |
| 4 | **Official export email unconfirmed** (Section 42.S) | RFQ notification delivery requires a confirmed email address |

> [!IMPORTANT]
> Blockers 3 and 4 do NOT stop code development. They stop production testing and launch. Blockers 1 and 2 affect architecture decisions — brand taxonomy and pricing display logic — but development of the framework, search, RFQ engine, and database can begin while these are resolved in parallel.

---

## DEVELOPMENT PHASE 1 — EXACT SCOPE

Phase 1 is architecture + foundation only. No full homepage, no production data, no deployment.

### Phase 1 Deliverables

| # | Deliverable | Status After This Document |
|---|---|---|
| 1 | ✅ HOSTINGER_AUDIT.md | Complete |
| 2 | ✅ ARCHITECTURE.md | Complete |
| 3 | ✅ HOSTINGER_DEPLOYMENT.md | Complete |
| 4 | ✅ DATABASE_ARCHITECTURE.md | Complete |
| 5 | ✅ DEVELOPMENT_STANDARDS.md | Complete |
| 6 | ✅ TESTING_STRATEGY.md | Complete |
| 7 | ✅ SKILLS_REQUIRED.md | Complete |
| 8 | ✅ TOOLS_AND_MCP_REQUIREMENTS.md | Complete |

### Next Phase — Phase 2: Laravel Project Scaffolding

When client resolves Blockers 1–4 above, the following can begin:

1. Create Laravel 11.x project (`laravel new rre-international`)
2. Install all required Composer packages (Filament, Livewire, spatie packages, seotools)
3. Configure Tailwind CSS + Vite
4. Write and run all database migrations (in order defined in DATABASE_ARCHITECTURE.md)
5. Set up Filament admin panel
6. Configure `SearchService` with MySQL FULLTEXT driver
7. Set up `.env.example` with all required keys
8. Set up Git repository with `main` + `development` branches
9. Configure Playwright test suite (empty tests)
10. Set up Cloudflare DNS + R2 bucket
11. Set up Brevo SMTP account and test email delivery
12. Create staging subdomain on Hostinger
13. First deployment to staging via SSH/Git

**What Phase 2 does NOT include:**
- Homepage content (no client assets yet)
- Product data import (price list requires pricing methodology decision first)
- Brand pages (brand scope unresolved)
- Country pages (confirmed markets unconfirmed)
- Production database population

---

## FINAL STATUS

**READY TO START DEVELOPMENT: YES**

The architecture is decided. The technology is validated against the hosting environment. The database schema is designed. All documentation is complete. Development can begin with Laravel project scaffolding and foundational setup immediately.

The four blockers listed above are business decisions the client must make — they do not prevent the technical foundation from being built in parallel. Code scaffolding, database migrations, admin panel setup, search architecture, RFQ engine structure, and test suite configuration can all proceed now.

---

*End of Final Architecture Report — RRE International*
*Document set version: 1.0 — Architecture Phase*
*Next review: After client resolves Section 42 mandatory items*
