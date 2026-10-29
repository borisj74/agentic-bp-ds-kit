# Agentic BP DS — tokens and layout

Bind every colour and every measurement to a token below. A value typed by hand is
drift; it has no counterpart in code.

## Off limits

`--ref-*` and `--ui-*` are the raw ramps the roles are built out of. Never bind a
design to one, and never read a hex out of one.

## Colour roles

Four roles, and the list is closed — if a colour you want is not here, it does not
exist in this system.

### `--bg-*` (132)

`--bg-neutral-min`, `--bg-neutral-min-hover`, `--bg-neutral-min-press`, `--bg-neutral-min-selected`, `--bg-neutral-min-selected-hover`, `--bg-neutral-min-selected-press`, `--bg-neutral-min-static`, `--bg-neutral-max`, `--bg-neutral-max-static`, `--bg-neutral-faint`, `--bg-neutral-subtle`, `--bg-neutral`, `--bg-neutral-strong`, `--bg-neutral-intense`, `--bg-neutral-hover`, `--bg-neutral-press`, `--bg-brand-faint`, `--bg-brand-faint-press`, `--bg-brand-subtle`, `--bg-brand`, `--bg-brand-strong`, `--bg-brand-intense`, `--bg-brand-hover`, `--bg-brand-press`, `--bg-info-faint`, `--bg-info-subtle`, `--bg-info`, `--bg-info-strong`, `--bg-info-intense`, `--bg-info-hover`, `--bg-info-press`, `--bg-success-faint`, `--bg-success-subtle`, `--bg-success`, `--bg-success-strong`, `--bg-success-intense`, `--bg-success-hover`, `--bg-success-press`, `--bg-warning-faint`, `--bg-warning-subtle`, `--bg-warning`, `--bg-warning-strong`, `--bg-warning-intense`, `--bg-warning-hover`, `--bg-warning-press`, `--bg-danger-faint`, `--bg-danger-faint-press`, `--bg-danger-subtle`, `--bg-danger`, `--bg-danger-strong`, `--bg-danger-intense`, `--bg-danger-hover`, `--bg-danger-press`, `--bg-highlight-faint`, `--bg-highlight-subtle`, `--bg-highlight`, `--bg-highlight-strong`, `--bg-highlight-intense`, `--bg-highlight-hover`, `--bg-highlight-press`, `--bg-neutral-contrast`, `--bg-danger-subtle-contrast`

Category hues — `--bg-{olive|green|mint|cyan|purple|pink|red|orange|yellow|gray}` on its own and with `-faint`, `-subtle`, `-strong`, `-intense`, `-hover`, `-press`. Category hues are for charts, swatches and category marks, never for state or meaning: status is `info`, `success`, `warning`, `danger`.

### `--border-*` (119)

`--border-neutral-faint`, `--border-neutral-subtle`, `--border-neutral`, `--border-neutral-strong`, `--border-neutral-intense`, `--border-neutral-field`, `--border-neutral-field-hover`, `--border-brand-faint`, `--border-brand-subtle`, `--border-brand`, `--border-brand-strong`, `--border-brand-intense`, `--border-brand-hover`, `--border-brand-press`, `--border-info-faint`, `--border-info-subtle`, `--border-info`, `--border-info-strong`, `--border-info-intense`, `--border-info-hover`, `--border-info-press`, `--border-success-faint`, `--border-success-subtle`, `--border-success`, `--border-success-strong`, `--border-success-intense`, `--border-success-hover`, `--border-success-press`, `--border-warning-faint`, `--border-warning-subtle`, `--border-warning`, `--border-warning-strong`, `--border-warning-intense`, `--border-warning-hover`, `--border-warning-press`, `--border-danger-faint`, `--border-danger-subtle`, `--border-danger`, `--border-danger-strong`, `--border-danger-intense`, `--border-danger-hover`, `--border-danger-press`, `--border-highlight-faint`, `--border-highlight-subtle`, `--border-highlight`, `--border-highlight-strong`, `--border-highlight-intense`, `--border-highlight-hover`, `--border-highlight-press`

Category hues — `--border-{olive|green|mint|cyan|purple|pink|red|orange|yellow|gray}` on its own and with `-faint`, `-subtle`, `-strong`, `-intense`, `-hover`, `-press`. Category hues are for charts, swatches and category marks, never for state or meaning: status is `info`, `success`, `warning`, `danger`.

### `--text-*` (97)

`--text-neutral-min`, `--text-neutral-min-static`, `--text-neutral-max`, `--text-neutral-max-static`, `--text-neutral-faint`, `--text-neutral-subtle`, `--text-neutral`, `--text-neutral-strong`, `--text-neutral-intense`, `--text-brand-faint`, `--text-brand-subtle`, `--text-brand`, `--text-brand-strong`, `--text-brand-intense`, `--text-info-faint`, `--text-info-subtle`, `--text-info`, `--text-info-strong`, `--text-info-intense`, `--text-success-faint`, `--text-success-subtle`, `--text-success`, `--text-success-strong`, `--text-success-intense`, `--text-warning-faint`, `--text-warning-subtle`, `--text-warning`, `--text-warning-strong`, `--text-warning-intense`, `--text-danger-faint`, `--text-danger-subtle`, `--text-danger`, `--text-danger-strong`, `--text-danger-intense`, `--text-highlight-faint`, `--text-highlight-subtle`, `--text-highlight`, `--text-highlight-strong`, `--text-highlight-intense`, `--text-neutral-contrast`, `--text-neutral-min-contrast`, `--text-neutral-intense-contrast`, `--text-brand-strong-contrast`, `--text-info-strong-contrast`, `--text-success-contrast`, `--text-danger-contrast`, `--text-danger-strong-contrast`

Category hues — `--text-{olive|green|mint|cyan|purple|pink|red|orange|yellow|gray}` on its own and with `-faint`, `-subtle`, `-strong`, `-intense`. Category hues are for charts, swatches and category marks, never for state or meaning: status is `info`, `success`, `warning`, `danger`.

### `--icon-*` (90)

`--icon-neutral-min`, `--icon-neutral-min-static`, `--icon-neutral-max`, `--icon-neutral-max-static`, `--icon-neutral-faint`, `--icon-neutral-subtle`, `--icon-neutral`, `--icon-neutral-strong`, `--icon-neutral-intense`, `--icon-brand-faint`, `--icon-brand-subtle`, `--icon-brand`, `--icon-brand-strong`, `--icon-brand-intense`, `--icon-info-faint`, `--icon-info-subtle`, `--icon-info`, `--icon-info-strong`, `--icon-info-intense`, `--icon-success-faint`, `--icon-success-subtle`, `--icon-success`, `--icon-success-strong`, `--icon-success-intense`, `--icon-warning-faint`, `--icon-warning-subtle`, `--icon-warning`, `--icon-warning-strong`, `--icon-warning-intense`, `--icon-danger-faint`, `--icon-danger-subtle`, `--icon-danger`, `--icon-danger-strong`, `--icon-danger-intense`, `--icon-highlight-faint`, `--icon-highlight-subtle`, `--icon-highlight`, `--icon-highlight-strong`, `--icon-highlight-intense`, `--icon-neutral-min-contrast`

Category hues — `--icon-{olive|green|mint|cyan|purple|pink|red|orange|yellow|gray}` on its own and with `-faint`, `-subtle`, `-strong`, `-intense`. Category hues are for charts, swatches and category marks, never for state or meaning: status is `info`, `success`, `warning`, `danger`.

### Surfaces, links, outlines, fonts

`--font-sans`, `--font-mono`, `--link-brand`, `--link-brand-hover`, `--link-brand-press`, `--link-neutral`, `--link-neutral-hover`, `--surface-flat`, `--surface-sunken`, `--surface-raised`, `--surface-floating`, `--surface-backdrop`, `--surface-backdrop-soft`, `--outline-brand`, `--outline-danger`

Surfaces carry page depth: `--surface-sunken` behind, `--surface-flat` for the page,
`--surface-raised` for a card, `--surface-floating` for a menu or popover, and
`--surface-backdrop` behind a modal.

## Measurements

Spacing is a 4px grid. Use these; never a typed px. A component's own sizes come
with the component — do not measure one off a frame.

- `space`: `--space-xxxsmall`, `--space-xxsmall`, `--space-xsmall`, `--space-small`, `--space-medium`, `--space-large`, `--space-xlarge`, `--space-xxlarge`
- `radius`: `--radius-small`, `--radius-medium`, `--radius-large`, `--radius-full`, `--radius-surface`, `--radius-pill`
- `control`: `--control-small`, `--control-medium`, `--control-large`
- `icon-size`: `--icon-size-xsmall`, `--icon-size-small`, `--icon-size-medium`, `--icon-size-large`, `--icon-size-xlarge`
- `font-size`: `--font-size-xsmall`, `--font-size-small`, `--font-size-regular`, `--font-size-large`, `--font-size-xlarge`, `--font-size-xxlarge`
- `font-weight`: `--font-weight-regular`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`
- `line-height`: `--line-height-tight`, `--line-height-snug`, `--line-height-normal`, `--line-height-relaxed`
- `letter-spacing`: `--letter-spacing-tight`, `--letter-spacing-normal`, `--letter-spacing-wide`
- `border-width`: `--border-width-thin`, `--border-width-medium`, `--border-width-thick`
- `border`: `--border-control`, `--border-control-strong`, `--border-surface`, `--border-divider`, `--border-divider-strong`, `--border-focus`
- `elevation`: `--elevation-card`, `--elevation-bar`, `--elevation-dropdown`, `--elevation-popover`, `--elevation-modal`, `--elevation-well`, `--elevation-focus`, `--elevation-focus-danger`
- `shadow`: `--shadow-raised`, `--shadow-floating`, `--shadow-inset`, `--shadow-bar`
- `layout`: `--layout-sidebar`, `--layout-rail`, `--layout-metrics-min`, `--layout-column-max-sm`, `--layout-column-max`, `--layout-column-max-lg`, `--layout-gutter-sm`, `--layout-gutter-md`, `--layout-gutter-lg`, `--layout-gutter-xl`, `--layout-gutter-2xl`, `--layout-margin-sm`, `--layout-margin-md`, `--layout-margin-lg`, `--layout-margin-xl`, `--layout-margin-2xl`, `--layout-container-sm`, `--layout-container-md`, `--layout-container-lg`, `--layout-container-xl`, `--layout-container-2xl`, `--layout-split-half`, `--layout-split-primary`, `--layout-split-secondary`, `--layout-split-third`, `--layout-split-quarter`
- `grid`: `--grid-columns`, `--grid-gutter-sm`, `--grid-gutter-md`, `--grid-gutter-lg`, `--grid-gutter-xl`, `--grid-gutter-2xl`, `--grid-margin-sm`, `--grid-margin-md`, `--grid-margin-lg`, `--grid-margin-xl`, `--grid-margin-2xl`, `--grid-width-sm`, `--grid-width-md`, `--grid-width-lg`, `--grid-width-xl`, `--grid-width-2xl`, `--grid-breakpoint-sm`, `--grid-breakpoint-md`, `--grid-breakpoint-lg`, `--grid-breakpoint-xl`, `--grid-breakpoint-2xl`
- `motion-duration`: `--motion-duration-0`, `--motion-duration-100`, `--motion-duration-150`, `--motion-duration-200`, `--motion-duration-300`, `--motion-duration-400`, `--motion-duration-500`, `--motion-duration-600`
- `motion-ease`: `--motion-ease-linear`, `--motion-ease-in`, `--motion-ease-out`, `--motion-ease-in-out`, `--motion-ease-standard`, `--motion-ease-emphasized`, `--motion-ease-spring`, `--motion-ease-spring-soft`
- `stick`: `--stick-frozen-cell`, `--stick-head-cell`, `--stick-frozen-head-cell`, `--stick-bar`, `--stick-lift`, `--stick-page-head`
- `target`: `--target-min`
- `opacity`: `--opacity-0`, `--opacity-100`, `--opacity-200`, `--opacity-300`, `--opacity-400`, `--opacity-500`, `--opacity-600`, `--opacity-700`, `--opacity-disabled`, `--opacity-muted`, `--opacity-hover`, `--opacity-scrim-soft`, `--opacity-scrim`, `--opacity-full`
- `page`: `--page-header-gap`, `--page-header-height`, `--page-header-height-sticky`
- `focus`: `--focus-offset`, `--focus-offset-field`

## Layout classes

- `.layout-app`
- `.layout-canvas`
- `.layout-container-2xl`
- `.layout-container-lg`
- `.layout-container-md`
- `.layout-container-sm`
- `.layout-container-xl`
- `.layout-content`
- `.layout-header`
- `.layout-metrics`
- `.layout-metrics--fixed-3`
- `.layout-metrics--fixed-4`
- `.layout-metrics--fixed-5`
- `.layout-split`
- `.layout-split--primary`
- `.layout-split--quarters`
- `.layout-split--thirds`
- `.layout-stack`
- `.layout-workspace`

What holds still on a page stacks in one order, from the rows up: a frozen first column (--stick-frozen-cell), the column names (--stick-head-cell), a frozen name cell which is both at once (--stick-frozen-head-cell), a pinned bar over all of them (--stick-bar), its lift (--stick-lift), and the page name above the lot (--stick-page-head). A piece that pins something takes its z-index from that scale rather than picking a number, or it ends up level with something it has to cover. Spacing follows a 4px grid (`--ref-space-200` = 4px; named `--space-*` matches the same ladder). The frame has two levels. The shell is the global header (the kit AppHeader) across the full width, with the app nav (AppNav) and the assistant rail (BP AI) under it; the nav and the assistant belong to the shell, not to the page, and come in from off canvas at the start and end edges. In class terms: `.layout-app` stacks `.layout-header` over `.layout-canvas`, and `.layout-canvas` lays out the nav, the page and the assistant in a row. Product screens get all of this from the AppShell pattern. The page is a PageHeader plus content blocks. Wrap the scrollable page body in `.layout-content`. Its `padding` uses `--layout-margin-md` (24px) for content edge inset. Its `gap` uses `--layout-gutter-lg` (24px) for space between stacked children, such as Section blocks. A page-level rail is a drawer about the page, never the assistant: inline, as the `aside` of `.layout-workspace` beside the content (352px, `--layout-rail`), or off canvas, as the kit Drawer over the page. Under 1024px the inline rail goes away, so use the Drawer there. When Sections stack inside a layout rather than directly in the page body, such as a side column of a `.layout-split`, wrap that column in `.layout-stack`: the same 24px gap between blocks, with no edge padding and no scrolling of its own. `.layout-split` uses the same 24px gutter between its columns, so blocks read one grid apart whether they stack or sit side by side. Slots are the blocks side by side in one row. A dashboard row holds up to 5: `.layout-metrics` fits as many as have room, and `--fixed-3`, `--fixed-4` and `--fixed-5` keep equal columns when the count is known. Form and record views hold up to 4 blocks: `.layout-split` (2), `.layout-split--primary` (2, wide and narrow), `.layout-split--thirds` (3) and `.layout-split--quarters` (4, two by two under 1024px). Fields inside a Form, and FormDisplay rows or fields inside a Section, go up to 3 side by side with Form or Section `columns` (RecordPage and FormPage set it for the whole page, 2 by default). Each of those columns stops at `--layout-column-max` (554px: a 234 start label, a 12 gap and a 308 field) and the block stays at the start, so on a wide screen (1920, 2560, 3008) the space past the last column stays empty rather than the fields stretching. Never more than 3, at any width. Tables, ListPage and related lists under a record keep the full width. Gutter steps are sm 12, md 16, lg 24, xl 40 and 2xl 48 (`--layout-gutter-*`). Margin steps are sm 16, md 24, lg 40, xl 48 and 2xl 64 (`--layout-margin-*`); 2xl is for wide, high-resolution screens. No layout class uses the xl or 2xl margin yet: `.layout-content` keeps 24px at every width. Inside a kit Drawer the drawer body is the box that layouts measure: narrow (360), medium (460) and wide (590) are under the 640px break, so splits and fixed metrics rows go to one column there; stack blocks with `.layout-stack` and leave `.layout-content` out, since the drawer has its own padding. Section only spaces header to body inside itself (`--space-medium`, 16px); the page supplies side padding via the layout class. A page header is the exception: the bar is the top of the page, so it pulls up through that top inset and sits flush against the frame's bar, with its own block padding standing in for the inset. The patterns that hold a PageHeader (AppShell, RecordPage) already do that; screens do not. The layout classes break twice, at 1024px and 640px, and they answer to the box they are in as well as to the window: a frame can be a phone-width box inside a wide window, and there the window says nothing about the room a layout has.layout-split and the fixed metrics grids drop to one column at the mobile break.

### Do not

- Do not add outer padding or margin to Section for page inset or between-section gap. Use `.layout-content` (or the matching layout class).
- Do not put an inline `gap` or a flex wrapper around a column of Sections. Use `.layout-stack`; use `.layout-content` only for the page body, since it adds page padding.
- Do not invent per-page grids, PageContent wrappers, or layout cousins.
- Do not stretch fields or FormDisplay rows across a wide page, or set a width on a Form to stop them. Use Form or Section columns, capped at `--layout-column-max`.
- Do not put the global header inside the page column or beside the nav. It spans the full width, over the nav, the page and the assistant.
- Do not put the assistant (BP AI) in the page rail, and do not build the app nav or the assistant inside a page. They belong to the shell; pass them to AppShell.
- Do not leave the page's top inset above a page header, and do not cancel it in the screen. The pattern holding the PageHeader owns that.
- Do not use raw px, magic numbers, or `--ref-space-*` / `--ui-*` primitives in components. Use layout tokens (`--layout-margin-*`, `--layout-gutter-*`) via layout classes, or semantic `--space-*` inside components.
- Do not use raw hex.
