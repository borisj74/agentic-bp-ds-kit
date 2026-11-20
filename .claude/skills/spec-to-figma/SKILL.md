---
name: spec-to-figma
description: Use when rendering a screen spec into the Agentic DS Figma file, or when a rendered Figma screen has to be checked and repaired. Drives the plan → emit → use_figma → audit → judge loop.
argument-hint: <spec.json, e.g. docs/references/usage-overview.json>
---

# Spec to Figma

One screen spec, rendered into Figma as library instances, then checked and repaired. The same spec
builds the web screen, so the two stay the same screen.

Node never talks to Figma. The scripts write the JavaScript; you send it. Keep that split: a render
is **one** `use_figma` call, and an audit is **one** more that returns JSON only.

Invoke with `/spec-to-figma <spec.json>`.

## The loop

Three attempts, at most. Each attempt is two `use_figma` calls: the render and the audit.

1. **Check the spec.** `validate_spec` (MCP), or `npm run build-screen -- <spec.json> --dry`. A spec
   that does not check out is not rendered: fix the spec first.
2. **Plan.** `npm run figma:plan -- <spec.json>` (add `--brand sunset` for another brand ramp,
   `--themes Light` for one scheme). A plan error is not a Figma problem — it says the screen asks
   for something the library does not draw. Read it, fix the spec, plan again. Nothing has been sent
   to Figma yet.
3. **Emit.** `npm run figma:emit -- <spec.json> --out <scratch>/render.js`. Read the file and send
   its contents as the `code` of one `use_figma` call. Load the `figma-use` skill first — it is a
   prerequisite of every `use_figma` call. If the emitter says the script will not fit one call,
   render one state or one theme at a time with `--frames`.
4. **Audit.** Build the audit script the same way (see below) and send it as one more `use_figma`
   call. It is read-only and returns `{ "ok": true }` or the failures and nothing else.
5. **Judge.** `npm run figma:judge -- <spec.json> --audit <scratch>/audit.json`. It makes the repairs
   `scripts/spec/fix.mjs` makes, writes them back into the **spec**, and says whether to render
   again. Never patch Figma by hand and never edit the generated page: the spec is the source.
6. **Repeat** from step 2 while the judge says `render`, up to three attempts in all.

To build the audit script (it reads the same page the emitter writes to, so pass `--page` to both or
to neither):

```bash
node -e 'const p=await import("./scripts/figma/plan.mjs"),a=await import("./scripts/figma/audit.js");const plan=p.planFile(process.argv[1]);process.stdout.write(a.auditScript(plan,{page:process.argv[2]||undefined}))' <spec.json> > <scratch>/audit.js
```

## Where it lands

Everything goes on the **`Spec renders`** page, created right after `Patterns` the first time. Each
spec's frames sit in a Section named after the spec, laid out in a row:

```
Spec renders
└── payments-empty            (section)
    ├── payments-empty/empty/light
    ├── payments-empty/empty/dark
    ├── payments-empty/ready/light
    └── payments-empty/ready/dark
```

A re-render reuses that section and those frames, so their ids, links and comments survive. Pass
`--page` to `figma:emit` to write somewhere else, and the same name to the audit.

## Screenshots

**Do not take a screenshot on every attempt.** They are the most expensive thing in the loop.

Take `get_screenshot` of each frame **once**: when the audit passes, or on the third attempt if it
never does. Light and dark, one shot per state, by the frame ids the render call returned.

Save them under `reports/figma-loop/<name>/` as `<state>-<theme>.png`.

## The report

Write `reports/figma-loop/<name>.md` when the loop stops, whatever the outcome:

- the spec, the pattern, the brand, the themes, and how many attempts it took
- a table of rules × attempts: one row per rule (`bp/figma-instance`, `bp/figma-detached`,
  `bp/figma-bound`, `bp/figma-props`, `bp/figma-modes`, `bp/figma-overflow`), one column per attempt
- every frame by name with its Figma node id, as a link to
  `https://www.figma.com/design/<fileKey>/?node-id=<id>`
- the screenshot paths
- what the judge repaired, and what it left for a person, in its own words
- what the plan reported as not in Figma (`dropped`): the props and the content the library draws as
  its own example. This is the honest part of the render — say it rather than let somebody think the
  frame holds the spec's own copy.

## Rules

- **Read-only outside the target page.** The renderer writes to the `Spec renders` page and nowhere
  else.
  Never touch the Components page, the Foundations page, the variables or the component sets.
- **Never delete a node the loop did not create.** Re-rendering replaces a frame's own children and
  keeps the frame's id; that is the only removal allowed.
- **Never `figma.create*` anything but a layout frame.** No rectangle, no text, no shape. Every
  visible leaf comes from a library instance. The emitted script already holds to this; do not add to
  it by hand.
- **Never write a number or a colour.** Gaps, paddings, radii and fills name a Dimension or Semantic
  variable and are bound to it.
- **One strong brand Button per screen**, as everywhere else in the kit.
- **Do not hand back a screen whose audit fails.** Read the report, fix the spec, run it again.
