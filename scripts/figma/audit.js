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
 *   bp/figma-align      the screen starts at the page header title's own left edge
 *   bp/figma-example-content
 *                       a slot holds the screen and nothing else: none of the example content the
 *                       artboard ships with is still showing
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
    frames: wanted.map((frame) => ({
      name: frame.name,
      modes: frame.modes,
      align: Boolean(frame.align),
      tree: frame.fallback
        ? [frame.parts.header, frame.parts.nav, frame.parts.content].filter(Boolean).map(expectNode)
        : [expectNode(frame.root)],
    })),
  };
}

const BODY = `
const out = [];
const add = (rule, frame, node, id, what) => out.push({ rule, frame, node, id, what });

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
    if (String(got) !== String(value)) add("bp/figma-props", frameName, node.name, node.id, key + " is " + JSON.stringify(got) + ", the plan says " + JSON.stringify(value));
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
        add("bp/figma-props", frameName, found.name, found.id, key + " on " + layer.path.join(" > ") + " is " + JSON.stringify(got === undefined ? null : got) + ", the plan says " + JSON.stringify(value));
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
for (const want of EXPECT.frames) {
  const frame = holder.children.find((c) => c.name === want.name) || page.findAll((c) => c.name === want.name && c.type === "FRAME")[0];
  if (!frame) {
    add("bp/figma-instance", want.name, want.name, null, "the frame is not on the page");
    continue;
  }
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

  // The screen starts where its title starts. A wrapper that carries an inset of its own pushes the
  // content in from the page header it belongs to, which no other rule can see.
  if (want.align) {
    const header = frame.findAll((n) => n.type === "INSTANCE" && n.name === "PageHeader")[0];
    const title = header ? header.findAll((n) => n.type === "TEXT" && n.visible && n.characters)[0] : null;
    const stack = slots.map((slot) => slot.children[0]).find(Boolean);
    const titleAt = title && title.absoluteBoundingBox ? title.absoluteBoundingBox.x : null;
    const contentAt = stack && stack.absoluteBoundingBox ? stack.absoluteBoundingBox.x : null;
    if (titleAt === null || contentAt === null) {
      add("bp/figma-align", want.name, frame.name, frame.id, "there is no page header title or no content to line it up with");
    } else if (Math.abs(titleAt - contentAt) > 1) {
      add("bp/figma-align", want.name, stack.name, stack.id, "the screen starts at " + Math.round(contentAt) + " and its title at " + Math.round(titleAt) + ", " + Math.round(Math.abs(contentAt - titleAt)) + "px apart");
    }
  }
}

return out.length === 0 ? { ok: true } : { ok: false, findings: out };
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
