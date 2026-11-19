# Reference screens

Four screen specs, the screens they build, and the screenshot each one is measured against. They are
the examples to copy from when you write a spec of your own.

| Spec | Pattern | What it shows |
| --- | --- | --- |
| `invoices-list.json` | ListPage | A list with two filters, a search, views, an editable DataGrid with a total row, a page bar, and an empty state |
| `account-create.json` | FormPage | A create form: its own page header with Cancel and one strong brand save, a dismissible notice, eight fields in two columns |
| `payments-empty.json` | ListPage | A screen that opens empty: the EmptyState and its two actions, with the filled state beside it |
| `usage-overview.json` | ListPage | Metrics over a table: a Scoreboard in a Section, usage by account, and the empty state |

## The loop

```bash
npm run build-screen -- docs/references/invoices-list.json --dry   # check it, write nothing
npm run build-screen -- docs/references/invoices-list.json         # write the pages
npm run loop -- docs/references/invoices-list.json                 # render, review, screenshot, repair
```

`npm run loop` starts `next dev` with `NEXT_PUBLIC_BP_INSPECT=1`, reviews each page twice (its code,
and the HTML the server serves), photographs every state in light and dark at 1440×900, repairs what
it can repair mechanically, and writes `reports/loop/<name>.md`. It gives up after three attempts.

## What a spec holds

```jsonc
{
  "name": "usage-overview",          // the route and the file name
  "title": "Usage overview",         // the page title, and the one h1
  "pattern": "ListPage",             // a pattern from `list level=template`
  "section": "mediation-usage-data", // which side-nav link is current
  "breadcrumbs": ["Mediation"],      // Home is added for you
  "state": "ready",                  // the state the screen itself opens in
  "states": ["ready", "empty"],      // every state it answers; each gets a route
  "copy": { "emptyTitle": "…" },     // words, with a length limit per kind
  "regions": {                       // the pattern's own regions, plus above and content
    "above": [],                     // Sections between the page header and the pattern
    "toolbar": [],                   // a ReactNode prop of the pattern
    "content": [],                   // the pattern's children
    "empty": []
  }
}
```

A node is `{ component, props, slots, text }`: `component` is a contract name, `props` carries values
only, `slots` carries the components that go into a ReactNode prop (`children` included), and `text`
is the label a component takes as its children. A handler is written as `true` and becomes a no-op in
the screen. A string like `"$copy.emptyTitle"` is replaced by that line of copy.

Everything is checked against `contracts/index.json` and the contracts themselves, so a spec that
could not be built fails before any code is written.

## The screenshots

`screenshots/<name>.png` is the reference: the screen's own state, light, 1440×900. `npm run loop --
<spec.json> --update-references` replaces it. `tests/spec-references.test.ts` compares the last loop
screenshot to it as a grid of average colours, so a change a person would see fails the test while a
font hint does not.

Edit the spec, never the generated page under `src/app/(examples)/`: the next build overwrites it.
