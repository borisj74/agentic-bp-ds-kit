// Builds the guidelines files uploaded to the published Figma library
// (file menu > Library > Manage guidelines...). Figma hands them to its agent
// whenever someone designs with the library, so they are the only place that
// tells it the rules the variants cannot carry.
//
// Run: npm run figma:guidelines
// Figma's limits: 3-8 files, aim under 100KB in total, 200KB hard cap per library.
// Upload is manual during the beta, so regenerate at release time and re-upload.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "docs/figma/guidelines");
const read = (p) => readFileSync(join(root, p), "utf8");
const json = (p) => JSON.parse(read(p));
const index = json("contracts/index.json");

// One sentence, so a component's line stays a line.
const firstSentence = (s = "") => (s.match(/^[^.]*\./)?.[0] ?? s).trim();

// Pointers back at the contract files mean nothing inside Figma.
const noContractRefs = (s = "") => s
  .replace(/\s*(?:See|see|Read|read) contracts\/[a-z0-9]+\.json for the full contract\.?/g, "")
  .replace(/[;,]?\s*(?:See|see|Read|read) contracts\/[a-z0-9]+\.json\.?/g, ".")
  // What is left points at the layout rules, which live in the tokens file here.
  .replace(/contracts\/layout\.json/g, "`02-tokens.md`")
  .replace(/\s+\./g, ".")
  .replace(/\.\.+/g, ".")
  .trim();

// Every custom property a file declares, in source order, deduped.
const declared = (file) => [
  ...new Set((read(file).match(/^\s*(--[a-z0-9-]+)\s*:/gm) ?? []).map((m) => m.trim().replace(/\s*:$/, ""))),
];

const files = [];
const add = (name, body) => files.push({ name, body: body.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n" });

// ---------------------------------------------------------------- 01 rules

// Read back out of Button's contract rather than restated here, so the pairs
// cannot drift away from the component.
const button = json("contracts/button.json");
const buttonPairs = button.props.intent.note.replace(/^Color role\.\s*/, "");
const patternNames = index.patterns.map((p) => p.name).join(", ");

add("01-rules.md", `# Agentic BP DS — rules

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
icon colour to a semantic variable. The ramps (\`--ref-*\`, \`--ui-*\`) are raw
material and are off limits — use the role tokens in \`02-tokens.md\`.

## The colour-role property is \`intent\`

Across the whole library the property that carries meaning-colour is \`intent\`
(\`brand\`, \`neutral\`, \`danger\`, \`info\`, \`success\`, \`warning\`, by component).
It is never called \`tone\`, \`variant\`, \`color\` or \`type\`.

## One loud button per screen

Button looks are \`emphasis\` x \`intent\`, and only these pairs exist:

> ${buttonPairs}

A screen gets exactly one \`emphasis=strong intent=brand\` Button — the main action.
Everything else is subtle or minimal. \`intent=danger\` is only for work that cannot
be undone.

## Spacing is a 4px grid, and the page owns its padding

Content edge padding and the gap between stacked sections come from the layout
classes, not from a per-screen number. A Section does not own page padding.
See \`02-tokens.md\` for the classes and the spacing tokens.

## Breadcrumbs read Home > section > current screen

Always start at Home, then the nav section (and any parent record), then the
current screen as the last crumb. Never leave Home out. When the screen *is* the
section's own page, the title already is the section, so the trail stops there —
\`Home > Accounts\`, never \`Home > Accounts > Accounts\`.

## A full screen sits in the frame, with the whole nav

Every full screen is an AppShell: app header across the top, the complete side nav,
and the page in the middle. Never trim the nav to the links one screen uses, and
never invent a link.

## Compose a screen from a pattern when one fits

These are whole-screen blueprints and they beat assembling a screen by hand:
${patternNames}. Read \`04-patterns.md\` before laying a screen out yourself.

## Say the missing thing

If a screen seems to need a part, a variant or a token that does not exist, do not
improvise one. Draw what you can, and name what is missing.
`);

// --------------------------------------------------------------- 02 tokens

const semantic = declared("src/tokens/semantic.css");
const roles = ["bg", "border", "text", "icon"];
// The meaning families are listed name by name: each carries its own extras
// (selected, field, static, contrast) and an agent must not guess them. The
// category hues all run the same ladder, so they go out as a grammar line
// instead of 240 near-identical names.
const meaning = ["neutral", "brand", "info", "success", "warning", "danger", "highlight"];
const hues = ["olive", "green", "mint", "cyan", "purple", "pink", "red", "orange", "yellow", "gray"];
const family = (t) => t.replace(/^--[a-z]+-/, "").split("-")[0];
const byRole = new Map(roles.map((r) => {
  const all = semantic.filter((t) => t.startsWith(`--${r}-`));
  const named = all.filter((t) => meaning.includes(family(t)));
  const steps = [...new Set(all.filter((t) => hues.includes(family(t)))
    .map((t) => t.replace(new RegExp(`^--${r}-(${hues.join("|")})-?`), "") || "(none)"))];
  return [r, { all, named, steps }];
}));
const otherRoles = semantic.filter((t) => !roles.some((r) => t.startsWith(`--${r}-`)));

// The dimension tokens worth naming: everything primitives.css declares that is
// not one of the two raw ramps.
// Cross-cutting measurements only. A component's own sizes (--calendar-row,
// --chat-bubble-max and the like) ride along with the component, and listing them
// here would only invite someone to measure a frame by hand.
const dimensionGroupsWanted = ["space", "radius", "control", "icon-size", "font-size", "font-weight",
  "line-height", "letter-spacing", "border-width", "border", "elevation", "shadow", "layout", "grid",
  "motion-duration", "motion-ease", "stick", "target", "opacity", "page", "focus"];
const dimensions = declared("src/tokens/primitives.css").filter((t) => !/^--(ref|ui)-/.test(t));
const group = (t) => {
  const seg = t.replace(/^--/, "").split("-");
  const two = seg.slice(0, 2).join("-");
  return ["font-size", "font-weight", "letter-spacing", "line-height", "icon-size", "border-width",
    "radius-control", "motion-duration", "motion-ease"].includes(two) ? two : seg[0];
};
const dimensionGroups = dimensionGroupsWanted
  .filter((g) => dimensions.some((t) => group(t) === g))
  .map((g) => `- \`${g}\`: ${dimensions.filter((t) => group(t) === g).map((t) => `\`${t}\``).join(", ")}`);

const layoutClasses = [...new Set((read("src/tokens/layout.css").match(/^\.[a-z0-9-]+/gm) ?? []))].sort();
const layout = json("contracts/layout.json");

add("02-tokens.md", `# Agentic BP DS — tokens and layout

Bind every colour and every measurement to a token below. A value typed by hand is
drift; it has no counterpart in code.

## Off limits

\`--ref-*\` and \`--ui-*\` are the raw ramps the roles are built out of. Never bind a
design to one, and never read a hex out of one.

## Colour roles

Four roles, and the list is closed — if a colour you want is not here, it does not
exist in this system.

${roles.map((r) => {
  const { all, named, steps } = byRole.get(r);
  return `### \`--${r}-*\` (${all.length})\n\n${named.map((t) => `\`${t}\``).join(", ")}\n\nCategory hues — \`--${r}-{${hues.join("|")}}\` on its own and with ${steps.filter((x) => x !== "(none)").map((x) => `\`-${x}\``).join(", ")}. Category hues are for charts, swatches and category marks, never for state or meaning: status is \`info\`, \`success\`, \`warning\`, \`danger\`.`;
}).join("\n\n")}

### Surfaces, links, outlines, fonts

${otherRoles.map((t) => `\`${t}\``).join(", ")}

Surfaces carry page depth: \`--surface-sunken\` behind, \`--surface-flat\` for the page,
\`--surface-raised\` for a card, \`--surface-floating\` for a menu or popover, and
\`--surface-backdrop\` behind a modal.

## Measurements

Spacing is a 4px grid. Use these; never a typed px. A component's own sizes come
with the component — do not measure one off a frame.

${dimensionGroups.join("\n")}

## Layout classes

${layoutClasses.map((c) => `- \`${c}\``).join("\n")}

${noContractRefs(layout.usage)}

### Do not

${layout.doNot.map((d) => `- ${noContractRefs(d)}`).join("\n")}
`);

// ----------------------------------------------------------- 03 components

// A callback cannot be drawn, so its own line would only cost the agent tokens.
const isCallback = (type = "") => type === "function" || type.includes("=>");

// Row and item shapes carry their field notes in the contract. Inside Figma only
// the field names matter, so each one becomes `name` or `name?`.
const shape = (itemShape) => {
  if (typeof itemShape === "string") return itemShape.length < 120 ? ` ${itemShape}` : "";
  if (!itemShape || typeof itemShape !== "object") return "";
  // A field reads "<type>? <what it is>", so what marks it optional is the question mark that closes the type,
  // not one inside the description. Taking the first word instead loses it on every union type.
  const optional = (value) => /^[^?]*\?(\s|$)/.test(String(value));
  const fields = Object.entries(itemShape)
    .map(([field, value]) => field + (optional(value) ? "?" : ""));
  return fields.length ? ` { ${fields.join(", ")} }` : "";
};

const componentEntry = (meta) => {
  const c = json(meta.contract);
  const entries = Object.entries(c.props ?? {});
  const props = entries.map(([name, p]) => {
    if (p.enum) return `\`${name}\`: ${p.enum.map((v) => `\`${v}\``).join(" | ")}${p.default !== undefined ? ` (default \`${p.default}\`)` : ""}`;
    if (p.type === "boolean") return `\`${name}\`: boolean${p.default !== undefined ? ` (default \`${p.default}\`)` : ""}`;
    if (isCallback(p.type)) return null;
    return `\`${name}\`: \`${p.type}\`${shape(p.itemShape)}`;
  }).filter(Boolean);
  // on* is a handler the agent can ignore. The rest are accessors a screen passes
  // to decide what a row or cell looks like, so they belong next to the props.
  const callbacks = entries.filter(([, p]) => !p.enum && isCallback(p.type)).map(([name]) => name);
  const names = (list) => list.map((name) => `\`${name}\``).join(", ");
  const accessors = callbacks.filter((name) => !/^on[A-Z]/.test(name));
  const events = callbacks.filter((name) => /^on[A-Z]/.test(name));
  // The whole usage paragraph, not a trim of it: a contract opens with what the piece is and how data goes in,
  // and only says how it behaves further down — a wide Table scrolls inside its box in sentence 10 of 14. Cut to
  // the first few sentences and the agent gets what the line above already told it, and none of the behaviour.
  return [
    `### ${c.name}`,
    firstSentence(c.intent),
    props.length ? `Props — ${props.join("; ")}` : null,
    accessors.length ? `Functions — ${names(accessors)}` : null,
    events.length ? `Events — ${names(events)}` : null,
    c.usage ? noContractRefs(c.usage) : null,
    c.doNot?.length ? c.doNot.slice(0, 3).map((d) => `- ${noContractRefs(d)}`).join("\n") : null,
  ].filter(Boolean).join("\n\n");
};

const categories = [...new Set(index.components.map((c) => c.category))].sort();
add("03-components.md", `# Agentic BP DS — components

Every component in the library, with its closed property lists. A property value
that is not on its line does not exist: do not add a variant, a size or a colour
the list leaves out.

${categories.map((cat) => `## ${cat}\n\n${index.components.filter((c) => c.category === cat).map(componentEntry).join("\n\n")}`).join("\n\n")}
`);

// ------------------------------------------------------------- 04 patterns

const patternEntry = (meta) => {
  const p = json(meta.contract);
  return [
    `## ${p.name}`,
    noContractRefs(p.intent),
    noContractRefs(p.usage),
    p.useWhen?.length ? `**Use when**\n\n${p.useWhen.map((u) => `- ${u}`).join("\n")}` : null,
    p.composes?.length ? `**Composes** ${p.composes.map((c) => `\`${c}\``).join(", ")}` : null,
    p.doNot?.length ? `**Do not**\n\n${p.doNot.map((d) => `- ${noContractRefs(d)}`).join("\n")}` : null,
  ].filter(Boolean).join("\n\n");
};

add("04-patterns.md", `# Agentic BP DS — screen patterns

A pattern is a whole-screen blueprint. When one fits the screen, use it: it already
settles the frame, the page header, the bar, the spacing and the scroll behaviour.
Do not lay a screen out by hand that a pattern covers, and do not change a pattern's
structure to suit one screen.

${index.patterns.map(patternEntry).join("\n\n")}
`);

// --------------------------------------------------------- 05 anti-patterns

add("05-antipatterns.md", `# Agentic BP DS — anti-patterns

Mistakes this system keeps catching. Each one has a right answer beside it.

## Drawing a component instead of inserting it

A table built from rectangles, a badge built from a rounded rect and a label, a
dialog built from a frame and a shadow. **Insert the library component.** If the
part is missing, say so instead of drawing a stand-in.

## A second component beside one that exists

A new "status chip" next to Badge, a local "header bar" next to PageHeader, a
"side panel" next to Drawer. **One component per job.** Extend the existing one's
property list, or say the variant is missing.

## Typed colour

A hex, an eyedropped fill, a colour nudged with opacity, or a binding to
\`--ref-*\` / \`--ui-*\`. **Bind to a role token** from \`02-tokens.md\`.

## \`tone\`, \`variant\` or \`color\` for the colour role

The property is always \`intent\`. On Button the look is \`emphasis\` x \`intent\`,
allowed pairs only — never a single \`variant\` property.

## More than one loud button

Two filled brand buttons on a screen means neither is the main action.
**One \`emphasis=strong intent=brand\` per screen**; everything else subtle or minimal.

## A per-screen grid

Columns and gaps invented for one layout. **Use the layout classes** —
\`.layout-content\`, \`.layout-stack\`, \`.layout-split\`, \`.layout-metrics\`.

## Page padding on a Section

Section does not own page padding; the page does. A Section that pads itself
double-pads against the page and misaligns with its neighbours.

## A metric row built out of frames and borders

**Use Scoreboard.** Hand-built metric rows drift in height, inset and divider
weight the moment the numbers change.

## Fields grouped by hand

A drawn fieldset, a two-column field grid, labels placed by eye. **Use Form**:
titled groups through its sections, \`labelPosition=start\` for leading labels,
\`columns=2\` for side-by-side fields. The leading-label column is a fixed width
(\`--input-label-width\`), so labels line up across every group.

## A table with its own scroll box

A table that scrolls inside a fixed-height frame fights the page. In this system
**the table scrolls with the page**, vertically; when it is wider than the viewport
the page scrolls sideways. Its column names hold at the top of the page, under
whatever is pinned above them.

## Guessing what holds still on scroll

Pinned things have one order, from the rows up: a frozen first column, the column
names, a frozen name cell (both at once), a pinned bar over them, its lift, and the
page name above the lot. **Take the order from that scale**, do not pick a layer.

## A trimmed side nav

A screen showing only the nav links it uses. **The whole nav, always**, with the
current screen marked.

## A breadcrumb trail without Home, or with its section twice

\`Home > section > screen\`. When the screen is the section's own page the trail
stops at the section.

## Inventing a token

A new spacing step, a new radius, a new type size. **Use the existing scale.** If
nothing fits, name what is missing rather than adding a value.
`);

// ------------------------------------------------------------------ write

let total = 0;
for (const f of files) {
  writeFileSync(join(out, f.name), f.body);
  const bytes = Buffer.byteLength(f.body);
  total += bytes;
  console.log(`${f.name.padEnd(22)} ${(bytes / 1024).toFixed(1)} KB`);
}
console.log(`${"total".padEnd(22)} ${(total / 1024).toFixed(1)} KB  (${files.length} files; aim under 100 KB, cap 200 KB)`);
if (total > 200 * 1024) { console.error("over Figma's 200 KB limit per library"); process.exit(1); }
if (total > 100 * 1024) console.warn("over the 100 KB Figma asks for: trim before uploading");
