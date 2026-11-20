# payments-empty — Figma render

Spec `docs/references/payments-empty.json` · pattern `ListPage` · brand `cobalt` · Light and Dark.
Rendered 2026-11-20 into [Agentic DS](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/), page
**Spec renders**, section **payments-empty**.

**Pass**, on the third attempt.

## Frames

| Frame | Node | Screenshot |
|---|---|---|
| payments-empty/empty/light | [1746:24](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1746-24) | `payments-empty/empty-light.png` |
| payments-empty/empty/dark | [1746:1517](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1746-1517) | `payments-empty/empty-dark.png` |
| payments-empty/ready/light | [1746:2151](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1746-2151) | `payments-empty/ready-light.png` |
| payments-empty/ready/dark | [1746:5709](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1746-5709) | `payments-empty/ready-dark.png` |

Page `1746:22`, section `1746:23`. Re-rendering keeps all of these ids.

## Rules by attempt

| Rule | 1 | 2 | 3 |
|---|---|---|---|
| bp/figma-instance | pass | pass | pass |
| bp/figma-detached | pass | pass | pass |
| bp/figma-bound | pass | pass | pass |
| bp/figma-props | pass | pass | pass |
| bp/figma-modes | pass | pass | pass |
| bp/figma-overflow | pass | pass | pass |

The audit passed on every attempt. The two defects that made attempts 1 and 2 wrong were **visual**,
and no rule caught either of them — the screenshot did. Both are fixed in the renderer:

1. **The page slot kept the artboard's own example content.** The screen went in under the AppShell's
   example Sections (Summary, Invoices, Billing settings), so the frame read as somebody else's
   screen with this one below it. `$fig` now empties a slot before it fills it.
2. **The shell's own parts were left at the artboard's defaults.** The frame root was built without
   the switch pass every other instance gets, so the example page header ("Invoices", a Home / Billing
   / Invoices trail, "Ask the assistant" and "New invoice") stayed on. The shell now says its own
   switches out loud — page on, assistant off — and writes the screen's title into the page header
   with the header's own example parts switched off.

The audit now checks both: the shell's switches and its page header are in the plan, so a render that
loses either fails `bp/figma-props`.

## What the render does not carry

- **No breadcrumb trail.** The web frame draws Home › Accounts receivable › Payments and refunds.
  The Figma page header's crumbs are the artboard's example trail, and the renderer cannot yet write
  a screen's own, so the breadcrumb is switched off rather than left saying something untrue.
  Left for a person.
- **Not in Figma** (the plan's own report):
  - `Toolbar label`, `searchPlaceholder`, `onSearchChange`, `onRefresh` — an accessible name, a
    runtime string and two callbacks. Figma draws the search and the refresh; their words are the
    artboard's.
  - `Table rowLabel`, `emptyLabel` — runtime strings.
  - `columns[0].emphasis` — HeaderCell has no Figma property for it.
  - `EmptyState headingLevel`, `icon`, `iconStyle` — the icon glyph is the artboard's; the kit sets
    it in code.

## What the screen does carry

Both states, both schemes, every leaf a library instance:

- the shell, its header and its nav, with the page title **Payments and refunds**
- ready: the Toolbar with its search and refresh and one strong brand **Record payment**; the Table
  with the five columns the spec names (Payment, Account, Method, Received, Amount — Amount ended),
  its three records, its caption, and rows 4 to 10 and columns 6 to 8 switched off
- empty: the EmptyState with its title, its description and **Import bank file**, drawn subtle
  neutral from the Button contract's own defaults, with the second example button switched off
