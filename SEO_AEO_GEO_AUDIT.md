# SEO / AEO — Current State & Implementation Record

**Last updated:** 8 September 2026
**Applies to:** this repository as it actually runs — Node/Express + EJS, SSR,
no database, catalogue in `src/data/generated/*.json`.

> Earlier versions of this file (and `SEO_ORPHAN_PAGE_AUDIT.md`, now removed)
> described a 45-entity demo model and features that were never built
> (dedicated `/parts/:partNumber` pages with cross-reference charts, per-product
> spec tables, machine-fitment listings). This document reflects the real site.

---

## 1. The data you actually have

`src/data/generated/products.json` — **85,150 rows** from the JCB master price
list. Per row: `part_number`, `description`, `mrp` (hidden), `hsn`, `gst`,
`internal_category_code`, and — for ~28k rows — a `catalogue_category_*`
(assigned by `scripts/build-category-mapping.js` from PDF OE evidence + keyword
rules). ~1,200 rows have a real product photo.

**There is no machine / model / engine / specification / fitment data anywhere
in the project.** `src/data/catalog.js` is a separate hand-authored set
(4 brands, 6 machines, 8 model-year variants, 6 export countries, 3 guides) used
only for the brand / machine / model / export / resources pages. It is not
linked to the 85k catalogue. The OCR'd `reports/pdf-extract.jsonl` (from
`Jcb catalogue E.pdf`) is organised by component system, not by machine — so it
cannot supply fitment data either.

Consequence: machine/model/brand pages are **navigational hubs**, not "parts
that fit your machine" lists. Any part→machine claim would be fabricated.

---

## 2. URL & page architecture

| URL | Page | Indexable |
|---|---|---|
| `/` | Home | yes |
| `/products` | Category hub (26 categories) | yes |
| `/products/{part-slug}` | Product detail — one canonical URL per row | **conditional** (§4) |
| `/parts/{category-slug}` | Category listing, 48/page, `?page=N` | yes (self-canonical per page) |
| `/machines`, `/machines/{slug}`, `/machines/{brand}/{model}` | Machinery hubs | yes |
| `/brands`, `/brands/{slug}` | Brand hubs | yes |
| `/export`, `/export/{country}` | Export-market landing pages | yes |
| `/resources`, `/resources/{slug}` | Technical guides (3) | yes |
| `/rfq`, `/rfq/confirmation` | Quote engine | `noindex` |
| `/search` | Internal search | `noindex`, `Disallow` in robots |
| `/audit`, `/qa/*`, `/api/*` | Internal | `noindex` + `Disallow` |

Legacy URL shapes 301 via `src/middleware/redirects.js`:
`/parts/{part-number}` → canonical product URL; legacy internal category codes
→ best catalogue category or `/products`.

---

## 3. On-page SEO

- **SSR, zero JS dependency.** All headings, copy, links, breadcrumbs and
  JSON-LD are in the raw HTML.
- **Titles** — product titles lead with the part number
  (`{part_number} {description} · JCB Spare Part | RRE International`); category
  titles are category-specific and JCB-qualified; every page unique.
- **Meta descriptions** — assembled per page from real fields (part number,
  description, category, HSN/GST for products; real category description for
  categories). No single template with one value swapped.
- **H1** — one per page. Product H1 carries description + part number. Machine
  / model / category H1s describe the page.
- **Part-number formats** — product pages show "Also written as
  `02-100073`, `02100073`" (mechanical variants of the real number only).
- **Open Graph / Twitter** — real per-page image (product photo where present,
  else the 1200×630 brand card `/images/rre-og-default.jpg`); `og:type=article`
  on guides with `article:published_time`.
- **Favicons** — `favicon.ico` (multi-size), `.svg`, 32px PNG, apple-touch.

---

## 4. Indexation policy (`productStore.computeIsIndexable`)

Not every one of 85k thin rows deserves an indexable URL. A row is `index,
follow` when **any** of these hold (all from real data):

1. it has a genuine product photo, or
2. it is mapped to a real catalogue category, or
3. its description is ≥ 2 words and ≥ 12 alphanumerics, or
4. its description carries a bracketed OE cross-reference, e.g.
   `Track Rod Link (335/Y0144)`.

Everything else — single-word generic fasteners ("BOLT", "NUT") with no photo
and no category — is `noindex, follow`: still crawlable, still passes link
equity, kept out of the index **and the XML sitemap**. Currently ≈ 57k
indexable / ≈ 28k `noindex`. This is a runtime flag; no product data is
mutated. Tune the thresholds as Search Console data arrives.

---

## 5. Structured data (JSON-LD)

| Schema | Where | Notes |
|---|---|---|
| `Organization` | all pages (`@id` `/#organization`) | legal name, ISO 9001:2015 credential, Delhi address, contact point |
| `WebSite` + `SearchAction` | all pages | search target `/search?q={q}` |
| `BreadcrumbList` | every hierarchical page | visible breadcrumb + JSON-LD kept in sync by `breadcrumbService` |
| `Product` | product pages | `name`, `sku`, `mpn`, `brand` (RRE International — the aftermarket maker; **no OEM brand asserted**), `manufacturer`, `category`, `additionalProperty` (HSN, GST). `image` only when a real photo exists. `offers` only when `show_price` (never, currently). |
| `CollectionPage` + `ItemList` | category pages | first 24 products as `ListItem`s, `numberOfItems` = category total |
| `FAQPage` | machine / model / brand pages | answers built only from real `catalog.js` fields (engine variants, aftermarket status, machines covered) |
| `Article` | `/resources/{slug}` | headline, author (Organization), datePublished |

**Never emitted:** ratings, reviews, prices, stock/availability, OEM
authorization, fabricated specs.

---

## 6. Sitemaps & robots

- `/sitemap.xml` — index → `/sitemaps/main.xml`, `/sitemaps/products-{1..9}.xml`
  (only `is_indexable` rows; photo-backed rows get higher priority),
  `categories`, `brands`, `machines`, `models`, `countries`, `resources`.
- `/robots.txt` — one `User-agent: *` group (the earlier per-bot groups
  silently replaced it for Googlebot/Bingbot and dropped every `Disallow`).
  `Disallow`: `/search`, `/admin`, `/rfq/private`, `/rfq/confirmation`,
  `/api/`, `/qa/`, `/audit`, `*?*sort=`, `*?*filter=`. CSS/JS explicitly
  allowed.
- `/llms.txt` — enterprise summary for AI crawlers.

---

## 7. Performance / crawl efficiency

- Static CSS ~51 KB, JS ~13 KB, SSR, gzip, ETag.
- `src/middleware/cacheControl.js` — catalogue HTML is `public, max-age=0,
  s-maxage=300, stale-while-revalidate=86400`; robots/sitemaps `s-maxage=3600`;
  search/rfq/api/qa `private, no-cache`.
- `src/middleware/utmTracker.js` — no visitor cookie for crawlers or for
  robots/sitemap/favicon; for real visitors the attribution cookie is written
  only on the first visit or a new campaign parameter, and such a response is
  marked `private`. Result: hot pages are shared/CDN-cacheable.

---

## 8. Analytics & Search Console

- **GA4** `G-VXNCSCEESK` — site-wide, plus `whatsapp_click` and `rfq_start`
  events. Overridable via `GA4_MEASUREMENT_ID`.
- **Search Console** — apex-domain `TXT` verification
  (`google-site-verification=Hxi4…`); `google-site-verification` meta also
  emitted (`GSC_VERIFICATION_TOKEN`). `msvalidate.01` via
  `BING_VERIFICATION_TOKEN` when set.
- Outstanding manual steps: click **Verify** in Search Console, submit the
  sitemap, mark `whatsapp_click` / `rfq_start` as key events in GA4, link GA4 ↔
  Search Console.

---

## 9. Internal linking

Home → hubs → detail. Machine/model/brand pages link the full category grid
with live counts; category pages cross-link every other category + key machine
pages; product pages link their category + related products; breadcrumbs
everywhere. No orphan indexable pages. The public footer no longer links the
internal `/audit` dashboard.

---

## 10. Known limitations / not done

- No machine/model/engine fitment data — hubs cannot list model-specific parts.
- ~57k product pages are real but brief (part number + description + category +
  enquiry path). They are honestly scoped, not doorway pages, but depth depends
  on the catalogue gaining photos and fuller descriptions.
- Competitor & keyword-volume research needs a data source with API units
  available (Semrush units were exhausted at the time of writing).
- `catalog.js` hero copy (e.g. "1,200 verified SKUs for JCB 3DX") is the
  client's own editorial claim, left as-is.
- Resource article images (`/images/resources/{slug}.jpg`) are 404 — only 3
  articles; low priority.

---

*This file supersedes the previous SEO_AEO_GEO_AUDIT.md and
SEO_ORPHAN_PAGE_AUDIT.md.*
