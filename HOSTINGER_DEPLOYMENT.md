# HOSTINGER_DEPLOYMENT.md
## RRE International — Hostinger Premium Shared Hosting Deployment Guide

**Version:** 1.0
**Prepared:** 20 August 2026
**Status:** Reference Document — Do NOT execute production deployment yet

---

> [!CAUTION]
> This document is a reference guide. Do NOT execute any production deployment step until the client has confirmed: domain, WhatsApp number, export email, brand scope, and all mandatory pre-development items in PROJECT_MASTER_PLAN.md Section 42.

---

## Prerequisites

Before beginning deployment, ensure the following are ready:

- [ ] Hostinger Premium account active with domain pointed
- [ ] SSH access enabled in hPanel
- [ ] MySQL database created in hPanel
- [ ] `.env.production` values prepared (see Section 6)
- [ ] Git repository ready (`main` branch)
- [ ] Assets built locally (`npm run build`)
- [ ] All `[CLIENT INPUT REQUIRED]` items resolved

---

## 1. Domain Setup

### 1.1 Add Domain in hPanel
1. Log in to Hostinger hPanel
2. Navigate to **Hosting → Manage → Domains**
3. Add primary domain: `rreinternational.com` **[CLIENT INPUT REQUIRED — confirm exact domain]**
4. Set document root to: `/home/[username]/public_html` (Hostinger default)

### 1.2 Configure Document Root for Laravel
Laravel's public directory must be the web root. Hostinger's default `public_html` maps to the web root.

**Option A (Recommended) — Point domain to Laravel's public/ folder:**
```
/home/[username]/
├── rreinternational/         ← Laravel application root (NOT web-accessible)
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   └── public/               ← This must be the web root
└── public_html/              ← Hostinger's default web root
```

**Method:** In hPanel, change the domain's document root to point at `rreinternational/public/` directly, OR use the symlink method below.

**Option B — Symlink method (if hPanel doesn't allow custom document root):**
```bash
# Via SSH
# Move Laravel's public contents to public_html
# Then symlink storage
cd /home/[username]/public_html
# Or redirect via index.php — see troubleshooting (Section 16)
```

**Option C — .htaccess redirect from public_html:**
```apache
# /home/[username]/public_html/.htaccess
RewriteEngine On
RewriteRule ^(.*)$ /home/[username]/rreinternational/public/$1 [L]
```

> [!NOTE]
> The cleanest approach on Hostinger is to set the subdomain/domain document root directly to `rreinternational/public` via hPanel's domain management. Confirm this option is available in your actual hPanel.

### 1.3 Subdomain for Staging
1. Create subdomain: `staging.rreinternational.com`
2. Point to: `/home/[username]/rreinternational-staging/public`
3. This mirrors production for pre-launch testing

### 1.4 Admin Subdomain (Optional)
- Create subdomain: `admin.rreinternational.com`
- Point to the same application (Filament runs at `/admin` by default)
- Or restrict access via IP whitelist in `.htaccess`

---

## 2. PHP Configuration

### 2.1 Set PHP Version in hPanel
1. hPanel → Hosting → Manage → **PHP Configuration**
2. Select **PHP 8.2** (or 8.3 — confirm Composer/Laravel 11 compatibility)
3. Click Save

### 2.2 Enable Required PHP Extensions
In hPanel → PHP Configuration → **Extensions** tab, enable:
```
bcmath, ctype, curl, dom, fileinfo, gd, intl, json,
mbstring, openssl, pdo, pdo_mysql, tokenizer, xml, zip
```

### 2.3 Configure PHP Options
In hPanel → PHP Configuration → **Options** tab:
```ini
memory_limit = 512M
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 120
max_input_vars = 3000
```

Or add to Laravel's `public/.htaccess`:
```apache
php_value memory_limit 512M
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value max_execution_time 120
php_value max_input_vars 3000
```

### 2.4 Verify PHP CLI Version (SSH)
```bash
# After SSH login, check CLI PHP version
php -v

# If it shows wrong version, use full path
/opt/alt/php82/usr/bin/php -v

# Find available PHP binaries
ls /opt/alt/
```

---

## 3. MySQL Setup

### 3.1 Create Database in hPanel
1. hPanel → Databases → **MySQL Databases**
2. Create database: `rre_production`
3. Create database user: `rre_user`
4. Set a strong password (generate 32-char random password)
5. Assign user to database with **All Privileges**
6. Note: Hostinger MySQL host is typically `127.0.0.1` or `localhost`

### 3.2 Verify Connection Details
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rre_production
DB_USERNAME=rre_user
DB_PASSWORD=[STRONG_RANDOM_PASSWORD]
```

### 3.3 Run Migrations (via SSH)
```bash
cd /home/[username]/rreinternational
/opt/alt/php82/usr/bin/php artisan migrate --force
```

### 3.4 Seed Initial Data (development only)
```bash
# NEVER run seeders with fake data in production
# Only run verified real data seeders
/opt/alt/php82/usr/bin/php artisan db:seed --class=CountriesSeeder
/opt/alt/php82/usr/bin/php artisan db:seed --class=CategoriesSeeder
```

---

## 4. SSH Setup

### 4.1 Enable SSH in hPanel
1. hPanel → Advanced → **SSH Access**
2. Toggle SSH ON
3. Note the SSH hostname, port (typically 22), and username

### 4.2 Connect via SSH
```bash
ssh [username]@[hostname] -p 22

# Or with key-based auth (recommended)
ssh -i ~/.ssh/rre_hostinger [username]@[hostname] -p 22
```

### 4.3 Generate SSH Key (local machine)
```bash
ssh-keygen -t ed25519 -C "rre-international-deploy" -f ~/.ssh/rre_hostinger
```
Add public key in hPanel → SSH Access → Manage Keys.

### 4.4 SSH Security Best Practices
- Use key-based authentication only
- Do not share SSH credentials
- Rotate keys if team member leaves
- Note: SSH on shared hosting is non-root; `sudo` is not available

---

## 5. Git Setup

### 5.1 Repository Structure
```
Branches:
├── main              → Production (protected)
├── development       → Staging / pre-production
└── feature/*         → Feature branches (merge to development first)
```

### 5.2 Git Deployment via hPanel
1. hPanel → Advanced → **Git**
2. Connect GitHub account via OAuth
3. Select repository: `[org]/rre-international`
4. Select branch: `main`
5. Set deployment path: `/home/[username]/rreinternational`
6. Enable auto-deploy on push: **YES** (for development branch only initially)
7. Production deploy: manual trigger or protected branch rules

### 5.3 Post-Deploy Hook
Create `/home/[username]/rreinternational/deploy.sh`:
```bash
#!/bin/bash
set -e

echo "=== RRE International Deploy $(date) ==="

# Navigate to application root
cd /home/[username]/rreinternational

# Install/update dependencies (skip dev)
/opt/alt/php82/usr/bin/php /usr/local/bin/composer install \
  --no-dev \
  --optimize-autoloader \
  --no-interaction

# Run migrations
/opt/alt/php82/usr/bin/php artisan migrate --force

# Clear and rebuild caches
/opt/alt/php82/usr/bin/php artisan config:cache
/opt/alt/php82/usr/bin/php artisan route:cache
/opt/alt/php82/usr/bin/php artisan view:cache
/opt/alt/php82/usr/bin/php artisan event:cache

# Restart queue (if using database queue)
/opt/alt/php82/usr/bin/php artisan queue:restart

echo "=== Deploy complete ==="
```

```bash
chmod +x deploy.sh
```

### 5.4 .gitignore (Critical)
```gitignore
# Environment — NEVER commit
.env
.env.*
!.env.example

# Dependencies
/vendor/
/node_modules/

# Build artifacts (commit dist/ if building remotely)
# Do NOT commit if building locally and deploying built assets
# /public/build/   ← commit this if building locally before deploy

# Storage (user uploads — never in Git)
/storage/app/public/rfq-uploads/
/storage/app/public/documents/

# Cache / compiled
/bootstrap/cache/*.php
/storage/framework/cache/
/storage/framework/sessions/
/storage/framework/views/

# Logs
/storage/logs/

# IDE / OS
.idea/
.vscode/
.DS_Store
Thumbs.db

# Testing
/coverage/
```

---

## 6. Environment Variables

### 6.1 .env.example (committed to Git — no real values)
```env
APP_NAME="RRE International"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://rreinternational.com

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
SESSION_DRIVER=file
SESSION_LIFETIME=120

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"

# Brevo / transactional email
BREVO_API_KEY=

# WhatsApp
WHATSAPP_NUMBER=        # [CLIENT INPUT REQUIRED]
WHATSAPP_COUNTRY_CODE=91

# Analytics
GA4_MEASUREMENT_ID=
GTM_CONTAINER_ID=

# Cloudflare R2 (image storage)
CLOUDFLARE_R2_KEY=
CLOUDFLARE_R2_SECRET=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ENDPOINT=

# Admin
FILAMENT_AUTH_GUARD=web
ADMIN_EMAIL=

# Security
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

### 6.2 Setting .env on Server
```bash
# Via SSH — create/edit directly on server
nano /home/[username]/rreinternational/.env

# Or upload via SFTP
# Never commit real .env to Git
```

### 6.3 Generate Application Key
```bash
/opt/alt/php82/usr/bin/php artisan key:generate --force
```

---

## 7. Build Process

### 7.1 Local Build (Before Deployment)
```bash
# On local development machine — NOT on Hostinger
cd rre-international/

# Install dependencies
npm install

# Build for production
npm run build
# This generates: public/build/assets/app-[hash].css + app-[hash].js

# Commit built assets
git add public/build/
git commit -m "build: compile assets for production"
git push origin main
```

### 7.2 Composer Install on Server
```bash
# Via SSH on Hostinger
cd /home/[username]/rreinternational

/opt/alt/php82/usr/bin/php /usr/local/bin/composer install \
  --no-dev \
  --optimize-autoloader \
  --prefer-dist \
  --no-interaction
```

### 7.3 Laravel Optimization Commands
```bash
# Run after every deployment
/opt/alt/php82/usr/bin/php artisan optimize
# This runs: config:cache, event:cache, route:cache, view:cache

# Or individually:
/opt/alt/php82/usr/bin/php artisan config:cache
/opt/alt/php82/usr/bin/php artisan route:cache
/opt/alt/php82/usr/bin/php artisan view:cache
```

---

## 8. Storage Permissions

```bash
# Set correct permissions via SSH
cd /home/[username]/rreinternational

# Storage directory — writable by web server
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/

# Create storage symlink for public assets
/opt/alt/php82/usr/bin/php artisan storage:link

# Verify symlink created
ls -la public/storage
```

---

## 9. Public Directory Configuration

### 9.1 Laravel's public/.htaccess
The default Laravel `.htaccess` in `public/` handles routing. Verify it is present and add:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Force www (or non-www — pick one, be consistent)
    # RewriteCond %{HTTP_HOST} !^www\.
    # RewriteRule ^ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# PHP settings override
php_value memory_limit 512M
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value max_execution_time 120

# Deny access to sensitive files
<FilesMatch "\.(env|log|sql|sh|json)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## 10. Cron Jobs

Configure in hPanel → Advanced → **Cron Jobs**.

Use the full PHP binary path. Run `which php` and `/opt/alt/php82/usr/bin/php -v` via SSH to confirm.

```bash
# Laravel scheduler (runs all scheduled tasks) — every minute
* * * * * /opt/alt/php82/usr/bin/php /home/[username]/rreinternational/artisan schedule:run >> /dev/null 2>&1

# Process queue jobs — every minute
* * * * * /opt/alt/php82/usr/bin/php /home/[username]/rreinternational/artisan queue:work --once --queue=default >> /dev/null 2>&1
```

**Scheduled tasks defined in `routes/console.php` (or `app/Console/Kernel.php`):**

```php
// Daily at 02:00 — generate XML sitemaps
Schedule::command('sitemap:generate')->dailyAt('02:00');

// Daily at 03:00 — clean expired uploaded files
Schedule::command('uploads:cleanup')->dailyAt('03:00');

// Weekly Sunday 04:00 — database backup via mysqldump
Schedule::command('db:backup')->weeklyOn(0, '04:00');

// Daily at 06:00 — send lead follow-up reminders to sales team
Schedule::command('leads:remind')->dailyAt('06:00');
```

> [!WARNING]
> Stagger all cron jobs — never run multiple CPU-intensive jobs at the same minute. Each cron job counts toward the 20-entry-process limit.

---

## 11. Cache Management

```bash
# Clear all caches (after config changes)
/opt/alt/php82/usr/bin/php artisan cache:clear
/opt/alt/php82/usr/bin/php artisan config:clear
/opt/alt/php82/usr/bin/php artisan route:clear
/opt/alt/php82/usr/bin/php artisan view:clear

# Re-optimize after clearing (production)
/opt/alt/php82/usr/bin/php artisan optimize

# Clear Cloudflare CDN cache after major deployments
# Via Cloudflare dashboard → Caching → Purge Everything
# Or via API (automate in deploy.sh if desired)
```

---

## 12. SSL Configuration

### 12.1 Enable SSL in hPanel
1. hPanel → Security → **SSL**
2. Select domain `rreinternational.com`
3. Install **Let's Encrypt** certificate (free, auto-renews)
4. Enable **Force HTTPS** toggle

### 12.2 Verify HTTPS Redirect
The `.htaccess` in Section 9 handles HTTPS redirect at the application layer. The Hostinger toggle handles it at the server level. Both can be active.

### 12.3 Check SSL Expiry
Let's Encrypt auto-renews every 90 days. Monitor via Hostinger hPanel SSL section.

---

## 13. Backups

### 13.1 Hostinger Automated Backups
- hPanel → Files → **Backups**
- Verify frequency on your plan (weekly on Premium; daily on Business)
- Test a manual restore from backup before going live

### 13.2 Manual Database Backup via SSH
```bash
# Create a dated backup
mysqldump \
  -h 127.0.0.1 \
  -u rre_user \
  -p[PASSWORD] \
  rre_production \
  > /home/[username]/backups/rre_$(date +%Y%m%d_%H%M%S).sql

gzip /home/[username]/backups/rre_$(date +%Y%m%d_%H%M%S).sql
```

### 13.3 Scheduled Backup Command
```php
// app/Console/Commands/DatabaseBackupCommand.php
// Runs weekly via Laravel scheduler (see Section 10)
// Stores compressed SQL dump in /home/[username]/backups/
// Optionally push to Cloudflare R2 for offsite storage
```

---

## 14. Rollback Procedure

### 14.1 Code Rollback
```bash
# Via SSH — revert to previous Git commit
cd /home/[username]/rreinternational
git log --oneline -10           # Find the commit to revert to
git reset --hard [COMMIT_HASH]  # Reset to that commit

# Re-run optimization
/opt/alt/php82/usr/bin/php artisan optimize
```

### 14.2 Database Rollback
```bash
# Revert last migration
/opt/alt/php82/usr/bin/php artisan migrate:rollback

# Revert to specific migration batch
/opt/alt/php82/usr/bin/php artisan migrate:rollback --step=3
```

### 14.3 Full Rollback from Backup
```bash
# Restore database from backup
gunzip < /home/[username]/backups/rre_[DATE].sql.gz | \
  mysql -h 127.0.0.1 -u rre_user -p[PASSWORD] rre_production
```

> [!CAUTION]
> Always take a fresh backup BEFORE any deployment to production. Never rollback a database without verifying the target backup is the correct state.

---

## 15. Production Deployment Checklist

Run this checklist before every production deployment:

**Pre-deployment:**
- [ ] Take manual backup (database + files) via hPanel
- [ ] Test changes on staging (`staging.rreinternational.com`) first
- [ ] Verify `.env.production` values are correct
- [ ] Build assets locally: `npm run build`
- [ ] Commit built assets to `main` branch

**Deployment:**
- [ ] SSH into server
- [ ] `git pull origin main`
- [ ] Run `composer install --no-dev --optimize-autoloader`
- [ ] Run `php artisan migrate --force`
- [ ] Run `php artisan optimize`
- [ ] Run `php artisan queue:restart`
- [ ] Set correct file permissions: `chmod -R 775 storage/ bootstrap/cache/`

**Post-deployment:**
- [ ] Visit homepage — verify loads correctly
- [ ] Test search (part number)
- [ ] Test RFQ form submission
- [ ] Test WhatsApp CTA link
- [ ] Check Laravel log: `tail -50 storage/logs/laravel.log`
- [ ] Verify Cloudflare cache purged if needed
- [ ] Check Google Search Console for crawl errors (next day)

---

## 16. Troubleshooting

### "500 Internal Server Error" after deploy
```bash
# Check Laravel log
tail -100 /home/[username]/rreinternational/storage/logs/laravel.log

# Common causes:
# 1. APP_KEY not set → php artisan key:generate
# 2. Wrong PHP version → verify hPanel PHP setting
# 3. Missing .env → copy .env.example and fill values
# 4. Wrong file permissions → chmod -R 775 storage/ bootstrap/cache/
# 5. Config cache stale → php artisan config:clear && php artisan config:cache
```

### "404 Not Found" on all pages except homepage
```bash
# mod_rewrite likely not enabled or .htaccess not loading
# Check .htaccess exists in public/
ls -la /home/[username]/rreinternational/public/.htaccess

# Verify document root points to public/ not application root
# Check via hPanel domain settings
```

### Composer not found
```bash
# Download Composer locally to server
cd /home/[username]/
/opt/alt/php82/usr/bin/php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
/opt/alt/php82/usr/bin/php composer-setup.php --install-dir=/home/[username]/bin --filename=composer
```

### "Class not found" errors
```bash
# Regenerate autoloader
/opt/alt/php82/usr/bin/php composer dump-autoload -o
```

### Database connection refused
```bash
# Verify MySQL host — on Hostinger use 127.0.0.1 not localhost
# Verify credentials in .env match hPanel MySQL settings
# Check DB_HOST=127.0.0.1 (not 'localhost' which may use socket)
```

### Queue jobs not processing
```bash
# Check cron is configured correctly in hPanel
# Test manually:
/opt/alt/php82/usr/bin/php artisan queue:work --once
# Check jobs table for failed jobs:
/opt/alt/php82/usr/bin/php artisan queue:failed
```

---

*End of HOSTINGER_DEPLOYMENT.md*
