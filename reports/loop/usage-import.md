# Loop report — Import usage

Spec: `docs/references/usage-import.json`  
Pattern: GuidedProcessPage  
States: ready  
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

Pages: `/usage-import`  
Code review: 1 file: nothing to fix.  
Live `ready`: 15 kit pieces, patterns AppShell, GuidedProcessPage, 0 errors  

Nothing to fix.

## Screenshots

- `ready` light (1440×900) — `reports/loop/usage-import/ready-light.png`
- `ready` dark (1440×900) — `reports/loop/usage-import/ready-dark.png`

Server: next dev on port 3123 with `NEXT_PUBLIC_BP_INSPECT=1`.
