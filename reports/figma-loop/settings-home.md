# settings-home

| | |
|---|---|
| Spec | `docs/references/settings-home.json` |
| Pattern | SettingsPage |
| Brand | cobalt |
| Themes | Light, Dark |
| States | ready |
| Page | **Spec renders**, section `settings-home` |
| Renders | 2 (the second after two renderer fixes the audit could not see) |
| Audits | 3 (the third after an audit rule was corrected) |
| Outcome | clean — all eight rules pass |

## Rules × attempts

| Rule | Audit 1 | Audit 2 | Audit 3 |
|---|---|---|---|
| `bp/figma-instance` | pass | pass | pass |
| `bp/figma-detached` | pass | pass | pass |
| `bp/figma-bound` | pass | **12** | pass |
| `bp/figma-props` | pass | pass | pass |
| `bp/figma-modes` | pass | pass | pass |
| `bp/figma-overflow` | pass | pass | pass |
| `bp/figma-align` | pass | pass | pass |
| `bp/figma-example-content` | pass | pass | pass |

Audit 1 passed on a frame that was visibly wrong — see "What the audit could not see".

The twelve `bp/figma-bound` findings in audit 2 were the rule's fault, not the render's: swapping an
icon's glyph records a `fills` override on the layer the glyph brings with it, and that layer's paint
is still bound to a variable. The rule now reads the node before it judges.

## Frames

| Frame | Node | Link |
|---|---|---|
| settings-home/ready/light | `1758:23` | https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1758-23 |
| settings-home/ready/dark | `1758:1699` | https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=1758-1699 |

Section `1758:22`, page `1746:22`.

## Screenshots

- `reports/figma-loop/settings-home/ready-light.png`
- `reports/figma-loop/settings-home/ready-dark.png`

## missing

None. Every layer the plan named was there.

## Not in Figma

What the plan said it could not draw, and what the library draws instead:

| Path | Why |
|---|---|
| `regions.intro[0].props.onDismiss`, `onAction` | Callbacks. Figma components carry no event handlers. |
| `regions.content[0..7].props.href` | Runtime strings with no Figma property on NavTile. |
| `regions.content[3].props.icon` | The file's icon set has no glyph named `savings`, so the tile draws NavTile's own shield. |
| `regions.content[4].props.icon` | The file's icon set has no glyph named `sync_alt`, so the tile draws NavTile's own shield. |

The other six tiles carry the glyph the spec asks for.

## What the audit could not see

The first render passed all six rules that existed and was still wrong in two ways. Both were found
by eye against `docs/references/screenshots/settings-home.png`, and both are now renderer fixes with
tests:

1. **Every tile drew the same shield.** `NavTile.icon` mapped to the boolean `showIcon`, so a glyph
   name became `true` and nothing was said about it. The map now holds a `glyphs` roster — the 137
   glyph components the file's Icon set offers, read from its preferred values — and `icon` is a
   `glyph` prop that names the Icon layer (`square > Icon`, read in the file) and the swap property
   on it (`glyph#29:0`). The same was done for Badge, Modal, PageHeader, EmptyState and Button's
   `iconStart` / `iconEnd`. A glyph the roster does not hold is reported, as `savings` and `sync_alt`
   are above, rather than passed over.
   Tests: *swaps the glyph the spec names onto the nested Icon instance*, *says which glyphs the
   file's icon set does not hold*, *carries the glyph swap into the emitted script and into the
   audit*.
2. **The eight tiles stood in one column.** The plan drew every region as one vertical frame, but
   SettingsPage draws its tiles in `.layout-metrics` with `--layout-metrics-min: 320px` — three
   across at 1440. The map now carries `patterns.SettingsPage.regions.content` (`columns: 3`,
   `gap: layout/gutter-md`), and a region with columns becomes a column of horizontal rows, the
   short last row filled out with an empty `layout/gap` frame so its tiles keep the width of the
   ones above.
   Test: *lays a region out across as many columns as the pattern draws*.

A third fix came from audit 2 and is an audit rule, not a render: *calls a paint override a problem
only when the paint is not a variable*.

## Left for a person

- **No breadcrumb.** The web screen reads `Home / Settings` over the title; the Figma frame has the
  breadcrumb switched off, because the plan fills the shell's page header with the title alone and
  turns every other part of it off. The spec carries no `breadcrumbs`, so there is nothing to write
  there yet; a screen that does carry them would lose them the same way.
- **The last row's tiles are 11px wider** than the two rows above (445 against 434). Figma shares a
  row's spare width between its filling children by what each needs, and the empty `layout/gap`
  frame needs nothing. The web grid gives every column the same width. Small, but it is there.
- **`savings` and `sync_alt`** have no glyph in the file. Either add them to the Icon set, or change
  the spec to two names the set has.
