# RRE International — Full Validation Report

Generated: 2026-08-31T07:36:40.581Z

## Counts

| Metric | Count |
|---|---|
| Excel data rows | 85150 |
| Products published | 85150 |
| Products excluded | 0 |
| Distinct internal Cat 1 codes | 41 |
| Customer-facing catalogue categories | 26 |
| Products categorized | 28314 |
| Products needing review (published, uncategorized) | 56789 |
| Duplicate slugs | 0 |
| Duplicate canonical URLs | 0 |

## Image status distribution

| Status | Count |
|---|---|
| source_image | 818 |
| placeholder_image | 83958 |
| image_pending | 0 |
| generated_image | 374 |

## Result

**FAIL — 2 issue(s):**
- 47 product(s) have an invalid/missing category_status (expected 'categorized' or 'needs_review').
- Category status counts (28314 categorized + 56789 needs_review = 85103) do not add up to total products (85150).


