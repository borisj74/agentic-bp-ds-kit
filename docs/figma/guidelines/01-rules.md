# Agentic BP DS — rules

These rules hold for anything drawn with this library. They are not style advice;
a design that breaks one is wrong and will not survive the move into code.

## Use the library, never a lookalike

Every piece in this library has a built counterpart in code. Insert the component.
Never draw a copy of one out of rectangles and text, and never build a near-cousin
of something that already exists (no second badge, no local dialog, no hand-drawn
table). If the thing you need is not in the library, stop and say so — leave the
frame with a note rather than inventing a part.

## Colour comes from tokens only

No hex, no picked colours, no opacity tricks. Bind every fill, stroke, text and
icon colour to a semantic variable. The ramps (`--ref-*`, `--ui-*`) are raw
material and are off limits — use the role tokens in `02-tokens.md`.

## The colour-role property is `intent`

Across the whole library the property that carries meaning-colour is `intent`
(`brand`, `neutral`, `danger`, `info`, `success`, `warning`, by component).
It is never called `tone`, `variant`, `color` or `type`.

## One loud button per screen

Button looks are `emphasis` x `intent`, and only these pairs exist:

> Allowed pairs: strong with brand or danger (intent is required with strong); subtle with neutral; minimal with neutral, brand or danger. Leave both out for subtle neutral.

A screen gets exactly one `emphasis=strong intent=brand` Button — the main action.
Everything else is subtle or minimal. `intent=danger` is only for work that cannot
be undone.

## Spacing is a 4px grid, and the page owns its padding

Content edge padding and the gap between stacked sections come from the layout
classes, not from a per-screen number. A Section does not own page padding.
See `02-tokens.md` for the classes and the spacing tokens.

## Breadcrumbs read Home > section > current screen

Always start at Home, then the nav section (and any parent record), then the
current screen as the last crumb. Never leave Home out. When the screen *is* the
section's own page, the title already is the section, so the trail stops there —
`Home > Accounts`, never `Home > Accounts > Accounts`.

## A full screen sits in the frame, with the whole nav

Every full screen is an AppShell: app header across the top, the complete side nav,
and the page in the middle. Never trim the nav to the links one screen uses, and
never invent a link.

## Compose a screen from a pattern when one fits

These are whole-screen blueprints and they beat assembling a screen by hand:
AccountFlow, AppShell, ChatWindow, Dashboard, FormPage, GuidedProcessPage, ListDetail, ListPage, RecordPage, SettingsPage. Read `04-patterns.md` before laying a screen out yourself.

## Say the missing thing

If a screen seems to need a part, a variant or a token that does not exist, do not
improvise one. Draw what you can, and name what is missing.
