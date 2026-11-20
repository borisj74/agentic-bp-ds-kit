/**
 * The plan as one use_figma script.
 *
 * Node never talks to Figma. This writes the JavaScript that does, and the agent sends it in a single
 * use_figma call per render — one call, whatever the screen holds, so a render costs one round trip.
 *
 * The script has three parts:
 *
 *   1. `$fig`, a small helper over the Plugin API. It is the only place the script touches `figma.*`,
 *      and the only place that creates a node at all: the page, the section a screen's frames sit in,
 *      the state × theme frame and the `layout/<region>` frames. Nothing else is ever created — no
 *      rectangle, no text, no shape. Every visible leaf comes from a library instance.
 *   2. `PLAN`, the plan as a literal. The plan is data, so it goes in as data: a per-node pile of
 *      statements would say the same thing several times over and spend the script's size budget on
 *      repetition.
 *   3. `render`, which walks PLAN and calls `$fig` and nothing else.
 *
 * Everything bound is bound by variable name: a gap, a padding, a radius and a fill on a layout frame
 * each name a Dimension or Semantic variable, and `$fig.getVar` looks it up in the file. No number and
 * no colour is ever written down. Each frame sets its own explicit mode for Ref, Scheme, Semantic,
 * Dimension and Density, so a frame never inherits a mode from the page.
 *
 * Fonts are loaded before anything is said. Figma refuses to set a text property while the font behind
 * that text is unloaded, so every instance has the fonts of its own text nodes loaded first, cached by
 * family and style across the whole render.
 *
 * Re-rendering keeps ids. A screen's frames live in a section named after the spec; a section and a
 * frame already by that name are reused, and a frame's children are replaced rather than the frame, so
 * links, comments and anything pointing at that frame survive.
 *
 * If a page slot refuses children at run time — a slot the API will not append to — the frame is drawn
 * the other way instead: an AppHeader and an AppNav instance beside a layout/content frame. The plan
 * carries both shapes for exactly that.
 *
 *   emitScript(plan, options) — { code, size, frames, warnings }
 */
import { repoRoot } from "../review/catalog.mjs";
import { planFile, PAGE_AFTER, TARGET_PAGE } from "./plan.mjs";

/** What one use_figma call may carry. A script over this is split by state or by theme. */
export const MAX_SCRIPT = 50_000;

export { TARGET_PAGE, PAGE_AFTER };

/** Where the first frame sits inside its section, and how far apart frames are laid out in a row. */
export const GRID = { x: 0, y: 0, gap: 160 };

const PRELUDE = `
// ---- $fig: the only place this script touches the Plugin API ----
const $fig = (() => {
  let vars = null;
  let collections = null;
  const components = new Map();
  const fonts = new Set();

  const loadVars = async () => {
    if (!vars) {
      const all = await figma.variables.getLocalVariablesAsync();
      vars = new Map(all.map((v) => [v.name, v]));
    }
    return vars;
  };
  const loadCollections = async () => {
    if (!collections) {
      const all = await figma.variables.getLocalVariableCollectionsAsync();
      collections = new Map(all.map((c) => [c.name, c]));
    }
    return collections;
  };

  const getVar = async (name) => {
    const found = (await loadVars()).get(name);
    if (!found) throw new Error("no variable named " + name);
    return found;
  };

  const setModes = async (node, modes) => {
    const all = await loadCollections();
    for (const [collection, mode] of Object.entries(modes || {})) {
      const found = all.get(collection);
      if (!found) throw new Error("no variable collection named " + collection);
      const id = (found.modes.find((m) => m.name === mode) || {}).modeId;
      if (!id) throw new Error(collection + " has no mode named " + mode);
      node.setExplicitVariableModeForCollection(found, id);
    }
  };

  // Figma will not set a text property while the font behind that text is unloaded, so every font a
  // node's text uses is loaded first. Each family and style is loaded once for the whole render.
  const loadFonts = async (node) => {
    const wanted = [];
    const texts = node.type === "TEXT" ? [node] : (node.findAll ? node.findAll((n) => n.type === "TEXT") : []);
    for (const text of texts) {
      let names = [];
      if (text.fontName === figma.mixed) {
        try {
          names = text.getRangeAllFontNames(0, text.characters.length);
        } catch (error) {
          names = [];
        }
      } else if (text.fontName) {
        names = [text.fontName];
      }
      for (const name of names) {
        const id = name.family + "|" + name.style;
        if (fonts.has(id)) continue;
        fonts.add(id);
        wanted.push(name);
      }
    }
    for (const name of wanted) {
      try {
        await figma.loadFontAsync(name);
      } catch (error) {
        // a font the file cannot load is reported by the audit as the text it could not set
      }
    }
  };

  const bindFill = async (node, name) => {
    const variable = await getVar(name);
    const paint = figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1 }, "color", variable);
    node.fills = [paint];
  };

  // The page the renderer writes to, made after the page the plan names when it is not there yet.
  const page = async (name, after) => {
    const found = figma.root.children.find((p) => p.name === name);
    if (found) {
      await found.loadAsync();
      return found;
    }
    const made = figma.createPage();
    made.name = name;
    const at = figma.root.children.findIndex((p) => p.name === after);
    if (at >= 0) figma.root.insertChild(at + 1, made);
    return made;
  };

  // One section per screen, so a spec's frames stay together and keep their ids across renders.
  const section = (parent, name) => {
    const found = parent.children.find((c) => c.type === "SECTION" && c.name === name);
    if (found) return found;
    const made = figma.createSection();
    made.name = name;
    parent.appendChild(made);
    return made;
  };

  // A section is a box, not a layout: it has to be told how big the frames inside it are.
  const fit = (node, padding) => {
    const boxes = node.children.filter((c) => c.width > 0 && c.height > 0);
    if (boxes.length === 0) return;
    const right = Math.max(...boxes.map((c) => c.x + c.width));
    const bottom = Math.max(...boxes.map((c) => c.y + c.height));
    node.resizeWithoutConstraints(right + padding, bottom + padding);
  };

  // A frame already named this keeps its id: its children go and it is filled again.
  const frame = async (parent, spec) => {
    let node = parent.children.find((c) => c.name === spec.name && c.type === "FRAME");
    if (node) for (const child of [...node.children]) child.remove();
    else {
      node = figma.createFrame();
      node.name = spec.name;
      parent.appendChild(node);
      node.x = spec.x;
      node.y = spec.y;
    }
    node.resize(spec.width, spec.height);
    node.layoutMode = "VERTICAL";
    node.primaryAxisSizingMode = "FIXED";
    node.counterAxisSizingMode = "FIXED";
    node.clipsContent = true;
    await setModes(node, spec.modes);
    return node;
  };

  const clear = (node) => {
    for (const child of [...node.children]) child.remove();
  };

  // An append a slot refuses is the one failure the render has a second shape for, so it is marked
  // as such. Every other failure — a font, an import, a missing component — is left as it is.
  const put = (parent, node) => {
    try {
      parent.appendChild(node);
    } catch (error) {
      const why = error && error.message ? error.message : String(error);
      if (parent.type === "SLOT") throw Object.assign(new Error("the page slot refused children: " + why), { slotRefused: true });
      throw error;
    }
  };

  const layout = async (parent, spec) => {
    const node = figma.createAutoLayout(spec.direction === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL");
    node.name = spec.name;
    put(parent, node);
    try {
      node.layoutSizingHorizontal = "FILL";
      node.layoutSizingVertical = "HUG";
    } catch (error) {
      // a parent that is not an auto layout leaves the frame at its own size
    }
    if (spec.gap) node.setBoundVariable("itemSpacing", await getVar(spec.gap));
    if (spec.padding) {
      const variable = await getVar(spec.padding);
      for (const side of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) node.setBoundVariable(side, variable);
    }
    if (spec.radius) {
      const variable = await getVar(spec.radius);
      for (const corner of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) node.setBoundVariable(corner, variable);
    }
    if (spec.fill) await bindFill(node, spec.fill);
    else node.fills = [];
    return node;
  };

  // The component, from this file by node id, or from a library by key.
  const component = async (spec) => {
    const cacheKey = spec.nodeId || spec.key;
    if (components.has(cacheKey)) return components.get(cacheKey);
    let node = null;
    if (spec.nodeId) {
      try {
        node = await figma.getNodeByIdAsync(spec.nodeId);
      } catch (error) {
        node = null;
      }
    }
    if (!node && spec.key) {
      node = spec.keyKind === "componentKey"
        ? await figma.importComponentByKeyAsync(spec.key)
        : await figma.importComponentSetByKeyAsync(spec.key);
    }
    if (!node) throw new Error("no component for " + spec.component);
    const target = node.type === "COMPONENT_SET" ? node.defaultVariant : node;
    if (!target || target.type !== "COMPONENT") throw new Error(spec.component + " is a " + node.type + ", not a component");
    components.set(cacheKey, target);
    return target;
  };

  const apply = async (node, props) => {
    const given = Object.entries(props || {});
    if (given.length === 0) return;
    const definitions = node.componentProperties || {};
    const take = {};
    for (const [key, value] of given) if (key in definitions) take[key] = value;
    if (Object.keys(take).length === 0) return;
    await loadFonts(node);
    node.setProperties(take);
  };

  // A layer down a path: "Column 2" then "Row 3". A step that names no layer falls back to the nth
  // instance of a component by that name, which is how an exposed action button is reached.
  const nested = (node, path, hint) => {
    let at = node;
    for (const step of path || []) {
      const nth = /^@(\\d+)$/.exec(step);
      const next = nth
        ? (at.children || [])[Number(nth[1]) - 1] || null
        : at.findAll((n) => n.name === step)[0] ||
          at.findAll((n) => n.type === "INSTANCE" && n.mainComponent && n.mainComponent.name === step)[0] ||
          null;
      if (!next) {
        if (!hint) return null;
        const all = at.findAll((n) => n.type === "INSTANCE" && (n.name === hint.component || (n.mainComponent && n.mainComponent.name === hint.component)));
        return all[(hint.index || 1) - 1] || null;
      }
      at = next;
    }
    return at;
  };

  const instance = async (parent, spec) => {
    const node = (await component(spec)).createInstance();
    node.name = spec.component;
    put(parent, node);
    if (parent.layoutMode) {
      try {
        node.layoutSizingHorizontal = "FILL";
      } catch (error) {
        // a component that cannot fill its row keeps its own width
      }
    }
    await apply(node, Object.assign({}, spec.props, spec.texts));
    return node;
  };

  const slot = (node, key) => {
    const slots = node.findAllWithCriteria({ types: ["SLOT"] });
    const named = key.split("#")[0];
    return slots.find((n) => n.name === named) || slots.find((n) => n.name.toLowerCase() === named.toLowerCase()) || slots[0] || null;
  };

  return { page, section, fit, frame, clear, layout, instance, slot, nested, apply, getVar, setModes, component, loadFonts };
})();
`;

const DRIVER = `
// ---- render: walks PLAN and calls $fig only ----
const made = [];
// A layer the plan names and the file does not have. It is reported rather than passed over: what
// the plan said would be drawn there is not drawn at all.
const missing = [];
let frameNow = null;
const want = async (node, path, hint, what) => {
  const target = $fig.nested(node, path, hint);
  if (!target) missing.push({ frame: frameNow, node: node.name, path: path, set: Object.keys(what || {}) });
  return target;
};

const fillRow = async (node, row) => {
  if (row.show) await $fig.apply(node, { [row.show]: true });
  const own = Object.assign({}, row.props, row.texts);
  if (Object.keys(own).length > 0) {
    const target = (row.path && row.path.length > 0) ? await want(node, row.path, null, own) : node;
    if (target) await $fig.apply(target, own);
  }
  for (const cell of row.cells || []) {
    const own2 = Object.assign({}, cell.props, cell.texts);
    const target = await want(node, cell.path, null, own2);
    if (target) await $fig.apply(target, own2);
  }
};

const fillInstance = async (node, spec) => {
  for (const row of spec.rows || []) await fillRow(node, row);
  for (const part of spec.parts || []) {
    const own = Object.assign({}, part.props, part.texts);
    const target = await want(node, part.path, { component: part.component, index: part.index }, own);
    if (target) await $fig.apply(target, own);
  }
  for (const [key, swap] of Object.entries(spec.swaps || {})) {
    const target = await $fig.component(swap);
    await $fig.apply(node, { [key]: target.id });
    const inner = node.findAll((n) => n.type === "INSTANCE" && n.mainComponent && n.mainComponent.id === target.id)[0];
    if (inner) {
      await $fig.apply(inner, Object.assign({}, swap.props, swap.texts));
      await fillInstance(inner, swap);
    }
  }
  for (const [key, children] of Object.entries(spec.slots || {})) {
    const target = $fig.slot(node, key);
    if (!target) throw new Error(node.name + " has no slot for " + key);
    // A slot comes with the artboard's own example content in it. The screen goes in its place, not
    // under it, so what is already there is taken out first.
    $fig.clear(target);
    for (const child of children) await place(target, child);
  }
};

const place = async (parent, spec) => {
  if (spec.kind === "layout") {
    const node = await $fig.layout(parent, spec);
    for (const child of spec.children) await place(node, child);
    return node;
  }
  const node = await $fig.instance(parent, spec);
  await fillInstance(node, spec);
  return node;
};

// The header, the nav and the content beside each other: the shape a frame takes when the AppShell
// has no page slot, or when the slot it has refuses children.
const beside = async (board, parts) => {
  if (parts.header) await place(board, parts.header);
  if (parts.nav) await place(board, parts.nav);
  await place(board, parts.content);
};

const page = await $fig.page(PLAN.page, PLAN.after);
const section = $fig.section(page, PLAN.screen);
for (const frame of PLAN.frames) {
  const tree = PLAN.trees[frame.tree];
  frameNow = frame.name;
  const board = await $fig.frame(section, frame);
  if (frame.fallback) {
    await beside(board, tree.parts);
  } else {
    try {
      await place(board, tree.root);
    } catch (error) {
      // Only a slot that refuses children: a font, an import or a missing component is a real
      // failure and is thrown on, because drawing the frame another way would not mend it.
      if (!error || !error.slotRefused) throw error;
      $fig.clear(board);
      await beside(board, tree.parts);
      made.push({ frame: frame.name, id: board.id, fellBack: error.message });
      continue;
    }
  }
  made.push({ frame: frame.name, id: board.id });
}
$fig.fit(section, PLAN.padding);
return missing.length === 0
  ? { page: page.id, section: section.id, frames: made }
  : { page: page.id, section: section.id, frames: made, missing: missing };
`;

/**
 * Only what the script reads.
 *
 * The plan carries more than the render needs — what a part is called, how many rows the artboard
 * draws, which switch belongs to which slot — because the report and the audit read those. The
 * script does not, and a use_figma call has a size budget, so everything else is left out and every
 * empty list and empty object with it.
 */
function thin(node) {
  if (node.kind === "layout") {
    const out = { kind: "layout", name: node.name, direction: node.direction, children: node.children.map(thin) };
    for (const field of ["gap", "padding", "radius", "fill"]) if (node[field]) out[field] = node[field];
    return out;
  }
  const out = { component: node.component, nodeId: node.nodeId, key: node.key, keyKind: node.keyKind };
  if (Object.keys(node.props ?? {}).length > 0) out.props = node.props;
  if (Object.keys(node.texts ?? {}).length > 0) out.texts = node.texts;
  for (const [key, child] of Object.entries(node.swaps ?? {})) (out.swaps ??= {})[key] = thin(child);
  for (const [key, list] of Object.entries(node.slots ?? {})) (out.slots ??= {})[key] = list.map(thin);
  for (const item of Object.values(node.items ?? {})) {
    for (const row of item.rows) {
      const kept = {};
      if (row.show) kept.show = row.show;
      if (row.path?.length > 0 && (Object.keys(row.props).length > 0 || Object.keys(row.texts).length > 0)) kept.path = row.path;
      if (Object.keys(row.props ?? {}).length > 0) kept.props = row.props;
      if (Object.keys(row.texts ?? {}).length > 0) kept.texts = row.texts;
      const cells = (row.cells ?? []).map((cell) => {
        const one = { path: cell.path, texts: cell.texts };
        if (Object.keys(cell.props ?? {}).length > 0) one.props = cell.props;
        return one;
      });
      if (cells.length > 0) kept.cells = cells;
      if (Object.keys(kept).length > 0) (out.rows ??= []).push(kept);
    }
  }
  for (const part of node.parts ?? []) {
    (out.parts ??= []).push({ path: part.path, component: part.component, index: part.index, props: part.props, texts: part.texts });
  }
  return out;
}

/** The frame box and its modes; the tree it holds is named rather than written out again. */
function frameData(frame, at, tree) {
  return {
    name: frame.name,
    width: frame.width,
    height: frame.height,
    x: at.x,
    y: at.y,
    modes: frame.modes,
    fallback: frame.fallback,
    tree,
  };
}

/**
 * One plan as one use_figma script.
 * @param {object} plan What planRender gave back.
 * @param {{ page?: string, frames?: string[], max?: number }} [options]
 * @returns {{ code: string, size: number, frames: string[], warnings: object[] }}
 */
export function emitScript(plan, { page = TARGET_PAGE, frames = null, max = MAX_SCRIPT } = {}) {
  if (!plan?.ok) throw new Error("The plan does not hold, so there is nothing to send to Figma.");
  const wanted = frames ? plan.frames.filter((frame) => frames.includes(frame.name) || frames.includes(frame.state) || frames.includes(frame.theme)) : plan.frames;
  if (wanted.length === 0) throw new Error("No frame in the plan matches what was asked for.");

  // Two frames of the same state hold the same tree: only the modes tell them apart. So a state's
  // tree is written once and the frames name it, which is most of what a render costs.
  const trees = {};
  for (const frame of wanted) {
    if (trees[frame.state]) continue;
    trees[frame.state] = {
      root: frame.fallback ? null : thin(frame.root),
      parts: { header: frame.parts.header ? thin(frame.parts.header) : null, nav: frame.parts.nav ? thin(frame.parts.nav) : null, content: thin(frame.parts.content) },
    };
  }
  const laid = wanted.map((frame, i) => frameData(frame, { x: GRID.x + i * (frame.width + GRID.gap), y: GRID.y }, frame.state));
  const data = { page, after: PAGE_AFTER, screen: plan.name, padding: GRID.gap, trees, frames: laid };
  const code = `// Generated by scripts/figma/emit.mjs for ${plan.name}. Do not edit by hand.\n${PRELUDE}\nconst PLAN = ${JSON.stringify(data)};\n${DRIVER}`;

  const warnings = [];
  if (code.length > max)
    throw new Error(
      `The script is ${code.length} characters and one use_figma call takes ${max}. Render fewer frames at a time: pass --frames with one state or one theme.`,
    );
  if (code.length > max * 0.8) warnings.push({ rule: "figma/script-size", what: `The script is ${code.length} characters, close to the ${max} a call takes.` });

  return { code, size: code.length, frames: laid.map((frame) => frame.name), warnings };
}

// ---- the command line ----------------------------------------------------------------------------

/** `npm run figma:emit -- <spec.json> [--frames ready] [--brand cobalt] [--out file.js]` */
async function main(argv) {
  const { parseArgs } = await import("node:util");
  const { writeFileSync } = await import("node:fs");
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      brand: { type: "string" },
      themes: { type: "string" },
      frames: { type: "string" },
      page: { type: "string" },
      out: { type: "string" },
    },
  });
  if (positionals.length !== 1) {
    console.error("\n  npm run figma:emit -- <spec.json> [--frames ready|Light|<frame name>] [--brand cobalt] [--out file.js]\n");
    process.exit(1);
  }

  let plan;
  try {
    plan = planFile(positionals[0], {
      root: repoRoot,
      brand: values.brand,
      themes: values.themes ? values.themes.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    });
  } catch (error) {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
  if (!plan.ok) {
    console.error("\n  The plan does not hold. Nothing was emitted.");
    for (const error of plan.errors) console.error(`    ${error.path}  ${error.message}`);
    console.error("");
    process.exit(1);
  }

  let script;
  try {
    script = emitScript(plan, {
      page: values.page ?? TARGET_PAGE,
      frames: values.frames ? values.frames.split(",").map((f) => f.trim()).filter(Boolean) : null,
    });
  } catch (error) {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  if (values.out) {
    writeFileSync(values.out, script.code);
    console.error(`\n  ${script.size} characters, ${script.frames.length} frame(s) → ${values.out}\n`);
  } else {
    process.stdout.write(script.code);
  }
}

const { pathToFileURL } = await import("node:url");
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
