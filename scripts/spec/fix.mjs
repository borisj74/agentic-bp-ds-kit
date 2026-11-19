/**
 * The repairs the loop can make on its own.
 *
 * A fixer changes the spec, never the generated code: the spec is the source of truth, so a repair
 * that only patched the TSX would be undone by the next build. Each fixer is mechanical — it needs no
 * taste, and it can only make the spec more like what the contracts already say. Everything else the
 * loop reports for a person or an agent to decide.
 *
 *   fixSpec(spec, { root }) — { spec, fixes: [{ rule, what }] }
 */
import { rawValueToken } from "../review/rules.mjs";
import { repoRoot } from "../review/catalog.mjs";

/** Walk every node in every region, deepest last, with the list that holds it. */
function* walk(spec) {
  const visit = function* (nodes, path) {
    for (const [i, node] of nodes.entries()) {
      yield { node, nodes, index: i, path: `${path}[${i}]` };
      for (const [slot, children] of Object.entries(node.slots ?? {})) {
        yield* visit(children, `${path}[${i}].slots.${slot}`);
      }
    }
  };
  for (const [region, nodes] of Object.entries(spec.regions ?? {})) {
    yield* visit(nodes ?? [], `regions.${region}`);
  }
}

const clone = (spec) => JSON.parse(JSON.stringify(spec));

/** Keep the first strong brand Button and make the rest subtle neutral. */
function onePrimary(spec) {
  const fixes = [];
  let seen = 0;
  for (const { node, path } of walk(spec)) {
    if (node.component !== "Button") continue;
    if (node.props?.emphasis !== "strong" || node.props?.intent !== "brand") continue;
    seen += 1;
    if (seen === 1) continue;
    node.props.emphasis = "subtle";
    delete node.props.intent;
    fixes.push({ rule: "bp/one-primary", what: `${path} is now subtle neutral; the screen keeps one strong brand Button.` });
  }
  return fixes;
}

/** The frame draws the page title as the one h1, so a PageHeader inside a region is a second one. */
function onePageHeader(spec) {
  const fixes = [];
  for (const { node, nodes, index, path } of [...walk(spec)].reverse()) {
    if (node.component !== "PageHeader") continue;
    // A pattern that takes its own header (FormPage) keeps that one: the frame then draws none.
    if (/^regions\.header\[\d+\]$/.test(path)) continue;
    nodes.splice(index, 1);
    fixes.push({ rule: "bp/landmark", what: `${path} was removed; the frame's PageHeader is the screen's one h1.` });
  }
  return fixes;
}

/** Home is added by the frame, so the spec never lists it. */
function breadcrumbs(spec) {
  if (!Array.isArray(spec.breadcrumbs)) return [];
  const kept = spec.breadcrumbs.filter((label) => String(label).toLowerCase() !== "home");
  if (kept.length === spec.breadcrumbs.length) return [];
  spec.breadcrumbs = kept;
  return [{ rule: "bp/screen-frame", what: "Home was dropped from breadcrumbs; the frame adds it." }];
}

/**
 * A raw colour, spacing, radius or shadow in a `style` prop. The spec check cannot refuse it: `style`
 * is a prop every React element takes, so no contract lists it and no enum covers its values. It is
 * the review of the rendered page that reports `bp/raw-value` on it — and this writes the token the
 * rule points at back into the spec, so the next build has no raw value to report.
 */
function styleTokens(spec, root) {
  const fixes = [];
  const repair = (holder, where) => {
    const style = holder?.props?.style;
    if (!style || typeof style !== "object" || Array.isArray(style)) return;
    for (const [property, value] of Object.entries(style)) {
      if (typeof value !== "string" && typeof value !== "number") continue;
      // A style object is written the way React writes it: paddingTop, not padding-top. A number is
      // px to React, so it is read as px here too.
      const custom = property.startsWith("--");
      const name = custom ? property : property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      const text = typeof value === "number" ? `${value}px` : value;
      const hit = rawValueToken({ property: name, value: text, custom }, root);
      if (!hit) continue;
      style[property] = `var(${hit.token})`;
      fixes.push({
        rule: "bp/raw-value",
        what: `${where}.style.${property} was ${JSON.stringify(value)} and is now var(${hit.token}); components carry no raw values.`,
      });
    }
  };
  for (const { node, path } of walk(spec)) repair(node, `${path}.props`);
  repair(spec, "props");
  return fixes;
}

const FIXERS = [onePrimary, onePageHeader, breadcrumbs, styleTokens];

/**
 * Repair what can be repaired mechanically.
 * @param {object} spec The spec as it stands.
 * @param {{ root?: string }} options Where the kit is, for the fixers that read its tokens.
 * @returns {{ spec: object, fixes: { rule: string, what: string }[] }} A new spec and what changed.
 */
export function fixSpec(spec, { root = repoRoot } = {}) {
  const next = clone(spec);
  const fixes = [];
  for (const fixer of FIXERS) fixes.push(...fixer(next, root));
  return { spec: next, fixes };
}
