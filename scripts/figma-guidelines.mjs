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

// A usage paragraph runs to 14 sentences for the bigger pieces, and all of them together were 72KB of the 150KB
// these files cost — enough to put the library over Figma's 200KB cap on the next component added. A contract opens
// with what the piece is and how data goes in, and the rules the agent cannot guess are spread down the rest, so
// neither the whole paragraph nor a flat cut of the first few is right. What comes through: the opening sentences
// (three for a pattern, none for a component — see below), then every later sentence carrying a rule — what to use
// instead, what is capped, what belongs where, what gives way. What is left behind is detail the property line above
// already shows (which values align, what an empty table says) and behaviour a static Figma drawing cannot express.
const RULE = /\b(never|do not|only|must|at most|one per|instead of|rather than|no more than|belongs? in|belong to|give way|too wide|scrolls? (in|inside) its own)\b/i;
const usageSentences = (s = "", openers) => {
  const sentences = s.trim().split(/(?<=[.!?])\s+/);
  return [...sentences.slice(0, openers), ...sentences.slice(openers).filter((line) => RULE.test(line))].join(" ");
};
// A pattern keeps its opening sentences: there are a dozen patterns and the opening is where a blueprint says which
// screen it is for. A component drops them. With 84 components those openers were 14KB, and they almost always
// restate the intent line printed directly above them ("Use Badge for status on rows and cards" under "Short status
// or category label"), while the steer to a different piece rides in the rules and the do-nots either way.
// A pattern's own opening sentence is always "Use <Pattern> for <the screen>", and the **Use when** bullets printed
// just below it say that outright, so the openers kept here are the two after it — the ones that say what the
// blueprint is made of.
const usageForFigma = (s = "") => {
  const sentences = s.trim().split(/(?<=[.!?])\s+/);
  return usageSentences(sentences.slice(1).join(" "), 2);
};
const usageForComponent = (s = "") => usageSentences(s, 0);

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

Each role carries the same set of category hues, listed once under the role below.
Category hues are for charts, swatches and category marks, never for state or
meaning: status is \`info\`, \`success\`, \`warning\`, \`danger\`.

${roles.map((r) => {
  const { all, named, steps } = byRole.get(r);
  return `### \`--${r}-*\` (${all.length})\n\n${named.map((t) => `\`${t}\``).join(", ")}\n\nCategory hues — \`--${r}-{${hues.join("|")}}\` on its own and with ${steps.filter((x) => x !== "(none)").map((x) => `\`-${x}\``).join(", ")}.`;
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

// "Do not invent/build a local <something>". Deliberately narrow: it has to be about making a second copy of the
// piece, so "Do not add a second strong Button" and "Do not draw forecast bars as a second series" are not caught.
const LOOKALIKE = /^do not (invent|hand-?roll|build a local|draw a local)\b/i;

// Row and item shapes carry their field notes in the contract. Inside Figma only
// the field names matter, so each one becomes `name` or `name?`.
// A contract writes a shape either as an object or as a line of TypeScript, and the same rule holds for both: the
// field types are for whoever wires the component up, not for whoever draws it. A written-out shape is reduced to
// its field names here, which is also what lets the longest ones through — they used to be dropped whole for
// running past 120 characters, so a designer learned nothing about those rows at all.
const fieldNames = (fields) => (fields.length ? ` { ${fields.join(", ")} }` : "");
const shape = (itemShape) => {
  if (typeof itemShape === "string") {
    // Walked rather than matched, because a shape can nest a group (`note: { at; label }`) and can be a union of
    // two of them (`{ id; label } | { divider: true }`). Only the names one brace deep are wanted, from every
    // group in the line, in order and without repeats.
    const names = [];
    let depth = 0;
    let token = "";
    const flush = () => {
      const name = token.split(":")[0].trim();
      if (name && !names.includes(name)) names.push(name);
      token = "";
    };
    for (const ch of itemShape) {
      if (ch === "{") { if (depth === 1) { token += "{"; } depth += 1; if (depth === 1) token = ""; continue; }
      if (ch === "}") { depth -= 1; if (depth === 0) flush(); continue; }
      if (ch === ";" && depth === 1) { flush(); continue; }
      if (depth === 1) token += ch;
    }
    // An index signature is the row's own "any other column" field; it reads as `[key]`.
    return fieldNames(names.map((name) => (name.startsWith("[") ? "[key]" : name)));
  }
  if (!itemShape || typeof itemShape !== "object") return "";
  // A field reads "<type>? <what it is>", so what marks it optional is the question mark that closes the type,
  // not one inside the description. Taking the first word instead loses it on every union type.
  const optional = (value) => /^[^?]*\?(\s|$)/.test(String(value));
  return fieldNames(Object.entries(itemShape)
    .map(([field, value]) => field + (optional(value) ? "?" : "")));
};

const componentEntry = (meta) => {
  const c = json(meta.contract);
  const entries = Object.entries(c.props ?? {});
  const props = entries.map(([name, p]) => {
    // Written tight, because the same few shapes repeat 84 times: `size sm|md*|lg` rather than
    // "`size`: `sm` | `md` (default `md`) | `lg`". The notation is spelled out at the head of the file.
    if (p.enum) return `${name} ${p.enum.map((v) => (String(p.default) === v ? `${v}*` : v)).join("|")}`;
    if (p.type === "boolean") return `${name} bool${p.default === true ? "*" : ""}`;
    if (isCallback(p.type)) return null;
    return `${name} ${p.type}${shape(p.itemShape)}`;
  }).filter(Boolean);
  // on* is a handler nothing in a Figma frame can show, so it is left out entirely; it cost 2.4KB across the
  // library to print names the agent was told to ignore. The rest are accessors a screen passes to decide what a
  // row or cell looks like — those do change what gets drawn, so they stay next to the props.
  const callbacks = entries.filter(([, p]) => !p.enum && isCallback(p.type)).map(([name]) => name);
  const accessors = callbacks.filter((name) => !/^on[A-Z]/.test(name));
  // A prop's note is written for someone reading code, and most of it says how the piece behaves rather than what
  // gets drawn. Every note would also put the files well past Figma's cap. So a contract marks the few whose note
  // carries something the property line cannot show — a count, a size, which values pair, where the prop may be
  // used — with noteForFigma, and only those come through, each on its own line under the props.
  // The first sentence of a marked note is the rule; what follows it is the worked example. The example is what a
  // designer gets from looking at the component on the canvas, so only the rule is written out here.
  const propNotes = entries
    .filter(([, p]) => p.noteForFigma && p.note)
    .map(([name, p]) => [name, firstSentence(noContractRefs(p.note))])
    // A few marked notes open with the callback's own signature, which says nothing a frame can show.
    .filter(([, note]) => !/=>/.test(note))
    .map(([name, note]) => `- ${name} — ${note}`);
  // "Do not invent a local Badge, Tag, Chip or Pill" is rule one in 01-rules.md and the first anti-pattern in
  // 05-antipatterns.md, restated for 49 of the 84 components. It is dropped here when the component has a rule of
  // its own left to give, and kept when it is all that component has to say.
  const specific = (c.doNot ?? []).filter((d) => !LOOKALIKE.test(d));
  const doNot = (specific.length ? specific : (c.doNot ?? [])).slice(0, 2);
  return [
    `### ${c.name}`,
    firstSentence(c.intent),
    props.length ? `Props — ${props.join("; ")}` : null,
    propNotes.length ? propNotes.join("\n") : null,
    accessors.length ? `Functions — ${accessors.join(", ")}` : null,
    c.usage ? usageForComponent(noContractRefs(c.usage)) : null,
    doNot.length ? doNot.map((d) => `- ${noContractRefs(d)}`).join("\n") : null,
  ].filter(Boolean).join("\n\n");
};

const categories = [...new Set(index.components.map((c) => c.category))].sort();
add("03-components.md", `# Agentic BP DS — components

Every component in the library, with its closed property lists. A property value
that is not on its line does not exist: do not add a variant, a size or a colour
the list leaves out.

How to read a property line. Choices are separated by \`|\` and the default is marked
with \`*\` — \`size sm|md*|lg\` means those three sizes and nothing else, \`md\` unless
you set it. \`name bool\` is a flag, \`bool*\` one that is already on. Anything else is
the type the property takes, with the fields of a row or item in braces after it.
\`Functions\` are the accessors a screen passes to decide how a row or cell is drawn.
Event handlers are left out: they change nothing you can see in a frame.

${categories.map((cat) => `## ${cat}\n\n${index.components.filter((c) => c.category === cat).map(componentEntry).join("\n\n")}`).join("\n\n")}
`);

// ------------------------------------------------------------- 04 patterns

const patternEntry = (meta) => {
  const p = json(meta.contract);
  return [
    `## ${p.name}`,
    noContractRefs(p.intent),
    usageForFigma(noContractRefs(p.usage)),
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
