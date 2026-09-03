# HOSTINGER_DEPLOYMENT.md
## RRE International — Deployment Guide (Node.js / Express)

**Last updated:** 3 September 2026
**Applies to:** this repository as it actually is — a Node.js + Express + EJS
web app with **no database**.

---

## 0. What this app actually is

Read this first. Earlier versions of this document described a Laravel /
PHP / MySQL stack. That was aspirational and never built. The real app:

| Thing | Reality |
|---|---|
| Runtime | Node.js (CommonJS). Works on Node 18, 20 or 22. Dev machine runs 24. |
| Framework | Express 5 + `express-ejs-layouts`, server-rendered EJS templates |
| Database | **None.** Catalogue data is JSON files loaded into memory at startup |
| Entry point | `src/server.js` — `app.listen(process.env.PORT || 3000)` |
| Persistent state | Only `storage/rfq-uploads/` (buyer file uploads from the RFQ form) |
| Outbound email | SMTP via `nodemailer`, for RFQ notifications only (optional) |
| Build step at deploy time | **None required** — the generated JSON is committed |

### Runtime dependencies (what production actually needs)

`express`, `express-ejs-layouts`, `ejs`, `cookie-parser`, `multer`,
`nodemailer`, `dotenv`.

`sharp`, `xlsx` and `lucide-static` are in `package.json` `dependencies`
but are **only used by `scripts/`** (the catalogue/image build pipeline),
never by anything under `src/`. `sharp` compiles a native binary on
install, which is slow and sometimes fails on shared hosting. See
§3.3 for how to avoid installing it in production.

### Memory footprint — the one real constraint

At startup `src/data/productStore.js` reads `src/data/generated/products.json`
(~74 MB of text) with `JSON.parse` and builds several in-memory `Map`
indexes over it. Expect the process to sit around **400–700 MB resident**.

- On a **VPS**: fine, give it ≥ 1 GB RAM.
- On **shared hosting**: check the plan's per-process memory limit before
  committing. If the app is killed on boot with no useful error, this is
  almost always why (see §9).

`src/data/generated/product-images.json` (~60 MB) is **not** loaded at
startup — only by the `/qa/image-review` and `/api/catalog/images` routes,
which re-read it from disk on every request. Treat those as internal/QA
only; don't link them in navigation or hammer them.

---

## 1. Choose a deployment model

| Model | Use when | Section |
|---|---|---|
| **A. hPanel "Setup Node.js App"** | You have a Hostinger plan that shows a Node.js app option in hPanel and its per-process memory limit is comfortably above ~700 MB | §4 |
| **B. Hostinger VPS + PM2 + nginx** | Shared hosting can't give the process enough memory, or you want full control / zero-downtime restarts | §6 |

If hPanel only offers PHP and no Node.js app screen, your current plan
cannot run this app — you need a VPS (Model B) or a plan upgrade.

---

## 2. Prerequisites (both models)

- [ ] Hostinger account with the domain (`rreinternational.com`) attached
- [ ] Decision on canonical host: **`www.rreinternational.com`** is the
      current default in `src/services/seoService.js`. Keep it, or override
      with the `APP_URL` env var (§8).
- [ ] SMTP mailbox password for `info@rreinternational.com` if you want RFQ
      emails (hPanel → Emails → Email Accounts → *Connect Devices*). Optional —
      the app runs fine without it, RFQ submissions are just logged instead.
- [x] GitHub remote — **configured**. `origin` →
      `https://github.com/ajayharchandani/rre.git`, default branch **`main`**
      (public repo). Push access is via the `ajayhbeaatho-art` account
      (repo collaborator). Everyday workflow: `git add . && git commit -m "…" && git push`.

---

## 3. One-time code prep before the first deploy

These are small repo changes that make deployment predictable. Do them
once, commit, then deploy.

### 3.1 Pin a Node version

Add to `package.json` so hPanel / PM2 pick a supported major:

```json
"engines": { "node": ">=18 <23" }
```

### 3.2 Confirm the startup file

The app **must** be started from `src/server.js`. That file only calls
`app.listen()` when it is the process entry point (`require.main === module`).

- `app.js` and `index.js` in the repo root both just `require('./src/server.js')`
  and do **not** call `listen` themselves — if you point the platform's
  startup file at `app.js`, the server never binds a port and the deploy
  fails.
- **Set the startup file to `src/server.js`** (§4.3 / §6). Optionally delete
  `app.js` and `index.js` to remove the trap.

### 3.3 Keep build-only packages out of production (optional but recommended)

Move `sharp`, `xlsx` and `lucide-static` from `dependencies` to
`devDependencies` in `package.json`. Nothing in `src/` imports them, so the
running site is unaffected, and production installs become
`npm install --omit=dev` — no native `sharp` compile on the server. You'll
still get them locally with a normal `npm install` for running the
`scripts/` pipeline.

If you'd rather not touch `package.json`, you can instead run
`npm install --omit=optional` on the server and accept the `sharp` build.

### 3.4 `.env` is never committed

`.env` is gitignored. Real values go into the host's environment variable
UI (§4.5) or the PM2 ecosystem file (§6), **not** a committed file.

---

## 4. Model A — hPanel "Setup Node.js App"

Menu labels vary slightly between hPanel versions; the flow is the same.

### 4.1 Create the application

hPanel → **Advanced → Node.js** (or **Website → Node.js app**) → **Create application**:

| Field | Value |
|---|---|
| Node.js version | 18, 20 or 22 (latest LTS offered) |
| Application mode | `Production` |
| Application root | e.g. `domains/rreinternational.com/app` (a folder **outside** `public_html`) |
| Application URL | `rreinternational.com` (and `www`) |
| Application startup file | `src/server.js` |

Create it. hPanel generates a domain-root `.htaccess`/Passenger wiring that
proxies the domain to the Node process — you don't manage the port
yourself; the platform sets `PORT` and `src/server.js` reads it.

### 4.2 Get the code onto the server

**Option 1 — Git (recommended for repeat deploys):**
hPanel → **Advanced → Git** → **Create a new repository**:

| Field | Value |
|---|---|
| Repository | `https://github.com/ajayharchandani/rre.git` (public — no deploy key needed) |
| Branch | `main` |
| Directory | the **Application root** from §4.1 (e.g. `domains/rreinternational.com/app`) — **not** `public_html` |

Then **Deploy** for the first pull.

> [!IMPORTANT]
> Hostinger's Git integration **only replaces files**. It does **not** run
> `npm install`, does **not** run a build step, and does **not** run any
> post-deploy hook. After every deploy you still have to install
> dependencies (first deploy, or whenever `package-lock.json` changed) and
> **restart the Node process**. Use `scripts/deploy.sh` for this — see §5.

**Auto-deploy on push:** in the Git screen click **Auto Deployment**, copy
the **Webhook URL**, then in GitHub → repo **Settings → Webhooks → Add
webhook**: paste it as the Payload URL, content type
`application/x-www-form-urlencoded`, event = *Just the push event*. Now every
`git push` to `main` makes Hostinger pull automatically — you still trigger
the dependency-install/restart step (§5.1), or automate it with a cron job
(§5.4).

**Option 2 — File Manager / SFTP (one-off or no GitHub):**
Upload the whole project into the Application root **except**:
`node_modules/`, `.git/`, `storage/rfq-uploads/*` (keep the folder),
`scratch/`, `test-results/`, `.env`.
The committed `src/data/generated/*.json` files are large (~135 MB total) —
SFTP will take a while; Git is faster.

### 4.3 Verify the startup file

In the Node.js app screen, confirm **Application startup file** = `src/server.js`.
If it defaulted to `app.js`, change it and save.

### 4.4 Install dependencies

In the Node.js app screen use **Run NPM install**, or via SSH:

```bash
cd ~/domains/rreinternational.com/app        # your Application root
source ~/nodevenv/domains/rreinternational.com/app/18/bin/activate  # path shown in hPanel
npm install --omit=dev                        # if you did §3.3
# otherwise: npm install --omit=optional
```

### 4.5 Set environment variables

In the Node.js app screen there is an **Environment variables** section.
Add (see §8 for the full reference):

```
NODE_ENV=production
APP_URL=https://www.rreinternational.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@rreinternational.com
SMTP_PASS=<mailbox password>
RFQ_NOTIFICATION_EMAIL=info@rreinternational.com
```

Do **not** set `PORT` — the platform manages it.

### 4.6 Start / restart

Click **Restart** in the Node.js app screen. Every code change or env var
change needs a restart.

### 4.7 Storage permissions

Ensure `storage/rfq-uploads/` exists and is writable by the app user:

```bash
mkdir -p storage/rfq-uploads
chmod 775 storage/rfq-uploads
```

This directory holds buyer uploads and is gitignored — it must **survive
deploys**. With Git deploy into a fixed install path it does; if you ever
deploy by replacing the folder, back it up first.

### 4.8 SSL & HTTPS

hPanel → **Security → SSL** → install Let's Encrypt for the domain and
enable **Force HTTPS**. The app sets security headers itself
(`src/middleware/security.js`) but does not force HTTPS — let Hostinger do
the redirect at the edge.

### 4.9 Smoke test

See §7.

---

## 5. Model A — deploying updates

### 5.1 Normal update (code or data)

```bash
# locally
git add .
git commit -m "..."
git push                     # -> origin/main
```

If auto-deploy is wired (§4.2), Hostinger pulls within a few seconds.
Otherwise click **Deploy** in hPanel → Git.

Then, on the server (SSH into the account), run the deploy helper:

```bash
cd ~/domains/rreinternational.com/app      # your Application root
bash scripts/deploy.sh
```

`scripts/deploy.sh` runs `npm install --omit=dev` (skipped effort when
nothing changed) and touches `tmp/restart.txt` to restart the app. You can
also just use the Node.js app screen's **Run NPM install** + **Restart**
buttons instead.

### 5.1a One-time: make `npm install` on the server lean

`sharp` / `xlsx` / `lucide-static` are in `dependencies` but only used by
`scripts/` (never by `src/`). Move them to `devDependencies` in
`package.json` (§3.3) so `npm install --omit=dev` on the server skips
`sharp`'s slow native compile. Until you do, `deploy.sh` falls back to
`npm install --omit=optional`.

### 5.2 Fast path — only product images changed

When the change is just files under `src/public/images/products/` (and the
`src/data/generated/products.json` / `product-images.json` references to
them), you do **not** need an `npm install`, and static images are served
directly by `express.static`:

1. Commit + push, deploy via Git (or upload just the changed
   `src/public/images/products/*.webp` and the two JSON files via SFTP).
2. **Restart** the Node.js app — `products.json` is only read at startup, so
   image-URL changes in it don't take effect until a restart.
3. Hard-refresh a product page and a category page to confirm.

`express.static` sends `Cache-Control: max-age=1d`, so a replaced image at
the same filename can look stale in a browser for up to a day — test in a
private window or append `?v=2`.

### 5.3 Rollback

Git deploy keeps history:

```bash
cd <install path>
git log --oneline -10
git reset --hard <good-commit>
```

Then **Restart**. (Uncommitted server-side changes are lost — there
shouldn't be any; `storage/rfq-uploads/` is gitignored and untouched.)

### 5.4 Fully hands-off (optional)

Hostinger's Git webhook pulls the files but can't run `deploy.sh`. To make
`git push` end-to-end automatic, add an hPanel **cron job** that runs the
helper on a short interval and exits fast when there's nothing new:

```bash
*/5 * * * * cd ~/domains/rreinternational.com/app && git rev-parse HEAD > .last_deploy_check.tmp 2>/dev/null; if ! cmp -s .last_deploy_check.tmp .last_deployed 2>/dev/null; then bash scripts/deploy.sh >> storage/deploy.log 2>&1 && mv .last_deploy_check.tmp .last_deployed; fi
```

(Use the correct Node/npm path in `deploy.sh` if `npm` isn't on the cron
`PATH` — check with `which npm` over SSH.) Simpler alternative: just run
`bash scripts/deploy.sh` over SSH after each push — it's two lines.

---

## 6. Model B — VPS + PM2 + nginx (condensed)

Use a Hostinger VPS (KVM) with Ubuntu, ≥ 1 GB RAM, Node 20 LTS.

```bash
# as a non-root deploy user
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

cd /var/www
git clone git@github.com:<org>/rre-international.git
cd rre-international
npm install --omit=dev        # after §3.3; else npm install
mkdir -p storage/rfq-uploads && chmod 775 storage/rfq-uploads
```

`ecosystem.config.js`:

```js
module.exports = {
  apps: [{
    name: 'rre',
    script: 'src/server.js',
    instances: 1,               // single instance: ~600 MB, in-memory catalogue
    exec_mode: 'fork',
    max_memory_restart: '1200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      APP_URL: 'https://www.rreinternational.com',
      SMTP_HOST: 'smtp.hostinger.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'info@rreinternational.com',
      SMTP_PASS: '<mailbox password>',
      RFQ_NOTIFICATION_EMAIL: 'info@rreinternational.com'
    }
  }]
};
```

```bash
pm2 start ecosystem.config.js
pm2 save && pm2 startup     # run the printed command
```

nginx reverse proxy (`/etc/nginx/sites-available/rre`):

```nginx
server {
  listen 80;
  server_name rreinternational.com www.rreinternational.com;
  client_max_body_size 25m;                 # RFQ uploads: 5 files (see multer limits)

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/rre /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rreinternational.com -d www.rreinternational.com
```

**Update:** `git pull && npm install --omit=dev && pm2 reload rre`.

---

## 7. Post-deploy smoke test

Run against the live domain. All should return HTTP 200 unless noted.

| URL | Expect |
|---|---|
| `/` | Homepage renders, category grid visible |
| `/search?q=332/H0893` | Results page, exact part match at top |
| `/products` | Paginated catalogue listing |
| `/parts/bearings` | A category listing page (try any real category slug) |
| `/rfq` | RFQ form renders |
| `POST /rfq` (submit the form with a file) | Redirects to `/rfq/confirmation`; file lands in `storage/rfq-uploads/`; if SMTP is set, email arrives at `RFQ_NOTIFICATION_EMAIL` |
| `/robots.txt` | Plain text, references `…/sitemap.xml` |
| `/sitemap.xml` | XML sitemap index |
| `/images/products/02-100073-filterelement.webp` | The image loads (static asset) |
| `/nope` | Custom 404 page, HTTP 404 |

Also check the process log (hPanel Node.js app log, or `pm2 logs rre`) for:
- `RRE International Platform Running at: http://localhost:<port>` — booted OK
- `[emailService] SMTP_HOST / SMTP_USER / SMTP_PASS not set` — expected only
  if you deliberately skipped SMTP
- Any `Generated catalog data not found` — the `src/data/generated/*.json`
  files didn't get uploaded

---

## 8. Environment variables — complete reference

These are the **only** variables the code reads. Anything else is noise.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3000` | Port to listen on. **Leave unset on hPanel** — the platform sets it. Set it on VPS. |
| `NODE_ENV` | Recommended | — | Set to `production`. Only effect in code: when `development`, the 500 page shows the error message. |
| `APP_URL` | Recommended | `https://www.rreinternational.com` | Absolute base URL used in SEO tags, JSON-LD, canonical URLs, sitemaps, `robots.txt`. Set it to the real canonical host with scheme, no trailing slash. |
| `SMTP_HOST` | No | — | RFQ notification email. If unset, email is skipped and the submission is logged. |
| `SMTP_PORT` | No | `465` | `465` (SSL) or `587` (STARTTLS). |
| `SMTP_SECURE` | No | `true` unless port `587` | `"true"` / `"false"` string. |
| `SMTP_USER` | No | — | Mailbox login, also the `From:` address. |
| `SMTP_PASS` | No | — | Mailbox password. |
| `RFQ_NOTIFICATION_EMAIL` | No | `info@rreinternational.com` | Where RFQ notifications are delivered. |

---

## 9. Troubleshooting

### App won't boot / 502 / "Application error"
- **Startup file wrong.** Must be `src/server.js`, not `app.js` / `index.js`
  (§3.2). This is the most common cause.
- **Catalogue data missing.** Log shows `Generated catalog data not found in
  .../src/data/generated`. The large JSON files weren't uploaded — re-deploy,
  or SFTP `src/data/generated/` explicitly.
- **Killed on startup, no stack trace.** Out of memory parsing
  `products.json`. Check the plan's per-process memory limit; if it's below
  ~800 MB, move to a VPS or a larger plan. `--max-old-space-size` won't help
  if the host's hard limit is lower than what the dataset needs.
- **Wrong Node version.** `engines` mismatch or an old default. Pick 18/20/22.

### 404 on every page except `/`
The domain is being served by Apache/`public_html` instead of the Node
process. Re-check the Node.js app's **Application URL** binding and that
`public_html` for the domain doesn't contain a competing site.

### Product images 404
- Confirm the file exists under `src/public/images/products/` in the
  deployed tree (Git deploy includes it; a partial SFTP upload may not).
- The app serves `src/public` at the web root via `express.static`, so
  `/images/products/x.webp` → `src/public/images/products/x.webp`.

### Replaced image still shows the old picture
Browser cache — `express.static` sets `max-age=1d`. Test in a private
window; for a guaranteed refresh change the filename or add `?v=N` in
`products.json` image URLs.

### RFQ form returns 500 on submit
- `storage/rfq-uploads/` doesn't exist or isn't writable (§4.7).
- Upload exceeded limits: `multer` allows **5 files**; the reverse proxy /
  platform body limit must allow the total (nginx `client_max_body_size`,
  §6). Express itself is set to a 20 MB body limit.

### RFQ emails not arriving
Check the process log:
- `SMTP_HOST / SMTP_USER / SMTP_PASS not set` → env vars didn't load; re-add
  and restart.
- `Failed to send RFQ notification … <reason>` → bad credentials or
  host/port. For Hostinger mail use `smtp.hostinger.com:465` with
  `SMTP_SECURE=true`. The submission itself still succeeded and is in the
  log.

### `sharp` fails during `npm install`
You don't need it in production. Do §3.3, or install with
`npm install --omit=dev`.

---

## 10. What is NOT part of this deployment

No MySQL, no Composer, no Laravel/artisan, no Redis, no queue workers, no
cron jobs are required to run the site. The `scripts/` pipeline (catalogue
build, image matching, Gemini image regeneration) runs **on a developer
machine**; its output (`src/data/generated/*.json`,
`src/public/images/products/*`) is committed and deployed as static content.

---

*End of HOSTINGER_DEPLOYMENT.md*
