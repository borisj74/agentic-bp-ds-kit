/**
 * The repairs the loop can make on its own.
 *
 * A fixer changes the spec, never the generated code: the spec is the source of truth, so a repair
 * that only patched the TSX would be undone by the next build. Each fixer is mechanical — it needs no
 * taste, and it can only make the spec more like what the contracts already say. Everything else the
 * loop reports for a person or an agent to decide.
 *
 *   fixSpec(spec, { root }) — { spec, fixes: [{ rule, what }], report: [{ rule, what }] }
 *
 * `fixes` is what changed. `report` is what a fixer looked at, could not change safely, and leaves for
 * a person: a shorthand it cannot map to one token without losing the shape of the value.
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
function onePrimary(spec, root, out) {
  const fixes = out.fixes;
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
}

/** The frame draws the page title as the one h1, so a PageHeader inside a region is a second one. */
function onePageHeader(spec, root, out) {
  const fixes = out.fixes;
  for (const { node, nodes, index, path } of [...walk(spec)].reverse()) {
    if (node.component !== "PageHeader") continue;
    // A pattern that takes its own header (FormPage) keeps that one: the frame then draws none.
    if (/^regions\.header\[\d+\]$/.test(path)) continue;
    nodes.splice(index, 1);
    fixes.push({ rule: "bp/landmark", what: `${path} was removed; the frame's PageHeader is the screen's one h1.` });
  }
}

/** Home is added by the frame, so the spec never lists it. */
function breadcrumbs(spec, root, out) {
  if (!Array.isArray(spec.breadcrumbs)) return;
  const kept = spec.breadcrumbs.filter((label) => String(label).toLowerCase() !== "home");
  if (kept.length === spec.breadcrumbs.length) return;
  spec.breadcrumbs = kept;
  out.fixes.push({ rule: "bp/screen-frame", what: "Home was dropped from breadcrumbs; the frame adds it." });
}

// ---- the raw parts of one value ------------------------------------------------------------------

/** A colour literal: a hex, or an rgb()/hsl() call with its arguments. */
const COLOUR_PART = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\([^)]*\)/g;

/** A px amount, with the same guard the review uses so `#aabbccpx` and `1.5px` read the same way. */
const PX_PART = /(?<![\w.#-])\d+(?:\.\d+)?px\b/g;

/** A shadow is one token or nothing: its parts carry no meaning on their own. */
const SHADOW_PROP = /^(box-shadow|text-shadow)$/;

/** calc() does its own arithmetic; a token swapped into it changes the sum. */
const CALC = /\bcalc\(/g;

/** The spans calc(...) covers, so a px amount inside one is left alone. */
function calcSpans(text) {
  const spans = [];
  for (const start of [...text.matchAll(CALC)].map((m) => m.index)) {
    let depth = 0;
    for (let i = text.indexOf("(", start); i < text.length; i += 1) {
      if (text[i] === "(") depth += 1;
      else if (text[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          spans.push([start, i]);
          break;
        }
      }
    }
  }
  return spans;
}

/**
 * The raw parts of one value, in the order they appear: every colour literal and every non-zero px
 * amount, outside calc().
 */
function rawParts(text) {
  const spans = calcSpans(text);
  const inCalc = (at) => spans.some(([from, to]) => at >= from && at <= to);
  const parts = [];
  for (const match of [...text.matchAll(COLOUR_PART), ...text.matchAll(PX_PART)]) {
    const at = match.index;
    if (inCalc(at)) continue;
    if (/px$/.test(match[0]) && Number.parseFloat(match[0]) === 0) continue;
    parts.push({ at, text: match[0] });
  }
  return parts.sort((a, b) => a.at - b.at);
}

/**
 * Put a token where each raw part of a value is, and leave the rest of the value exactly as it was.
 *
 * A shorthand holds more than one value — `padding: 8px 16px`, `border: 1px solid #ccc` — so replacing
 * the whole declaration with one token would change what the value means. This replaces the raw parts
 * and nothing else, so `8px 16px` keeps its two parts and `1px solid #ccc` keeps its three.
 *
 * A part the kit has no token for (a 1px border width is not a step on the 4px grid) stays as it is and
 * comes back under `unresolved`, for a person to decide. A shadow is never taken apart: its parts mean
 * nothing on their own, so the whole value is left alone and reported.
 *
 * @param {{ property: string, value: string, custom?: boolean }} decl The declaration, property in CSS
 *   spelling (`padding-top`, not `paddingTop`).
 * @param {string} [root] Where the kit is, for the tokens.
 * @returns {{ value: string, tokens: string[], unresolved: string[], whole: boolean } | null}
 *   null when the value holds no raw part at all.
 */
export function repairRawValue({ property, value, custom = false }, root = repoRoot) {
  const text = String(value);
  const parts = rawParts(text);
  if (parts.length === 0) return null;

  // A shadow: one token for the whole value, or nothing. Taking it apart would leave `0 2px 4px` with
  // a spacing token in the middle of it, which is not what any of those numbers mean.
  if (SHADOW_PROP.test(property) || (custom && /shadow/.test(property))) {
    return { value: text, tokens: [], unresolved: [text], whole: true };
  }

  const tokens = [];
  const unresolved = [];
  let out = "";
  let from = 0;
  for (const part of parts) {
    const hit = rawValueToken({ property, value: part.text, custom }, root);
    out += text.slice(from, part.at);
    if (hit) {
      out += `var(${hit.token})`;
      tokens.push(hit.token);
    } else {
      out += part.text;
      unresolved.push(part.text);
    }
    from = part.at + part.text.length;
  }
  out += text.slice(from);
  return { value: out, tokens, unresolved, whole: false };
}

/**
 * A raw colour, spacing, radius or shadow in a `style` prop. The spec check cannot refuse it: `style`
 * is a prop every React element takes, so no contract lists it and no enum covers its values. It is
 * the review of the rendered page that reports `bp/raw-value` on it — and this writes the token the
 * rule points at back into the spec, so the next build has no raw value to report.
 *
 * Only the raw parts of a value change. What the kit has no token for is left alone and reported.
 */
function styleTokens(spec, root, out) {
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
      const hit = repairRawValue({ property: name, value: text, custom }, root);
      if (!hit) continue;
      const at = `${where}.style.${property}`;
      if (hit.tokens.length > 0) {
        style[property] = hit.value;
        out.fixes.push({
          rule: "bp/raw-value",
          what: `${at} was ${JSON.stringify(value)} and is now ${hit.value}; components carry no raw values.`,
        });
      }
      if (hit.unresolved.length === 0) continue;
      out.report.push({
        rule: "bp/raw-value",
        what: hit.whole
          ? `${at} is ${JSON.stringify(value)}. A shadow is one token or nothing, so the loop left it: use var(--shadow-raised) for a card, var(--shadow-floating) for a popover or menu.`
          : `${at} still holds ${hit.unresolved.map((p) => JSON.stringify(p)).join(", ")}. The kit has no token for that part of the value, so the loop left it for you.`,
      });
    }
  };
  for (const { node, path } of walk(spec)) repair(node, `${path}.props`);
  repair(spec, "props");
}

const FIXERS = [onePrimary, onePageHeader, breadcrumbs, styleTokens];

/**
 * Repair what can be repaired mechanically.
 * @param {object} spec The spec as it stands.
 * @param {{ root?: string }} options Where the kit is, for the fixers that read its tokens.
 * @returns {{ spec: object, fixes: { rule: string, what: string }[], report: { rule: string, what: string }[] }}
 *   A new spec, what changed, and what is left for a person.
 */
export function fixSpec(spec, { root = repoRoot } = {}) {
  const next = clone(spec);
  const out = { fixes: [], report: [] };
  for (const fixer of FIXERS) fixer(next, root, out);
  return { spec: next, fixes: out.fixes, report: out.report };
}
