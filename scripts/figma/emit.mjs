/**
 * The plan as one use_figma script.
 *
 * Node never talks to Figma. This writes the JavaScript that does, and the agent sends it in a single
 * use_figma call per render — one call, whatever the screen holds, so a render costs one round trip.
 *
 * The script has three parts:
 *
 *   1. `$fig`, a small helper over the Plugin API. It is the only place the script touches `figma.*`,
 *      and the only place that creates a node at all: `$fig.frame` makes the state × theme frame and
 *      `$fig.layout` makes a `layout/<region>` frame. Nothing else is ever created — no rectangle, no
 *      text, no shape. Every visible leaf comes from a library instance.
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
 * Re-rendering keeps a frame's id: a frame already named `<screen>/<state>/<theme>` has its children
 * removed and filled again, so links, comments and anything pointing at that frame survive.
 *
 *   emitScript(plan, options) — { code, size, frames, warnings }
 */
import { repoRoot } from "../review/catalog.mjs";
import { planFile } from "./plan.mjs";

/** What one use_figma call may carry. A script over this is split by state or by theme. */
export const MAX_SCRIPT = 50_000;

/** The page the renderer writes to. Everything outside it is left alone. */
export const TARGET_PAGE = "Screens";

/** Where the first frame sits, and how far apart frames are laid out. */
export const GRID = { x: 0, y: 0, gap: 160 };

const PRELUDE = `
// ---- $fig: the only place this script touches the Plugin API ----
const $fig = (() => {
  let vars = null;
  let collections = null;
  const components = new Map();

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

  const bindFill = async (node, name) => {
    const variable = await getVar(name);
    const paint = figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1 }, "color", variable);
    node.fills = [paint];
  };

  const page = async (name) => {
    const found = figma.root.children.find((p) => p.name === name);
    if (found) {
      await found.loadAsync();
      return found;
    }
    const made = figma.createPage();
    made.name = name;
    return made;
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

  const layout = async (parent, spec) => {
    const node = figma.createAutoLayout(spec.direction === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL");
    node.name = spec.name;
    parent.appendChild(node);
    node.layoutSizingHorizontal = "FILL";
    node.layoutSizingVertical = "HUG";
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

  const apply = (node, props) => {
    const given = Object.entries(props || {});
    if (given.length === 0) return;
    const definitions = node.componentProperties || {};
    const take = {};
    for (const [key, value] of given) if (key in definitions) take[key] = value;
    if (Object.keys(take).length > 0) node.setProperties(take);
  };

  const child = (node, layer) => {
    const found = node.findAll((n) => n.name === layer && n.type === "INSTANCE")[0] || node.findAll((n) => n.name === layer)[0];
    if (!found) throw new Error("no layer named " + layer + " in " + node.name);
    return found;
  };

  const instance = async (parent, spec) => {
    const node = (await component(spec)).createInstance();
    node.name = spec.component;
    parent.appendChild(node);
    if (node.layoutSizingHorizontal !== undefined && parent.layoutMode) {
      try {
        node.layoutSizingHorizontal = "FILL";
      } catch (error) {
        // a component that cannot fill its row keeps its own width
      }
    }
    apply(node, Object.assign({}, spec.props, spec.texts));
    return node;
  };

  const slot = (node, key) => {
    const slots = node.findAllWithCriteria({ types: ["SLOT"] });
    const named = key.split("#")[0];
    return slots.find((n) => n.name === named) || slots.find((n) => n.name.toLowerCase() === named.toLowerCase()) || slots[0] || null;
  };

  return { page, frame, layout, instance, slot, child, apply, getVar, setModes, component };
})();
`;

const DRIVER = `
// ---- render: walks PLAN and calls $fig only ----
const made = [];

const fillInstance = async (node, spec) => {
  for (const [name, item] of Object.entries(spec.items || {})) {
    for (const row of item.rows) {
      if (row.show) $fig.apply(node, { [row.show]: true });
      if (Object.keys(row.texts).length > 0) $fig.apply(node, row.texts);
      if (row.layer && (Object.keys(row.props).length > 0 || Object.keys(row.texts).length > 0)) {
        const nested = $fig.child(node, row.layer);
        $fig.apply(nested, Object.assign({}, row.props, row.texts));
      }
    }
  }
  for (const [key, swap] of Object.entries(spec.swaps || {})) {
    const target = await $fig.component(swap);
    $fig.apply(node, { [key]: target.id });
    const nested = node.findAll((n) => n.type === "INSTANCE" && n.mainComponent && n.mainComponent.id === target.id)[0];
    if (nested) {
      $fig.apply(nested, Object.assign({}, swap.props, swap.texts));
      await fillInstance(nested, swap);
    }
  }
  for (const [key, children] of Object.entries(spec.slots || {})) {
    const target = $fig.slot(node, key);
    if (!target) throw new Error(node.name + " has no slot for " + key);
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

const page = await $fig.page(PLAN.page);
for (const frame of PLAN.frames) {
  const board = await $fig.frame(page, frame);
  if (frame.fallback) {
    if (frame.parts.header) await place(board, frame.parts.header);
    if (frame.parts.nav) await place(board, frame.parts.nav);
    await place(board, frame.parts.content);
  } else {
    await place(board, frame.root);
  }
  made.push({ frame: frame.name, id: board.id });
}
return { page: page.id, frames: made };
`;

/** Only what the script needs: the tree, the modes, the frame box. */
function frameData(frame, at) {
  return {
    name: frame.name,
    state: frame.state,
    theme: frame.theme,
    width: frame.width,
    height: frame.height,
    x: at.x,
    y: at.y,
    modes: frame.modes,
    fallback: frame.fallback,
    root: frame.fallback ? null : frame.root,
    parts: frame.fallback ? frame.parts : null,
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

  const laid = wanted.map((frame, i) => frameData(frame, { x: GRID.x + i * (frame.width + GRID.gap), y: GRID.y }));
  const data = { page, screen: plan.name, title: plan.title, pattern: plan.pattern, brand: plan.brand, frames: laid };
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
