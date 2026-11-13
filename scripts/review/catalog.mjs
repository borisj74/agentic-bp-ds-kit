/**
 * What the review knows about the kit: the contracts, the semantic tokens and the starters.
 * Everything is read from the repo, so the rules never carry a second copy of the catalog.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cssName, knownVarNames, readSemantic, tokenIndex } from "../audit-tokens.mjs";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Names the kit used to grow by hand. A file that declares one of these is building a cousin. */
export const KNOWN_COUSINS = ["EmptyHeader", "Dialog", "Sheet", "SliderThumb", "ToastAction"];

/** The review never points at the chat pieces: they are not a screen's building blocks. */
export const NEVER_SUGGEST = ["ChatWindow", "ChatComposer", "ChatHeader", "ChatList", "ChatMessage"];

/** Props every React element may take, whatever its contract lists. */
const FREE_PROPS = new Set([
  "key", "ref", "className", "style", "id", "children", "title", "role", "tabIndex", "hidden",
  "form", "name", "value", "autoFocus",
]);

/** True for props a contract never has to list: handlers, data-*, aria-*, and the free ones above. */
export function isFreeProp(name) {
  if (FREE_PROPS.has(name)) return true;
  if (name.startsWith("data-") || name.startsWith("aria-")) return true;
  return /^on[A-Z]/.test(name);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

let cached = null;

/** The whole catalog, read once: pieces by lower-case name, plus tokens and starter ids. */
export function catalog(root = repoRoot) {
  if (cached && cached.root === root) return cached;

  const index = readJson(join(root, "contracts", "index.json"));
  const pieces = new Map();

  const add = (row, kind) => {
    const file = join(root, row.contract);
    if (!existsSync(file)) return;
    const contract = readJson(file);
    pieces.set(row.name.toLowerCase(), {
      name: row.name,
      kind,
      level: row.level ?? contract.level ?? null,
      contract: row.contract,
      composes: Array.isArray(contract.composes) ? contract.composes : null,
      props: contract.props && typeof contract.props === "object" ? contract.props : {},
      importPath: kind === "pattern" ? `@/patterns/${row.name}/${row.name}` : `@/ui/${row.name}/${row.name}`,
    });
  };

  for (const row of index.components ?? []) add(row, "component");
  for (const row of index.patterns ?? []) add(row, "pattern");

  const semantic = readSemantic(join(root, "src/tokens/source/semantic.txt"));
  const tokens = tokenIndex(semantic);
  const knownVars = knownVarNames(root);

  const starters = new Map();
  const startersFile = join(root, "starters", "index.json");
  if (existsSync(startersFile)) {
    for (const s of readJson(startersFile).starters ?? []) {
      if (s.template) starters.set(String(s.template).toLowerCase(), s.id);
    }
  }

  cached = { root, pieces, tokens, knownVars, starters, cssName };
  return cached;
}

/** One kit piece by name, or null when the kit has no contract for it. */
export function piece(name, root = repoRoot) {
  return catalog(root).pieces.get(String(name).toLowerCase()) ?? null;
}

/** The starter id that opens with a pattern, so a fix can name `npm run new-screen`. */
export function starterFor(pattern, root = repoRoot) {
  return catalog(root).starters.get(String(pattern).toLowerCase()) ?? null;
}

/** A semantic token that fits a CSS property's role, to name in a fix. */
export function tokenForRoles(roles, root = repoRoot) {
  if (!roles) return null;
  const { tokens } = catalog(root);
  for (const role of roles) {
    for (const [name, t] of tokens) if (t.role === role && t.family === "neutral" && !/-(hover|press|selected)$/.test(name)) return name;
  }
  return null;
}
