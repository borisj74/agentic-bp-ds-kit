# Changelog

What changed in each kit release, newest first. Each release is a git tag; `npm create agentic-bp-ds@<version>` installs that exact release.

Releases marked **Breaking** rename or remove something, or change how a piece behaves. Read their Breaking list before you move screens to that version. The rename scripts are listed in the README under "Getting updates".

## v0.4.10 — 2026-10-07

### Added
- Form: example "Rate bands in a form": a two-column Form with start labels, a few Inputs and a DataGrid of rate bands (USD 10,000 1,800.00; 50,000 1,620.00; No limit 1,440.00).

### Changed
- A DataGrid inside a Form with `columns` spans the row, like a Textarea, since it needs the width for its columns. With start labels it starts at the section's edge, under the title, rather than past the label column: its column headers stand in for a label. The same holds in a one-column Form with start labels. The Form and DataGrid contracts say so.
- Catalog: wide Form examples (three columns, start labels) keep to the Variants stage on a narrow window instead of spilling past it.

## v0.4.9 — 2026-10-06

### Added
- More values in a cell (DataGrid, Table, Lookup). A column with `opensDetail` shows the cell's first value, then a Button holding a Count of the other values (`detailCount`) with an expand arrow; it opens and closes the row's `detail`. The open detail lines up under that column, at least 360px wide (`--data-grid-detail-min`, `--table-detail-min`), and slides back to fit. Built for tiered rates: "USD 0–10,000: 1,800.00" with 2 more bands. The button is named "2 more, row 1" and has aria-expanded. Lookup passes `detail` and `detailCount` to its Table; opening a detail never picks the row. In a table wider than its box, the open detail stays in view while the columns scroll.
- DataGrid: a row whose `detail` is null gets no toggle and cannot open. With an `opensDetail` column the grid drops its toggle column.
- DataGrid: cell styles now stay on the grid's own cells, so a kit Table inside an open detail keeps the Table look.
- Table: `TableColumn.maxWidth` caps a column; a long value ends with an ellipsis and shows in full on hover (title) and to screen readers. Example "Long names".

## v0.4.8 — 2026-10-06

### Changed
- A reference label (BarChart and LineChart) now keeps clear of the marker line, not just the marker's label. When the line runs through the label's spot at the end, the label slides left until it is clear. In the BarChart example Against a grant, the Today line no longer cuts through "Grant 1.8K".

## v0.4.7 — 2026-10-05

### Changed
- A reference line whose level changes now reads both ends in the hidden list screen readers get, like "Grant: 1,150 to 1,750". Before it gave only the level the line ends at, so the change was lost. A line that stays flat reads as it did.
- The BarChart contract describes `referenceLines`, `projectedFrom` and `marker` in its usage, the way LineChart does, and says how they reach screen readers.

## v0.4.6 — 2026-10-05

### Added
- BarChart `referenceLines` and `marker`, the same as LineChart's, on upright charts: a dashed line across at a value (like a grant or a limit), drawn over the bars so it stays visible where they pass it, and a thin line down at one category (like today). The reference label moves clear of the bars.
- BarChart series `projectedFrom`: bars from that category on draw see-through in their color, and the tooltip and the screen-reader table say projected.
- Reference lines (BarChart and LineChart) take `values`, one level per category, for a limit that changes during the period, like a grant a top-up raises: the line steps on the category it changed, and its label reports the level it ends at.
- Catalog: BarChart example Against a grant.

## v0.4.5 — 2026-10-02

### Added
- `CHANGELOG.md` (this file, back to v0.3.0) and `RELEASING.md`, the steps a release follows.
- AccountFlow holds 36 accounts, so the list has pages to turn.

### Changed
- ListPage: Table View runs to the bottom of the page, so Pagination sits at the foot instead of partway up. More rows than fit still scroll inside the table. List and Card views keep their own height.
- AccountFlow list: Table View is the default and the view picker is controlled; List View shows the same page of accounts as a ListView. 25 rows a page, so the table fills the page.
- AccountFlow list trail reads Home › Accounts: the list is the Accounts section's own page, so there is no second Account crumb.
- AccountFlow Details is one column. Account information, Billing profile and System information put their labels at the start, and the side sections (Payments, Shipping address, Quick links) move below Account products, each collapsible and closed. The new-account form puts its labels at the start too.
- AppHeader background is `bg-neutral-faint`, flat instead of a radial wash to white, and the search field has no shadow behind it.

## v0.4.4 — 2026-10-01 · Breaking

### Added
- Toast loading mode: pass `progress` (0–100, or `"indeterminate"`). A loading toast sits at the top center, shows a Spinner, its title as a TextLoader and a thin Meter bar (with the percent when you pass a number). It never closes on its own; its action (like Cancel) runs `onAction`, then `onClose`.
- Meter `value="indeterminate"` (bar only): a segment slides along the bar, with no percent.
- Catalog: a Loading switch on Toast (off, indeterminate, percent), and indeterminate on the Meter value switch.

### Changed
- Every Toast is 360px wide (was 400).
- Escape closes a confirmation toast while focus is inside it.

### Removed
- The close (X) button on every Toast.

### Breaking
- Toasts no longer have a close button.
- Toasts with an action now close after 8 seconds (before, they stayed until closed). `duration` defaults to 5000, or 8000 with `actionLabel`. To keep one open, pass `duration={null}` and close it yourself.

## v0.4.3 — 2026-10-01

### Added
- Token `--layout-column-max` (480px: a 160px label, a 12px gap and a 308px field).
- Section `columns` (1, 2 or 3): fields and rows flow left to right, each column at most 480px wide, kept at the start. Tables inside stay full width.
- RecordPage `columns` (default 2) and `labelPosition` (default start). FormPage `columns` (default 2).
- Catalog: Columns chips on Section, RecordPage and FormPage; 1920, 2560 and 3008 stage widths; a Field column row on the Grid foundation page.

### Changed
- Form columns stop at 480px each and stay at the start; the rest of a wide page stays empty. Never more than 3 columns.
- Form `columns` has no default any more. Inside a FormPage or RecordPage it takes the page's columns, so a Form there with no `columns` now shows 2 columns, not 1. Outside one it is a single column that fills its box. Modal and Drawer start again at one column.

## v0.4.2 — 2026-09-30

### Added
- Spacing and layout tokens: `--ref-space-1700` (64px; 60 compact, 68 comfortable), `--layout-gutter-2xl` (48), `--layout-margin-xl` (48) and `--layout-margin-2xl` (64), with their `--grid-*` versions.
- `.layout-metrics--fixed-5`: up to five dashboard slots (3 columns at 1024px and below, 1 at 640px and below).
- `.layout-split--quarters`: four blocks, two by two at 1024px and below.
- `.layout-header` is now a documented layout class.
- A Drawer measures its own width, so layouts inside narrow, medium and wide drawers drop to one column.
- Catalog: a "Blocks inside" Drawer example, a "Three columns" Form example, and use names (Page Title, Section Title, Field Labels…) under the type rows.

### Changed
- `.text-metric` is 16px semibold (was 24px medium), the same as `.text-ref-metric`. Scoreboard uses it.
- `.layout-app` is a header row over a canvas row; `.layout-canvas` is app nav, page and assistant side by side. AppShell looks the same. If you built a screen from the raw classes, the nav aside now goes inside `.layout-canvas`; `.layout-app > aside` no longer makes a 224px sidebar.
- Type samples in the catalog use title case.

## v0.4.1 — 2026-09-29

### Added
- RadioGroup `labelPosition` (top or start, default top). Start puts the legend in the 160px label column, level with the first option. It follows the Form's setting when unset, and goes back on top below 480px. New example: "Legend at the start".

## v0.4.0 — 2026-09-28 · Breaking

### Changed
- Cell `popupTrigger` shows a small `open_in_full` icon after its text.
- Cell `treeToggle` defaults to `box`; `chevron` is still an option.

### Removed
- Cell types `icon`, `linkSecondary`, `radio`, `rating` and `select`, and the props only they used: `external`, `options` and `onValueChange`.

### Breaking
- Screens that use the removed Cell types or props stop compiling. Use `status` for a status icon, `link` or `redirect` for `linkSecondary`, and a Select or RadioGroup outside the Cell for `select` and `radio`.

## v0.3.3 — 2026-09-25

### Added
- New Cell types: `number` (end-aligned, even-width digits), `date` (shows "Mar 12, 2024"), `status` (colored dot and label, by `intent`), `icon`, `switch`, `radio`, `popupTrigger`, `linkSecondary`, `textBlock` (wraps on md, one line on sm) and `redirect` (brand Link with an `arrow_outward` icon).
- RadioGroup option `hideLabel`: the label is read by screen readers only.
- Table example "Reference cell types".

## v0.3.2 — 2026-09-25

### Changed
- Checkbox labels are Medium weight with a 120% line height.
- RadioGroup option labels use a 120% line height.
- Cell text has a 1.5 line height; row heights do not change.
- Component text now uses the named type roles, with the same look: field labels and FormDisplay terms (`text-ref-label-form`), Badge (`text-ref-label-badge`), DataGrid cells (`text-ref-cell`), Callout (`text-ref-alert`), Breadcrumb and dialog descriptions (`text-body`), Legend.
- Fix: Table emphasis columns keep their Medium weight.

## v0.3.1 — 2026-09-25 · Breaking

### Added
- Minimal brand and minimal danger Button looks, with tokens `--bg-brand-faint-press` and `--bg-danger-faint-press`.

### Breaking
- Button `variant` is now `emphasis` × `intent`, allowed pairs only: primary → `emphasis="strong" intent="brand"`, secondary → `emphasis="subtle"` (the default), tertiary → `emphasis="minimal"`, danger → `emphasis="strong" intent="danger"`.
- Button `pressed` is now `toggle` (subtle and minimal neutral only).
- The same change on Dropdown's button, Cell and GuidedProcess actions. AlertDialog `actionVariant` ("primary", "danger") is now `actionIntent` ("brand", "danger").
- Types: `ButtonVariant` is gone; use `ButtonEmphasis`, `ButtonIntent`, `ButtonLook` or `ButtonPair`. `AlertDialogActionVariant` is now `AlertDialogActionIntent`.
- Rule: one `emphasis="strong" intent="brand"` Button per view.
- Run `node scripts/codemod-a4a-button.mjs src/app` (after the v0.3.0 scripts), then `npx tsc --noEmit`.

## v0.3.0 — 2026-09-25 · Breaking · not published to npm

Tagged, but never published to npm. v0.3.1 is the first published release with these changes.

### Added
- Compact and Comfortable density tokens. Kit sizes now come from one size ramp; the minimum click target is fixed at 24px.
- Type roles: bold titles (`text-title-xl` to `text-title-xxs`), `text-label-sm`, `text-caption-strong`, button labels (`text-button-small`, `-medium`, `-large`) and 16 use-named roles (`text-ref-page`, `text-ref-section`, `text-ref-cell`, `text-ref-label-form`…).
- Link color tokens (`--ref-brand-link*`, `--ui-brand-link*`).
- Paired dark contrast tokens that replace one-off dark fixes inside components (no visible change).
- Avatar and AvatarGroup size `xs` (24px).
- An invoices example screen at `/invoices`.

### Changed
- Button and FilterButton labels are semibold (600).
- Cobalt links are one step lighter. Sunset dark brand text is one step lighter.
- Modal and Drawer titles are 20px bold (were 24px). PageHeader title is bold with normal letter spacing.
- Inputs, Cell, Checkbox, RadioGroup, Switch, Tooltip and others use the snug line height (1.35) instead of 1.4.
- Table and Cell rows are 36px (sm) and 40px (md), down from 48 and 56; header cells are 40px. DataGrid sm rows are 38px.
- Fixes in dark mode: strong neutral icons are visible again; a pressed Button keeps its text color on hover.
- Modal close button is centered in the header.

### Breaking
- Pieces renamed: Alert → Callout, Empty → EmptyState, Progress → Meter, ProgressLegacy → ProgressBar, ButtonFilter → FilterButton, SegmentedControl → Segmented, Stepper → Steps, DropdownMenu → Dropdown, ShimmerText → TextLoader, Command → GlobalSearch, Tile → NavTile, SideNav → AppNav. Old catalog links redirect.
- `tone` is now `intent` everywhere, with the same values: props (`badgeTone` → `badgeIntent`, `messageTone`, `environmentTone`, `highlightTone`), data fields, types and helpers.
- Props renamed:
  - Modal `size="full"` → `"fullscreen"`; ListView `groupSize` → `size`
  - BarChart, LineChart, PieChart `legend` → `legendPosition`, `showTitle` → `showHeader`
  - Legend `orientation` row/column → horizontal/vertical, `align` → `alignment`
  - Meter `thresholds="track"` → `"plotArea"`
  - Tooltip and HelpPopover `placement` → `position` (top/bottom → above/below)
  - Dropdown `align` → `alignment` (start/end → left/right)
  - Cell, HeaderCell, Carousel, PieChart and Table columns `align` → `alignment`
  - Callout `dismissible` → `closeButton`
  - Section, Form sections and Accordion `open` / `defaultOpen` / `onOpenChange` → `expanded` / `defaultExpanded` / `onExpandedChange`
  - Cascader `showLegend` → `hasLegend`; DatePicker `mode` → `type` (range → dual); Logo and LogoAI `variant` → `type`
- Density now changes the size tokens instead of switching controls to sm or lg. Controls stay md and grow or shrink with the tokens (compact Button 32px, comfortable 36px). `useDensitySize` no longer reads Density; popups keep the density they were opened from.
- Run `node scripts/codemod-a2-rulings.mjs src/app`, then `node scripts/codemod-a3-renames.mjs src/app`, then `npx tsc --noEmit`. Both scripts are safe to run twice.

## Before 0.3.0 — 2026-09-13 to 2026-09-22

v0.2.0 to v0.2.37 built the kit:

- A code-first kit with a catalog (Foundations, Components, Patterns; Preview and Variants on every page), one JSON contract per piece, and semantic tokens with light, dark and brand themes.
- The `npm create agentic-bp-ds` installer, which downloads the matching release.
- 77 components and 10 patterns by v0.2.37, including UsageList, ListView and the ListDetail pattern.
- DataGrid dates and row details; LineChart reference lines and projections; DatePicker month and year menus.
- Layout classes such as `.layout-stack`; title-case headings; subtler field borders.
- One full app nav in AppShell; PageHeader phone layouts.
- Catalog search, a phone menu, and Do's and Don'ts beside Usage on component pages.
- The catalog is live at agentic-bp-ds-kit.vercel.app.
