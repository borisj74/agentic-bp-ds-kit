# Agentic BP DS — anti-patterns

Mistakes this system keeps catching. Each one has a right answer beside it.

## Drawing a component instead of inserting it

A table built from rectangles, a badge built from a rounded rect and a label, a
dialog built from a frame and a shadow. **Insert the library component.** If the
part is missing, say so instead of drawing a stand-in.

## A second component beside one that exists

A new "status chip" next to Badge, a local "header bar" next to PageHeader, a
"side panel" next to Drawer. **One component per job.** Extend the existing one's
property list, or say the variant is missing.

## Typed colour

A hex, an eyedropped fill, a colour nudged with opacity, or a binding to
`--ref-*` / `--ui-*`. **Bind to a role token** from `02-tokens.md`.

## `tone`, `variant` or `color` for the colour role

The property is always `intent`. On Button the look is `emphasis` x `intent`,
allowed pairs only — never a single `variant` property.

## More than one loud button

Two filled brand buttons on a screen means neither is the main action.
**One `emphasis=strong intent=brand` per screen**; everything else subtle or minimal.

## A per-screen grid

Columns and gaps invented for one layout. **Use the layout classes** —
`.layout-content`, `.layout-stack`, `.layout-split`, `.layout-metrics`.

## Page padding on a Section

Section does not own page padding; the page does. A Section that pads itself
double-pads against the page and misaligns with its neighbours.

## A metric row built out of frames and borders

**Use Scoreboard.** Hand-built metric rows drift in height, inset and divider
weight the moment the numbers change.

## Fields grouped by hand

A drawn fieldset, a two-column field grid, labels placed by eye. **Use Form**:
titled groups through its sections, `labelPosition=start` for leading labels,
`columns=2` for side-by-side fields. The leading-label column is a fixed width
(`--input-label-width`), so labels line up across every group.

## A table with its own scroll box

A table that scrolls inside a fixed-height frame fights the page. In this system
**the table scrolls with the page**, vertically; when it is wider than the viewport
the page scrolls sideways. Its column names hold at the top of the page, under
whatever is pinned above them.

## Guessing what holds still on scroll

Pinned things have one order, from the rows up: a frozen first column, the column
names, a frozen name cell (both at once), a pinned bar over them, its lift, and the
page name above the lot. **Take the order from that scale**, do not pick a layer.

## A trimmed side nav

A screen showing only the nav links it uses. **The whole nav, always**, with the
current screen marked.

## A breadcrumb trail without Home, or with its section twice

`Home > section > screen`. When the screen is the section's own page the trail
stops at the section.

## Inventing a token

A new spacing step, a new radius, a new type size. **Use the existing scale.** If
nothing fits, name what is missing rather than adding a value.
