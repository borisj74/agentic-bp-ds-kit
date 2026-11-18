---
name: bp-kit-to-library
description: Use when rebuilding or extending the Agentic BP DS library from a source of truth — a token file, a reference component (code, Figma node, or screenshot). Produces tokens, then atoms, then molecules, with names that match the contracts.
argument-hint: <the source, e.g. "contracts/table.json", "this Figma node", "screenshot of a tag chip">
---

# Kit to library

Turn a source of truth into kit pieces that look, name and behave like the rest of Agentic BP DS.

Use `prototype-from-kit` to **build a screen** out of existing pieces. Use this skill to **grow or rebuild the library itself**: tokens, atoms, molecules.

`RULES.md` beside this file is the written-out rule set, with every rule tagged **[code]** (confirmed in the repo) or **[guess]** (my reading). Read it before step 2; re-read the section you are touching.

## Input

One of:

1. **A token file** — `src/tokens/source/*.txt`, a Figma variable export, or a list of values.
2. **A reference component in code** — another system's component, or an older version of this one.
3. **A Figma node** — a component in the Agentic DS file (`fileKey` + `nodeId`).
4. **A screenshot** — a picture of one component, with its states if you have them.

If you have none of these, stop: there is nothing to reverse-engineer.

## Output, in this order

Never skip down the list. Each step's output is the next step's input.

### Step 0 — Place it in the catalog (always first)

1. Read `contracts/index.json`. Search `name`, `tags`, `category`.
2. If a contract already exists for this job, **change that piece**. Do not add a cousin. Cousin names the review rejects outright: `EmptyHeader`, `Dialog`, `Sheet`, `SliderThumb`, `ToastAction`.
3. If nothing matches, write down: the `name` (PascalCase), the `level` (`atom` / `molecule` / `organism`), the `category` (`data`, `navigation`, `form`, `feedback`, `overlay`, `base`, `layout`, `brand`) and 4–7 `tags`.
4. Decide the level honestly. A piece that only composes existing pieces is a `molecule` or `organism` and lists them in `composes`.

### Step 1 — Tokens and variables

Do this before any component code, and only if a value you need has no token.

1. Map each value in the source to an existing role: colour → a `semantic.txt` role; spacing → `space/*`; radius → `radius/*`; height → `control/*`; icon → `icon/size/*`; type → a role in `src/tokens/typography.css`.
2. Round to the ramp. Space is 4px steps (2, 4, 8, 12, 16, 20, 24, 28); radius is 2 / 4 / 8 / 9999; controls are 28 / 36 / 44.
3. A value that rounds onto an existing role **is** that role. Do not add a token for 10px or `#1b6ef3`.
4. If a role is genuinely missing, add the row to the right `src/tokens/source/*.txt` file (never to the generated CSS), in the file's own format:
   - colour role → `semantic.txt`: `name|Light|Dark`, both columns aliasing `ui/*`
   - scheme colour → `ui.txt`: `name|Light|Dark`, aliasing `ref/*`
   - new hue → `ref.txt`: `name|Cobalt|Sunset|Olive|BP-Legacy`
   - size / type → `scale.txt`: one value, or `default|compact|comfortable`
   - comment the row `# not in Figma: …` when the kit is ahead of Figma.
5. Run `npm run tokens`. Check the diff in `primitives.css` / `semantic.css` is only your rows.
6. Needing more than one or two new tokens means the source is off-system. Stop and ask.

### Step 2 — The contract

The contract comes before the React. Write `contracts/<name>.json` with every field:

`name`, `path`, `level`, `figma { fileKey, nodeId }`, `intent`, `usage`, `props`, `useWhen[]`, `doNot[]`, `a11y[]`, `snippet`, `examples[]`.

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

### Step 5 — Playground and gates

1. Add a `registry` entry in `src/playground/registry.tsx`, keyed by the contract `name`: `render`, `preview`, and `hide[]` / `normalize()` where a prop is not a visual option or a pair is illegal. **No route file** — `/components/[slug]` is generated from the index.
2. `npm run sync:index` — levels into `contracts/index.json`.
3. `npm test` — contract examples render and pass axe; levels and docs tests pass.
4. `npm run review -- <any screen you touched>` and `npm run lint`, `npm run build`.

## Pass / fail checklist

Fail any line and the piece is not done.

**Catalog**
- [ ] No existing contract covers this job (searched `name`, `tags`, `category`).
- [ ] `level` in the contract and in the index agree (`npm run sync:index` is clean).
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

## Stop and ask

- The source needs more than one or two new tokens.
- The source needs a prop that is not an enum, or an enum value outside the kit's vocabulary.
- The piece overlaps an existing contract but does not fit it.
- The source conflicts with a rule in `RULES.md` §9 (where the sources already disagree).
