---
name: widget-from-template
description: Use when building a dashboard tile (a widget) from the Agentic BP DS kit. Pick a template, a size, the params and data, then check and build. Never lay a tile out by hand.
argument-hint: <the tile to build, e.g. "open AR by aging bucket, half width">
---

# Widget from template

A widget is one tile of a dashboard: a kit Section with a thin line, a body, and an optional footer Link. Every
tile comes from a template in `templates/widgets/`. A template knows which kit pieces draw it, which sizes it
comes in, how much fits each size, and how it looks loading, empty and failed. You only pick and fill.

Invoke with `/widget-from-template <the tile you want>`.

## Steps

1. **Pick the template.** Read `templates/widgets/index.mjs`, then the one template file that matches:

   | Template | Draws | For |
   | --- | --- | --- |
   | `kpi-strip` | Scoreboard | the 3 to 6 numbers that matter, with a trend and a spark line |
   | `task-list` | ListView (drill) | the steps of a piece of work, each with a status Badge; rows open |
   | `line-chart` | LineChart | values over time, one line per series |
   | `bar-chart` | BarChart | values side by side, upright or across, stacked or not |
   | `donut` | PieChart (donut) | a whole split into 2 to 6 parts |
   | `table` | Table + Cell | a few rows that explain a number; cells are `plain`, `status` or `link` |
   | `checklist` | Timeline | what has to be done before something closes: done, open or late |

   If none fits, **stop and propose a new template** (what it draws, which kit pieces, its sizes and capacity).
   Do not draw the tile by hand, and do not stretch a template into something it is not.

2. **Pick the size.** Sizes are `<columns>x<rows>` on the 12-column grid: `3x1 4x1 6x1 12x1 4x2 6x2 12x2 6x3 12x3`.
   Their px come from the layout tokens, in `contracts/widget-sizes.json` (regenerate with `npm run widget -- sizes`).
   Each template lists the sizes it allows in `sizes`, and `capacity(size)` says how many items, rows,
   categories or slices each one holds. Pick the smallest size that holds the data.

3. **Fill params and data.** Params are closed enums from the template's zod `params`; data follows its zod
   `data`. Write the copy: `title` always, `help` when the tile needs explaining, `emptyTitle` (and
   `emptyDescription` on tiles two rows or taller) for the empty state, `error` for the error state. Actions:
   - `{ "id": "view-report", "type": "footer", "label": "View invoice period report" }` — one footer Link
   - `{ "id": "export", "type": "button", "label": "Export", "emphasis": "minimal", "icon": "download" }` — up to two header buttons, one strong at most (`bp/one-strong-action`); the page owns its one strong brand Button, so a tile rarely has one
   - `{ "id": "open-row", "type": "open" }` — rows that open (task-list, and table link cells, which need it)
   `retry` is the error state's own action; do not declare it. `states` defaults to all four; list fewer only when a state cannot happen.

   ```json
   {
     "kind": "widget",
     "name": "close-tasks",
     "template": "task-list",
     "size": "6x3",
     "copy": { "title": "Tasks", "emptyTitle": "No close tasks for this period", "error": "The close tasks did not load." },
     "data": { "items": [{ "id": "close", "title": "Close invoices", "detail": "12 pending", "status": { "label": "Completed", "intent": "success" } }] },
     "actions": [{ "id": "open-row", "type": "open" }, { "id": "view-period-report", "type": "footer", "label": "View invoice period report" }]
   }
   ```

   Worked specs: `docs/widgets/billing/*.json` (the billing prototype's tiles), and `widgets/billing.jsonl` (20 variants per template).

4. **Check.** `npm run widget -- check <spec.json | folder | batch.jsonl>`. An unknown template, a size the
   template does not come in, a param outside its enum, data in the wrong shape, missing copy for a declared
   state, a second strong button, or more data than the size holds all fail here, each with a fix.

5. **Build.** `npm run widget -- build <source>` writes each tile to
   `src/app/(widgets)/widgets/<batch>/tiles/<name>.tsx` and serves it at `/widgets/<batch>/<name>` (not committed).

6. **Loop.** `npm run widget -- loop <source>` renders every tile in each declared state, light and dark;
   reviews the code with the kit rules; type-checks it; measures it against its size; uses every declared action
   against a stub; screenshots each; repairs what it can in the spec (a bigger size, a footer moved to a header
   button, spark lines dropped, extra strong buttons made minimal) and retries, three attempts at most. It writes
   `reports/widgets/<batch>.md` (failures only) and `reports/widgets/<batch>.csv` (passes). Fix what the report
   leaves for you in the spec and run it again.

## Hard rules

- Edit the spec, never the generated tile: the next build overwrites it.
- No freehand layout: no `div`, no grid, no `style` in a tile. The template is the layout.
- A template only draws kit pieces by their contract names; a missing piece is a question, not a local cousin.
- One strong action per tile at most; one strong brand Button per page.
- Over capacity is an error, never a clipped tile: change the size or the data.
