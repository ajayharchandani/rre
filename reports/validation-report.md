# RRE International — Product Migration Validation Report

Generated: 2026-08-20T20:28:43.578Z
Source: JCB Price list month of June 2026.xlsx

| Metric | Count |
|---|---|
| Excel data rows | 85150 |
| Products published | 85150 |
| Products excluded | 0 |
| Distinct categories | 41 |
| Products with confirmed category names | 0 of 41 |
| Slugs that required disambiguation suffix | 5 |

**All 85150 Excel rows were published. Zero exclusions.**

## Notes
- `show_price` is set to `false` on every product per client decision: MRP is stored exactly as sourced but not shown publicly until an export pricing methodology is confirmed.
- `image_status` is set to `image_pending` for all products pending Phase 3 (PDF image matching) and Phase 4 (placeholder assignment).
- `category_name` defaults to the raw `category_code` until confirmed via reports/category-mapping-review.csv.
