#!/usr/bin/env bash
# Driver for scripts/_ocr_page_worker.py — runs one fresh Python
# subprocess per PDF page (98 total) so memory is fully released
# between pages. Writes reports/pdf-extract.jsonl and stages matched
# image crops in scripts/.pdf-image-staging/.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_JSONL="$ROOT/reports/pdf-extract.jsonl"
STAGING_DIR="$ROOT/scripts/.pdf-image-staging"

mkdir -p "$ROOT/reports" "$STAGING_DIR"
rm -f "$OUT_JSONL"

TOTAL_PAGES=98
for ((i=0; i<TOTAL_PAGES; i++)); do
  python "$ROOT/scripts/_ocr_page_worker.py" "$i" "$OUT_JSONL" "$STAGING_DIR"
done

echo "Done. Rows written to $OUT_JSONL"
wc -l "$OUT_JSONL"
