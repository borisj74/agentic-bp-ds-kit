---
name: bp-ds-builder
description: Use when rebuilding or extending the Agentic BP DS library from a source of truth — a token file, a reference component (code, Figma node, or screenshot), or a whole screen. Produces tokens, then atoms, molecules, organisms and page templates, with names that match the contracts.
argument-hint: <the source, e.g. "contracts/table.json", "this Figma node", "screenshot of a tag chip">
---

# BP DS builder

Turn a source of truth into kit pieces that look, name and behave like the rest of Agentic BP DS.

Use `prototype-from-kit` to **build a screen** out of existing pieces. Use this skill to **grow or rebuild the library itself**: tokens, atoms, molecules, organisms and page templates.

A **page template** is a kit piece too, not a screen: it is the blueprint a screen fills in. A screen with real data in it is a page under `src/app/`, and that is `prototype-from-kit`'s job, not this skill's.

`RULES.md` beside this file is the written-out rule set, with every rule tagged **[code]** (confirmed in the repo) or **[guess]** (my reading). Read it before step 2; re-read the section you are touching.

## Input

One of:

1. **A token file** — `src/tokens/source/*.txt`, a Figma variable export, or a list of values.
2. **A reference component in code** — another system's component, or an older version of this one.
3. **A Figma node** — a component in the Agentic DS file (`fileKey` + `nodeId`).
4. **A screenshot** — a picture of one component, with its states if you have them.
5. **A whole screen** — a reference screen, in code, Figma or a screenshot, whose shape repeats across the product. That is a page template, not a one-off screen.

If you have none of these, stop: there is nothing to reverse-engineer.

## Output, in this order

Never skip down the list. Each step's output is the next step's input.

### Step 0 — Place it in the catalog (always first)

1. Read `contracts/index.json`. Search `name`, `tags`, `category`.
2. If a contract already exists for this job, **change that piece**. Do not add a cousin. Cousin names the review rejects outright: `EmptyHeader`, `Dialog`, `Sheet`, `SliderThumb`, `ToastAction`.
3. If nothing matches, write down: the `name` (PascalCase), the `level` (`atom` / `molecule` / `organism` / `template`), the `category` (`data`, `navigation`, `form`, `feedback`, `overlay`, `base`, `layout`, `brand`) and 4–7 `tags`. A `template` goes in `index.patterns` and takes **no** `category`.
4. Decide the level honestly, and build from the biggest piece down (`CLAUDE.md`, "Build order"):
   - `atom` — one control, no kit piece inside it.
   - `molecule` — a few atoms with one flattened API.
   - `organism` — one whole block of a screen: a bar, a table, a section, a header, a chart.
   - `template` — a whole page shape, with no state and no content of its own. Patterns only, and `tests/contract-levels.test.ts` fails if a pattern is not a `template` or a component is.
   A piece that only composes existing pieces lists them in `composes`. Every template does.

### Step 1 — Tokens and variables

Do this before any component code, and only if a value you need has no token.

1. Map each value in the source to an existing role: colour → a `semantic.txt` role; spacing → `space/*`; radius → `radius/*`; height → `control/*`; icon → `icon/size/*`; type → a role in `src/tokens/typography.css`.
2. Round to the ramp. Space is 4px steps (2, 4, 8, 12, 16, 20, 24, 28); radius is 2 / 4 / 8 / 9999; controls are 28 / 36 / 44.
3. A value that rounds onto an existing role **is** that role. Do not add a token for 10px or `#1b6ef3`.
4. If a role is genuinely missing, add the row to the right `src/tokens/source/*.txt` file (never to the generated CSS), in the file's own format:
   - colour role → `semantic.txt`: `name|Light|Dark`, both columns aliasing `ui/*`
   - scheme colour → `ui.txt`: `name|Light|Dark`, aliasing `ref/*`
   - new hue → `ref.txt`: `name|Cobalt|Sunset|Olive|BP-Legacy`
   - size, or a font size / weight / line-height / letter-spacing primitive → `scale.txt`: one value, or `default|compact|comfortable`
   - a new **text role** (`--text-<role>-size|-weight|-lh|-ls`) → `src/tokens/typography.css`, by hand, as the four-var quartet inside the `:root, [data-density]` block. `scale.txt` only carries the ramp a role points at; a role added there would never exist.
   - comment the row `# not in Figma: …` when the kit is ahead of Figma.
5. Run `npm run tokens`. Check the diff in `primitives.css` / `semantic.css` is only your rows.
6. Needing more than one or two new tokens means the source is off-system. Stop and ask.

### Step 2 — The contract

The contract comes before the React. Write `contracts/<name>.json` with every field:

`name`, `path`, `level`, `figma { fileKey, nodeId }`, `intent`, `usage`, `props`, `useWhen[]`, `doNot[]`, `a11y[]`, `snippet`, `examples[]`.

Then add the row to `contracts/index.json` by hand, in the right group (`components` or `patterns`) and A to Z: `name`, `contract`, `level`, `category`, `tags[]` (a pattern row has no `category`). `npm run sync:index` only refreshes the `level` of rows that are already there — it never adds one, so a contract with no index row is invisible to the catalog, the playground, the review and the tests.

- `props`: closed `enum` + `default`, or `type` + `required`, each with a plain-language `note`. Use the kit's prop vocabulary: `emphasis`, `intent` (never `tone`), `size` `sm|md|lg`, `iconStart` / `iconEnd` (Material Symbols names), `iconOnly`, `disabled`, `loading`, `invalid`, `error`, `required`, `readOnly`, `fullWidth`, `children` for the label.
- `doNot` must include at least one "when not to use" line naming the piece to use instead — a test fails without it.
- `examples`: every item is rendered by the test suite with axe. Start with an `"Accessibility"` example (`a11y: true`); put size examples in sm → md → lg order.
- `composes`: list the kit pieces this piece is built from, if any.
- `usage` is prose for an agent: say what the piece decides for the builder (defaults, allowed pairs, what the page owns instead).

### Step 3 — The atom (or the component)

```
src/ui/<Name>/<Name>.tsx          named export <Name>, "use client" if it has state
src/ui/<Name>/<Name>.module.css
```

- Every enum value becomes a class of the same name; join them: `[styles.root, styles[emphasis], styles[intent], styles[size], …].join(" ").trim()`.
- Type the allowed combinations as a union so a wrong pair fails typecheck — do not leave it to prose.
- Colour only from semantic roles. Space, radius, control height, motion, opacity and focus from their roles. No hex, no literal px (a media query is the one exception, and it lives in `layout.css`).
- States, exactly as the kit does them: `:hover:not(:disabled, .loading)`, `:active:not(:disabled, .loading)`, `:focus-visible { outline: var(--border-width-medium) solid var(--outline-brand); outline-offset: var(--focus-offset); }`, `:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }`. Danger swaps `--outline-danger`. Hover and press colours come from the `/hover` and `/press` tokens; never compute them.
- Size comes from the group, then the prop, then `useDensitySize`.
- A11y is part of the component: a native element, a real label (`iconOnly` keeps a visually hidden one), `aria-busy` + `aria-disabled` for `loading`, `aria-pressed` for `toggle` unless `aria-expanded` is already there.
- Spread `inspect("<Name>")` on the root element.
- If the piece can sit on a booting page, draw its own `Skeleton` from `useFieldSkeleton()` at its own size, and take no `loading` prop for it.

### Step 4 — The molecule

- Compose atoms. Never restyle an atom from the outside and never re-implement one.
- Flatten the API: one `Toast`, not `ToastTitle` + `ToastDescription`. Pass content as props and arrays of item objects (`itemShape` in the contract).
- Owned spacing comes from `--space-*`; page spacing stays with the layout classes.
- List the parts in the contract's `composes`.

### Step 5 — The organism

One whole block of a screen: a bar, a header, a section, a table, a chart. Read `RULES.md` §10 first.

- Same files and same rules as a molecule (§10.1). An organism is not a new file layout; it is a bigger piece in the same one.
- **Build it from kit pieces.** If a part has a contract, import it: `@/ui/<Name>/<Name>`. Raw HTML is for the box and the grid the organism itself owns, never for a control the kit already has. Name every kit piece you used in `composes`, and the review will point screens at your organism instead of letting them hand-roll it (≥60% of the parts, minimum 3).
- A piece that draws its own cells, rows or marks — a chart, a grid, a calendar — carries no `composes`. That is allowed (§10.2); a half-filled list is not.
- **Slots, not children components.** The parts a screen owns come in as `ReactNode` props named after their role (`actions`, `filters`, `footer`, `children`); the rest as arrays of item objects with an `itemShape`. One `ListView`, never `ListViewRow`.
- Take a `label` string when the piece is a region a screen reader should be able to jump to.
- **Boot:** if the block can sit on a booting page, take a `loading` prop and read both sources:
  ```tsx
  const { skeleton: own } = useBootSkeleton(loading);
  const inPage = useFieldSkeleton();
  const booting = own || inPage;
  ```
  Draw your own bars where the content will stand. If you draw your children's blocks, do not reach the leaf.
- **Reflow on your own box**, not the window: `container-type: inline-size` + `@container`. A kit piece can sit in a phone-width frame inside a wide window (§10.5).
- Never set a page width or a page inset. Columns come from the page through `FormLayoutContext` (§10.6).

**Gates for an organism**

- [ ] Every part that has a contract is imported, not rebuilt. No raw `<button>`, `<input>`, `<table>` where the kit has the piece.
- [ ] `composes` names every kit piece used, or the piece genuinely draws its own grid.
- [ ] Colour, space, radius, shadow and type from semantic roles and the `--text-<role>-*` quartets only.
- [ ] Reflow is `@container` on its own box, not a viewport media query.
- [ ] Boot skeleton drawn in place, from `useBootSkeleton` + `useFieldSkeleton`.
- [ ] `inspect("<Name>")` on the root; `label` where it is a region.

### Step 6 — The page template

A whole page shape with no state and no content of its own. Read `RULES.md` §11 first, and read `contracts/recordpage.json` and `src/patterns/RecordPage/RecordPage.tsx` before you write anything.

1. **Place it as a pattern.** `src/patterns/<Name>/<Name>.tsx` + `<Name>.module.css`, `"use client"` at the top, `contracts/<name>.json` with `level: "template"`, and a hand-written row in `index.patterns` (no `category`). A component contract may never be a `template`, and a pattern may never be anything else — the test checks both.
2. **Decide the regions.** Each is a `ReactNode` prop named after what the screen puts there, from the kit's own slot vocabulary (§11.3): `header`, `tabs`, `notice`, `toolbar`, `summary`, `bulk`, `pagination`, `empty`, `footer`, `children`. Write in the contract's `usage` which kit piece goes in each one.
3. **Keep no state.** The screen holds the tab, the open section, the ticked rows, the sticky boolean. The pattern reports a crossing at most (`onStickyChange`). Say so in `intent` and in `doNot`.
4. **Layout.** Root is a flex column with `gap: var(--layout-gutter-lg)` and **no padding**: the AppShell page (`.layout-content`) owns the inset. Side by side is `.layout-split` (`--thirds`, `--quarters`); numbers are `.layout-metrics`; a column inside another layout is `.layout-stack`. One field column stops at `--layout-column-max` (554px), `columns` is `1 | 2 | 3` default `2`, and never more than 3. Sticky offsets are written from `--page-header-height-sticky` and the `--stick-*` roles, never from numbers.
5. **Loading.** Take either `loading` + `loadingShape: "content" | "rows"` + a count, or `state: "ready" | "loading" | "empty" | "error"`. `content` renders the real children and lets each piece draw its own bars; `rows` is the fallback grid. Keep the real tree mounted, `inert` and `aria-hidden`, say it once with one `role="status"`, give a `notice` its own height, and OR the frame's boot with your own (`own || inFrame`) so a screen sets `loading` in one place.
6. **Empty and error are slots.** Take `empty` and let the screen pass a kit `EmptyState`. Decide where it stands, never what it says. Only `ListPage` owns error copy, and it does it with a kit `Callout intent="danger"`.
7. **Responsive.** Write no breakpoint of your own. The 1024 / 640 steps and the 1279 field break live in `src/tokens/layout.css` and `src/ui/Form/columns.module.css`. Set `container-type: inline-size` on a frame so it reflows on its own width.
8. **Density.** Take no density prop and read no `Density`. Density is a token switch; the screen puts `data-density` on the frame's wrapper.
9. **Playground.** A template is stateless, so add a `<NameDemo>` to `src/playground/demos.tsx` that drives it the way a screen would (with `shell` and `stage`), then a registry entry with `render`, `preview`, `card`, **`page`** (the whole screen, scaled into the gallery card), `block: true`, `wide: true`, a `hide[]` listing every slot, and `toggles` / `extras` for `shell`, `sticky`, `stage` and `boot`. No route file.
10. **Starter.** Add `starters/<id>/page.tsx`, a row in `starters/index.json` (`id`, `template: "<Name>"`, `title`, `about`) and an import plus a row in `tests/starters.test.tsx`. The review prints `npm run new-screen -- --template <id>` in its fix when a template has one.
11. **A boot test.** Put the page's skeleton shape in `tests/pattern-skeletons.test.tsx` (or its own `*-skeleton.test.tsx`): one row per real row, nothing reachable by keyboard, said once, axe clean.

### Step 7 — Playground and gates

1. Add a `registry` entry in `src/playground/registry.tsx`, keyed by the contract `name`: `render`, `preview`, and `hide[]` / `normalize()` where a prop is not a visual option or a pair is illegal. **No route file** — `/components/[slug]` is generated from the index.
2. `npm run sync:index` — levels into `contracts/index.json`.
3. `npm test` — contract examples render and pass axe; levels and docs tests pass.
4. `npm run review -- <any screen you touched>` and `npm run lint`, `npm run build`.

## Pass / fail checklist

Fail any line and the piece is not done.

**Catalog**
- [ ] No existing contract covers this job (searched `name`, `tags`, `category`).
- [ ] The piece has a row in `contracts/index.json`, written by hand, and its `level` matches the contract (`npm run sync:index` is clean).
- [ ] Name is PascalCase; folder, file and named export all match; contract file is the lower-case name.

**Tokens**
- [ ] No new token, or each new one is a row in `src/tokens/source/*.txt` and nothing else.
- [ ] Generated CSS regenerated with `npm run tokens`, diff limited to those rows.
- [ ] No `--ref-*` or `--ui-*` outside `src/tokens`.
- [ ] No hex, `rgb()`, or literal px for space / radius / shadow anywhere in the component.
- [ ] Type set through a `--text-<role>-*` quartet, not raw size and weight.

**Contract**
- [ ] All required fields present, `figma` included.
- [ ] Every prop enum closed, with a default where there is one.
- [ ] `doNot` has a "when not to use" line that names the alternative.
- [ ] Examples cover the states the component has: default, each size, disabled, error/invalid, loading, empty.
- [ ] `composes` lists every kit piece used.

**Component**
- [ ] Illegal prop pairs fail typecheck, not just review.
- [ ] hover, press, focus-visible, disabled, selected and error all drawn from tokens.
- [ ] One theme's worth of colour only: no `[data-theme]` block (logos excepted).
- [ ] Native element, label present, focus visible, keyboard reachable; axe clean in the contract examples.
- [ ] `inspect("<Name>")` on the root.
- [ ] Boot skeleton drawn in place if the piece can sit on a loading page.

**Gates**
- [ ] `npm test` green, `npm run lint` clean, `npm run build` passes.
- [ ] Playground shows the real component (registry entry), not a mock.
- [ ] One `emphasis="strong" intent="brand"` Button per view in anything you demo.

## Pass / fail checklist — a page template

On top of the list above. Fail any line and the page is not done.

**Catalog and contract**
- [ ] Contract `level` is `"template"`, and the row is in `index.patterns` with no `category`.
- [ ] `npm run sync:index` clean, `tests/contract-levels.test.ts` green.
- [ ] `figma { fileKey, nodeId }` names the page in the Agentic DS file.
- [ ] `composes` lists every kit piece the page puts on screen.
- [ ] `usage` names the kit piece for every slot, says the pattern keeps no state, and says the AppShell page owns the padding.
- [ ] `doNot` has the "when not to use" line naming the other page template, plus "do not add state", "do not build the header inside it" and "do not put page padding around it".
- [ ] `examples` cover the page's own shapes, including a booting one.

**Built from the kit**
- [ ] Every region is filled by a kit piece: `PageHeader`, `Tabs`, `Toolbar`, `Callout`, `Scoreboard`, `Section`, `Table`, `Pagination`, `EmptyState`. No raw HTML for anything the kit has.
- [ ] No local cousin declared or imported (`npm run review` reports `bp/local-cousin`).
- [ ] No piece restyled from the outside.

**Tokens and layout**
- [ ] No hex, no `rgb()`, no literal px for space, radius or shadow; no `--ref-*` / `--ui-*`.
- [ ] Root has `gap: var(--layout-gutter-lg)` and **no padding**.
- [ ] Side-by-side blocks use `.layout-split` / `--thirds` / `--quarters`; numbers use `.layout-metrics`; no hand-written page grid.
- [ ] A field column stops at `--layout-column-max`; `columns` is 1, 2 or 3 and never more.
- [ ] Sticky offsets written from `--page-header-height-sticky`, `--layout-margin-md` and the `--stick-*` roles.
- [ ] No breakpoint of its own; a frame that reflows sets `container-type: inline-size`.
- [ ] Takes no density prop and reads no `Density`.

**States**
- [ ] A loading shape exists, and `content` renders the real children so nothing moves when the data lands.
- [ ] Booting: the real tree is `inert` and `aria-hidden`, one `role="status"` says it once, a `notice` holds its own height.
- [ ] Inside a booting `AppShell` the page follows the frame (`own || inFrame`); a screen sets `loading` in one place.
- [ ] `empty` is a slot the screen fills with a kit `EmptyState`; the pattern writes no copy.
- [ ] Error, if the page has one, is a kit `Callout intent="danger"` with a retry.

**Gates**
- [ ] `"use client"` at the top; `inspect("<Name>")` on the root; `<section aria-label>` for a page in the frame.
- [ ] A `<NameDemo>` in `demos.tsx` and a registry entry with `page`, `block`, `wide`, `hide[]`, `toggles` / `extras`.
- [ ] A starter folder, a `starters/index.json` row and a row in `tests/starters.test.tsx`.
- [ ] A boot test in `tests/pattern-skeletons.test.tsx` or its own `*-skeleton.test.tsx`.
- [ ] `npm test` green, `npm run lint` clean, `npm run build` passes, and `npm run review -- <a screen using it>` reports no error.
- [ ] axe clean in every contract example, and in the starter.

## Worked example A — Button (atom, from a reference component)

Source: another system's button with `variant="primary|secondary|ghost"`, `danger` boolean, `size="small|medium|large"`, `#1b6ef3` fill, `6px` radius, `32/40/48` heights.

| Source | Kit | Why |
| --- | --- | --- |
| `variant` + `danger` | `emphasis` × `intent` | Loudness and colour role are separate axes. `ButtonPair` / `ButtonLook` types the legal pairs: strong × (brand, danger), subtle × neutral, minimal × (neutral, brand, danger). |
| `primary` | `emphasis="strong" intent="brand"` | One per view. |
| `secondary` | `emphasis="subtle"` (the default) | Border, no fill. |
| `ghost` | `emphasis="minimal"` | No border, no fill. |
| `#1b6ef3` | `--bg-brand`, hover `--bg-brand-hover`, press `--bg-brand-press` | Never a hex; the hover step is a token, not a calculation. |
| white label | `--text-neutral-min-static` | `static` so it does not flip in dark. |
| `6px` | `--radius-medium` (4) | Rounded onto the ramp; 6 is off-system. |
| `32 / 40 / 48` | `--control-small|medium|large` (28 / 36 / 44) | Control heights are fixed; Density moves them, not the enum. |
| `loading` spinner | `loading` + `aria-busy` + `aria-disabled`, colour kept, click swallowed | Loading is not disabled. |
| `iconOnly` | `iconOnly` + `children` as the hidden label | A square at the control height. |

Result: `contracts/button.json` (props, allowed pairs in both `intent.note` and `doNot`, 8 examples), `src/ui/Button/Button.tsx` (union-typed look, group → prop → density size, boot skeleton), `src/ui/Button/Button.module.css` (one block per allowed pair, states from `/hover` and `/press` tokens).

## Worked example B — Input (form field, from a screenshot)

Source: a screenshot of a text field with a label above, a help icon, a hint line, a red error state, a `USD` prefix, and a `0/40` counter.

What the kit does with it:

1. **One component, no wrapper.** `label`, `hint`, `error`, `prefix`, `suffix`, `maxLength` are **props on `Input`**. There is no `Field`, `FormLabel` or `HelperText` cousin.
2. **Label placement is an enum, not a layout.** `labelPosition="top" | "start"`, with `labelWidth="sm" | "md" | "lg"` = 140 / 234 / 320px for the start column, and the label falls back on top under 460 / 554 / 640px. A field inside a `Form` lets the Form set the column, or the labels stop lining up.
3. **Error vs invalid.** `error` is border **and** message; `invalid` is the border alone. Prefer `error`.
4. **`required`** draws the asterisk in `--text-danger` and sets the native attribute.
5. **Help icon** is 16px but gets a 24px hit area via `::after` and `--target-min`.
6. **Type comes from roles:** label on `--text-ref-label-form-*`, control font from `--font-size-*` per size, heights from `--control-*`.
7. **Boot:** the field keeps its box, label column and control height and draws a bar + block; the page says loading once through `FormLayoutContext`.
8. **Contract examples** mirror the screenshot's states: label on top, label at start, narrower column, no label, required, help icon, invalid, disabled and read only, prefix/suffix/count, file, sizes.

Read `contracts/input.json` and `src/ui/Input/Input.module.css` before adding any field-shaped piece (Select, Textarea, DatePicker, Lookup all share the label, hint and error shape).

## Worked example C — RecordPage (page template, from a reference screen)

Source: a product screen for one account — the record name with a status pill and actions at the top, a tab strip, a red "3 invoices overdue" bar, a toolbar for the tab, four numbers, then the details in folding blocks, with a related invoices table underneath.

What the kit did with it (`contracts/recordpage.json`, `src/patterns/RecordPage/RecordPage.tsx`):

| Source | Kit | Why |
| --- | --- | --- |
| name, status pill, actions | `header` slot, filled with a kit `PageHeader` | The pattern never builds a header. `PageHeader` already owns the trail, the `Badge` and the `moreActions` menu. |
| tab strip | `tabs` slot, a kit `Tabs` | The screen swaps `children` to match. The pattern keeps no current tab. |
| red overdue bar | `notice` slot, a kit `Callout` | One `Callout` per record — a `doNot` line. It scrolls away under the name. |
| tab actions | `toolbar` slot, a kit `Toolbar` | Holds at the top at `--page-header-height-sticky` less `--layout-margin-md`, so it lands under the compact bar. |
| four numbers | `summary` slot, a kit `Scoreboard` | Not a new tile piece; `Scoreboard` exists. |
| folding detail blocks | `children`: kit `Section`s with `FormDisplay` rows straight in | Flat, no `RecordSection` cousin. |
| two columns of label-and-value | `columns: 1 \| 2 \| 3`, default 2, published on `FormLayoutContext` | Set once on the page; every `Section` of rows follows unless it sets its own. Each column stops at `--layout-column-max` (554px); never more than 3, even at 2560px. |
| the related invoices table | a `Section` holding a kit `Table`, full width | A `Section` of a `Table` opts out of the columns on its own (`columns.module.css`). |
| page padding in the mock | nothing | `AppShell`'s `<main className="layout-content">` owns the 24px inset and the 24px gap. The pattern's root is `flex` + `gap: var(--layout-gutter-lg)`, no padding. |
| the header shrinking on scroll | `onStickyChange` only | The screen holds the boolean and passes it to `PageHeader` as `sticky`. The pattern reports the crossing, nothing more. |
| the loading screen | `loading` + `loadingShape: "content" \| "rows"` + `loadingRows` | `content` renders the real details so every `Section`, row, `Scoreboard` card and `Table` draws its own bars where it will stand. `rows` is the fixed two-column grid for a record whose details have not arrived. |
| nothing in the mock | `label` | Names the `<section>` region, so a screen reader can jump to the record. |

The parts that are easy to get wrong, checked against the code:

- The sticky header is a **child of the record**, not of the block under it, so it holds all the way down (`RecordPage.tsx`, the `.head` comment). The toolbar is a child of the record for the same reason: a sticky box can only hold inside its own parent.
- The pinned band's lift bleeds out through the page inset — `margin-inline: calc(-1 * var(--layout-margin-md))` — because the bar and the sections keep the page's side padding and cannot reach the page edges themselves.
- Booting, the real tree stays mounted with `inert` and `aria-hidden`, and one `<span role="status">Loading {label}</span>` says it. The notice is rendered `visibility: hidden` with one `Skeleton` absolutely over it, so the details below stand where they will stand.
- The `rows` fallback draws **two** columns even when the record asks for three (one when it asks for one): past two it no longer reads as a record. `tests/pattern-skeletons.test.tsx` asserts exactly that.
- The field break at 1279px is repeated in the skeleton's own media query, so the bars and the fields they stand in for never disagree.
- `columns.note` in the contract still says 480px. The live cap is 554px (`--layout-column-max`); see `RULES.md` §9.4 — stale prose, not a second rule.

Result: a contract with 9 `composes`, 14 props, 3 examples and a `figma` node; a 159-line pattern that holds no state; a `RecordPageDemo` in `demos.tsx`; a registry entry with `page`, `block`, `wide`, `hide[]` and the `stage` / `boot` extras; the `record` starter; and its boot shape under test.

## Stop and ask

- The source needs more than one or two new tokens.
- The source needs a prop that is not an enum, or an enum value outside the kit's vocabulary.
- The piece overlaps an existing contract but does not fit it.
- The source conflicts with a rule in `RULES.md` §9 (where the sources already disagree).
- The screen needs a region no page template has a slot for, or a fourth column.
- The page would need a piece the kit does not have. Stop and ask: do not scaffold a one-off inside the template.
- The shape does not repeat across the product. Then it is a screen, not a page template: hand it to `prototype-from-kit`.
