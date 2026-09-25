#!/usr/bin/env node
// A3 codemod: the BP renames from docs/figma/bp-mapping.json (user rulings 2026-09-25).
//   1. Components: Alert -> Callout, Empty -> EmptyState, Progress -> Meter, ProgressLegacy -> ProgressBar,
//      ButtonFilter -> FilterButton, SegmentedControl -> Segmented, Stepper -> Steps, DropdownMenu -> Dropdown,
//      ShimmerText -> TextLoader, Command -> GlobalSearch, Tile -> NavTile, SideNav -> AppNav.
//      Import paths, imported names, JSX tags, `typeof X` and every exported type (AlertProps -> CalloutProps ...).
//   2. Props and values, inside the JSX tags of the component that owns them (see PROPS below).
//   3. Exported type names that follow a renamed prop (TooltipPlacement -> TooltipPosition ...).
//   4. Keys of the data objects some components take (see KEYS below): Form sections follow Section
//      (open -> expanded ...) and Table columns follow Cell (align -> alignment).
// Run A2 (codemod-a2-rulings.mjs) first if the project is older than A2.
//
// Usage: node scripts/codemod-a3-renames.mjs [paths...]   (default: src tests)
// Rewrites .ts and .tsx files in place and prints the files it changed.
// Safe to run twice: new names never match the old patterns.
// What it can't see: props passed through a spread ({...props}) or built in an object, and values held in
// a variable (size={s}). It prints a hint for each such tag so you can check it by hand. Section and column
// objects are found by their shape (a section has collapsible, a column has key), so check any that lack it.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

export const COMPONENTS = {
  Alert: "Callout",
  Empty: "EmptyState",
  Progress: "Meter",
  ProgressLegacy: "ProgressBar",
  ButtonFilter: "FilterButton",
  SegmentedControl: "Segmented",
  Stepper: "Steps",
  DropdownMenu: "Dropdown",
  ShimmerText: "TextLoader",
  Command: "GlobalSearch",
  Tile: "NavTile",
  SideNav: "AppNav",
};

// Exports of each old module. A name that starts with the old component name takes the new one
// (AlertProps -> CalloutProps); the rest keep their name unless listed in TYPES.
const EXPORTS = {
  Alert: ["AlertIntent", "AlertProps"],
  Empty: ["EmptyIconStyle", "EmptyHeadingLevel", "EmptyProps"],
  Progress: ["ProgressShape", "ProgressSize", "ProgressThresholds", "ProgressIntent", "ProgressProps"],
  ProgressLegacy: ["ProgressLegacyLabelPosition", "ProgressLegacyProps"],
  ButtonFilter: ["ButtonFilterSize", "ButtonFilterToggle", "ButtonFilterProps"],
  SegmentedControl: ["SegmentedControlSize", "SegmentedControlOption", "SegmentedControlProps"],
  Stepper: ["StepperSize", "StepperProps"],
  DropdownMenu: ["DropdownMenuTrigger", "DropdownMenuItem", "DropdownMenuDivider", "DropdownMenuEntry", "DropdownMenuProps", "DropdownMenuWidth"],
  ShimmerText: ["ShimmerTextSize", "ShimmerTextSpeed", "ShimmerTextProps"],
  Command: ["CommandVariant", "CommandIconStyle", "CommandSize", "CommandItem", "CommandGroup", "CommandScope", "CommandProps"],
  Tile: ["TileIntent", "TileProps"],
  SideNav: ["SideNavLink", "SideNavDivider", "SideNavChild", "SideNavItem", "SideNavEntry", "SideNavProps"],
};

// Type names that follow a renamed prop.
export const TYPES = {
  DropdownMenuAlign: "DropdownAlignment",
  ProgressThresholds: "MeterThresholds",
  TooltipPlacement: "TooltipPosition",
  HelpPopoverPlacement: "HelpPopoverPosition",
  HeaderCellAlign: "HeaderCellAlignment",
  CellAlign: "CellAlignment",
  LegendAlign: "LegendAlignment",
  PieChartAlign: "PieChartAlignment",
  PieChartLegend: "PieChartLegendPosition",
  CarouselAlign: "CarouselAlignment",
  DatePickerMode: "DatePickerType",
  ListViewGroupSize: "ListViewSize",
  ChartLegendPlace: "ChartLegendPosition",
  LogoVariant: "LogoType",
  LogoAIVariant: "LogoAIType",
};

// Props per component (new component names). `to` renames the prop; `values` renames string values.
export const PROPS = {
  Modal: { size: { values: { full: "fullscreen" } } },
  ListView: { groupSize: { to: "size" } },
  BarChart: { legend: { to: "legendPosition" }, showTitle: { to: "showHeader" } },
  LineChart: { legend: { to: "legendPosition" }, showTitle: { to: "showHeader" } },
  PieChart: { legend: { to: "legendPosition" }, showTitle: { to: "showHeader" }, align: { to: "alignment" } },
  Legend: { orientation: { values: { row: "horizontal", column: "vertical" } }, align: { to: "alignment" } },
  Meter: { thresholds: { values: { track: "plotArea" } } },
  Tooltip: { placement: { to: "position", values: { top: "above", bottom: "below" } } },
  HelpPopover: { placement: { to: "position", values: { top: "above", bottom: "below" } } },
  Dropdown: { align: { to: "alignment", values: { start: "left", end: "right" } } },
  HeaderCell: { align: { to: "alignment" } },
  Cell: { align: { to: "alignment" } },
  Carousel: { align: { to: "alignment" } },
  Callout: { dismissible: { to: "closeButton" } },
  Section: { open: { to: "expanded" }, defaultOpen: { to: "defaultExpanded" }, onOpenChange: { to: "onExpandedChange" } },
  Accordion: { defaultOpen: { to: "defaultExpanded" } },
  Cascader: { showLegend: { to: "hasLegend" } },
  DatePicker: { mode: { to: "type", values: { range: "dual" } } },
  Logo: { variant: { to: "type" } },
  LogoAI: { variant: { to: "type" } },
};

// Keys of data objects, in files that import one of `from`. An object is renamed only when it has the `when` key.
export const KEYS = [
  { from: ["Form", "FormPage"], when: "collapsible", keys: { open: "expanded", defaultOpen: "defaultExpanded", onOpenChange: "onExpandedChange" } },
  { from: ["Table", "Lookup", "ListPage", "AppShell"], when: "key", keys: { align: "alignment" } },
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const renamed = (name, from, to) => (name.startsWith(from) ? to + name.slice(from.length) : name);

// Finds the end of a JSX opening tag that starts at `i` (the "<"), skipping {...} and quotes.
function tagEnd(text, i) {
  let depth = 0, quote = null;
  for (let j = i + 1; j < text.length; j++) {
    const c = text[j];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return j;
  }
  return -1;
}

// Renames props inside one tag, only at the top level of the tag (not inside {...} values).
function renameProps(tag, rules, warn) {
  let out = "", depth = 0, quote = null, i = 0;
  while (i < tag.length) {
    const c = tag[i];
    if (quote) { out += c; if (c === quote) quote = null; i++; continue; }
    if (depth === 0 && (c === '"' || c === "'")) { quote = c; out += c; i++; continue; }
    if (c === "{") { if (depth === 0 && tag.startsWith("{...", i)) warn("spread"); depth++; out += c; i++; continue; }
    if (c === "}") { depth--; out += c; i++; continue; }
    if (depth === 0 && /\s/.test(c)) {
      const m = /^(\s+)([A-Za-z]\w*)(?=[\s=/>]|$)/.exec(tag.slice(i));
      if (m && rules[m[2]]) {
        const rule = rules[m[2]];
        out += m[1] + (rule.to ?? m[2]);
        i += m[0].length;
        if (rule.values && tag[i] === "=") {
          const v = /^=(\s*)(["'])([^"']*)\2/.exec(tag.slice(i));
          const e = /^=\{\s*(["'])([^"']*)\1\s*\}/.exec(tag.slice(i));
          if (v) { out += `=${v[1]}${v[2]}${rule.values[v[3]] ?? v[3]}${v[2]}`; i += v[0].length; }
          else if (e) { out += `="${rule.values[e[2]] ?? e[2]}"`; i += e[0].length; }
          else warn(`${m[2]} value`);
        }
        continue;
      }
    }
    out += c; i++;
  }
  return out;
}

// Renames the direct keys of object literals that have `when` among them. Skips strings, template text and
// comments; a ' only opens a string where a value can start, so JSX copy like "don't" is read as text.
function renameKeys(text, when, keys) {
  const frames = [], edits = [];
  let keyPos = false, prev = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "/" && text[i + 1] === "/") { i = text.indexOf("\n", i); if (i < 0) break; continue; }
    if (c === "/" && text[i + 1] === "*") { i = text.indexOf("*/", i + 2) + 1; if (i <= 0) break; continue; }
    if (c === '"' || c === "`" || (c === "'" && /[=(,:[{?&|!+]|^$/.test(prev))) {
      for (i++; i < text.length && text[i] !== c; i++) if (text[i] === "\\") i++;
      prev = c; keyPos = false; continue;
    }
    if (/\s/.test(c)) continue;
    if (c === "{") { frames.push({ keys: [] }); keyPos = true; prev = c; continue; }
    if (c === "}") { const f = frames.pop(); if (f && f.keys.some((k) => k.name === when)) edits.push(...f.keys.filter((k) => keys[k.name])); keyPos = false; prev = c; continue; }
    if (c === ",") { keyPos = true; prev = c; continue; }
    const m = keyPos && frames.length ? /^([A-Za-z_$][\w$]*)\s*:/.exec(text.slice(i, i + 64)) : null;
    if (m) frames[frames.length - 1].keys.push({ name: m[1], at: i });
    else if (keyPos && frames.length) { const k = /^([A-Za-z_$][\w$]*)\s*[,}]/.exec(text.slice(i, i + 64)); if (k) frames[frames.length - 1].keys.push({ name: k[1], at: -1 }); }
    keyPos = false;
    if (m) { i += m[0].length - 1; prev = ":"; continue; }
    const w = /^[A-Za-z_$][\w$]*/.exec(text.slice(i, i + 64));
    if (w) { i += w[0].length - 1; prev = "w"; continue; }
    prev = c;
  }
  let out = text;
  for (const e of edits.filter((e) => e.at >= 0).sort((a, b) => b.at - a.at)) out = out.slice(0, e.at) + keys[e.name] + out.slice(e.at + e.name.length);
  return out;
}

const imports = (text, comp) => new RegExp(`["'](?:@/(?:ui|patterns)/|(?:\\.\\./)+(?:ui/|patterns/)?|\\./)${comp}(?:/${comp})?["']`).test(text);

export function transform(text, hints = []) {
  let out = text;
  for (const [from, to] of Object.entries(COMPONENTS)) {
    // Import paths: @/ui/Alert/Alert, ../Alert/Alert, ./Alert.module.css inside the folder.
    const path = new RegExp(`(["'])(@/ui/|(?:\\.\\./)+(?:ui/)?)${from}/${from}(\\.module\\.css)?\\1`, "g");
    const imported = new RegExp(path.source).test(out);
    out = out.replace(path, (_, q, pre, css = "") => `${q}${pre}${to}/${to}${css}${q}`);
    if (!imported) continue;
    for (const name of EXPORTS[from]) out = out.replace(new RegExp(`\\b${name}\\b`, "g"), renamed(name, from, to));
    // The component itself: import specifiers, JSX tags, typeof. Not free text, where the word may be copy.
    out = out
      .replace(/import\s[^;]*?from\s*["'][^"']+["']/g, (s) => s.replace(new RegExp(`\\b${from}\\b`, "g"), to))
      .replace(new RegExp(`(</?)${from}(?=[\\s/>])`, "g"), `$1${to}`)
      .replace(new RegExp(`\\btypeof\\s+${from}\\b`, "g"), `typeof ${to}`);
  }
  for (const [from, to] of Object.entries(TYPES)) out = out.replace(new RegExp(`\\b${from}\\b`, "g"), to);
  for (const [comp, rules] of Object.entries(PROPS)) {
    // Only the kit's own component: the file must import it (a local Cell or Section is left alone).
    if (!new RegExp(`["'](?:@/ui/|(?:\\.\\./)+(?:ui/)?|\\./)${comp}(?:/${comp})?["']`).test(out)) continue;
    const open = new RegExp(`<${esc(comp)}(?=[\\s/>])`, "g");
    let m, res = "", last = 0;
    while ((m = open.exec(out))) {
      const end = tagEnd(out, m.index);
      if (end < 0) break;
      const line = out.slice(0, m.index).split("\n").length;
      const tag = out.slice(m.index, end);
      res += out.slice(last, m.index) + renameProps(tag, rules, (what) => hints.push(`line ${line}: <${comp}> ${what === "spread" ? "has a {...spread}: check its props by hand" : `${what} is not a plain string: check it by hand`}`));
      last = end;
      open.lastIndex = end;
    }
    out = res + out.slice(last);
  }
  for (const { from, when, keys } of KEYS) if (from.some((c) => imports(out, c))) out = renameKeys(out, when, keys);
  return out;
}

const EXT = new Set([".ts", ".tsx"]);
function* files(p) {
  const s = statSync(p);
  if (s.isFile()) { if (EXT.has(extname(p))) yield p; return; }
  for (const name of readdirSync(p)) {
    // Skip dependencies, dot folders and the codemods' own tests (their fixtures hold the old names on purpose).
    if (name === "node_modules" || name.startsWith(".") || name.startsWith("codemod-")) continue;
    yield* files(join(p, name));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const roots = process.argv.slice(2);
  let changed = 0;
  for (const root of roots.length ? roots : ["src", "tests"]) {
    for (const f of files(root)) {
      const before = readFileSync(f, "utf8");
      const hints = [];
      const after = transform(before, hints);
      if (after !== before) { writeFileSync(f, after); changed++; console.log(f); }
      for (const h of hints) console.log(`  check ${f} ${h}`);
    }
  }
  console.log(`${changed} files changed`);
}
