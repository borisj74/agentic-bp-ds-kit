# usage-overview

| | |
|---|---|
| Spec | `docs/references/usage-overview.json` |
| Pattern | ListPage |
| Brand | cobalt |
| Themes | Light, Dark |
| States | ready, empty |
| Page | **Spec renders**, section `usage-overview` |
| Renders | 5 |
| Audits | 2 |
| Outcome | clean — all eight rules pass |

Five renders is more than the skill's three attempts. The cap is for repairing a **spec**; the spec
never changed here. Each extra render followed a fix to the map or the renderer, which the loop is
supposed to surface and which a person has to make. Said plainly rather than hidden in a count.

## Rules × attempts

The audit ran twice: once the render stopped reporting missing layers, and once more after a rule
was corrected. Renders 1 to 4 were judged by what the render call reported and by the screenshots.

| Rule | Audit 1 | Audit 2 |
|---|---|---|
| `bp/figma-instance` | **4** | pass |
| `bp/figma-detached` | pass | pass |
| `bp/figma-bound` | pass | pass |
| `bp/figma-props` | pass | pass |
| `bp/figma-modes` | pass | pass |
| `bp/figma-overflow` | pass | pass |
| `bp/figma-align` | pass | pass |
| `bp/figma-example-content` | pass | pass |

The four `bp/figma-instance` findings were the rule's fault: a swapped instance keeps the name of the
layer it was put in, so the Scoreboard in the Section's content slot is called `content` in the file.
The audit now reads the component behind the instance as well as the layer's name.

## Frames

| Frame | Node | Link |
|---|---|---|
| usage-overview/ready/light | `1767:23` | https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1767-23 |
| usage-overview/ready/dark | `1767:4978` | https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1767-4978 |
| usage-overview/empty/light | `1767:7037` | https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1767-7037 |
| usage-overview/empty/dark | `1767:7902` | https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1767-7902 |

Section `1767:22`, page `1746:22`.

## Screenshots

- `reports/figma-loop/usage-overview/ready-light.png`
- `reports/figma-loop/usage-overview/ready-dark.png`
- `reports/figma-loop/usage-overview/empty-light.png`
- `reports/figma-loop/usage-overview/empty-dark.png`

## missing

Render 1 and render 2 each reported two:

| Render | Frame | Layer the plan named |
|---|---|---|
| 1 | ready/light, ready/dark | `Dropdown 1` — the map did not say where the Toolbar draws its filters, so the plan guessed a name |
| 2 | ready/light, ready/dark | `filters > chips > Chip 1` — the right path, but the chips are only in the `filtersOpen=true` variant |

Renders 3 to 5 reported none. Nothing `fellBack`: the AppShell page slot took the screen in every
frame.

## Not in Figma

The library draws these as its own example content. The spec's words are not there:

| Path | What shows instead |
|---|---|
| `regions.above[0]…items[*].trend` | Card has no Figma property for a trend, so the artboard's `12% MoM`, `4.1% MoM`, `0% MoM`, `8.2% YoY` stand, and the `Month` badges with them. The spec says 6.4 up, 2.1 down, 11.8 up, and no trend on the fourth card. |
| `regions.toolbar[0].slots.filters[*].props.label` / `.text` / `.items[*]` | Dropdown's label is an accessible name in the map and its items are drawn as example copy, so the chips read `Status: Pending` and `Account Name`, not `Product` and `Plan`. |
| `regions.toolbar[0].slots.filters` | The Toolbar always draws 4 filter chips and the spec fills 2; `Account ID` and `Period` are the artboard's. |
| `regions.toolbar[0].props.searchPlaceholder`, `filterCount` | No Figma property; the search box reads `Search in list`. |
| `regions.content[0].props.footer` | The Table's footer label and value have no Figma property, so the total row reads `Total $2,250.00`, not `Total rated $308,977`. |
| `regions.pagination[0].props.total`, `page`, `pageSize` | No Figma property; the bar reads `Showing 1 to 10 of 59 rows`, not 128 rows at 25. |
| `breadcrumbs: ["Mediation"]` | The shell's page header has its breadcrumb switched off, so the trail the web screen shows is not drawn. |
| callbacks (`onSearchChange`, `onReset`, `onRefresh`, `onSelect`, …) | Figma components carry no event handlers. |

Everything else is the spec's own: the four Scoreboard cards, the Toolbar's `Export usage` with its
download glyph, all six columns and eight rows of the Table with their alignment, and the empty
state with its `speed` glyph and `open_in_new` button.

## What the audit could not see

Four faults were found by eye against `docs/references/screenshots/usage-overview.png` and the
prototype at `vercel-bp-prototype.vercel.app/prototypes/billing-dashboard`, not by a rule. All four
are fixed, each with a test:

1. **The Toolbar's filters went nowhere.** The map had no path for them. Read in the file:
   `filters > chips > Chip N`. Recorded as `Toolbar.partLayers.filters`.
2. **The chips were not drawn at all.** They are in the `filtersOpen=true` variant, not behind a
   switch per chip. The map now has `partVariants`, which says the variant to ask for and how many
   parts it draws; the plan asks for it, fills as many as the spec has, and says how many it cannot
   fill. Test: *asks for the variant that draws a whole row of parts, and says what it cannot fill*.
3. **The "This month" Section was empty.** The Scoreboard went into `content#119:91` while
   `showContent#119:78` — the switch that draws that layer — was turned off by the sweep that turns
   off everything the spec did not ask for. A slot the spec fills now turns its own switch on.
   Test: *turns on the switch that belongs to a slot the spec filled*.
4. **The cards carried the artboard's figures.** A Card on its own says `title#189:21`; the same
   Card inside a Scoreboard says `title#176:0`, and `metric` and `metadata` are exposed there too,
   which the plan had been reporting as "Card has no Figma property". The map now holds
   `slots.<name>.childKeys` for a parent that re-keys what it exposes.
   Test: *writes a row with the keys the parent exposes, not the child's own*.

The audit rule that was wrong is fixed too: *finds a swapped instance by the component behind it,
not by the layer's name*.

## Left for a person

- **The cards' trends are the library's.** Either expose a trend on the Scoreboard's cards in Figma,
  or accept that a rendered Scoreboard shows the artboard's movement. Right now a reader would take
  `12% MoM` for the screen's own number, and it is not.
- **The filter chips' labels cannot be set.** `Dropdown.label` is an accessible name in the map and
  the chip's visible words come from the `FilterButton` inside it. Reading that layer and recording
  it would let the chips read `Product` and `Plan`.
- **The Toolbar draws four chips whatever the spec says.** Two of them are somebody else's filter.
- **The Table footer and the Pagination numbers** are the artboard's. Both need a property in Figma
  before the spec's own figures can go in.
- **No breadcrumb**, as in settings-home: the shell's page header takes the title and nothing else.
- **The ready frame runs past 900px.** The pagination bar is below the fold once the Scoreboard is
  drawn. `bp/figma-overflow` only measures the frame's own children, and the AppShell fits; the web
  screen scrolls, so this may be right, but it is worth a decision rather than a surprise.
