/**
 * The review rules. Each one reads the facts a file gave up and returns findings:
 * { rule, severity, file, line, contract, message, fix }.
 *
 * Contracts are the source of truth here too: the rules read contracts/index.json and the
 * contract files, and the token rules read the token knowledge scripts/audit-tokens.mjs already has.
 */
import { isTokenLike, propertyRoles } from "../audit-tokens.mjs";
import { KNOWN_COUSINS, NEVER_SUGGEST, catalog, isFreeProp, piece, starterFor, tokenForRoles } from "./catalog.mjs";
import { ts } from "./tsx.mjs";

/** How much of a bigger piece's parts a file has to use before the review names that piece. */
export const COMPOSES_SHARE = 0.6;

/** However small a piece's `composes` list is, a file has to use at least this many of its parts. */
export const MIN_PARTS = 3;

const SPACING_PROP = /^(padding|margin|gap|row-gap|column-gap|inset)(-(top|right|bottom|left|block|inline)(-(start|end))?)?$/;
const RADIUS_PROP = /^border(-(top|bottom)-(left|right))?-radius$/;
const SHADOW_PROP = /^(box-shadow|text-shadow)$/;
const COLOR_VALUE = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\s*\(/;

const SPACE_TOKENS = [
  [2, "--space-xxxsmall"], [4, "--space-xxsmall"], [8, "--space-xsmall"], [12, "--space-small"],
  [16, "--space-medium"], [20, "--space-large"], [24, "--space-xlarge"], [28, "--space-xxlarge"],
];
const RADIUS_TOKENS = [[2, "--radius-small"], [4, "--radius-medium"], [8, "--radius-large"], [9999, "--radius-full"]];

const nearest = (px, table) =>
  table.reduce((best, row) => (Math.abs(row[0] - px) < Math.abs(best[0] - px) ? row : best));

const relative = (file) => file.replace(/\\/g, "/");

function finding(rule, severity, file, line, message, fix, contract = null) {
  return { rule, severity, file: relative(file), line, contract, message, fix };
}

// ---- 1. bp/raw-value ----------------------------------------------------------------------------

/** A raw colour, or a px spacing, radius or shadow value, where a token or a layout class belongs. */
function rawValue(decl, file, root) {
  const { property, value } = decl;
  const out = [];
  if (COLOR_VALUE.test(value)) {
    const token = tokenForRoles(propertyRoles(property) ?? ["background"], root) ?? "--bg-neutral";
    out.push(finding(
      "bp/raw-value", "error", file, decl.line,
      `Raw colour in \`${property}: ${value}\`. Components never carry colour values.`,
      `Use a semantic token from src/tokens/semantic.css, like var(${token}).`,
      "contracts/layout.json",
    ));
    return out;
  }
  const px = value.match(/(?<![\w.#-])(\d+(?:\.\d+)?)px\b/);
  if (!px || Number(px[1]) === 0 || /^calc\(/.test(value)) return out;
  const amount = Number(px[1]);
  if (SPACING_PROP.test(property) || (decl.custom && /space|gap|pad|margin|inset/.test(property))) {
    const [size, token] = nearest(amount, SPACE_TOKENS);
    out.push(finding(
      "bp/raw-value", "error", file, decl.line,
      `Hard-coded spacing in \`${property}: ${value}\`. Page spacing comes from the 4px grid.`,
      `Use var(${token}) (${size}px), or a layout class from src/tokens/layout.css (.layout-content for the page inset, .layout-stack for the gap between sections).`,
      "contracts/layout.json",
    ));
  } else if (RADIUS_PROP.test(property) || (decl.custom && /radius/.test(property))) {
    const [size, token] = nearest(amount, RADIUS_TOKENS);
    out.push(finding(
      "bp/raw-value", "error", file, decl.line,
      `Hard-coded radius in \`${property}: ${value}\`.`,
      `Use var(${token}) (${size}px).`,
    ));
  } else if (SHADOW_PROP.test(property) || (decl.custom && /shadow/.test(property))) {
    out.push(finding(
      "bp/raw-value", "error", file, decl.line,
      `Hard-coded shadow in \`${property}: ${value}\`.`,
      `Use var(--shadow-raised) for a card, var(--shadow-floating) for a popover or menu.`,
    ));
  }
  return out;
}

// ---- 2. bp/primitive-token ---------------------------------------------------------------------

/** A primitive ramp used outside src/tokens, or a token the kit does not have. */
function tokenUse(use, file, code, root) {
  const { knownVars } = catalog(root);
  if (/^--(ref|ui)-/.test(use.name)) {
    return [finding(
      "bp/primitive-token", "error", file, use.line,
      `Primitive ramp \`${use.name}\` outside src/tokens.`,
      "Use a semantic role from src/tokens/semantic.css (--bg-*, --text-*, --icon-*, --border-*). Only the token files read the ramps.",
    )];
  }
  if (knownVars.has(use.name)) return [];
  // A custom property the file sets itself is not a missing token.
  if (new RegExp(use.name + "[\"'`]?\\s*[:,]").test(code)) return [];
  if (!isTokenLike(use.name, knownVars)) return [];
  return [finding(
    "bp/primitive-token", "error", file, use.line,
    `Unknown token \`${use.name}\`. No token file defines it.`,
    "Use a token that exists (see src/tokens/semantic.css), or ask before adding one.",
  )];
}

// ---- 3. bp/local-cousin ------------------------------------------------------------------------

const UI_MODULE = /^(@\/ui\/|@\/patterns\/)/;
const OK_MODULE = (m) =>
  m === "react" || m === "react-dom" || m.startsWith("react/") || m.startsWith("react-dom/") ||
  m.startsWith("next/") || UI_MODULE.test(m) || /\.css$/.test(m);

function localCousin(facts, file, root) {
  const out = [];
  for (const local of facts.localComponents) {
    const kit = piece(local.name, root);
    const cousin = KNOWN_COUSINS.includes(local.name);
    if (!kit && !cousin) continue;
    out.push(finding(
      "bp/local-cousin", "error", file, local.line,
      kit
        ? `\`${local.name}\` is declared here, but the kit already has ${kit.name} (${kit.level}).`
        : `\`${local.name}\` is a local cousin of a kit piece. The kit does not grow by hand.`,
      kit
        ? `Delete it and import ${kit.name} from ${kit.importPath}.`
        : "Use the kit piece that covers it, or stop and ask before adding anything new.",
      kit?.contract ?? null,
    ));
  }
  for (const imp of facts.imports) {
    if (OK_MODULE(imp.module)) continue;
    if (imp.typeOnly) continue;
    // A component name, not a data constant: Card, not CARD_OPTIONS.
    const ui = imp.names.filter((n) => !n.type && /^[A-Z][a-z]/.test(n.local));
    if (ui.length === 0) continue;
    out.push(finding(
      "bp/local-cousin", "error", file, imp.line,
      `UI imported from \`${imp.module}\`: ${ui.map((n) => n.local).join(", ")}.`,
      "Screens import UI from @/ui and @/patterns only (react and next/* are fine). If the kit is missing a piece, stop and ask.",
    ));
  }
  return out;
}

// ---- 4. bp/closed-enum -------------------------------------------------------------------------

const BUTTON_PAIRS = { strong: ["brand", "danger"], subtle: ["neutral"], minimal: ["neutral", "brand", "danger"] };

function closedEnum(el, file) {
  const out = [];
  const { piece: kit } = el;
  const props = kit.props ?? {};
  const names = Object.keys(props);
  for (const attr of el.attrs) {
    if (attr.spread || !attr.name) continue;
    if (isFreeProp(attr.name)) continue;
    if (!(attr.name in props)) {
      const hint =
        attr.name === "tone" && "intent" in props
          ? "The colour-role prop is `intent`, never `tone`."
          : attr.name === "variant" && "emphasis" in props
            ? "A Button's look is `emphasis` x `intent`, never `variant`."
            : `Props its contract allows: ${names.join(", ")}.`;
      out.push(finding(
        "bp/closed-enum", "error", file, attr.line,
        `${kit.name} has no prop \`${attr.name}\`.`,
        hint,
        kit.contract,
      ));
      continue;
    }
    const spec = props[attr.name];
    const allowed = Array.isArray(spec?.enum) ? spec.enum : null;
    if (!allowed || typeof attr.value !== "string") continue;
    if (!allowed.includes(attr.value)) {
      out.push(finding(
        "bp/closed-enum", "error", file, attr.line,
        `${kit.name} ${attr.name}="${attr.value}" is not in the contract.`,
        `Allowed: ${allowed.map((v) => `"${v}"`).join(", ")}.`,
        kit.contract,
      ));
    }
  }
  if (kit.name === "Button") {
    const emphasis = el.attrs.find((a) => a.name === "emphasis")?.value;
    const intent = el.attrs.find((a) => a.name === "intent")?.value;
    if (typeof emphasis === "string" && typeof intent === "string" && BUTTON_PAIRS[emphasis]) {
      if (!BUTTON_PAIRS[emphasis].includes(intent)) {
        out.push(finding(
          "bp/closed-enum", "error", file, el.line,
          `Button emphasis="${emphasis}" intent="${intent}" is not an allowed pair.`,
          `With emphasis="${emphasis}" the intent can only be ${BUTTON_PAIRS[emphasis].map((v) => `"${v}"`).join(" or ")}.`,
          kit.contract,
        ));
      }
    }
  }
  return out;
}

// ---- 5. bp/one-primary -------------------------------------------------------------------------

function onePrimary(kitEls, file) {
  const primaries = kitEls.filter((el) => {
    if (el.piece.name !== "Button") return false;
    const emphasis = el.attrs.find((a) => a.name === "emphasis")?.value;
    const intent = el.attrs.find((a) => a.name === "intent")?.value;
    return emphasis === "strong" && intent === "brand";
  });
  if (primaries.length < 2) return [];
  return primaries.slice(1).map((el) =>
    finding(
      "bp/one-primary", "error", file, el.line,
      `${primaries.length} strong brand Buttons in this file. A view has one.`,
      `Keep the one main action strong and brand; make the rest subtle neutral, or minimal.`,
      "contracts/button.json",
    ),
  );
}

// ---- 6 and 7. bp/use-pattern and bp/use-bigger-piece -------------------------------------------

/** How much of one piece's `composes` list a file already uses, and where the first part sits. */
function composesMatch(target, facts) {
  const parts = target.composes ?? [];
  if (parts.length === 0) return null;
  const used = parts.filter((part) => facts.tags.has(part));
  const first = facts.elements.find((el) => used.includes(el.tag));
  return { used, share: used.length / parts.length, line: first?.line ?? 1 };
}

function biggerPieces(facts, file, root) {
  const { pieces } = catalog(root);
  const shadowed = new Set(facts.localComponents.map((c) => c.name));
  const out = [];
  const candidates = [];
  for (const p of pieces.values()) {
    if (!p.composes || NEVER_SUGGEST.includes(p.name)) continue;
    if (facts.tags.has(p.name) || shadowed.has(p.name)) continue;
    const match = composesMatch(p, facts);
    if (!match || match.share < COMPOSES_SHARE || match.used.length < MIN_PARTS) continue;
    candidates.push({ piece: p, ...match });
  }
  // Build order: the biggest piece first, and the closest match ahead of a looser one.
  const order = { template: 0, organism: 1, molecule: 2, atom: 3 };
  candidates.sort((a, b) => (order[a.piece.level] ?? 9) - (order[b.piece.level] ?? 9) || b.share - a.share);

  // A screen has one template. If the file already uses a pattern, the frame is settled.
  const hasPattern = [...pieces.values()].some((p) => p.kind === "pattern" && facts.tags.has(p.name));
  const pattern = hasPattern ? null : candidates.find((c) => c.piece.kind === "pattern");
  if (pattern) {
    const starter = starterFor(pattern.piece.name, root);
    out.push(finding(
      "bp/use-pattern", "warn", file, pattern.line,
      `This looks like a ${pattern.piece.name}. The file already uses ${pattern.used.join(", ")}.`,
      `Use ${pattern.piece.importPath}` + (starter ? `, or start from: npm run new-screen -- --template ${starter}.` : "."),
      pattern.piece.contract,
    ));
  }
  for (const c of candidates) {
    if (c.piece.kind === "pattern") continue;
    out.push(finding(
      "bp/use-bigger-piece", "warn", file, c.line,
      `This builds ${c.piece.name} by hand from ${c.used.join(", ")}.`,
      `Use ${c.piece.name} (${c.piece.level}) from ${c.piece.importPath}.`,
      c.piece.contract,
    ));
  }
  return out;
}

// ---- 8. bp/screen-frame ------------------------------------------------------------------------

/** The first breadcrumb label a `breadcrumbs={[...]}` prop carries, or null when it is not literal. */
function firstBreadcrumb(el) {
  const attr = el.attrs.find((a) => a.name === "breadcrumbs");
  if (!attr?.node?.initializer || !ts.isJsxExpression(attr.node.initializer)) return null;
  const expr = attr.node.initializer.expression;
  if (!expr || !ts.isArrayLiteralExpression(expr) || expr.elements.length === 0) return null;
  const head = expr.elements[0];
  if (!ts.isObjectLiteralExpression(head)) return null;
  for (const prop of head.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : null;
    if (name === "label" && ts.isStringLiteral(prop.initializer)) {
      return { label: prop.initializer.text, line: el.line };
    }
  }
  return null;
}

function screenFrame(facts, file) {
  const out = [];
  if (!facts.tags.has("AppShell")) {
    out.push(finding(
      "bp/screen-frame", "warn", file, 1,
      "A full screen with no AppShell around it.",
      "Frame it with AppShell from @/patterns/AppShell/AppShell, and pass the whole side nav: items={APP_NAV} endItems={APP_NAV_END} from @/patterns/AppShell/appNav.",
      "contracts/appshell.json",
    ));
  } else if (!/\bAPP_NAV\b/.test(facts.text) || !/\bAPP_NAV_END\b/.test(facts.text)) {
    out.push(finding(
      "bp/screen-frame", "warn", file, 1,
      "AppShell is here, but the side nav is not the kit's own.",
      "Pass items={APP_NAV} and endItems={APP_NAV_END} from @/patterns/AppShell/appNav. Never trim or invent nav links.",
      "contracts/appshell.json",
    ));
  }
  for (const el of facts.elements) {
    const crumb = firstBreadcrumb(el);
    if (crumb && crumb.label !== "Home") {
      out.push(finding(
        "bp/screen-frame", "warn", file, crumb.line,
        `Breadcrumbs start with "${crumb.label}", not Home.`,
        "The trail reads Home > side-nav section > this screen. Pass Home first; PageHeader adds the page title itself.",
        "contracts/pageheader.json",
      ));
    }
    for (const style of el.styles) {
      if (style.property === "display" && /\bgrid\b/.test(style.value)) {
        out.push(finding(
          "bp/screen-frame", "warn", file, style.line,
          "A page-level grid written by hand.",
          "Use a layout class from src/tokens/layout.css (.layout-content, .layout-stack, .layout-metrics, .layout-split). Never invent a per-page grid.",
          "contracts/layout.json",
        ));
      }
    }
  }
  return out;
}

export const SCREEN_PATH = /^src\/app\/(?!\(playground\)).*\/page\.tsx$/;

/** Every rule for one TSX file. */
export function tsxFindings({ facts, file, root }) {
  const out = [];
  // A component the file declares itself shadows the kit piece of the same name. bp/local-cousin
  // already names it, so the prop rules do not read the kit contract for it.
  const shadowed = new Set(facts.localComponents.map((c) => c.name));
  // Only a PascalCase tag spelled exactly like the contract is that kit piece: <link rel> is HTML, not Link.
  const lookup = (tag) => {
    if (shadowed.has(tag)) return null;
    const found = piece(tag, root);
    return found && found.name === tag ? found : null;
  };
  const kitEls = [];
  for (const el of facts.elements) {
    const found = lookup(el.tag);
    if (found) kitEls.push({ ...el, piece: found });
  }

  for (const el of facts.elements) for (const style of el.styles) out.push(...rawValue(style, file, root));
  for (const use of facts.varUses) out.push(...tokenUse(use, file, facts.text, root));
  out.push(...localCousin(facts, file, root));
  for (const el of kitEls) out.push(...closedEnum(el, file));
  out.push(...onePrimary(kitEls, file));
  out.push(...biggerPieces(facts, file, root));
  if (SCREEN_PATH.test(relative(file))) out.push(...screenFrame(facts, file));
  return out;
}

/** Every rule for one CSS file. */
export function cssFindings({ decls, varUses, file, code, root }) {
  const out = [];
  for (const decl of decls) out.push(...rawValue(decl, file, root));
  for (const use of varUses) out.push(...tokenUse(use, file, code, root));
  return out;
}
