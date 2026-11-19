# Loop report — Usage overview

Spec: `docs/references/usage-overview.json`  
Pattern: ListPage  
States: ready, empty  
Attempts: 1  
Result: **pass**

## Rules

| Rule | Result | Errors | Warnings |
| --- | --- | --- | --- |
| bp/raw-value | pass | 0 | 0 |
| bp/primitive-token | pass | 0 | 0 |
| bp/local-cousin | pass | 0 | 0 |
| bp/closed-enum | pass | 0 | 0 |
| bp/one-primary | pass | 0 | 0 |
| bp/use-pattern | pass | 0 | 0 |
| bp/use-bigger-piece | pass | 0 | 0 |
| bp/screen-frame | pass | 0 | 0 |
| bp/no-tags | pass | 0 | 0 |
| bp/landmark | pass | 0 | 0 |
| bp/no-pattern | pass | 0 | 0 |

## Attempts

### Attempt 1 — pass

Pages: `/usage-overview`, `/usage-overview/empty`  
Code review: 2 files: nothing to fix.  
Live `ready`: 22 kit pieces, patterns AppShell, ListPage, 0 errors  
Live `empty`: 18 kit pieces, patterns AppShell, ListPage, 0 errors  

Nothing to fix.

## Screenshots

- `ready` light (1440×900) — `reports/loop/usage-overview/ready-light.png`
- `empty` light (1440×900) — `reports/loop/usage-overview/empty-light.png`
- `ready` dark (1440×900) — `reports/loop/usage-overview/ready-dark.png`
- `empty` dark (1440×900) — `reports/loop/usage-overview/empty-dark.png`

## Repairs written back to the spec

The spec was built as it was written: `docs/references/usage-overview.json` is unchanged.

Served by next dev with `NEXT_PUBLIC_BP_INSPECT=1`.
