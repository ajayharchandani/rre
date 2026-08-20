# HOSTINGER AUDIT
## RRE International — Hostinger Premium Shared Hosting Capability Assessment

**Prepared:** 20 August 2026
**Status:** Architecture Phase — Pre-Development
**Auditor:** Lead Software Architect

---

> [!IMPORTANT]
> This audit is based on publicly verified Hostinger Premium plan specifications supplemented by Hostinger's official documentation. Items marked **[VERIFY IN HPANEL]** must be confirmed by logging into the actual Hostinger account before production deployment begins. Specifications may vary slightly based on the exact promotional bundle purchased.

---

## 1. Current Plan

**Plan:** Hostinger Premium Shared Hosting
**Status:** Already purchased and owned by the client

---

## 2. Verified Capabilities

### 2.1 Compute Resources

| Capability | Specification | Notes |
|---|---|---|
| RAM | 2 GB | Shared pool across all processes |
| CPU | 1 Core | Shared; throttled under sustained load |
| Entry Processes | 20 concurrent PHP workers | **Critical limit** |
| I/O | Throttled on shared hosting | No dedicated I/O guarantee |

### 2.2 PHP

| Capability | Specification | Notes |
|---|---|---|
| PHP Version | 8.2, 8.3, 8.4 available | Selectable per website in hPanel |
| PHP Extensions | Manageable via hPanel | Enable/disable per site |
| OPcache | ✅ Enabled by default | Significant performance benefit for Laravel |
| CLI PHP version | May differ from web PHP | Must explicitly set correct binary path when using SSH |

**PHP Extensions (Laravel-relevant):**

| Extension | Required | Status |
|---|---|---|
| `bcmath` | ✅ Yes | Available |
| `ctype` | ✅ Yes | Available |
| `curl` | ✅ Yes | Available |
| `dom` | ✅ Yes | Available |
| `fileinfo` | ✅ Yes | Available |
| `gd` | ✅ Yes | Available |
| `intl` | Optional | Available |
| `json` | ✅ Yes | Default (PHP 8+) |
| `mbstring` | ✅ Yes | Available |
| `openssl` | ✅ Yes | Available |
| `pdo_mysql` | ✅ Yes | Available |
| `tokenizer` | ✅ Yes | Available |
| `xml` | ✅ Yes | Available |
| `zip` | ✅ Yes | Available |
| `imagick` | Optional | **[VERIFY IN HPANEL]** |
| `redis` | ❌ N/A | No Redis server on shared hosting |

**PHP Limits (adjustable within plan ceiling):**

| Directive | Typical Default | Adjustable | How |
|---|---|---|---|
| `memory_limit` | 256M | Up to ~512M–1.5G | hPanel PHP Options or `.htaccess` |
| `upload_max_filesize` | 64M | 256M+ | hPanel PHP Options or `.htaccess` |
| `post_max_size` | 64M | 256M+ | hPanel PHP Options or `.htaccess` |
| `max_execution_time` | 30s | 300s | hPanel PHP Options or `.htaccess` |
| `max_input_vars` | 1000 | 5000+ | hPanel PHP Options |

### 2.3 MySQL Database

| Capability | Specification | Notes |
|---|---|---|
| Database Engine | MySQL 5.7 / 8.0 | **[VERIFY IN HPANEL]** exact version |
| Database Count | Up to 10 | Verify on actual account |
| Database Size Limit | 3 GB per database | Sufficient for initial launch |
| Max Connections (Global) | 500 | Shared across all server users |
| Max Connections (Per User) | 50 | **Critical for Laravel connection pooling** |
| Max Import Size (phpMyAdmin) | 200 MB | Use SSH for large dumps |
| phpMyAdmin | ✅ Included | Accessible from hPanel |
| Remote MySQL | ✅ Available | Whitelist IPs for external connections |
| MySQL FULLTEXT indexes | ✅ Available | InnoDB FULLTEXT supported (MySQL 5.6+) |
| MySQL JSON columns | ✅ Available | Useful for product specifications |

### 2.4 Storage

| Capability | Specification | Notes |
|---|---|---|
| SSD Storage | 20 GB – 100 GB | **[VERIFY IN HPANEL]** exact allocation |
| Inodes | 600,000 | **Critical limit** — see Section 4 |
| Bandwidth | Unlimited (Fair Use) | Actual throughput limited by CPU/RAM |

### 2.5 Access & Deployment

| Capability | Specification | Notes |
|---|---|---|
| SSH Access | ✅ Included | Must be enabled in hPanel; non-root restricted bash |
| SFTP | ✅ Included | Via FileZilla or equivalent |
| Git Integration | ✅ Included | hPanel Git deployment via GitHub OAuth |
| Composer | ✅ Via SSH | Must use correct PHP binary path |
| NPM/Node | ⚠️ Limited | Build steps only; no long-running Node processes |
| Root Access | ❌ Not available | No sudo, no root |
| Supervisor | ❌ Not available | Cannot run persistent background processes |

### 2.6 Cron Jobs

| Capability | Specification | Notes |
|---|---|---|
| Cron Jobs | ✅ Unlimited | Configured via hPanel |
| Minimum interval | Every minute | Standard cron syntax |
| Execution environment | PHP CLI | Must use full PHP binary path |
| Concurrent execution | ⚠️ Counts toward entry processes | Stagger scheduling |

### 2.7 SSL & Security

| Capability | Specification | Notes |
|---|---|---|
| Free SSL | ✅ Unlimited, auto-renewed | Let's Encrypt; all domains and subdomains |
| Wildcard SSL | ✅ Available | For `*.domain.com` |
| HTTPS force redirect | ✅ Configurable | Via hPanel or `.htaccess` |
| Security headers | ⚠️ Partial via .htaccess | X-Frame-Options, CSP configurable |
| WAF | ⚠️ Basic | Hostinger basic firewall only |

### 2.8 CDN & Caching

| Capability | Specification | Notes |
|---|---|---|
| Built-in CDN | ✅ Included | Hostinger's CDN network |
| Cloudflare integration | ✅ Supported | DNS-level; free Cloudflare fully compatible |
| Server-side caching | ❌ No Varnish/Redis | No reverse-proxy cache daemon |
| OPcache | ✅ Enabled | PHP bytecode caching |
| Application cache | ✅ File-based only | Laravel `file` driver is the only option |
| Object caching | ❌ Not available | No Redis/Memcached |

### 2.9 Email

| Capability | Specification | Notes |
|---|---|---|
| Webmail | ✅ Included | Hostinger email |
| SMTP | ✅ Available | External SMTP strongly recommended for transactional mail |
| PHP mail() | ✅ Available | Unreliable; use SMTP via Laravel Mail |

### 2.10 Backups

| Capability | Specification | Notes |
|---|---|---|
| Automated backups | ✅ Weekly (Premium) | **[VERIFY IN HPANEL]** frequency |
| Manual backup | ✅ On-demand via hPanel | Do before every deployment |
| Database backups | ✅ Included | Via hPanel or mysqldump via SSH |

### 2.11 DNS & Domain Management

| Capability | Specification | Notes |
|---|---|---|
| DNS management | ✅ Full control | Via hPanel DNS Zone editor |
| Subdomains | ✅ Unlimited | Useful for staging, admin subdomain |
| Domain redirects | ✅ Supported | 301 redirects via hPanel or `.htaccess` |

---

## 3. Unknown Capabilities — Must Verify in hPanel

| Item | Action Required |
|---|---|
| Exact PHP version deployed | hPanel → PHP Configuration |
| Exact storage allocation on this account | hPanel → Plan Details |
| Exact database count allowed on this account | hPanel → MySQL Databases |
| Exact MySQL version (5.7 vs 8.0) | hPanel → phpMyAdmin → Server Info |
| Current inode usage | hPanel → Usage |
| Imagick extension availability | hPanel → PHP Extensions |
| Exact memory_limit ceiling for this plan | hPanel → PHP Options; test with phpinfo() |
| Backup frequency (daily vs weekly) | hPanel → Backups |
| SSH IP whitelist requirement | hPanel → SSH Access |

---

## 4. Hard Limits That Affect Architecture

| Limit | Value | Architectural Impact |
|---|---|---|
| Entry Processes (concurrent PHP) | 20 | Must minimize per-request execution time; heavy uncached pages will cause 503 under traffic spikes |
| MySQL per-user connections | 50 | Laravel DB pool must be sized ≤ 40; avoid connection leaks |
| Inodes | 600,000 | Must use CDN for images; cannot store 85K product images locally; compiled cache must be managed |
| No Redis | N/A | Cache = file driver; sessions = file/cookie; no real-time queuing |
| No Supervisor | N/A | Cannot run `queue:work` persistently; use cron-based `queue:work --once` |
| No long-running Node | N/A | All Vite/npm builds must be done locally before deployment |
| Max execution time | 30–300s | Batch operations must be chunked via cron, not single HTTP requests |
| Database size | 3 GB | 85,150 JCB SKUs may approach; optimize data types; monitor closely |

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Entry process exhaustion under traffic spikes | **HIGH** | Aggressive file-based caching; CDN for static assets; Cloudflare page caching |
| Inode exhaustion from product images + cache files | **HIGH** | Store product images on Cloudflare R2 or Bunny CDN; purge stale cache |
| Slow Composer operations via SSH | MEDIUM | Run Composer locally; deploy vendor via SFTP or Git |
| Queue processing gaps (no Supervisor) | MEDIUM | Use `queue:work --once` via cron every minute; accept ~60s max delay |
| MySQL 50-connection cap | MEDIUM | Keep connection pool ≤ 40 |
| CLI vs web PHP version mismatch | MEDIUM | Always specify full PHP binary path in SSH/cron |
| PHP memory exhaustion on bulk operations | MEDIUM | Chunk bulk imports; never load 85K rows at once |
| Weekly-only automated backups | LOW-MED | Supplement with manual mysqldump via cron + offsite |
| Shared server "noisy neighbor" | LOW-MED | Cloudflare CDN reduces origin hits significantly |

---

## 6. Recommended Architecture for This Environment

| Layer | Technology | Verdict |
|---|---|---|
| Language | PHP 8.2+ | ✅ Fully compatible |
| Framework | Laravel 11.x | ✅ Fully compatible |
| Database | MySQL 8.0 | ✅ Fully compatible |
| Templates | Laravel Blade | ✅ Fully compatible |
| Reactive UI | Laravel Livewire 3.x | ✅ Compatible |
| Styling | Tailwind CSS (compiled) | ✅ Compatible |
| Asset build | Vite (local build, deploy dist/) | ✅ Compatible |
| Cache driver | Laravel `file` cache | ✅ Only option |
| Session driver | Laravel `file` sessions | ✅ Compatible |
| Queue driver | `sync` / `database` via cron | ✅ Compatible with limits |
| Search | MySQL FULLTEXT indexes | ✅ Adequate for launch |
| Image/file CDN | Cloudflare R2 or Bunny CDN | ✅ Strongly recommended |
| Email | Brevo / Mailgun (external SMTP) | ✅ Compatible |
| Deployment | Git push-to-deploy or SFTP | ✅ Compatible |
| SSL | Hostinger free Let's Encrypt | ✅ Compatible |
| CDN/WAF | Cloudflare free tier | ✅ Strongly recommended |

**NOT compatible with Hostinger Premium Shared Hosting:**

| Technology | Reason | When to adopt |
|---|---|---|
| Redis | No Redis server | On migration to VPS |
| Elasticsearch / Meilisearch | No persistent processes | On migration to VPS |
| Next.js (SSR server) | No long-running Node | On migration to cloud |
| PostgreSQL | Only MySQL available | On migration to VPS |
| Docker / Kubernetes | No root access | N/A for this project scale |
| Laravel Horizon | Requires Redis | On migration to VPS |

---

## 7. Verdict

**HOSTINGER COMPATIBILITY: ✅ COMPATIBLE**

The Laravel + MySQL + Blade + Livewire + Tailwind CSS stack is **fully compatible** with Hostinger Premium Shared Hosting.

The primary constraints (no Redis, no persistent processes, inode limits, 20 entry processes) are **manageable through architecture decisions** — not blockers. The project can launch, operate, and scale on this plan through the initial B2B lead generation phase before a VPS migration becomes necessary.

The master plan's originally suggested stack (Next.js + PostgreSQL + Meilisearch) is **NOT compatible** with Hostinger Premium Shared Hosting and should only be considered after migration to VPS or cloud.

---

*End of HOSTINGER_AUDIT.md*
