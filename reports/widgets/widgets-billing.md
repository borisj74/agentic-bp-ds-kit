# Widget report — widgets-billing

Source: `widgets/billing.jsonl`  
Tiles: 140 · pass 140 · fail 0 · repaired 6  
Each tile: its size × light and dark × every state it declares (ready, loading, empty, error with retry), reviewed with the kit rules, type-checked, measured against its size, and every declared action used against a stub.  
Passes are listed in `reports/widgets/widgets-billing.csv`; screenshots are in `reports/widgets/widgets-billing/` (not committed).

| Template | Pass | Fail |
| --- | --- | --- |
| bar-chart | 20 | 0 |
| checklist | 20 | 0 |
| donut | 20 | 0 |
| kpi-strip | 20 | 0 |
| line-chart | 20 | 0 |
| table | 20 | 0 |
| task-list | 20 | 0 |

## Failures

None: every tile passed.

## Repairs written back

These were written back into the spec, so the next run starts from them:

- `widgets/billing.jsonl:1` kpi-strip-01: `widget/capacity` size 6x1 → 12x1: 3 items need it.
- `widgets/billing.jsonl:5` kpi-strip-05: `widget/footer` footer link view-report is now a minimal header button: a kpi-strip has no room under its body.
- `widgets/billing.jsonl:6` kpi-strip-06: `widget/capacity` params.spark is now "hide": the cards did not fit with their spark lines.
- `widgets/billing.jsonl:11` kpi-strip-11: `widget/footer` footer link view-report is now a minimal header button: a kpi-strip has no room under its body.
- `widgets/billing.jsonl:13` kpi-strip-13: `widget/capacity` size 6x1 → 12x1: 3 items need it.
- `widgets/billing.jsonl:28` task-list-08: `widget/capacity` size 6x2 → 6x3: 4 items need it.
