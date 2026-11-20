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
 *   bp/figma-props      componentProperties and texts are what the plan said
 *   bp/figma-modes      each frame sets its own explicit mode for every collection the plan named
 *   bp/figma-overflow   nothing sticks out of the frame it was put in
 */

/** The rules the audit can report, in the order a report lists them. */
export const RULES = [
  "bp/figma-instance",
  "bp/figma-detached",
  "bp/figma-bound",
  "bp/figma-props",
  "bp/figma-modes",
  "bp/figma-overflow",
];

/** The one kit component name per plan node, and the props and texts the plan set on it. */
function expectInstance(node) {
  const children = [];
  for (const item of Object.values(node.items ?? {})) {
    for (const row of item.rows) {
      if (row.layer && (Object.keys(row.props).length > 0 || Object.keys(row.texts).length > 0))
        children.push({ layer: row.layer, props: { ...row.props, ...row.texts } });
    }
  }
  const props = { ...node.props, ...node.texts };
  for (const item of Object.values(node.items ?? {})) {
    for (const row of item.rows) {
      if (row.show) props[row.show] = true;
      Object.assign(props, row.texts);
    }
  }
  const nested = [];
  for (const child of Object.values(node.swaps ?? {})) nested.push(expectInstance(child));
  for (const list of Object.values(node.slots ?? {})) for (const child of list) nested.push(expectNode(child));
  return { kind: "instance", component: node.component, props, children, nested };
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
export function expectations(plan, { page = "Screens", frames = null } = {}) {
  const wanted = frames ? plan.frames.filter((frame) => frames.includes(frame.name) || frames.includes(frame.state) || frames.includes(frame.theme)) : plan.frames;
  return {
    page,
    screen: plan.name,
    frames: wanted.map((frame) => ({
      name: frame.name,
      modes: frame.modes,
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
const bound = (node, field) => Boolean((node.boundVariables || {})[field]);
const boundPaint = (list) => Array.isArray(list) && list.length > 0 && list.every((p) => p.boundVariables && p.boundVariables.color);

const page = figma.root.children.find((p) => p.name === EXPECT.page);
if (!page) return { ok: false, findings: [{ rule: "bp/figma-instance", frame: EXPECT.page, node: EXPECT.page, id: null, what: "there is no page by that name" }] };
await page.loadAsync();

const checkInstance = (node, want, frameName) => {
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
  for (const field of ["fills", "strokes"]) {
    const overridden = (node.overrides || []).some((o) => (o.overriddenFields || []).includes(field));
    if (overridden) add("bp/figma-bound", frameName, node.name, node.id, field + " are overridden on an instance");
  }
  for (const child of want.children || []) {
    const found = node.findAll((n) => n.name === child.layer)[0];
    if (!found) {
      add("bp/figma-props", frameName, node.name, node.id, "no layer named " + child.layer);
      continue;
    }
    const nestedHave = found.componentProperties || {};
    for (const [key, value] of Object.entries(child.props || {})) {
      const entry = nestedHave[key];
      const got = entry && typeof entry === "object" ? entry.value : entry;
      if (entry === undefined || String(got) !== String(value))
        add("bp/figma-props", frameName, found.name, found.id, key + " on " + child.layer + " is " + JSON.stringify(got === undefined ? null : got) + ", the plan says " + JSON.stringify(value));
    }
  }
  for (const nested of want.nested || []) {
    if (nested.kind === "layout") {
      const slotChild = node.findAll((n) => n.name === nested.name)[0];
      if (!slotChild) add("bp/figma-instance", frameName, node.name, node.id, "no " + nested.name + " frame inside the instance");
      else checkNode(slotChild, nested, frameName);
      continue;
    }
    const found = node.findAll((n) => n.type === "INSTANCE" && n.name === nested.component)[0];
    if (!found) add("bp/figma-instance", frameName, node.name, node.id, "no " + nested.component + " instance inside it");
    else checkInstance(found, nested, frameName);
  }
};

const checkLayout = (node, want, frameName) => {
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
    checkNode(have, child, frameName);
  }
};

function checkNode(node, want, frameName) {
  if (want.kind === "layout") checkLayout(node, want, frameName);
  else checkInstance(node, want, frameName);
}

for (const want of EXPECT.frames) {
  const frame = page.children.find((c) => c.name === want.name);
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
    checkNode(have, child, want.name);
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
