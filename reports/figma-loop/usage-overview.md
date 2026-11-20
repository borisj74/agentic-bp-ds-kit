# usage-overview

| | |
|---|---|
| Spec | `docs/references/usage-overview.json` |
| Pattern | ListPage |
| Brand | cobalt |
| Themes | Light, Dark |
| States | ready, empty |
| Page | **Spec renders**, section `usage-overview` |
| Renders | 6 |
| Audits | 3 |
| Outcome | clean — all nine rules pass |

Six renders is more than the skill's three attempts. The cap is for repairing a **spec**; the spec
never changed here. Each extra render followed a fix to the map or the renderer, which the loop is
supposed to surface and which a person has to make. Said plainly rather than hidden in a count.

## Since this run

`bp/figma-example-content` changed under this spec afterwards. It now reads every word showing in
the frame, not only a slot's own children, passing over the shell's own chrome and the words a
component draws that no spec can set (`audit.exampleContent` in `contracts/figma-map.json`). So the
artboard's trends, badges, chips, total and pagination line below are findings rather than a
paragraph in this report, and a run today would not come back clean.

## Rules × attempts

The audit ran three times: once the render stopped reporting missing layers, and twice more after a
rule was corrected. Renders 1 to 3 were judged by what the render call reported and by the
screenshots.

| Rule | Audit 1 | Audit 2 | Audit 3 |
|---|---|---|---|
| `bp/figma-instance` | **4** | pass | pass |
| `bp/figma-detached` | pass | pass | pass |
| `bp/figma-bound` | pass | pass | pass |
| `bp/figma-props` | pass | pass | pass |
| `bp/figma-modes` | pass | pass | pass |
| `bp/figma-overflow` | pass | pass | pass |
| `bp/figma-align` | pass | pass | pass |
| `bp/figma-example-content` | pass | pass | pass |
| `bp/figma-dividers` | — | — | pass |

`bp/figma-dividers` did not exist for the first two audits. It was added with render 6.

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

Renders 3 to 6 reported none. Nothing `fellBack`: the AppShell page slot took the screen in every
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

Five faults were found by eye against `docs/references/screenshots/usage-overview.png` and the
prototype at `vercel-bp-prototype.vercel.app/prototypes/billing-dashboard`, not by a rule. All five
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

5. **The third card had no line down its right side.** The Scoreboard's divider is each card's own
   `showLine#176:35`, drawn by a `line` rectangle inside the card, and the kit's rule is
   `.card:last-child { border-inline-end: 0 }` — every card but the last shown one carries it. The
   artboard ships three cards with the line off on Card 3, because Card 3 was last there. Turning
   Card 4 on made Card 3 no longer last and left it bare, and gave Card 4 a line it should not have.
   The map now holds `slots.items.childDivider`, and the plan writes the flag on every row: true for
   all but the last, false for the last, whatever the count.
   Tests: *draws the line down every card but the last, for any number of cards* (3, 4 and 6), and
   *checks the cards' lines in the file, not against what the plan wrote*.

Two audit rules were wrong and are fixed: *finds a swapped instance by the component behind it, not
by the layer's name*, and the new **`bp/figma-dividers`**, which reads which cards are showing in
the file and checks each one's line against the contract rather than against the plan — so a divider
drawn on the wrong card is caught even when the plan and the render agree with each other.

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
