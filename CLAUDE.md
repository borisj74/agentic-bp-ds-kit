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
One `variant="primary"` Button per view.
Page spacing: 4px grid. Content edge padding and between-section gap come from layout classes in `src/tokens/layout.css` — `.layout-content` uses `--layout-margin-md` (24px) for inset and `--layout-gutter-lg` (24px) for gap between stacked children. Section does not own page padding; read `contracts/layout.json`.

## Stack

- Next.js App Router + TypeScript. Plain CSS (CSS Modules + CSS vars). No Tailwind.
- Fonts: Inter (display + text), Roboto Mono (code). Loaded in `src/app/layout.tsx` via `next/font`.
- Icons: Google Material Symbols Outlined. Use the `Icon` component only.
- Deploys to Vercel.

## Layout

- `src/tokens/primitives.css` — raw values (colors only from the BP Foundations palette, spacing, radius, type scale).
- `src/tokens/semantic.css` — roles (`--color-bg`, `--color-fg`, `--color-primary` ...). Light + dark via `[data-theme]`.
- `src/tokens/layout.css` — layout pattern classes (`.layout-app`, `.layout-canvas`, `.layout-workspace`, `.layout-content`, `.layout-metrics`, `.layout-split`). Screens use these. Never invent per-page grids.
- `contracts/index.json` — catalog index. One JSON contract per piece in `contracts/`.
- `src/ui/` — one folder per component. Implements its contract exactly.
- `src/patterns/` — blueprints that only compose `src/ui` pieces.
- `src/app/(playground)/` — catalog routes: `/foundations`, `/components`, `/patterns`.

## How the kit is built

- Tokens: primitives → semantic roles. Components never use raw hex. They use semantic CSS vars only.
- contracts/index.json, then one JSON contract per piece (intent, usage, closed enums, useWhen, doNot, a11y, snippet, examples). The playground Variants tab renders `examples` straight from the contract.
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
6. One primary Button per view.

## How to prototype a screen

1. Search the index.
2. Open only the matching contracts.
3. If a pattern matches the screen, use the pattern.
4. Frame full screens with AppShell and the whole side nav: `items={APP_NAV}` and `endItems={APP_NAV_END}` from `@/patterns/AppShell/appNav`. Never trim or invent nav links; set `current` to the screen's page.
5. Compose kit pieces. Match closed enums. Do not add variants that are not in the contract.
6. If something is missing, stop and ask. Do not scaffold a one-off on the screen.

## Stay consistent

- More components are expected. Do not invent a local version of a piece that already has a contract.
- Write in simple everyday language. Ask one thing at a time when blocked.
- Do not rewrite for style. Do not add Figma, Storybook, or a package publish unless asked.

## When asked to check the code / find bugs

Review only. Do not rewrite. Report: summary, blockers, should-fix, nits (max 5), what you verified.
Check: real bugs, contract drift, local fakes, token misuse (hex, magic spacing), playground not showing the real kit, a11y (labels, focus, keyboard), and typecheck / build.
