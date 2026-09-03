#!/usr/bin/env bash
#
# scripts/deploy.sh — run ON THE HOSTINGER SERVER after each Git deploy.
#
# Hostinger's hPanel Git integration only replaces the repo files. It does
# NOT run `npm install`, a build step, or any post-deploy hook. This script
# fills that gap: install production dependencies (only real work when
# package-lock.json changed) and restart the Node process.
#
# Usage (SSH into the hosting account):
#   cd ~/domains/rreinternational.com/app        # your Application root
#   bash scripts/deploy.sh
#
# Or wire it to a cron job — see HOSTINGER_DEPLOYMENT.md §5.4.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"
echo "[deploy] $(date -u '+%Y-%m-%dT%H:%M:%SZ')  dir=$APP_DIR"

# --- 1. Dependencies -------------------------------------------------------
# `sharp` / `xlsx` / `lucide-static` are only used by scripts/, never by
# src/. Move them to devDependencies (HOSTINGER_DEPLOYMENT.md §3.3) and the
# --omit=dev path below skips sharp's native compile entirely.
if node -e "process.exit((require('./package.json').devDependencies||{}).sharp?0:1)" 2>/dev/null; then
  echo "[deploy] npm install --omit=dev"
  npm install --omit=dev --no-audit --no-fund
else
  echo "[deploy] npm install --omit=optional  (move sharp/xlsx/lucide-static to devDependencies to speed this up)"
  npm install --omit=optional --no-audit --no-fund
fi

# --- 2. Restart ----------------------------------------------------------
# Phusion Passenger (hPanel "Setup Node.js App") restarts the app when the
# mtime of tmp/restart.txt changes.
mkdir -p tmp
touch tmp/restart.txt
echo "[deploy] touched tmp/restart.txt — Passenger will reload on next request"

# --- 3. Sanity check --------------------------------------------------
# Confirm the generated catalogue data is present (productStore.js throws at
# boot if it isn't). Kept light — don't parse the 74 MB file here while the
# live process is also running.
for f in src/data/generated/products.json src/data/generated/catalogue-categories.json src/server.js; do
  [ -s "$f" ] || { echo "[deploy] ERROR: missing or empty $f"; exit 1; }
done
echo "[deploy] required files present"

echo "[deploy] done"
