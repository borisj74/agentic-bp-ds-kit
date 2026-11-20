# payments-empty — Figma render

Spec `docs/references/payments-empty.json` · pattern `ListPage` · brand `cobalt` · Light and Dark.
Rendered 2026-11-20 into [Agentic DS](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/), page
**Spec renders**, section **payments-empty**.

**Pass.** Eight rules, four frames, nothing left for the loop to repair.

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
| bp/figma-align | — | — | pass |
| bp/figma-example-content | — | — | pass |

Three defects got through attempts 1 and 2 with every rule passing. The screenshot caught all three;
the last two rules in the table were written so none of them can pass silently again.

1. **The page slot kept the artboard's own example content** — the screen was appended under the
   AppShell's example Sections. A slot is emptied before it is filled, and **bp/figma-example-content**
   now reads every slot in the frame and reports anything in it the plan did not put there, quoting
   the words it found.
2. **The shell's own parts were left at the artboard's defaults** — its example page header stayed on
   with the wrong title, somebody else's breadcrumb trail and two example actions. The shell now says
   its own switches out loud, and **bp/figma-props** covers them because they are in the plan.
3. **The screen sat 24px in from its own title.** The shell's `page` frame already carries the content
   inset (`layout/margin-md`) and the 16px gap under the page header, and the renderer's own column
   carried a second inset on top of it. In the kit that column is `.layout-stack`, not
   `.layout-content`, so that is what it is now: the same gap, no padding and no surface of its own.
   `.layout-content` is still what the fallback frame uses, where there is no padded page around it.
   **bp/figma-align** measures the page header title's left edge against the screen's first child and
   fails at more than 1px.

Measured after this render, in every one of the four frames: title and content both at the page's own
left edge, 0px apart, and 16px between the page header and the first thing under it — the same two
numbers as [the billing-dashboard prototype](https://vercel-bp-prototype.vercel.app/prototypes/billing-dashboard)
at 1440 (title and sections both at x 192, header bottom 136, first section 152).

## Page-level actions

**This screen has none, so the page header carries only its title.**

The spec names one action, `Record payment`, and puts it in the `Toolbar`'s `actions` slot. The
contracts keep those two places apart: `Toolbar actions` is what can be done to the list under it,
and `PageHeader actions` is what can be done to the page. A list's own primary action belongs to the
bar over the rows — it is where every other list screen in `docs/references/` puts it — so it stays
in the toolbar, and the page header's two example buttons are switched off rather than filled with
something the spec never asked for.

The renderer fills a page header's actions wherever a spec does name them: a pattern that draws its
own header (FormPage, RecordPage) gets them through `bar > controls > Action 1` and `Action 2`, the
layers read in the file. A ListPage's header is drawn by the shell, and the spec has no way to put
actions in it — if this screen should have one, that is a change to the kit's spec schema, not to
this render.

## What the render does not carry

- **No breadcrumb trail.** The web frame draws Home › Accounts receivable › Payments and refunds. The
  Figma page header's crumbs are the artboard's example trail and the renderer cannot yet write a
  screen's own, so the breadcrumb is switched off rather than left saying something untrue.
- **Not in Figma** (the plan's own report):
  - `Toolbar label`, `searchPlaceholder`, `onSearchChange`, `onRefresh` — an accessible name, a
    runtime string and two callbacks. Figma draws the search and the refresh; their words are the
    artboard's.
  - `Table rowLabel`, `emptyLabel` — runtime strings.
  - `columns[0].emphasis` — HeaderCell has no Figma property for it.
  - `EmptyState headingLevel`, `icon`, `iconStyle` — the icon glyph is the artboard's.

## What the screen does carry

Both states, both schemes, every leaf a library instance:

- the shell, its header and its nav, with the page title **Payments and refunds**
- ready: the Toolbar with its search and refresh and one strong brand **Record payment**; the Table
  with the five columns the spec names (Payment, Account, Method, Received, Amount — Amount ended),
  its three records, its caption, and rows 4 to 10 and columns 6 to 8 switched off
- empty: the EmptyState with its title, its description and **Import bank file**, drawn subtle
  neutral from the Button contract's own defaults, with the second example button switched off
