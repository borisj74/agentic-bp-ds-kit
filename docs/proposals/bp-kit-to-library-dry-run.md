# Dry run: `bp-kit-to-library` on InsightCard

Plan only. No component code, no contract file, no token rows were written for this. The point is to check whether the skill in `.claude/skills/bp-kit-to-library/` is enough to plan a piece the kit does not cover, and to see where it makes an agent stop.

**Piece chosen:** `InsightCard`. It is the one component `.claude/skills/prototype-from-kit/SKILL.md` still lists as "not built yet", and the planned `assistant-workspace` pattern is described as "AppShell with a `ChatWindow` as `assistant` + two-column InsightCards". So it is a real gap with a named caller, not an invented one.

Source of truth used: the kit itself (existing contracts) plus the one-line description in the prototype skill. There is no Figma node and no screenshot, which is already a finding — see "What is missing" at the end.

---

## Step 0 — Place it in the catalog

Searched `contracts/index.json` for `insight`: no row. The nearest pieces, and why none of them is it:

| Piece | Level | Why it is not InsightCard |
| --- | --- | --- |
| `Card` | molecule | An item in a set people compare and pick (plan, product, proposal line): title, price, status, select checkbox. Its `doNot` sends key numbers to Scoreboard. An insight is not a choice in a set. |
| `Scoreboard` | organism | A strip of 3–6 key numbers with trend and spark chart. One number per tile, no narrative, no per-tile action. Its `doNot` bans a `MetricCard` outright. |
| `Callout` | molecule | Inline message with one action — the closest behaviour, but it is page furniture, not a tile in a grid, and it carries no metric, trend or source. |
| `Section` | organism | A page section with a heading. Too big; an insight sits *inside* one. |
| `Sparkline` / `Meter` / `Badge` | atoms | Parts, not the piece. |

**Verdict: it is a gap, with a caveat.** `Card.doNot` and `Scoreboard.doNot` between them already forbid "a card with a number in it". An InsightCard is only allowed to exist if it is clearly a *different job*: a machine-written finding that someone reads, judges and acts on. If the plan cannot keep that line, the skill says stop and ask — and that is the honest outcome here (see "Open question" below).

Proposed catalog entry:

```json
{
  "name": "InsightCard",
  "contract": "contracts/insightcard.json",
  "level": "molecule",
  "category": "feedback",
  "tags": ["insight", "anomaly", "finding", "recommendation", "ai", "assistant", "explanation"]
}
```

- `level: molecule` — it composes `Badge`, `Icon`, `Sparkline`, `Button`. It is not an organism: it holds no list, no toolbar, no layout of its own children beyond one stack.
- `category: feedback` — it tells someone something, like `Callout` and `Toast`. Not `data`: it is not a chart or a grid.
- Name: `InsightCard`, folder `src/ui/InsightCard/InsightCard.tsx`, contract `contracts/insightcard.json`.

## Step 1 — Tokens

Walked every value the piece needs against the existing roles:

| Need | Role | New token? |
| --- | --- | --- |
| tile surface | `--surface-raised` | no |
| tile border | `--border-neutral-subtle` | no |
| tile radius | `--radius-surface` (8) | no |
| tile padding | `--space-medium` (16) | no |
| gap between tile rows | `--space-xsmall` (8) / `--space-small` (12) | no |
| severity tint (info / warning / danger / success) | `--bg-info-faint`, `--bg-warning-faint`, `--bg-danger-faint`, `--bg-success-faint` + matching `--border-*-subtle`, `--icon-*`, `--text-*-strong` | no |
| title type | `--text-heading-xs-*` | no |
| body type | `--text-body-*` | no |
| the metric | `--text-metric-*` (16px semibold, same as a Scoreboard tile) | no |
| source / timestamp line | `--text-body-tight-*` + `--text-neutral-subtle` | no |
| leading icon | `--icon-size-small` (16) | no |
| action row | `Button emphasis="minimal"` | no |

**Zero new tokens.** Good sign: the piece is on-system. The skill's rule holds — if this had needed three or four new tokens, the shape would have been wrong.

## Step 2 — The contract (sketch, not written to disk)

```
name     InsightCard
path     src/ui/InsightCard/InsightCard.tsx
level    molecule
figma    — missing, see "What is missing"
intent   One machine-written finding someone reads and acts on: what was found, how sure
         or how serious it is, the number behind it, and the one thing to do next.
composes ["Badge", "Icon", "Sparkline", "Button"]
```

Props, all enums closed:

| Prop | Type | Default | Note |
| --- | --- | --- | --- |
| `title` | `string`, required | — | The finding in one line, sentence case. |
| `children` | `ReactNode`, required | — | The explanation. Two or three sentences. |
| `intent` | `info \| warning \| danger \| success \| neutral` | `info` | How serious the finding is. Sets the icon tint and the left edge. Never raw colour. |
| `iconStart` | `string` | per `intent` | Material Symbols name. Defaults: info `lightbulb`, warning `warning`, danger `priority_high`, success `check_circle`, neutral `insights`. |
| `badge` | `string` | — | One short label beside the title: confidence or category. Renders a kit `Badge`. |
| `metric` | `string` | — | The number behind the finding, in `--text-metric-*`. One value only. |
| `metricLabel` | `string` | — | What the number is. Read with `metric`. |
| `trend` | `{ value: string; unit?: string; direction?: "up" \| "down" \| "none"; status?: "success" \| "danger" \| "neutral" }` | — | Same shape as a `ScoreboardItem.trend`, on purpose. |
| `chart` | `{ points: number[]; area?: boolean }` | — | The shape of the trend only, drawn with `Sparkline`. |
| `source` | `string` | — | Where the finding came from, e.g. "Revenue · last 30 days". |
| `actionLabel` | `string` | — | The one action. Renders `Button emphasis="minimal" intent="brand"`. |
| `onAction` | `function` | — | `() => void`. |
| `dismissible` | `boolean` | `false` | Adds an icon-only minimal close Button, labelled "Dismiss insight". |
| `onDismiss` | `function` | — | `() => void`. |
| `href` | `string` | — | Makes the whole tile a link to the record behind it. Mutually exclusive with `onAction`. |
| `size` | `sm \| md` | `md` | `sm` drops the chart and the source line, for a narrow rail. |

`useWhen`
- An assistant or a rule engine found something and a person has to judge it.
- A two-column grid of findings on an insights or anomaly screen.
- A single finding above the thing it is about, with one action.

`doNot` (first line is the required "when not to use")
- Do not use it for a key number with no finding attached. Use Scoreboard.
- Do not use it for an item in a set people compare and pick. Use Card.
- Do not use it for a page-level message about the page itself. Use Callout.
- Do not use it for a message that disappears on its own. Use Toast.
- Do not invent a local InsightTile, AnomalyCard, RecommendationCard or FindingCard.
- Do not put more than one action in it. Put extra actions in the Section above it.
- Do not use raw hex; `intent` sets every colour.
- Do not pass both `href` and `onAction`.

`a11y`
- The tile is an `<article>` with `aria-labelledby` on the title.
- `intent` is never the only carrier of meaning: the icon has a label, and severity is also in the words.
- The action is a native `<button>`; with `href`, the title is the link and the tile is not a nested interactive.
- Dismiss is an icon-only Button with a visible label for screen readers.
- Focus ring from `--outline-brand`, offset `--focus-offset`.

`snippet`

```tsx
<InsightCard
  intent="warning"
  title="Invoice volume dropped 18% this week"
  badge="High confidence"
  metric="$42,180"
  metricLabel="Invoiced, last 7 days"
  trend={{ value: "18%", direction: "down", status: "danger" }}
  source="Billing · last 7 days"
  actionLabel="Open invoices"
>
  Weekly invoiced amount fell below the 8-week range. Three accounts stopped invoicing on Tuesday.
</InsightCard>
```

`examples` to write (each one is also a render + axe test):
1. **Accessibility** (`a11y: true`) — default tile, one with `href`, one dismissible.
2. **Intents** — info, warning, danger, success, neutral.
3. **With a number** — metric + metricLabel + trend.
4. **With a trend shape** — metric + chart.
5. **Narrative only** — title + children, no metric.
6. **Dismissible** — with `onDismiss`.
7. **Sizes** — sm then md.
8. **In a grid** — two tiles side by side in `.layout-split` (hand-written `code`).

## Step 3 — The component (plan)

```
src/ui/InsightCard/InsightCard.tsx        "use client" (dismiss and action handlers)
src/ui/InsightCard/InsightCard.module.css
```

- Classes: `.card`, `.info|.warning|.danger|.success|.neutral`, `.sm|.md`, joined the Button way: `[styles.card, styles[intent], styles[size]].join(" ").trim()`.
- Union-typed props so `href` + `onAction` fails typecheck, and so `onDismiss` is only accepted with `dismissible`.
- Layout inside the tile: header row (icon, title, badge, dismiss), body (`children`), metric row (metric, metricLabel, trend, chart), footer (source, action). Gaps from `--space-xsmall` / `--space-small`; no literal px.
- Severity drawn as a tinted icon plus a 2px start edge in `--border-<intent>-subtle`. The tile background stays `--surface-raised` so a grid of tiles does not turn into a traffic light. **Assumption, flag for review.**
- States: `:hover` lifts to `--shadow-raised` only when the tile is a link; `:focus-visible` outline on the interactive child, not the tile; no `disabled` state (an insight is never disabled).
- `inspect("InsightCard")` on the root.
- Boot: a page-level skeleton tile — `Skeleton shape="rect"` at the tile's own height when `useFieldSkeleton()` is true, so an insights page boots like the rest of the kit.
- Reuses `Sparkline` for `chart` — and `Sparkline.doNot` only forbids it *on a Scoreboard tile* (which draws its own), so this is allowed. Worth a line in the Sparkline contract either way.

## Step 4 — Molecule rules check

- Composes `Badge`, `Icon`, `Sparkline`, `Button`; restyles none of them from outside.
- Flat API: no `InsightCardHeader` / `InsightCardFooter`. Content arrives as props and `children`.
- No page spacing owned: the grid is `.layout-split` or `.layout-metrics` on the screen.

## Step 5 — Gates

1. `src/playground/registry.tsx` → `InsightCard: { render, preview: { intent: "warning", title: …, metric: …, actionLabel: … }, hide: ["onAction", "onDismiss"], normalize: drop onAction when href is set }`.
2. No route file: `/components/insightcard` comes from the index.
3. `npm run sync:index`, `npm test` (contract examples + axe), `npm run lint`, `npm run build`.
4. Trim `InsightCard` from the "Not built yet" list in `.claude/skills/prototype-from-kit/SKILL.md` in the same change, or the two skills disagree.

## Open question for the owner

The skill told me to stop twice, and both stops are real:

1. **Overlap.** `Card.doNot` ("not for key numbers — use Scoreboard") and `Scoreboard.doNot` ("no MetricCard, ScoreCard or Sparkline") were written to stop exactly this shape of component. `InsightCard` is defensible only as *a finding with a number attached*, never as *a number in a card*. If that line feels thin, the cheaper move is to extend `Callout` with an optional metric and source, and not add a piece at all. My read: a separate piece is right, because the assistant screens need a grid of them and a `Callout` grid would be wrong. Marked as my judgement, not a kit rule.
2. **No Figma node.** Every component contract but `layout` and `density` carries `figma { fileKey, nodeId }`, and a test checks it. A new piece cannot satisfy that gate until the component is drawn in the Agentic DS file. Planning can finish; the contract cannot be committed complete.

## What this dry run says about the skill

Worked:
- Step 0 caught the overlap with `Card` and `Scoreboard` before any code, which is the expensive mistake.
- Step 1 forced each value onto an existing role; the result was zero new tokens, which is the signal the shape is on-system.
- The prop vocabulary (`intent`, `size`, `iconStart`, item shapes) made the API look like the kit without copying another contract wholesale.
- Reusing `ScoreboardItem.trend`'s shape verbatim came straight from reading the neighbouring contract, as step 2 asks.

Missing, now listed in the PR summary:
- The skill has no step for the Figma side, so a contract planned this way is incomplete at `figma`.
- The skill does not say who updates the "Not built yet" list in `prototype-from-kit`; this plan had to add it as step 5.4 by hand.
- There is no machine check that a new contract's `doNot` does not contradict an existing contract's `doNot`. Step 0 is done by reading.
