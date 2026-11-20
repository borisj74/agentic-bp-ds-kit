/**
 * The audit: what to ask Figma about a rendered screen, and nothing more.
 *
 * `auditScript(plan)` returns one piece of JavaScript for a single use_figma call. The script reads
 * the frames the plan named and returns compact JSON — failures only, so a clean render costs a few
 * bytes of context and a broken one costs only what is broken:
 *
 *   { "ok": true }
 *   { "ok": false, "findings": [{ "rule": "...", "frame": "...", "node": "...", "id": "...", "what": "..." }] }
 *
 * It is read-only. It creates nothing, changes nothing and removes nothing.
 *
 * The rules:
 *   bp/figma-instance   every visible leaf sits inside a library instance; the only nodes that are
 *                       not instances are the state frame itself and its `layout/*` frames
 *   bp/figma-detached   no instance has lost its main component, and nothing named after a kit
 *                       component is a plain frame or group
 *   bp/figma-bound      a layout frame's gap, padding, radius and fill are bound to variables, and no
 *                       instance carries a fill or stroke override
 *   bp/figma-props      componentProperties and texts are what the plan said, down to the cells of a
 *                       table and the label on an exposed action button
 *   bp/figma-modes      each frame sets its own explicit mode for every collection the plan named
 *   bp/figma-overflow   nothing sticks out of the frame it was put in
 *   bp/figma-align      the screen's first visible content starts at the page header title's own
 *                       left edge — the title layer, not the first text in the header, which is the
 *                       breadcrumb trail
 *   bp/figma-example-content
 *                       a slot holds the screen and nothing else, and every word showing anywhere
 *                       inside the frame is a word the spec wrote: a trend, a badge, a chip, a total
 *                       and a pagination line the artboard ships with are all caught here
 *
 * A finding that a render can mend node by node carries `set`: the node's id and the properties the
 * plan wants on it. scripts/figma/emit.mjs turns those into a repair that touches only those nodes,
 * rather than drawing the whole frame again.
 */
import { TARGET_PAGE } from "./plan.mjs";

/** The rules the audit can report, in the order a report lists them. */
export const RULES = [
  "bp/figma-instance",
  "bp/figma-detached",
  "bp/figma-bound",
  "bp/figma-props",
  "bp/figma-modes",
  "bp/figma-overflow",
  "bp/figma-align",
  "bp/figma-example-content",
  "bp/figma-dividers",
];

/** The one kit component name per plan node, and the props, words and layers the plan set on it. */
function expectInstance(node) {
  const layers = [];
  const add = (path, props, texts, hint = null, swaps = null) => {
    const all = { ...props, ...texts };
    const named = swaps && Object.keys(swaps).length > 0 ? Object.fromEntries(Object.entries(swaps).map(([key, swap]) => [key, swap.component])) : null;
    if (path?.length > 0 && (Object.keys(all).length > 0 || named)) {
      const layer = { path, props: all };
      if (hint) layer.hint = hint;
      if (named) layer.swaps = named;
      layers.push(layer);
    }
  };
  for (const item of Object.values(node.items ?? {})) {
    for (const row of item.rows) {
      add(row.path, row.props, row.texts);
      for (const cell of row.cells ?? []) add(cell.path, cell.props, cell.texts);
    }
  }
  for (const part of node.parts ?? []) {
    add(part.path, part.props, part.texts, { component: part.component, index: part.index }, part.swaps);
    // A part's own parts are read from the part, so their path starts where the part's ends.
    for (const inner of part.parts ?? [])
      add([...part.path, ...inner.path], inner.props, inner.texts, { component: inner.component, index: inner.index }, inner.swaps);
  }

  // The line between one child and the next, checked against the contract rather than against what
  // the plan wrote: the children that are showing are read in the file, and every one but the last
  // has to carry the line.
  let divider = null;
  for (const item of Object.values(node.items ?? {})) {
    if (!item.divider || typeof item.child !== "string") continue;
    const names = [];
    for (let n = 1; n <= Number(item.max ?? 0); n += 1) names.push(item.child.replace(/\bN\b/g, String(n)));
    if (names.length > 0) divider = { key: item.divider, cards: names };
  }

  const props = { ...node.props, ...node.texts };
  for (const item of Object.values(node.items ?? {})) {
    for (const row of item.rows) if (row.show) props[row.show] = true;
  }
  const nested = [];
  const slots = {};
  for (const child of Object.values(node.swaps ?? {})) nested.push(expectInstance(child));
  for (const [key, list] of Object.entries(node.slots ?? {})) {
    slots[key.split("#")[0]] = list.map((child) => (child.kind === "layout" ? child.name : child.component));
    for (const child of list) nested.push(expectNode(child));
  }
  const out = { kind: "instance", component: node.component, props, layers, nested };
  if (divider) out.divider = divider;
  if (Object.keys(slots).length > 0) out.slots = slots;
  return out;
}

/**
 * Every word the plan writes into a tree: the screen's own copy, and nothing else.
 *
 * `bp/figma-example-content` reads the words showing in the file against this set, so a figure the
 * artboard draws of its own — a trend, a total, a page count — is told apart from the spec's.
 */
export function wordsOf(node, out = new Set()) {
  if (node === null || typeof node !== "object") return out;
  const take = (texts) => {
    for (const value of Object.values(texts ?? {})) if (typeof value === "string" || typeof value === "number") out.add(String(value).trim());
  };
  if (node.kind === "layout") {
    for (const child of node.children ?? []) wordsOf(child, out);
    return out;
  }
  take(node.texts);
  for (const item of Object.values(node.items ?? {})) {
    for (const row of item.rows ?? []) {
      take(row.texts);
      for (const cell of row.cells ?? []) take(cell.texts);
    }
  }
  for (const part of node.parts ?? []) {
    take(part.texts);
    for (const inner of part.parts ?? []) take(inner.texts);
  }
  for (const child of Object.values(node.swaps ?? {})) wordsOf(child, out);
  for (const list of Object.values(node.slots ?? {})) for (const child of list) wordsOf(child, out);
  return out;
}

/** What the align rule measures against: the title the shell's page header holds, and its layer. */
function alignOf(frame) {
  if (!frame.align) return null;
  if (typeof frame.align === "object") return { title: frame.align.title ?? null, layer: frame.align.layer ?? null };
  return { title: frame.title ?? null, layer: null };
}

function expectNode(node) {
  if (node.kind === "layout")
    return {
      kind: "layout",
      name: node.name,
      gap: node.gap ?? null,
      padding: node.padding ?? null,
      radius: node.radius ?? null,
      fill: node.fill ?? null,
      children: node.children.map(expectNode),
    };
  return expectInstance(node);
}

/** What the audit expects of one plan: the frames, their modes and their trees. */
export function expectations(plan, { page = TARGET_PAGE, frames = null } = {}) {
  const wanted = frames ? plan.frames.filter((frame) => frames.includes(frame.name) || frames.includes(frame.state) || frames.includes(frame.theme)) : plan.frames;
  return {
    page,
    screen: plan.name,
    frames: wanted.map((frame) => {
      const roots = frame.fallback ? [frame.parts.header, frame.parts.nav, frame.parts.content].filter(Boolean) : [frame.root];
      const words = new Set();
      for (const root of roots) wordsOf(root, words);
      return {
        name: frame.name,
        modes: frame.modes,
        align: alignOf(frame),
        words: [...words].filter(Boolean),
        tree: roots.map(expectNode),
      };
    }),
  };
}

const BODY = `
const started = Date.now();
const out = [];
// A finding, and — where a render can mend it node by node — the node's id and the properties the
// plan wants on it. Everything else is left for the judge and for a person.
const add = (rule, frame, node, id, what, set) => out.push(set ? { rule, frame, node, id, what, set } : { rule, frame, node, id, what });
// Words the artboard draws of its own are read against the spec's, and an icon glyph is a character
// in a symbol font rather than a word, so it is left out of that reading.
const ICON = /material symbols/i;
const glyphy = (text) => {
  const font = text.fontName;
  const family = font && typeof font === "object" ? font.family : null;
  return typeof family === "string" && ICON.test(family);
};

const LAYOUT = /^layout\\//;
// A layer down a path, read exactly the way the render wrote it: "columns" then "@2" then "Row 3".
// "@N" is the Nth child; a name that is not there falls back to the nth instance of the component
// the plan named, which is how an exposed action button is reached.
const down = (node, path, hint) => {
  let at = node;
  for (const step of path || []) {
    const nth = /^@(\\d+)$/.exec(step);
    const next = nth
      ? (at.children || [])[Number(nth[1]) - 1] || null
      : at.findAll((n) => n.name === step)[0] || at.findAll((n) => n.type === "INSTANCE" && n.mainComponent && n.mainComponent.name === step)[0] || null;
    if (!next) {
      if (!hint) return null;
      const all = at.findAll((n) => n.type === "INSTANCE" && (n.name === hint.component || (n.mainComponent && n.mainComponent.name === hint.component)));
      return all[(hint.index || 1) - 1] || null;
    }
    at = next;
  }
  return at;
};
const bound = (node, field) => Boolean((node.boundVariables || {})[field]);
// What the plan put in a slot of this frame, by the slot's own name, or null when it planned none.
const slotNames = (want, name) => {
  let found = null;
  const look = (node) => {
    if (found) return;
    if (node.kind === "instance") {
      if (node.slots && node.slots[name]) { found = node.slots[name]; return; }
      for (const child of node.nested || []) look(child);
      return;
    }
    for (const child of node.children || []) look(child);
  };
  for (const child of want.tree) look(child);
  return found;
};
// The first words showing inside a node, to name what is there in a finding.
const firstWords = (node) => {
  if (node.type === "TEXT" && node.visible && node.characters) return node.characters.slice(0, 40);
  const text = node.findAll ? node.findAll((n) => n.type === "TEXT" && n.visible && n.characters)[0] : null;
  return text ? text.characters.slice(0, 40) : null;
};
const boundPaint = (list) => Array.isArray(list) && list.length > 0 && list.every((p) => p.boundVariables && p.boundVariables.color);

const page = figma.root.children.find((p) => p.name === EXPECT.page);
if (!page) return { ok: false, findings: [{ rule: "bp/figma-instance", frame: EXPECT.page, node: EXPECT.page, id: null, what: "there is no page by that name" }] };
await page.loadAsync();

const checkInstance = async (node, want, frameName) => {
  if (node.type !== "INSTANCE") {
    add("bp/figma-detached", frameName, node.name, node.id, want.component + " is a " + node.type + ", not an instance");
    return;
  }
  if (!node.mainComponent) {
    add("bp/figma-detached", frameName, node.name, node.id, "the instance has no main component");
    return;
  }
  const have = node.componentProperties || {};
  for (const [key, value] of Object.entries(want.props || {})) {
    const entry = have[key];
    if (entry === undefined) {
      add("bp/figma-props", frameName, node.name, node.id, key + " is not a property of this component");
      continue;
    }
    const got = entry && typeof entry === "object" ? entry.value : entry;
    if (String(got) !== String(value))
      add("bp/figma-props", frameName, node.name, node.id, key + " is " + JSON.stringify(got) + ", the plan says " + JSON.stringify(value), { id: node.id, props: { [key]: value } });
  }
  // A paint override inside an instance only matters when the paint is a colour somebody wrote
  // down. Swapping a component — an icon's glyph — records an override on the layer it brings with
  // it, and that layer's paint is still bound to a variable, so it is left alone.
  for (const over of node.overrides || []) {
    const fields = (over.overriddenFields || []).filter((field) => field === "fills" || field === "strokes");
    if (fields.length === 0) continue;
    const painted = await figma.getNodeByIdAsync(over.id);
    if (!painted) continue;
    for (const field of fields) {
      const paints = painted[field];
      if (!Array.isArray(paints) || paints.length === 0) continue;
      if (boundPaint(paints)) continue;
      add("bp/figma-bound", frameName, painted.name, painted.id, field + " on " + painted.name + " are a colour, not a variable");
    }
  }
  for (const layer of want.layers || []) {
    const found = down(node, layer.path, layer.hint);
    if (!found) {
      add("bp/figma-props", frameName, node.name, node.id, "no layer at " + layer.path.join(" > "));
      continue;
    }
    const nestedHave = found.componentProperties || {};
    // A swap holds a component id. What it is meant to be is a component name, so the id is read
    // back and the component behind it named, which is how a glyph is checked.
    for (const [key, want_] of Object.entries(layer.swaps || {})) {
      const entry = nestedHave[key];
      const id = entry && typeof entry === "object" ? entry.value : entry;
      let name = null;
      if (id) {
        const swapped = await figma.getNodeByIdAsync(String(id));
        name = swapped ? (swapped.parent && swapped.parent.type === "COMPONENT_SET" ? swapped.parent.name : swapped.name) : null;
      }
      if (!name || want_.indexOf(name) < 0)
        add("bp/figma-props", frameName, found.name, found.id, key + " on " + layer.path.join(" > ") + " holds " + JSON.stringify(name) + ", the plan says " + JSON.stringify(want_));
    }
    for (const [key, value] of Object.entries(layer.props || {})) {
      const entry = nestedHave[key];
      const got = entry && typeof entry === "object" ? entry.value : entry;
      if (entry === undefined || String(got) !== String(value))
        add(
          "bp/figma-props",
          frameName,
          found.name,
          found.id,
          key + " on " + layer.path.join(" > ") + " is " + JSON.stringify(got === undefined ? null : got) + ", the plan says " + JSON.stringify(value),
          entry === undefined ? null : { id: found.id, props: { [key]: value } },
        );
    }
  }
  // The line between one child and the next, read in the file. The contract says every child but
  // the last shown one carries it, so which children are showing decides it — and that is what a
  // render gets wrong when it turns a card on and leaves the lines as the artboard drew them.
  if (want.divider) {
    const showing = [];
    for (const name of want.divider.cards) {
      const card = node.findAll((n) => n.name === name)[0];
      if (card && card.visible) showing.push(card);
    }
    for (const [i, card] of showing.entries()) {
      const entry = (card.componentProperties || {})[want.divider.key];
      if (entry === undefined) {
        add("bp/figma-dividers", frameName, card.name, card.id, want.divider.key + " is not a property of this card");
        continue;
      }
      const has = String(entry && typeof entry === "object" ? entry.value : entry) === "true";
      const wants = i < showing.length - 1;
      if (has !== wants)
        add(
          "bp/figma-dividers",
          frameName,
          card.name,
          card.id,
          card.name + " is " + (wants ? "not the last of " : "the last of ") + showing.length + " showing and its line is " + (has ? "on" : "off"),
          { id: card.id, props: { [want.divider.key]: wants } },
        );
    }
  }
  for (const nested of want.nested || []) {
    if (nested.kind === "layout") {
      const slotChild = node.findAll((n) => n.name === nested.name)[0];
      if (!slotChild) add("bp/figma-instance", frameName, node.name, node.id, "no " + nested.name + " frame inside the instance");
      else await checkNode(slotChild, nested, frameName);
      continue;
    }
    // A swapped instance keeps the name of the layer it was put in — a Scoreboard in a Section's
    // content slot is called "content" — so it is found by the component behind it as well.
    const isOne = (n) => {
      if (n.type !== "INSTANCE") return false;
      if (n.name === nested.component) return true;
      const main = n.mainComponent;
      if (!main) return false;
      if (main.name === nested.component) return true;
      return Boolean(main.parent && main.parent.type === "COMPONENT_SET" && main.parent.name === nested.component);
    };
    const found = node.findAll(isOne)[0];
    if (!found) add("bp/figma-instance", frameName, node.name, node.id, "no " + nested.component + " instance inside it");
    else await checkInstance(found, nested, frameName);
  }
};

const checkLayout = async (node, want, frameName) => {
  if (node.type !== "FRAME" || !LAYOUT.test(node.name)) {
    add("bp/figma-instance", frameName, node.name, node.id, "expected the layout frame " + want.name);
    return;
  }
  if (want.gap && !bound(node, "itemSpacing")) add("bp/figma-bound", frameName, node.name, node.id, "the gap is not bound to a variable");
  if (want.padding) for (const side of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) if (!bound(node, side)) add("bp/figma-bound", frameName, node.name, node.id, side + " is not bound to a variable");
  if (want.radius) for (const corner of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) if (!bound(node, corner)) add("bp/figma-bound", frameName, node.name, node.id, corner + " is not bound to a variable");
  if (want.fill && !boundPaint(node.fills)) add("bp/figma-bound", frameName, node.name, node.id, "the fill is not bound to a variable");
  if (!want.fill && Array.isArray(node.fills) && node.fills.length > 0 && !boundPaint(node.fills)) add("bp/figma-bound", frameName, node.name, node.id, "the frame has a fill the plan did not ask for");
  if (Array.isArray(node.strokes) && node.strokes.length > 0 && !boundPaint(node.strokes)) add("bp/figma-bound", frameName, node.name, node.id, "the stroke is not bound to a variable");

  for (const child of node.children) {
    if (child.type === "FRAME" && LAYOUT.test(child.name)) continue;
    if (child.type === "INSTANCE") continue;
    add("bp/figma-instance", frameName, child.name, child.id, "a " + child.type + " that is neither a library instance nor a layout/ frame");
  }
  for (const [i, child] of (want.children || []).entries()) {
    const have = node.children[i];
    if (!have) {
      add("bp/figma-instance", frameName, node.name, node.id, "child " + (i + 1) + " is missing: " + (child.kind === "layout" ? child.name : child.component));
      continue;
    }
    await checkNode(have, child, frameName);
  }
};

async function checkNode(node, want, frameName) {
  if (want.kind === "layout") await checkLayout(node, want, frameName);
  else await checkInstance(node, want, frameName);
}

// A screen's frames sit in a section named after the spec, so the frame is looked for there first.
const holder = page.children.find((c) => c.type === "SECTION" && c.name === EXPECT.screen) || page;
// The one read-back an attempt gets: the ids the report links to come back with the findings, so a
// clean audit needs no second call to find out what was drawn where.
const drawn = [];
for (const want of EXPECT.frames) {
  const frame = holder.children.find((c) => c.name === want.name) || page.findAll((c) => c.name === want.name && c.type === "FRAME")[0];
  if (!frame) {
    add("bp/figma-instance", want.name, want.name, null, "the frame is not on the page");
    drawn.push({ frame: want.name, id: null });
    continue;
  }
  drawn.push({ frame: want.name, id: frame.id });
  const modes = frame.explicitVariableModes || {};
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  for (const [name, mode] of Object.entries(want.modes || {})) {
    const collection = collections.find((c) => c.name === name);
    if (!collection) {
      add("bp/figma-modes", want.name, frame.name, frame.id, "there is no collection named " + name);
      continue;
    }
    const id = modes[collection.id];
    const have = id ? (collection.modes.find((m) => m.modeId === id) || {}).name : null;
    if (have !== mode) add("bp/figma-modes", want.name, frame.name, frame.id, name + " is " + (have === null ? "inherited" : have) + ", the plan says " + mode);
  }

  for (const [i, child] of want.tree.entries()) {
    const have = frame.children[i];
    if (!have) {
      add("bp/figma-instance", want.name, frame.name, frame.id, "the frame is empty where the plan puts " + (child.kind === "layout" ? child.name : child.component));
      continue;
    }
    await checkNode(have, child, want.name);
  }

  const inside = frame.findAll(() => true);
  for (const node of inside) {
    let parent = node.parent;
    let sheltered = false;
    while (parent && parent.id !== frame.id) {
      if (parent.type === "INSTANCE") { sheltered = true; break; }
      parent = parent.parent;
    }
    if (sheltered) continue;
    if (node.type === "INSTANCE" || (node.type === "FRAME" && LAYOUT.test(node.name)) || node.type === "SLOT") continue;
    add("bp/figma-instance", want.name, node.name, node.id, "a " + node.type + " outside every instance and every layout/ frame");
  }

  for (const child of frame.children) {
    const box = child.absoluteBoundingBox;
    const own = frame.absoluteBoundingBox;
    if (!box || !own) continue;
    if (box.y + box.height > own.y + own.height + 1 || box.x + box.width > own.x + own.width + 1)
      add("bp/figma-overflow", want.name, child.name, child.id, "it sticks out of the frame");
  }

  // A slot holds the screen and nothing else. An artboard ships its slots full of example content,
  // and a render that only appends leaves that content showing above or below the screen.
  const slots = frame.findAllWithCriteria({ types: ["SLOT"] });
  for (const slot of slots) {
    const planned = slotNames(want, slot.name);
    if (planned === null) continue;
    for (const child of slot.children) {
      if (planned.includes(child.name)) continue;
      const words = firstWords(child);
      add("bp/figma-example-content", want.name, child.name, child.id, "the " + slot.name + " slot still holds " + (words ? JSON.stringify(words) : "a " + child.type) + ", which the spec never asked for");
    }
    for (const name of planned) {
      if (!slot.children.some((child) => child.name === name)) add("bp/figma-example-content", want.name, slot.name, slot.id, "the slot does not hold " + name);
    }
  }

  // Every word showing in the frame, against the words the spec wrote. A slot's own children are
  // only where the artboard's example content is easiest to see: a trend inside a card, a badge, a
  // chip's label, a table's total and a pagination line are all inside instances the render keeps,
  // and a render that sets only what the spec names leaves every one of them reading as the
  // screen's own figure.
  const mine = new Set(want.words || []);
  const said = new Set();
  const spare = [];
  for (const text of frame.findAllWithCriteria({ types: ["TEXT"] })) {
    if (!text.visible || !text.characters) continue;
    let up = text.parent;
    let hidden = false;
    while (up && up.id !== frame.id) {
      if (up.visible === false) { hidden = true; break; }
      up = up.parent;
    }
    if (hidden) continue;
    if (glyphy(text)) continue;
    const words = String(text.characters).trim();
    if (!words || !/[A-Za-z0-9]/.test(words)) continue;
    if (mine.has(words)) continue;
    if (said.has(words)) continue;
    said.add(words);
    spare.push(text);
  }
  for (const text of spare.slice(0, 12))
    add("bp/figma-example-content", want.name, text.name, text.id, JSON.stringify(String(text.characters).slice(0, 40)) + " is showing and the spec never wrote it");
  if (spare.length > 12)
    add("bp/figma-example-content", want.name, frame.name, frame.id, spare.length - 12 + " more words are showing that the spec never wrote");

  // The screen starts where its title starts. A wrapper that carries an inset of its own pushes the
  // content in from the page header it belongs to, which no other rule can see.
  //
  // Both edges are read for what they are. The title is the title layer — the first text in the
  // page header is the breadcrumb trail, which starts somewhere else — and the content is the first
  // visible child of the page slot, not whatever child happens to be first.
  if (want.align) {
    const header = frame.findAll((n) => n.type === "INSTANCE" && n.name === "PageHeader")[0];
    const texts = header ? header.findAll((n) => n.type === "TEXT" && n.visible && n.characters) : [];
    const layer = want.align.layer ? String(want.align.layer).toLowerCase() : null;
    const titled = want.align.title ? String(want.align.title).trim() : null;
    const title =
      (titled ? texts.find((t) => String(t.characters).trim() === titled) : null) ||
      (layer ? texts.find((t) => String(t.name).toLowerCase() === layer) : null) ||
      texts.find((t) => String(t.name).toLowerCase().indexOf("title") >= 0) ||
      null;
    const stack = slots.map((slot) => (slot.children || []).find((child) => child.visible !== false && child.absoluteBoundingBox)).find(Boolean);
    const titleAt = title && title.absoluteBoundingBox ? title.absoluteBoundingBox.x : null;
    const contentAt = stack && stack.absoluteBoundingBox ? stack.absoluteBoundingBox.x : null;
    if (titleAt === null) {
      add("bp/figma-align", want.name, header ? header.name : frame.name, header ? header.id : frame.id, "there is no page header title layer to line the screen up with");
    } else if (contentAt === null) {
      add("bp/figma-align", want.name, frame.name, frame.id, "there is no visible content in the page slot to line up with the title");
    } else if (Math.abs(titleAt - contentAt) > 1) {
      add("bp/figma-align", want.name, stack.name, stack.id, "the screen starts at " + Math.round(contentAt) + " and its title at " + Math.round(titleAt) + ", " + Math.round(Math.abs(contentAt - titleAt)) + "px apart");
    }
  }
}

const answer = { page: page.id, section: holder.type === "SECTION" ? holder.id : null, frames: drawn, ms: Date.now() - started };
return out.length === 0 ? { ok: true, ...answer } : { ok: false, findings: out, ...answer };
`;

/**
 * The audit as one use_figma script.
 * @param {object} plan What planRender gave back.
 * @param {{ page?: string, frames?: string[] }} [options]
 * @returns {string}
 */
export function auditScript(plan, options = {}) {
  const expect = expectations(plan, options);
  return `// Audit for ${plan.name}. Read-only; returns JSON, failures only.\nconst EXPECT = ${JSON.stringify(expect)};\n${BODY}`;
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/**
 * The audit body as a function of `(figma, EXPECT)`.
 *
 * It is the same text the script sends, so a test runs the rules themselves rather than a copy of
 * them: give it a fake Plugin API over a fake tree and it answers exactly as Figma would.
 * @returns {(figma: object, expect: object) => Promise<object>}
 */
export function auditFunction() {
  return new AsyncFunction("figma", "EXPECT", BODY);
}

/**
 * Run the audit here, against a fake Figma.
 * @param {object} plan What planRender gave back.
 * @param {{ figma: object, page?: string, frames?: string[] }} options
 */
export async function runAudit(plan, { figma, ...options } = {}) {
  return auditFunction()(figma, expectations(plan, options));
}
