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
 * page slot; inside that sit `layout/<region>` frames, one per region the pattern has, in the order
 * the pattern draws them, each holding the region's component instances.
 *
 * What the plan may say about a layout frame is deliberately narrow: a gap, a padding, a radius and
 * a fill — each named as a Figma variable, never as a number or a colour. A layout frame is the only
 * node in the plan that is not a library instance.
 *
 * What a pattern is, here. The kit's patterns are drawn in Figma as artboards, not as containers:
 * their map entries carry variants (state, columns, loading) and no slot properties, so a pattern
 * instance has nowhere to put a screen's content. So the plan takes the pattern for what it can
 * give — which regions it has and the order it draws them in — and lays those regions out as frames.
 *
 * Nothing is left at a Figma default. Every `show…` toggle a component has is set: on for the parts
 * the spec asks for, off for the rest. A list shorter than the rows the artboard draws turns the
 * rows it does not fill off, one by one.
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

/** The page the renderer writes to, and the page it is created after when it is not there yet. */
export const TARGET_PAGE = "Spec renders";
export const PAGE_AFTER = "Patterns";

/**
 * A layer path, as the map records it.
 *
 * The map's `slots.<name>.child` and `partLayers.<name>` hold the path to the layer a row or a part
 * sets, read in the Figma file rather than guessed: names split on `>`, and in a name
 *
 *   @N        the Nth child of the layer before it, counting from 1 — the Nth column frame
 *   $column   the column's own layer name, from `slots.columns.layers`
 *   N         the column number
 *   R         the row number
 *
 * So the Table's `columns > @N > Row R` is the Rth row of the Nth column frame, and the DataGrid's
 * `grid > Row R > $column` is that column's own cell inside row R.
 *
 * @param {string | null} shape The path as the map records it.
 * @param {{ n?: number | null, r?: number | null, layers?: string[] | null }} [where] The column
 *   number, the row number, and the column layer names the map read in the file.
 * @returns {string[]} One step per layer, `@2` where a step is the second child.
 */
export function layerPath(shape, { n = null, r = null, layers = null } = {}) {
  if (typeof shape !== "string" || shape.trim() === "") return [];
  return shape
    .split(">")
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => {
      if (/^@N$/.test(step)) return n === null ? step : `@${n}`;
      if (step === "$column") return n !== null && layers?.[n - 1] ? layers[n - 1] : step;
      let out = step;
      if (n !== null) out = out.replace(/\bN\b/g, String(n));
      if (r !== null) out = out.replace(/\bR\b/g, String(r));
      return out;
    });
}

/** Whether a path can tell one row from another: without that, it names the same layer every time. */
export const pathNumbers = (shape) => /@N|\$column|\bN\b|\bR\b/.test(String(shape ?? ""));

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

// ---- the order a pattern draws its regions in ----------------------------------------------------

/**
 * The regions of a pattern, top to bottom.
 *
 * `regionsOf` answers with the regions a pattern has, sorted by name, which is the order a reader of
 * the contract meets them and not the order the screen draws them. A screen drawn in that order
 * would put its table over its toolbar. So the order is read off the pattern itself: where each
 * region prop first appears in what the component returns. `children` is the content region, and
 * `above` is always first, since it sits over the pattern.
 *
 * A region the source never names keeps its place from `regionsOf`, after the ones that were found.
 */
export function regionOrderOf(pattern, root = repoRoot) {
  const all = regionsOf(pattern);
  const named = all.filter((region) => region !== ABOVE_REGION);
  const contractFile = join(root, pattern.contract ?? "");
  let source = null;
  try {
    const contract = JSON.parse(readFileSync(contractFile, "utf8"));
    const file = join(root, contract.path ?? "");
    const text = readFileSync(file, "utf8");
    // Only what the component returns: a region named in a hook call above it says nothing about
    // where the screen draws it.
    const at = text.indexOf("return (");
    // Comments are prose: a note about the tabs over the header must not put the tabs first.
    source = (at >= 0 ? text.slice(at) : text).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  } catch {
    return all;
  }

  const seen = new Map();
  for (const region of named) {
    const prop = region === CONTENT_REGION ? "children" : region;
    // The prop where it is drawn, or — for a pattern that draws a region through a local of its own,
    // as ListDetail draws `list` as `listSide` — the class name of the box it is drawn in.
    const hit = new RegExp(`[{&?|\\s(]${prop}\\b|styles\\.${prop}\\b`).exec(source);
    if (hit) seen.set(region, hit.index);
  }
  const found = [...seen.entries()].sort((a, b) => a[1] - b[1]).map(([region]) => region);
  // A region the source never names keeps the order the contract declares it in, which is at least
  // the order somebody wrote it down in, rather than its place in the alphabet.
  const declared = Object.keys(pattern.props ?? {});
  const rest = named
    .filter((region) => !seen.has(region))
    .sort((a, b) => declared.indexOf(a === CONTENT_REGION ? "children" : a) - declared.indexOf(b === CONTENT_REGION ? "children" : b));
  return [ABOVE_REGION, ...found, ...rest];
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

/** Every `show…` boolean a component has, whether the map lists it as a prop or as Figma's own. */
export function everyToggle(entry) {
  const keys = new Set();
  for (const prop of Object.values(entry.props ?? {})) {
    if (prop?.kind === "boolean" && typeof prop.figma === "string" && /^show[A-Z]/.test(prop.figma) && !prop.inverted) keys.add(prop.figma);
  }
  for (const slot of Object.values(entry.slots ?? {})) for (const key of slot.show ?? []) keys.add(key);
  for (const key of Object.keys(entry.figmaOnly ?? {})) if (/^show[A-Z]/.test(key)) keys.add(key);
  return [...keys];
}

/** The bare name a `show…` key is about: showSelectedCount → selectedcount. */
const toggleStem = (key) => key.replace(/^show/, "").split("#")[0].replace(/\d+$/, "").toLowerCase();

/** What a prop name could be called on an artboard: onRefresh is refresh, columns is column. */
const propAliases = (name) => {
  const bare = String(name);
  const noOn = /^on[A-Z]/.test(bare) ? bare.slice(2) : bare;
  const out = new Set([bare.toLowerCase(), noOn.toLowerCase()]);
  for (const one of [...out]) {
    if (one.endsWith("s")) out.add(one.slice(0, -1));
    else out.add(`${one}s`);
  }
  return [...out];
};

/**
 * The toggles that have to go on because the spec asked for the part, by name rather than by a
 * property the map carries: a Callout's `showTitle` for its title, a Toolbar's `showSearch` for its
 * search placeholder, `showRefresh` for its onRefresh.
 */
export function toggleAsked(key, asked) {
  const stem = toggleStem(key);
  if (!stem) return false;
  for (const name of asked) {
    for (const alias of propAliases(name)) {
      if (alias === stem) return true;
      if (alias.length > stem.length && alias.startsWith(stem)) return true;
      if (stem.length > alias.length && stem.startsWith(alias)) return true;
    }
  }
  return false;
};

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
 * A column as the Figma column reads it: its `key` is how a record finds its cell and draws nothing,
 * and `numeric` is an alignment both the header cell and the cells carry.
 */
const gridColumn = (column) => {
  if (column === null || typeof column !== "object") return column;
  const rest = { ...column };
  delete rest.key;
  delete rest.numeric;
  return column.numeric ? { ...rest, alignment: "end" } : rest;
};

/** A variant value as Figma holds it: a string, and booleans as "true" / "false". */
const variantValue = (value) => (typeof value === "boolean" ? String(value) : String(value));

/** The layer a numbered toggle stands for: showAction1 is "Action 1", showActions is "Actions". */
const toggleLayer = (key) => {
  const bare = key.replace(/^show/, "").split("#")[0];
  const hit = /^([A-Za-z]+?)(\d+)$/.exec(bare);
  const name = hit ? hit[1] : bare;
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return hit ? `${label} ${hit[2]}` : label;
};

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
  // A page slot the map does not have is the one case the plan has a second shape for: the frame then
  // draws the header and the nav as their own instances beside a layout/content frame, which is a
  // frame and can hold the screen. The render carries both shapes, because a slot can also refuse
  // children at run time, and the script falls back there rather than giving up.
  const fallback = pageSlot === null;
  for (const name of ["AppHeader", "AppNav"]) {
    if (!entryFor(name) && fallback) fail(name, `AppShell has no page slot and the map has no ${name} entry either.`);
  }

  // One strong brand Button on a screen, in Figma as everywhere else. The spec check counts them too;
  // this is the render's own guard, because an action the artboard draws comes in here as well.
  let primaries = 0;
  const keepOnePrimary = (node, props, at) => {
    if (node.component !== "Button") return props;
    if (props.emphasis !== "strong" || props.intent !== "brand") return props;
    primaries += 1;
    if (primaries === 1) return props;
    drop(at, "the screen already has its one strong brand Button, so this one is drawn subtle neutral.");
    return { ...props, emphasis: "subtle", intent: "neutral" };
  };

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
      parts: [],
      hidden: [],
    };
    const mapped = entry.props ?? {};
    const slots = entry.slots ?? {};
    // Every prop and slot the spec names on this node: what the artboard has to show.
    const asked = [...Object.keys(node.props ?? {}), ...Object.keys(node.slots ?? {})];
    if (node.text !== undefined) asked.push("children", "label", "text");

    /** A child contract's props, mapped onto one Figma layer. */
    const childValues = (childEntry, item, at, { skip = null, as = null } = {}) => {
      const texts = {};
      const props = {};
      if (as && itemWords(item) !== null) texts[as] = itemWords(item);
      if (item === null || typeof item !== "object") return { props, texts };
      for (const [field, value] of Object.entries(item)) {
        if (field === skip) continue;
        const childProp = childEntry?.props?.[field];
        if (!childProp || !childProp.figma) {
          drop(`${at}.${field}`, `${childEntry?.contract ?? "the row"} has no Figma property for "${field}".`);
          continue;
        }
        if (childProp.kind === "text") texts[childProp.figma] = String(value);
        else if (childProp.kind === "boolean") props[childProp.figma] = childProp.inverted ? !value : Boolean(value);
        else if (childProp.kind === "variant") {
          const allowed = childProp.values ?? [];
          if (allowed.length > 0 && !allowed.includes(variantValue(value)))
            fail(`${at}.${field}`, `${childEntry.contract} ${field} cannot be ${JSON.stringify(value)} in Figma.`, `It draws: ${allowed.join(", ")}.`);
          else props[childProp.figma] = variantValue(value);
        } else drop(`${at}.${field}`, `${childEntry.contract} ${field} is a ${childProp.kind} property; the plan does not set those on a row.`);
      }
      return { props, texts };
    };

    /**
     * A list the Figma component draws as numbered parts.
     *
     * The map says how many parts the artboard draws (`max`) and which boolean turns each extra one
     * on (`show`), so the first `max - show.length` are always there and the rest are switched. The
     * ones the spec does not fill are switched off, which is the whole point: a Figma default must
     * never show through a render.
     */
    const planList = (name, value, at) => {
      const slot = slots[name];
      const max = Number(slot.max ?? 0);
      if (max > 0 && value.length > max) {
        fail(
          at,
          `${node.component} draws at most ${max} ${name}; the spec has ${value.length}.`,
          `Cut the list to ${max}, or draw the extra rows as their own component.`,
        );
        return;
      }
      const family = textFamily(entry, name);
      const show = slot.show ?? [];
      const baseline = Math.max(1, max - show.length);
      const childEntry = slot.childProps ? entryFor(slot.childProps) : null;
      const childShape = typeof slot.child === "string" ? slot.child : null;
      const rows = [];
      value.forEach((item, i) => {
        const n = i + 1;
        const row = { index: n, show: n > baseline ? (show[n - baseline - 1] ?? null) : null, texts: {}, props: {}, path: [] };
        const words = itemWords(item);
        if (family?.[n] && words !== null) row.texts[family[n]] = words;
        else if (words !== null && !childShape) drop(`${at}[${i}]`, `${node.component} draws ${name} ${n} as example copy; "${words}" is not a Figma property.`);
        if (childShape) {
          row.path = layerPath(childShape, { n, r: n, layers: slot.layers ?? null });
          if (value.length > 1 && !pathNumbers(childShape))
            drop(`${at}[${i}]`, `the map's path for ${name} ("${childShape}") names one layer, so row ${n} cannot be told from the others.`);
          const { props, texts } = childValues(childEntry, item, `${at}[${i}]`, { skip: family?.[n] ? wordsField(item) : null });
          Object.assign(row.props, props);
          Object.assign(row.texts, texts);
        } else if (item !== null && typeof item === "object") {
          for (const field of Object.keys(item)) {
            if (family?.[n] && field === wordsField(item)) continue;
            drop(`${at}[${i}].${field}`, `${node.component} exposes no child layer for ${name}, so "${field}" cannot be set.`);
          }
        }
        rows.push(row);
      });
      // Every switched part is said out loud: on for the ones the list fills, off for the rest. A
      // part left unsaid would come back as whatever the artboard happens to draw.
      const shown = show.slice(0, Math.max(0, value.length - baseline));
      const hidden = show.slice(Math.max(0, value.length - baseline));
      for (const key of shown) out.props[key] = true;
      for (const key of hidden) out.props[key] = false;
      out.items[name] = { figmaSlot: name, child: childShape, childProps: slot.childProps ?? null, max, baseline, rows, hidden };
    };

    /**
     * A table, which Figma draws as columns rather than as rows: a column frame per column, with its
     * header cell and one row cell per record inside it. So a cell is addressed down the column —
     * `Column 2 > Row 3` — and the column's own name is its header cell's label.
     */
    const planGrid = (columns, rows, at) => {
      const columnSlot = slots.columns;
      const rowSlot = slots.rows;
      const columnMax = Number(columnSlot.max ?? 0);
      const rowMax = Number(rowSlot.max ?? 0);
      if (columnMax > 0 && columns.length > columnMax) {
        fail(`${at}.props.columns`, `${node.component} draws at most ${columnMax} columns; the spec has ${columns.length}.`, `Cut the list to ${columnMax}, or draw the extra columns as their own component.`);
        return;
      }
      if (rowMax > 0 && rows.length > rowMax) {
        fail(`${at}.props.rows`, `${node.component} draws at most ${rowMax} rows; the spec has ${rows.length}.`, `Cut the list to ${rowMax}, or draw the extra rows as their own component.`);
        return;
      }
      const columnShape = typeof columnSlot.child === "string" ? columnSlot.child : null;
      const rowShape = typeof rowSlot.child === "string" ? rowSlot.child : null;
      const layers = columnSlot.layers ?? null;
      if (!columnShape || !rowShape) {
        fail(
          `${at}.props.columns`,
          `The map does not say where ${node.component} draws its columns and its cells.`,
          "Read the component in Figma and record slots.columns.child and slots.rows.child in contracts/figma-map.json.",
        );
        return;
      }
      const headerEntry = columnSlot.childProps ? entryFor(columnSlot.childProps) : null;
      const cellEntry = rowSlot.childProps ? entryFor(rowSlot.childProps) : null;
      const headerText = headerEntry?.props?.label?.figma ?? null;
      const cellText = cellEntry?.props?.label?.figma ?? null;

      const columnShow = columnSlot.show ?? [];
      const rowShow = rowSlot.show ?? [];
      const columnBaseline = Math.max(1, columnMax - columnShow.length);
      const rowBaseline = Math.max(1, rowMax - rowShow.length);

      const headers = columns.map((column, c) => {
        const n = c + 1;
        const at_ = `${at}.props.columns[${c}]`;
        // The header cell sits inside its own column frame, under the column's name.
        const header = {
          index: n,
          show: n > columnBaseline ? (columnShow[n - columnBaseline - 1] ?? null) : null,
          path: layerPath(columnShape, { n, layers }),
          props: {},
          texts: {},
        };
        const { props, texts } = childValues(headerEntry, gridColumn(column), at_, { skip: "header" });
        Object.assign(header.props, props);
        Object.assign(header.texts, texts);
        if (headerText && typeof column?.header === "string") header.texts[headerText] = column.header;
        else if (typeof column?.header === "string") drop(at_, `${columnSlot.childProps ?? "the column"} has no Figma label for "${column.header}".`);
        return header;
      });

      // A record is one row of cells, each addressed down its own column: Column 2 > Row 3.
      const records = rows.map((record, r) => {
        const row = r + 1;
        const cells = [];
        columns.forEach((column, c) => {
          const key = column?.key;
          const value = key === undefined ? undefined : record?.[key];
          if (value === undefined || typeof value === "object") return;
          const alignment = column?.numeric ? cellEntry?.props?.alignment : null;
          if (!cellText) {
            drop(`${at}.props.rows[${r}].${key}`, `${rowSlot.childProps ?? "the cell"} has no Figma label, so "${value}" cannot be set.`);
            return;
          }
          cells.push({
            column: c + 1,
            path: layerPath(rowShape, { n: c + 1, r: row, layers }),
            props: alignment?.figma ? { [alignment.figma]: "end" } : {},
            texts: { [cellText]: String(value) },
          });
        });
        return { index: row, show: row > rowBaseline ? (rowShow[row - rowBaseline - 1] ?? null) : null, cells, props: {}, texts: {}, path: [] };
      });

      for (const field of new Set(rows.flatMap((record) => Object.keys(record ?? {})))) {
        if (field === "id" || columns.some((column) => column?.key === field)) continue;
        drop(`${at}.props.rows.${field}`, `no column has the key "${field}", so Figma draws nothing for it.`);
      }

      const shownColumns = columnShow.slice(0, Math.max(0, columns.length - columnBaseline));
      const shownRows = rowShow.slice(0, Math.max(0, rows.length - rowBaseline));
      const hiddenColumns = columnShow.slice(Math.max(0, columns.length - columnBaseline));
      const hiddenRows = rowShow.slice(Math.max(0, rows.length - rowBaseline));
      for (const key of [...shownColumns, ...shownRows]) out.props[key] = true;
      for (const key of [...hiddenColumns, ...hiddenRows]) out.props[key] = false;
      out.items.columns = { figmaSlot: "columns", child: columnShape, childProps: columnSlot.childProps ?? null, max: columnMax, baseline: columnBaseline, rows: headers, hidden: hiddenColumns };
      out.items.rows = { figmaSlot: "rows", child: rowShape, childProps: rowSlot.childProps ?? null, max: rowMax, baseline: rowBaseline, rows: records, hidden: hiddenRows };
    };

    // A table is read as a grid, so its columns and its rows are planned together rather than one
    // list at a time: a cell's address needs both.
    const gridly =
      slots.columns && slots.rows && Array.isArray(node.props?.columns) && Array.isArray(node.props?.rows) && slots.rows.childProps === "Cell";
    if (gridly) planGrid(node.props.columns, node.props.rows, path);

    for (const [name, raw] of Object.entries(node.props ?? {})) {
      const at = `${path}.props.${name}`;
      if (gridly && (name === "columns" || name === "rows")) continue;
      const value = resolveCopy(raw, copy);
      const prop = mapped[name];

      if (Array.isArray(value) && slots[name]) {
        planList(name, value, at);
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

    /**
     * The contract's own defaults, for every prop the spec leaves out.
     *
     * A prop nobody set is not a prop Figma gets to decide. The contract says what the component is
     * without it — a Button is subtle neutral, an Input is md — so that is written down, and the
     * artboard's own variant never stands in for it. A default the Figma component set does not draw
     * is reported rather than forced.
     */
    const contract = piece(node.component, root);
    for (const [name, prop] of Object.entries(contract?.props ?? {})) {
      if (prop.default === undefined) continue;
      if (node.props && name in node.props) continue;
      if (node.slots && name in node.slots) continue;
      const mapping = mapped[name];
      if (!mapping?.figma) continue;
      const at = `${path}.props.${name}`;
      if (mapping.kind === "variant") {
        const allowed = mapping.values ?? [];
        const value = variantValue(prop.default);
        if (allowed.length === 0 || allowed.includes(value)) out.props[mapping.figma] = value;
        else drop(at, `the contract's default ${name}=${JSON.stringify(prop.default)} is not one Figma draws (${allowed.join(", ")}).`);
        continue;
      }
      if (mapping.kind === "boolean") {
        out.props[mapping.figma] = mapping.inverted ? !prop.default : Boolean(prop.default);
        continue;
      }
      if (mapping.kind === "text" && (typeof prop.default === "string" || typeof prop.default === "number"))
        out.texts[mapping.figma] = String(prop.default);
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
      // An artboard part: Figma draws the thing already and a boolean turns it on. The spec's own
      // component cannot go in, but what it says and how it looks can be set on the instance Figma
      // exposes inside, so the part reads as the screen's own action rather than as example copy.
      const toggles = showToggles(entry, name, prop);
      if (toggles.length > 0) {
        const wanted = Math.min(toggles.length, list.length);
        for (const toggle of toggles.slice(0, wanted)) out.props[toggle] = true;
        const shape = entry.partLayers?.[name] ?? null;
        for (const [i, child] of list.slice(0, wanted).entries()) {
          const toggle = toggles[i];
          // The path the map read in the file. Without one, the part is reached by the name the
          // toggle stands for, and the script falls back to the nth instance of that component.
          const path = shape ? layerPath(shape, { n: i + 1, r: i + 1 }) : [toggles.length === 1 ? `${child.component} ${i + 1}` : toggleLayer(toggle)];
          if (!shape) drop(`${at}[${i}]`, `the map does not say where ${node.component} draws its ${name}; the render looks for "${path.join(" > ")}".`);
          out.parts.push({
            toggle,
            index: i + 1,
            slot: name,
            component: child.component,
            path,
            props: child.props,
            texts: child.texts,
          });
        }
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

    Object.assign(out, { props: keepOnePrimary(node, out.props, path) });

    // Every switch a slot owns, whether the spec filled that slot or not: a slot says for itself
    // which of its parts are on, so any of its switches left unsaid is off.
    const owned = new Set();
    for (const name of new Set([...Object.keys(slots), ...Object.keys(node.slots ?? {})])) {
      for (const key of showToggles(entry, name, mapped[name])) owned.add(key);
    }

    // Whatever is left: every toggle the component has that nothing above set. A part the spec did
    // not ask for is off, so what Figma happens to draw on its artboard never shows through.
    for (const key of everyToggle(entry)) {
      if (key in out.props) continue;
      const on = owned.has(key) ? false : toggleAsked(key, asked);
      out.props[key] = on;
      if (!on) out.hidden.push(key);
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

  const order = regionOrderOf(pattern, root);
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

  const bare = (name) => {
    const entry = entryFor(name);
    if (!entry) return null;
    return {
      kind: "instance",
      component: name,
      contract: entry.contract,
      key: entry.key ?? null,
      keyKind: entry.keyKind ?? null,
      nodeId: entry.nodeId ?? null,
      props: {},
      texts: {},
      swaps: {},
      slots: {},
      items: {},
      parts: [],
      hidden: [],
    };
  };

  /**
   * The page header the shell itself draws.
   *
   * A pattern that fills its own header region draws the screen's one h1; every other screen gets
   * the shell's, with the page title in it, exactly as the web frame does. The shell's own crumbs
   * are the artboard's example trail, and the renderer cannot yet write a screen's own, so the
   * breadcrumb is switched off rather than left saying something that is not true.
   */
  const shellHeader = () => {
    const ownsHeader = (given.header ?? []).length > 0;
    const shape = shell.frameLayers?.pageHeader ?? null;
    const header = entryFor("PageHeader");
    const toggle = Object.keys(shell.figmaOnly ?? {}).find((key) => /^showPageHeader#/i.test(key)) ?? null;
    if (ownsHeader || !shape || !header) return { toggle, on: false, part: null };
    const title = header.props?.title?.figma ?? null;
    // The shell's header is the page title and nothing else: the spec gives it no actions, no icon
    // and no badge, and its crumbs are the artboard's example trail rather than this screen's. So
    // every part of it is switched off and only the title is written.
    const props = {};
    for (const key of everyToggle(header)) props[key] = false;
    return {
      toggle,
      on: true,
      part: { path: layerPath(shape), component: "PageHeader", index: 1, props, texts: title ? { [title]: spec.title } : {} },
    };
  };

  const frames = [];
  for (const state of states) {
    const inside =
      state === "empty"
        ? filled.filter((region) => region === ABOVE_REGION || region === "header" || region === "empty")
        : filled.filter((region) => region !== "empty");
    const children = inside.map((region) => planned.get(region));
    // Two shapes for the same column, because what is around it differs.
    //
    // In the shell's page slot the page is already a padded box: its own frame carries the content
    // inset and the gap under the page header, so a second inset here would push the screen in from
    // the title it belongs to. That is `.layout-stack` in the kit — the same gap, no padding of its
    // own and no surface of its own.
    //
    // Without a page slot the frame has no padded box at all, so the column is the page itself and
    // carries the inset and the background: `.layout-content`.
    const stack = {
      kind: "layout",
      name: "layout/stack",
      region: CONTENT_REGION,
      direction: "VERTICAL",
      gap: LAYOUT_TOKENS.gap,
      padding: null,
      radius: null,
      fill: null,
      children,
    };
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
      const root_ = bare("AppShell");
      const loadingProp = shell.props?.loading;
      if (state === "loading" && loadingProp?.kind === "variant") root_.props[loadingProp.figma] = "true";
      if (!fallback) root_.slots[pageSlot] = [stack];

      // The shell's own switches, said out loud like every other component's: the page on, the
      // assistant off, and the page header on only when the pattern does not draw one itself.
      const header = shellHeader();
      root_.hidden = Object.keys(header.part?.props ?? {}).filter((key) => header.part.props[key] === false);
      for (const key of everyToggle(shell)) root_.props[key] = /^showPage#/i.test(key);
      if (header.toggle) root_.props[header.toggle] = header.on;
      if (header.part) root_.parts = [header.part];

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
        slot: pageSlot,
        // The screen's content shares the page header's left edge, so the audit can measure it.
        align: !fallback && header.on,
        root: root_,
        // The second shape, always planned: the header, the nav and the content frame beside them.
        // The script uses it when the map has no page slot, and when a slot refuses children.
        parts: { header: bare("AppHeader"), nav: bare("AppNav"), content },
        content: stack,
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
  console.log(`  Pattern ${plan.pattern}; ${plan.frames[0]?.state ?? "ready"} regions ${plan.frames[0]?.regions.join(", ") || "none"}.`);
  if (plan.fallback) console.log("  AppShell has no page slot in the map: the frame draws AppHeader, AppNav and a layout/content frame.");
  for (const frame of plan.frames) console.log(`    ${frame.name}`);
  for (const item of plan.dropped) console.log(`  not in Figma  ${item.path}: ${item.why}`);
  console.log("");
}

const { pathToFileURL } = await import("node:url");
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
