# account-create — Figma render

Spec `docs/references/account-create.json` · pattern `FormPage` · brand `cobalt`.

**Not rendered.** The plan does not hold, so nothing was sent to Figma. One blocker, and it is in the
library rather than in the spec or the renderer.

## Where it fails

```
regions.content[0].slots.children
  Form children is one swappable instance in Figma (content#174:15), and .Form fields draws a
  fixed roster: Input, Input, Input, Select, Lookup, Textarea, Checkbox. The spec asks for
  Select ×2, DatePicker, which the roster has no slot for.
  fix: Give .Form fields a slot per field, or draw this form as its own Figma component.
       As it is, a form of Input ×3, Select, Lookup, Textarea, Checkbox fits.
```

Read in the file today: `Form`'s body holds one instance named `Content`, bound to the
`content#174:15` INSTANCE_SWAP property. What it swaps in is `.Form fields`
([680:73922](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=680-73922), key
`3fe018f8…`, unpublished), a component set of 12 variants over `columns` (1, 2, 3),
`labelPosition` (top, start) and `labelWidth` (md, sm, lg).

Every one of those variants draws **the same seven fields** — Input, Input, Input, Select, Lookup,
Textarea, Checkbox. `columns` and `labelPosition` only change how the seven are arranged.

The spec asks for eight: Input, Input, Select, Select, Input, Select, DatePicker, Checkbox. Three
Inputs and the Checkbox have a slot; the second and third Select and the DatePicker have none. There
is no show flag per field either — `.Form fields` has only `showCheckbox#697:0` — so a form with
fewer fields than the roster cannot hide the rest of it.

A half-filled form would be worse than none: three of this account's fields would be right and the
others would read as some other form's example copy, and no audit rule could tell the difference.
So the renderer stops.

## What would make it render

One of these, in the Figma file:

1. **A slot per field on `.Form fields`** — a numbered roster with a show flag each, the way `Table`
   draws its rows (`showRow4` … `showRow10`) and `Breadcrumb` its crumbs. Then any form of up to that
   many fields renders, and the renderer already knows how to fill a numbered roster.
2. **A component for this form**, swapped into the content slot as one piece.

Nothing in the renderer or the spec needs to change for either.

## The same shape elsewhere

`Section`'s content is the same kind of slot, and its default draws nothing at all: `.Section slot`
([119:2](https://www.figma.com/design/ELFJs16lnRVQaOrxhMVrVf/?node-id=119-2), key `7b3dd3e3…`) is
blank, so a Section holds exactly one component. That is why `account-record`, `approvals-queue` and
`billing-dashboard` do not render either — each puts 2 to 8 components in one Section.

Both rosters are now recorded in `contracts/figma-map.json` under `props.children.swap`, so the plan
says which pieces have nowhere to go instead of only that the slot takes one component.

## What does render today

`payments-empty`, `settings-home` and `usage-overview` plan and render clean. The four that do not
all fail on the same thing: a slot that takes one component where the kit composes many.
