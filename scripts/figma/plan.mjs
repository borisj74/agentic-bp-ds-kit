/**
 * The render plan: a validated spec plus contracts/figma-map.json, turned into the exact tree of
 * library instances a Figma page should hold.
 *
 * Nothing here talks to Figma. The plan is pure and deterministic: the same spec and the same map
 * always give the same plan, byte for byte. Figma is reached once, later, by the single use_figma
 * call that scripts/figma/emit.mjs writes from this plan.
 *
 *   planRender(spec, { map, brand, themes, root })  — { ok, frames, errors, dropped, ... }
 *   planFile(specFile, options)                    — read a spec file, validate it, plan it
 *
 * One frame per state × theme. A frame's root is an AppShell instance with the screen inside its
 * page slot; inside that sit `layout/<region>` frames, one per region the pattern has, in contract
 * order, each holding the region's component instances.
 *
 * What the plan may say about a layout frame is deliberately narrow: a gap, a padding, a radius, a
 * fill — each named as a Figma variable, never as a number or a colour. A layout frame is the only
 * node in the plan that is not a library instance.
 *
 * What a pattern is, here. The kit's patterns are drawn in Figma as artboards, not as containers:
 * their map entries carry variants (state, columns, loading) and no slot properties, so a pattern
 * instance has nowhere to put a screen's content. So the plan takes the pattern for what it can
 * give — the list of regions and their order — and lays those regions out as frames. The pattern's
 * own variant for the state is kept on the frame as `patternState` so the report can name it.
 *
 * What a state means to the plan:
 *   ready, error   every region the spec fills, except `empty`
 *   loading        the same, with the AppShell instance's loading variant set
 *   empty          the frame's own regions (above, header) plus `empty` in place of the content
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { repoRoot, piece } from "../review/catalog.mjs";
import { regionsOf, validateSpec, resolveCopy, ABOVE_REGION, CONTENT_REGION } from "../spec/schema.mjs";

/** Where the map lives, read from the repo and never from Figma. */
export const MAP_FILE = "contracts/figma-map.json";

/** The frame a screen is drawn at: the size the loop photographs the web screen at. */
export const FRAME = { width: 1440, height: 900 };

/** The brand ramp a frame uses unless `--brand` says otherwise. It is the Ref collection's default. */
export const DEFAULT_BRAND = "cobalt";

/** The two schemes every screen is drawn in. */
export const THEMES = ["Light", "Dark"];

/** The one mode each collection that is not a theme is pinned to, so a frame never inherits one. */
export const FIXED_MODES = { Dimension: "Value", Density: "default" };

/** The variables a layout frame may use. Named, never valued: emit resolves each one in Figma. */
export const LAYOUT_TOKENS = {
  /** 24px: the gap between stacked sections, from .layout-content and .layout-stack. */
  gap: "layout/gutter-lg",
  /** 24px: the page's content inset, from .layout-content. */
  padding: "layout/margin-md",
  /** The page's own background. */
  fill: "bg/neutral-min",
};

/** A CSS custom property as a Figma variable name: the first dash becomes a slash. */
export function figmaVarName(cssVar) {
  const bare = String(cssVar).replace(/^--/, "");
  return bare.replace("-", "/");
}

/** Read contracts/figma-map.json. */
export function readMap(root = repoRoot) {
  const file = join(root, MAP_FILE);
  if (!existsSync(file)) throw new Error(`There is no map at ${MAP_FILE}. Run the contracts to Figma map first.`);
  return JSON.parse(readFileSync(file, "utf8"));
}

// ---- the map, read one component at a time -------------------------------------------------------

/** The numbered text family behind a slot: crumb1, crumb2, crumb3, crumb4 → { 1: key, 2: key, ... }. */
export function textFamily(entry, slotName) {
  const base = entry.props?.[slotName];
  if (!base || base.kind !== "text" || !base.figma) return null;
  const stem = /^([A-Za-z][A-Za-z]*?)(\d+)(#.+)$/.exec(base.figma);
  if (!stem) return null;
  const family = {};
  const pattern = new RegExp(`^${stem[1]}(\\d+)#`);
  const keys = [...Object.keys(entry.props ?? {}).map((p) => entry.props[p].figma), ...Object.keys(entry.figmaOnly ?? {})];
  for (const key of keys) {
    if (typeof key !== "string") continue;
    const hit = pattern.exec(key);
    if (hit) family[Number(hit[1])] = key;
  }
  return Object.keys(family).length > 1 ? family : null;
}

/** The first words in an item: what a numbered text family holds for that row. */
const itemWords = (item) => {
  if (typeof item === "string" || typeof item === "number") return String(item);
  for (const field of ["label", "title", "text", "name", "value"]) {
    const value = item?.[field];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return null;
};

/** The field an item's words came from, so it is not mapped a second time. */
const wordsField = (item) => {
  if (item === null || typeof item !== "object") return null;
  for (const field of ["label", "title", "text", "name", "value"]) {
    if (typeof item[field] === "string" || typeof item[field] === "number") return field;
  }
  return null;
};

/**
 * The artboard toggles behind a slot a Figma component draws as example content: the slot's own
 * boolean property (Section actions is showActions), or the numbered show family in figmaOnly
 * (PageHeader actions is showAction1 and showAction2), in the order Figma numbers them.
 */
export function showToggles(entry, slotName, prop) {
  if (prop?.kind === "boolean" && prop.figma) return [prop.figma];
  const stem = slotName.replace(/s$/, "");
  const one = new RegExp(`^show${slotName}#`, "i");
  const many = new RegExp(`^show${stem}(\\d+)#`, "i");
  const numbered = [];
  let single = null;
  for (const key of Object.keys(entry.figmaOnly ?? {})) {
    if (one.test(key)) single = key;
    const hit = many.exec(key);
    if (hit) numbered.push([Number(hit[1]), key]);
  }
  if (numbered.length > 0) return numbered.sort((a, b) => a[0] - b[0]).map(([, key]) => key);
  return single ? [single] : [];
}

/** A variant value as Figma holds it: a string, and booleans as "true" / "false". */
const variantValue = (value) => (typeof value === "boolean" ? String(value) : String(value));

// ---- the plan ------------------------------------------------------------------------------------

/**
 * One spec as a render plan.
 * @param {object} spec A spec that has passed validateSpec, with its copy still as written.
 * @param {{ map?: object, brand?: string, themes?: string[], root?: string }} [options]
 */
export function planRender(spec, { map = null, brand = DEFAULT_BRAND, themes = THEMES, root = repoRoot } = {}) {
  const sheet = map ?? readMap(root);
  const errors = [];
  const dropped = [];
  const fail = (path, message, fix) => errors.push(fix ? { path, message, fix } : { path, message });
  const drop = (path, why) => dropped.push({ path, why });

  const copy = spec.copy ?? {};
  const components = sheet.components ?? {};
  const entryFor = (name) => components[name] ?? null;

  const brands = sheet.themes?.Ref?.modes ?? [];
  if (brands.length > 0 && !brands.includes(brand))
    fail("brand", `The Ref collection has no mode called "${brand}".`, `Its modes: ${brands.join(", ")}.`);
  const schemes = sheet.themes?.Scheme?.modes ?? [];
  for (const theme of themes) {
    if (schemes.length > 0 && !schemes.includes(theme))
      fail("themes", `The Scheme collection has no mode called "${theme}".`, `Its modes: ${schemes.join(", ")}.`);
  }

  const pattern = piece(spec.pattern, root);
  if (!pattern || pattern.kind !== "pattern") {
    fail("pattern", `"${spec.pattern}" is not a pattern in this kit.`);
    return { ok: false, errors, dropped, frames: [], name: spec.name, pattern: spec.pattern, brand, themes };
  }

  const shell = entryFor("AppShell");
  if (!shell) {
    fail("AppShell", "The map has no AppShell entry, so there is no frame to draw the screen in.");
    return { ok: false, errors, dropped, frames: [], name: spec.name, pattern: pattern.name, brand, themes };
  }
  const pageSlot = shell.props?.children?.kind === "slot" ? shell.props.children.figma : null;
  // A page slot that the API cannot take children through is the one case the plan has a second
  // shape for: the frame then draws the header and the nav as their own instances beside a
  // layout/content frame, which is a frame and can hold the screen.
  const fallback = pageSlot === null;
  if (fallback) {
    for (const name of ["AppHeader", "AppNav"]) {
      if (!entryFor(name)) fail(name, `AppShell has no page slot and the map has no ${name} entry either.`);
    }
  }

  /** One component node, with its props, its words and whatever sits inside it. */
  const planNode = (node, path) => {
    const entry = entryFor(node.component);
    if (!entry) {
      fail(`${path}.component`, `The map has no Figma component for ${node.component}.`, "Add it to contracts/figma-map.json, or use a component that is drawn.");
      return null;
    }
    const out = {
      kind: "instance",
      component: node.component,
      contract: entry.contract,
      key: entry.key ?? null,
      keyKind: entry.keyKind ?? null,
      nodeId: entry.nodeId ?? null,
      props: {},
      texts: {},
      swaps: {},
      slots: {},
      items: {},
    };
    const mapped = entry.props ?? {};
    const slots = entry.slots ?? {};

    for (const [name, raw] of Object.entries(node.props ?? {})) {
      const at = `${path}.props.${name}`;
      const value = resolveCopy(raw, copy);
      const prop = mapped[name];

      // A list that the Figma component draws as numbered rows: its own slot entry says how many
      // rows are drawn and which boolean turns each extra one on.
      if (Array.isArray(value) && slots[name]) {
        const slot = slots[name];
        const max = Number(slot.max ?? 0);
        if (max > 0 && value.length > max) {
          fail(
            at,
            `${node.component} draws at most ${max} ${name}; the spec has ${value.length}.`,
            `Cut the list to ${max}, or draw the extra rows as their own component.`,
          );
          continue;
        }
        const family = textFamily(entry, name);
        const show = slot.show ?? [];
        const baseline = Math.max(1, max - show.length);
        const childLayer = typeof slot.child === "string" ? slot.child : null;
        const childEntry = slot.childProps ? entryFor(slot.childProps) : null;
        const rows = [];
        value.forEach((item, i) => {
          const n = i + 1;
          const row = { index: n, show: n > baseline ? (show[n - baseline - 1] ?? null) : null, texts: {}, props: {}, layer: null };
          const words = itemWords(item);
          if (family?.[n] && words !== null) row.texts[family[n]] = words;
          else if (words !== null && !childEntry) drop(`${at}[${i}]`, `${node.component} draws row ${n} as example copy; "${words}" is not a Figma property.`);
          if (childLayer) row.layer = childLayer.replace(/\bN\b/, String(n));
          if (item !== null && typeof item === "object") {
            const skip = family?.[n] ? wordsField(item) : null;
            for (const [field, fieldValue] of Object.entries(item)) {
              if (field === skip) continue;
              const childProp = childEntry?.props?.[field];
              if (!childProp || !childProp.figma) {
                drop(`${at}[${i}].${field}`, `${slot.childProps ?? node.component} has no Figma property for "${field}".`);
                continue;
              }
              if (!row.layer) {
                drop(`${at}[${i}].${field}`, `${node.component} exposes no child layer for ${name}, so "${field}" cannot be set.`);
                continue;
              }
              if (childProp.kind === "text") row.texts[childProp.figma] = String(fieldValue);
              else if (childProp.kind === "boolean") row.props[childProp.figma] = Boolean(fieldValue);
              else if (childProp.kind === "variant") {
                const allowed = childProp.values ?? [];
                if (allowed.length > 0 && !allowed.includes(variantValue(fieldValue)))
                  fail(`${at}[${i}].${field}`, `${slot.childProps} ${field} cannot be ${JSON.stringify(fieldValue)} in Figma.`, `It draws: ${allowed.join(", ")}.`);
                else row.props[childProp.figma] = variantValue(fieldValue);
              } else drop(`${at}[${i}].${field}`, `${slot.childProps} ${field} is a ${childProp.kind} property; the plan does not set those on a row.`);
            }
          }
          rows.push(row);
        });
        out.items[name] = { figmaSlot: name, child: childLayer, childProps: slot.childProps ?? null, max, baseline, rows };
        continue;
      }

      if (!prop || !prop.figma) {
        const why = entry.noFigma?.[name] ?? entry.figmaOnly?.[name] ?? `${node.component} has no Figma property for "${name}".`;
        drop(at, why);
        continue;
      }
      if (prop.kind === "variant") {
        const allowed = prop.values ?? [];
        if (allowed.length === 0 || allowed.includes(variantValue(value))) {
          out.props[prop.figma] = variantValue(value);
          continue;
        }
        // A picker: a variant whose values carry the prop's own name chooses which of several things
        // the component draws, not what it says. Input placeholder is one — `content` picks
        // placeholder, value or file, and the words themselves stay the artboard's example copy.
        if (allowed.includes(name)) {
          out.props[prop.figma] = name;
          drop(at, `${node.component} picks ${prop.figma}="${name}"; the words are the artboard's example copy.`);
          continue;
        }
        fail(at, `${node.component} ${name} cannot be ${JSON.stringify(value)} in Figma.`, `It draws: ${allowed.join(", ")}.`);
        continue;
      }
      if (prop.kind === "boolean") {
        // An inverted boolean reads the other way round in Figma: hideLabel is showLabel off.
        out.props[prop.figma] = prop.inverted ? !value : Boolean(value);
        continue;
      }
      if (prop.kind === "text") {
        if (typeof value === "string" || typeof value === "number") out.texts[prop.figma] = String(value);
        else drop(at, `${name} is drawn as words in Figma and the spec gives ${typeof value}.`);
        continue;
      }
      if (prop.kind === "instanceSwap" || prop.kind === "slot") {
        drop(at, `${name} takes a component in Figma; the spec gives it a value.`);
        continue;
      }
      drop(at, `${name} is a ${prop.kind} property; the plan does not set those.`);
    }

    if (node.text !== undefined) {
      const words = String(resolveCopy(node.text, copy));
      const prop = mapped.children;
      if (prop?.kind === "text" && prop.figma) out.texts[prop.figma] = words;
      else drop(`${path}.text`, `${node.component} draws its own copy in Figma; "${words}" cannot be set.`);
    }

    for (const [name, children] of Object.entries(node.slots ?? {})) {
      const at = `${path}.slots.${name}`;
      const prop = mapped[name];
      const list = (children ?? []).map((child, i) => planNode(child, `${at}[${i}]`)).filter(Boolean);
      if (list.length === 0) continue;
      if (prop?.kind === "slot" && prop.figma) {
        out.slots[prop.figma] = list;
        continue;
      }
      if (prop?.kind === "instanceSwap" && prop.figma) {
        if (list.length > 1) {
          fail(
            at,
            `${node.component} ${name} is one swappable instance in Figma (${prop.figma}); the spec puts ${list.length} components in it.`,
            "Put one component in the slot, or give Figma a component that draws the group.",
          );
          continue;
        }
        out.swaps[prop.figma] = list[0];
        continue;
      }
      // An artboard toggle: in Figma the part is drawn as example content and a boolean turns it on.
      // The spec's own components cannot go in, so the toggles go on and the content is reported.
      const toggles = showToggles(entry, name, prop);
      if (toggles.length > 0) {
        for (const toggle of toggles.slice(0, list.length)) out.props[toggle] = true;
        const shown = Math.min(toggles.length, list.length);
        drop(at, `${node.component} draws ${name} as ${shown === 1 ? "an example part" : `${shown} example parts`}; the spec's ${list.map((child) => child.component).join(", ")} cannot go in.`);
        if (list.length > toggles.length)
          drop(at, `${node.component} draws at most ${toggles.length} ${name}; the spec has ${list.length}.`);
        continue;
      }
      fail(
        at,
        `${node.component} has no Figma slot for ${name}.`,
        prop ? `In Figma ${name} is a ${prop.kind} property, which takes no children.` : `Its Figma properties: ${Object.keys(mapped).join(", ") || "none"}.`,
      );
    }

    return out;
  };

  /** A region as a layout frame: a frame is the only non-instance node the plan allows. */
  const planRegion = (region, nodes, path) => ({
    kind: "layout",
    name: `layout/${region}`,
    region,
    direction: "VERTICAL",
    gap: LAYOUT_TOKENS.gap,
    padding: null,
    radius: null,
    fill: null,
    children: nodes.map((node, i) => planNode(node, `${path}[${i}]`)).filter(Boolean),
  });

  const order = regionsOf(pattern);
  const given = spec.regions ?? {};
  const filled = order.filter((region) => (given[region] ?? []).length > 0);
  const main = spec.state ?? "ready";
  const states = [...new Set([main, ...(spec.states ?? [])])];
  const patternEntry = entryFor(pattern.name);

  // The region plans are built once and shared by every frame: the same spec, the same tree. Only
  // the modes and the AppShell variant change from frame to frame.
  const planned = new Map();
  for (const region of filled) planned.set(region, planRegion(region, given[region], `regions.${region}`));

  const patternStateFor = (state) => {
    const props = patternEntry?.props ?? {};
    if (props.state?.kind === "variant" && (props.state.values ?? []).includes(state)) return { figma: props.state.figma, value: state };
    if (state === "loading" && props.loading?.kind === "variant") return { figma: props.loading.figma, value: "true" };
    return null;
  };

  const frames = [];
  for (const state of states) {
    const inside =
      state === "empty"
        ? filled.filter((region) => region === ABOVE_REGION || region === "header" || region === "empty")
        : filled.filter((region) => region !== "empty");
    const children = inside.map((region) => planned.get(region));
    const content = {
      kind: "layout",
      name: "layout/content",
      region: CONTENT_REGION,
      direction: "VERTICAL",
      gap: LAYOUT_TOKENS.gap,
      padding: LAYOUT_TOKENS.padding,
      radius: null,
      fill: LAYOUT_TOKENS.fill,
      children,
    };

    for (const theme of themes) {
      const root_ = {
        kind: "instance",
        component: "AppShell",
        contract: shell.contract,
        key: shell.key ?? null,
        keyKind: shell.keyKind ?? null,
        nodeId: shell.nodeId ?? null,
        props: {},
        texts: {},
        swaps: {},
        slots: {},
        items: {},
      };
      const loadingProp = shell.props?.loading;
      if (state === "loading" && loadingProp?.kind === "variant") root_.props[loadingProp.figma] = "true";
      if (!fallback) root_.slots[pageSlot] = [content];

      frames.push({
        name: `${spec.name}/${state}/${theme.toLowerCase()}`,
        screen: spec.name,
        title: spec.title,
        state,
        theme,
        brand,
        width: FRAME.width,
        height: FRAME.height,
        modes: { Ref: brand, Scheme: theme, Semantic: theme, ...FIXED_MODES },
        regions: inside,
        patternState: patternStateFor(state),
        fallback,
        root: root_,
        // Only read when `fallback` is true: the header, the nav and the content frame beside them.
        parts: fallback
          ? {
              header: entryFor("AppHeader") ? { kind: "instance", component: "AppHeader", key: entryFor("AppHeader").key, keyKind: entryFor("AppHeader").keyKind, nodeId: entryFor("AppHeader").nodeId, props: {}, texts: {}, swaps: {}, slots: {}, items: {} } : null,
              nav: entryFor("AppNav") ? { kind: "instance", component: "AppNav", key: entryFor("AppNav").key, keyKind: entryFor("AppNav").keyKind, nodeId: entryFor("AppNav").nodeId, props: {}, texts: {}, swaps: {}, slots: {}, items: {} } : null,
              content,
            }
          : null,
        content,
      });
    }
  }

  return {
    ok: errors.length === 0,
    name: spec.name,
    title: spec.title,
    pattern: pattern.name,
    section: spec.section ?? null,
    breadcrumbs: spec.breadcrumbs ?? [],
    fileKey: sheet.fileKey ?? null,
    brand,
    themes: [...themes],
    states,
    regionOrder: order,
    fallback,
    frames,
    errors,
    dropped,
  };
}

/**
 * Read a spec file, check it against the contracts, then plan it.
 * @param {string} specFile
 * @param {{ root?: string, brand?: string, themes?: string[], map?: object }} [options]
 */
export function planFile(specFile, { root = repoRoot, brand = DEFAULT_BRAND, themes = THEMES, map = null } = {}) {
  const full = resolve(root, specFile);
  if (!existsSync(full)) throw new Error(`There is no spec at ${specFile}.`);
  const raw = JSON.parse(readFileSync(full, "utf8"));
  const checked = validateSpec(raw, { root });
  if (!checked.ok)
    return {
      ok: false,
      spec: null,
      frames: [],
      errors: checked.errors.map((error) => ({ ...error, message: `The spec does not check out: ${error.message}` })),
      dropped: [],
      invalid: checked.errors,
    };
  // The spec as the file holds it, so the words and the key order are the author's.
  return { spec: raw, ...planRender(raw, { map, brand, themes, root }) };
}

// ---- the command line ----------------------------------------------------------------------------

/** `npm run figma:plan -- <spec.json> [--brand cobalt] [--themes Light,Dark] [--json]` */
async function main(argv) {
  const { parseArgs } = await import("node:util");
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      brand: { type: "string" },
      themes: { type: "string" },
      json: { type: "boolean", default: false },
    },
  });
  if (positionals.length !== 1) {
    console.error("\n  npm run figma:plan -- <spec.json> [--brand cobalt] [--themes Light,Dark] [--json]\n");
    process.exit(1);
  }

  let plan;
  try {
    plan = planFile(positionals[0], {
      brand: values.brand ?? DEFAULT_BRAND,
      themes: values.themes ? values.themes.split(",").map((t) => t.trim()).filter(Boolean) : THEMES,
    });
  } catch (error) {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  if (values.json) {
    console.log(JSON.stringify(plan, null, 2));
    process.exit(plan.ok ? 0 : 1);
  }

  if (!plan.ok) {
    console.error(`\n  The plan does not hold. Nothing was sent to Figma.`);
    for (const error of plan.errors) {
      console.error(`    ${error.path}  ${error.message}`);
      if (error.fix) console.error(`        fix: ${error.fix}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`\n  ${plan.name}: ${plan.frames.length} frame(s), brand ${plan.brand}, ${plan.themes.join(" + ")}.`);
  console.log(`  Pattern ${plan.pattern}; regions ${plan.frames[0]?.regions.join(", ") || "none"}.`);
  if (plan.fallback) console.log("  AppShell has no page slot in the map: the frame draws AppHeader, AppNav and a layout/content frame.");
  for (const frame of plan.frames) console.log(`    ${frame.name}`);
  for (const item of plan.dropped) console.log(`  not in Figma  ${item.path}: ${item.why}`);
  console.log("");
}

const { pathToFileURL } = await import("node:url");
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
