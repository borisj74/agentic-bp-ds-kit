---
name: prototype-from-kit
description: Use when building a screen from the Agentic BP DS kit. Compose from kit components and patterns.
argument-hint: <what to prototype, e.g. "an amendment page with line items and row actions">
---

# Prototype from kit

Use this skill when adding or changing UI built on the Agentic BP DS kit.
Invoke with `/prototype-from-kit <what you want to build>`.

## Steps

1. **Search the index** — Read `contracts/index.json`. Note the group: `foundations`, `components`, or `patterns`.
2. **Open contracts** — Read only the 1–2 contract files in `contracts/` that match the UI you need.
3. **Check patterns** — If a pattern listed under `patterns` in `contracts/index.json` matches the screen, import it from `@/patterns/` instead of hand-rolling the layout.
4. **Compose from the kit** — `import { Button } from "@/ui/Button/Button"`. Match props exactly to contract enums; do not add variants. Page layout uses the classes in `src/tokens/layout.css` (`layout-app`, `layout-header`, `layout-canvas`, `layout-container-sm` … `layout-container-2xl`, `layout-workspace`, `layout-content`, `layout-metrics`, `layout-split`); never invent a per-page grid. Read `contracts/layout.json`: `.layout-content` owns edge padding (`--layout-margin-md`, 24px) and between-section gap (`--layout-gutter-lg`, 24px); Section does not.
5. **Stop if missing** — If no contract or pattern covers what you need, stop and ask. Do not scaffold a one-off.

## Hard rules

- Never define local cousins of kit components.
- Tokens load once, globally, in `src/app/layout.tsx`. Do not add a second tokens import.
- Never use raw hex in component styles; semantic tokens from `src/tokens/semantic.css` only.
- One `variant="primary"` Button per view.
- Every full screen sits in `AppShell` with the whole side nav: `<SideNav items={APP_NAV} endItems={APP_NAV_END} current={pageId} />`, imported from `@/patterns/AppShell/appNav`. Never trim, reorder or invent nav links; set `current` to the screen's own page.
- Fields that save together go in the kit `Form` (titled groups via `sections`). Never hand-roll a `<form>` or `<fieldset>` wrapper. For labels at the beginning use `labelPosition="start"` on the Form, and for side-by-side fields use `columns={2}`, never a custom grid. Inside a Modal, give the Form an `id` and put Save in the Modal footer with `form={id}`.

## Not built yet — stop and ask

These pieces and patterns are planned but have no contract in this kit yet. If a screen needs one, stop and ask before going further.

- Components: InsightCard. (Tables are built: use `Table`, or `DataGrid` for editable cells.)
- Patterns and what they will contain:
  - `list-detail`
  - `invite-members` — invite / add-people screens (Empty + Modal + Form).
  - `assistant-workspace` — assistant / insights screens (`layout-workspace` + a `ChatWindow` rail + two-column InsightCards).
  - `empty-first-run` — empty / first-run screens (PageHeader + Empty + one primary that opens a create Modal).
  - `activity` — activity screens (Scoreboard + task cards or list + tabbed DataTable feed).
  - `inbox` — inbox screens (Scoreboard + tabbed Table + detail Section + reply Drawer).
- Metric rows use `<Scoreboard items={...} />` (it exists now), not flex layouts with borders.
