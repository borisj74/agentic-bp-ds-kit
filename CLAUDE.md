@AGENTS.md

# Agentic BP DS

Code-first design system and playground.

Repo: https://github.com/borisj74/agentic-bp-ds-kit.git. Code is the only source of truth.

Job: keep the kit consistent so agents can prototype real product screens from it. The catalog will grow past 30 components. That is fine. Do not grow a second system beside it.

## Kit rules (always on)

Before writing UI, read `contracts/index.json`, then only the matching contract file(s).
If a contract exists, import it from `@/ui/<Name>/<Name>`. Never invent a local cousin.
If a pattern listed under `patterns` in `contracts/index.json` matches the screen, import it from `@/patterns/`.
If something is missing from the index, stop and ask — do not add a one-off.
Never put hex in components; use semantic tokens from `src/tokens/semantic.css` (not primitive `--ref-*` / `--ui-*` ramps).
One `emphasis="strong" intent="brand"` Button per view.
Page spacing: 4px grid. Content edge padding and between-section gap come from layout classes in `src/tokens/layout.css` — `.layout-content` uses `--layout-margin-md` (24px) for inset and `--layout-gutter-lg` (24px) for gap between stacked children. A column of Sections inside another layout (for example a `.layout-split` side) uses `.layout-stack`: same gap, no padding. Section does not own page padding; read `contracts/layout.json`.

## Stack

- Next.js App Router + TypeScript. Plain CSS (CSS Modules + CSS vars). No Tailwind.
- Fonts: Inter (display + text), Roboto Mono (code). Loaded in `src/app/layout.tsx` via `next/font`.
- Icons: Google Material Symbols Outlined. Use the `Icon` component only.
- Deploys to Vercel.

## Layout

- `src/tokens/primitives.css` — raw values (colors only from the BP Foundations palette, spacing, radius, type scale).
- `src/tokens/semantic.css` — roles (`--color-bg`, `--color-fg`, `--color-primary` ...). Light + dark via `[data-theme]`.
- `src/tokens/layout.css` — layout pattern classes (`.layout-app`, `.layout-canvas`, `.layout-workspace`, `.layout-content`, `.layout-stack`, `.layout-metrics`, `.layout-split`). Screens use these. Never invent per-page grids.
- `contracts/index.json` — catalog index. One JSON contract per piece in `contracts/`.
- `src/ui/` — one folder per component. Implements its contract exactly.
- `src/patterns/` — blueprints that only compose `src/ui` pieces.
- `src/app/(playground)/` — catalog routes: `/foundations`, `/components`, `/patterns`.

## How the kit is built

- Tokens: primitives → semantic roles. Components never use raw hex. They use semantic CSS vars only.
- contracts/index.json, then one JSON contract per piece (intent, usage, closed enums, useWhen, doNot, a11y, snippet, examples, and `figma` with the fileKey and nodeId of the component in the Agentic DS Figma file). The playground Variants tab renders `examples` straight from the contract.
- ui/ implements that contract exactly. If a contract exists, use that component. Never invent a local cousin (no EmptyHeader, SliderThumb, ToastAction, Dialog, Sheet).
- Patterns only compose kit pieces. They are blueprints, not new primitives.
- Playground is the catalog: /foundations, /components, /patterns. Master is Preview | Variants. Size chips go sm → md → lg.
- User-facing copy (playground, contracts, README) does not name another design system. Describe this kit as its own system.

## How to add or change a piece

1. Read contracts/index.json, then the one or two contracts that match.
2. If the piece exists, change that component. Do not add a cousin.
3. If it is missing, add it as one flattened component: contract first, then React, then playground. Do not skip the playground.
4. Flatten compound APIs into one component. Example: one Toast, not ToastTitle + ToastDescription.
5. Playground must show the real kit component, not a local mock.
6. One strong brand Button (`emphasis="strong" intent="brand"`) per view.

## How to prototype a screen

1. Search the index.
2. Open only the matching contracts.
3. If a pattern matches the screen, use the pattern. Then follow "Build order" below for everything inside it.
4. Breadcrumbs always read Home › side-nav section › current screen. Pass `breadcrumbs` starting with Home, then the section (and any parent record); PageHeader adds the page title as the last, current crumb. Never leave Home out. When the screen is the section's own page (like the Accounts list), the title is the section, so pass only Home: the trail reads Home › Accounts, never Home › Accounts › Accounts.
5. Frame full screens with AppShell and the whole side nav: `items={APP_NAV}` and `endItems={APP_NAV_END}` from `@/patterns/AppShell/appNav`. Never trim or invent nav links; set `current` to the screen's page.
6. Compose kit pieces. Match closed enums. Do not add variants that are not in the contract. The color-role prop is `intent` (`intent="success"`), never `tone`. Button looks are `emphasis` × `intent`, allowed pairs only (strong: brand, danger · subtle: neutral · minimal: neutral, brand, danger); never `variant`.
7. If something is missing, stop and ask. Do not scaffold a one-off on the screen.
8. Before you hand a screen back, run `npm run review -- <file>` (or the `review_ui` MCP tool) and fix the errors.

## Spec first, then the loop

Write the screen as a JSON spec before you write any TSX. The loop closes itself: request → spec → screen → render → review → fix → done.

1. Write the spec. One pattern (level `template`), its regions filled with kit components by their contract name, props inside each contract's enums, the copy, and the states the screen answers (`ready`, `loading`, `empty`, `error`). `docs/references/` holds nine worked examples, one per screen pattern; read the one closest to your screen.
2. Check it: the `validate_spec` MCP tool, or `npm run build-screen -- <spec.json> --dry`. An unknown pattern, an unknown component, a prop no contract lists, a value outside a closed enum, a side-nav id that does not exist or a second strong brand Button all fail here, before any code exists.
3. Build it: `npm run build-screen -- <spec.json>` writes `src/app/(examples)/<name>/page.tsx`, one page per state.
4. Run the loop: `npm run loop -- <spec.json>`. It starts the dev server with the inspect tag on, reviews the code and the served page, takes a 1440×900 screenshot of each state in light and dark, repairs what it can, and writes `reports/loop/<name>.md`.
5. Never hand back a screen that fails `review_ui`. Read the report, fix the spec, run the loop again.

Edit the spec, never the generated page: the next build overwrites the page.

What the loop can repair on its own, between attempts, always by changing the spec and never the page:

- a second `emphasis="strong" intent="brand"` Button (`bp/one-primary`) — the rest become subtle neutral
- a `PageHeader` inside a region when the frame already draws one (`bp/landmark`)
- `Home` listed in `breadcrumbs` (`bp/screen-frame`) — the frame adds it
- a raw colour, spacing or radius in a `style` prop (`bp/raw-value`) — the token the review points at goes in, in place of that one raw part of the value. A shorthand keeps its shape: `padding: "8px 16px"` becomes two tokens, and `border: "1px solid #ccc"` keeps its width. A part no token fits (a 1px border width), and a shadow shorthand, whose parts mean nothing on their own, stay as they are and are named under "Left for a person" in the report. The spec check cannot refuse this one: `style` is a prop every React element takes, so no contract lists it; it is the review of the written screen that catches it

Everything else the report names for you to decide: pick the bigger piece, write the words, change the layout. Fix the spec and run the loop again.

## Build order

Every contract carries a `level`: `atom`, `molecule`, `organism` or `template`. Read it in `contracts/index.json`.

Start from the biggest piece that fits and only go smaller when nothing bigger fits: pattern (`template`), then `organism`, then `molecule`, then `atom`.

A page is a template filled with real content. The screens you build are pages, so they are not contracts and have no level of their own.

Never rebuild an organism or a pattern by hand from smaller pieces when the kit already has it. If nothing fits, stop and ask.

## Stay consistent

- More components are expected. Do not invent a local version of a piece that already has a contract.
- Write in simple everyday language. Ask one thing at a time when blocked.
- Do not rewrite for style. Do not add Figma, Storybook, or a package publish unless asked.

## When asked to check the code / find bugs

Review only. Do not rewrite. Report: summary, blockers, should-fix, nits (max 5), what you verified.
Check: real bugs, contract drift, local fakes, token misuse (hex, magic spacing), playground not showing the real kit, a11y (labels, focus, keyboard), and typecheck / build.
