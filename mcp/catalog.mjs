/**
 * Read-only catalog for the Agentic BP DS MCP server. Answers come from
 * contracts/, src/tokens/source/, and CLAUDE.md — no duplicated datasets.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cssName } from "../scripts/audit-tokens.mjs";
import { LEVELS } from "../scripts/sync-index.mjs";

const mcpDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(mcpDir, "..");

// The categories are whatever src/tokens/source/semantic.txt actually holds, read once at start. Hardcoding them
// let the list drift: it advertised fill, stroke and shadow, which the file has never had, so get_tokens answered
// those with an empty set instead of saying the category does not exist.
export const TOKEN_CATEGORIES = readTokenCategories();

function readTokenCategories() {
  try {
    const file = join(repoRoot, "src/tokens/source/semantic.txt");
    if (!existsSync(file)) return [];
    const found = new Set();
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const row = line.trim();
      if (!row || row.startsWith("#")) continue;
      const category = row.split("|")[0]?.split("/")[0]?.trim();
      if (category) found.add(category);
    }
    return [...found].sort();
  } catch {
    return [];
  }
}

export class CatalogError extends Error {
  constructor(message) {
    super(message);
    this.name = "CatalogError";
  }
}

const cache = new Map();

function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

function readJson(relativePath, label) {
  const file = join(repoRoot, relativePath);
  if (!existsSync(file)) {
    throw new CatalogError(`${label} is missing (${relativePath}).`);
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new CatalogError(`Could not parse ${label} (${relativePath}): ${error.message}`);
  }
}

function kitVersion() {
  const pkg = readJson("package.json", "package.json");
  return String(pkg.version ?? "0.0.0");
}

function index() {
  return cached("index", () => readJson("contracts/index.json", "contracts/index.json"));
}

function contractPathForName(name) {
  const needle = String(name ?? "").trim();
  if (!needle) return null;

  const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = compact(needle);

  const idx = index();
  const pools = [
    ...(idx.components ?? []).map((row) => ({ ...row, kind: "component" })),
    ...(idx.patterns ?? []).map((row) => ({ ...row, kind: "pattern" })),
  ];

  for (const row of pools) {
    if (row.name === needle || compact(row.name) === target) {
      return { ...row, contractPath: row.contract };
    }
    const fileStem = row.contract?.replace(/^contracts\//, "").replace(/\.json$/, "");
    if (fileStem && compact(fileStem) === target) {
      return { ...row, contractPath: row.contract };
    }
  }
  return null;
}

function readContract(relativePath) {
  return readJson(relativePath, relativePath);
}

const oneLine = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

// The contract carries the level, so the rows read it from there and the index row is only a fallback.
export function levelOf(row, contract) {
  return contract?.level ?? row?.level ?? "";
}

// Reads a level argument. Empty means "no filter". Anything outside LEVELS is an error that names the four values.
export function parseLevel(level) {
  if (level === undefined || level === null || String(level).trim() === "") return null;
  const wanted = String(level).trim().toLowerCase();
  if (!LEVELS.includes(wanted)) {
    throw new CatalogError(`Unknown level "${level}". Use one of: ${LEVELS.join(", ")}.`);
  }
  return wanted;
}

function rowsFor(kind, level = null) {
  const key = kind === "pattern" ? "patterns" : "components";
  const rows = [];
  for (const row of index()[key] ?? []) {
    let contract = null;
    try {
      contract = readContract(row.contract);
    } catch {
      contract = null;
    }
    const rowLevel = levelOf(row, contract);
    if (level && rowLevel !== level) continue;
    rows.push({
      name: row.name,
      kind,
      level: rowLevel,
      category: row.category ?? "",
      contract: row.contract,
      tags: row.tags ?? [],
      intent: oneLine(contract?.intent ?? contract?.usage ?? ""),
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

// Patterns are listed beside the components on purpose: the kit's first rule for a screen is to use the pattern
// that covers it, and an agent that cannot see them cannot follow it.
// Only patterns are templates, so a template filter returns patterns alone and any other level returns components alone.
export function listComponents({ level } = {}) {
  const version = kitVersion();
  const wanted = parseLevel(level);
  const components = wanted === "template" ? [] : rowsFor("component", wanted);
  const patterns = wanted && wanted !== "template" ? [] : rowsFor("pattern", wanted);
  return {
    kit: version,
    level: wanted,
    count: components.length + patterns.length,
    components,
    patterns,
  };
}

// Serves a component or a pattern: both are contracts, and a screen usually starts from a pattern.
export function getComponent(name) {
  const version = kitVersion();
  const hit = contractPathForName(name);
  if (!hit) {
    throw new CatalogError(`Nothing in the kit is called "${name}". Use list or search.`);
  }

  const contract = readContract(hit.contractPath);
  // The contract carries its own path (src/ui/Button/Button.tsx, src/patterns/ListPage/ListPage.tsx), so the import
  // follows it rather than a guess about where the piece lives.
  const fromPath = contract.path
    ? contract.path.replace(/^src\//, "@/").replace(/\.tsx?$/, "")
    : `@/${hit.kind === "pattern" ? "patterns" : "ui"}/${contract.name}/${contract.name}`;
  const importLine = contract.name ? `import { ${contract.name} } from "${fromPath}";` : undefined;

  return {
    kit: version,
    name: hit.name,
    kind: hit.kind,
    level: levelOf(hit, contract),
    category: hit.category ?? "",
    contractPath: hit.contract,
    import: importLine,
    usage: oneLine(contract.usage ?? contract.intent ?? ""),
    contract,
  };
}

function searchHaystack(row, contract) {
  const parts = [
    row.name,
    row.category,
    ...(row.tags ?? []),
    contract?.intent,
    contract?.usage,
    ...(Array.isArray(contract?.useWhen) ? contract.useWhen : []),
    ...(Array.isArray(contract?.doNot) ? contract.doNot : []),
  ];
  return parts
    .filter(Boolean)
    .map((p) => String(p).toLowerCase())
    .join(" ");
}

export function searchComponents(query) {
  const version = kitVersion();
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) {
    throw new CatalogError('search requires a non-empty query, e.g. "date picker".');
  }
  const terms = q.split(/\s+/).filter(Boolean);

  const hits = (kind) => {
    const key = kind === "pattern" ? "patterns" : "components";
    const matches = [];
    for (const row of index()[key] ?? []) {
      let contract = {};
      try {
        contract = readContract(row.contract);
      } catch {
        continue;
      }
      const haystack = searchHaystack(row, contract);
      if (terms.every((term) => haystack.includes(term))) {
        matches.push({
          name: row.name,
          kind,
          level: levelOf(row, contract),
          category: row.category ?? "",
          contract: row.contract,
          intent: oneLine(contract.intent ?? ""),
          matchedQuery: query,
        });
      }
    }
    matches.sort((a, b) => a.name.localeCompare(b.name));
    return matches;
  };

  const components = hits("component");
  const patterns = hits("pattern");
  return { kit: version, query, count: components.length + patterns.length, components, patterns };
}

function parseSemanticSource() {
  return cached("semanticRows", () => {
    const file = join(repoRoot, "src/tokens/source/semantic.txt");
    if (!existsSync(file)) {
      throw new CatalogError("src/tokens/source/semantic.txt is missing.");
    }
    return readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const [source, light, dark] = line.split("|");
        const category = source.split("/")[0] ?? "";
        return {
          source: source.trim(),
          name: cssName(source.trim()),
          category,
          light: (light ?? "").trim(),
          dark: (dark ?? "").trim(),
        };
      });
  });
}

export function getTokens({ category, theme } = {}) {
  const version = kitVersion();
  let rows = parseSemanticSource();

  if (category) {
    const cat = String(category).trim().toLowerCase();
    if (!TOKEN_CATEGORIES.includes(cat)) {
      throw new CatalogError(
        `Unknown token category "${category}". Use one of: ${TOKEN_CATEGORIES.join(", ")}.`,
      );
    }
    rows = rows.filter((row) => row.category === cat);
  }

  const themeMode = theme ? String(theme).trim().toLowerCase() : "both";
  if (!["light", "dark", "both"].includes(themeMode)) {
    throw new CatalogError('theme must be "light", "dark", or "both".');
  }

  const tokens = rows.map((row) => {
    const entry = {
      name: row.name,
      source: row.source,
      category: row.category,
    };
    if (themeMode === "light" || themeMode === "both") {
      entry.light = row.light;
    }
    if (themeMode === "dark" || themeMode === "both") {
      entry.dark = row.dark;
    }
    return entry;
  });

  return {
    kit: version,
    source: "src/tokens/source/semantic.txt",
    category: category ?? null,
    theme: themeMode,
    count: tokens.length,
    tokens,
    note:
      "Components must use semantic CSS variables from src/tokens/semantic.css, not primitive --ref-* or --ui-* ramps.",
  };
}

const RULES_MARKDOWN_SOURCES = ["CLAUDE.md", "AGENTS.md"];

function readMarkdown(relativePath) {
  const file = join(repoRoot, relativePath);
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8");
}

export function getRules() {
  const version = kitVersion();
  const essentials = [
    "Before writing UI, read contracts/index.json, then only the matching contract file(s).",
    "If a contract exists, import it from @/ui/<Name>/<Name>. Never invent a local cousin.",
    "If a pattern in contracts/index.json matches the screen, import it from @/patterns/.",
    "Build in level order: reuse the biggest piece that fits — pattern (template), then organism, molecule, atom — and read each piece's level in contracts/index.json.",
    "If something is missing from the index, stop and ask — do not add a one-off.",
    "Never put hex in components; use semantic tokens from src/tokens/semantic.css (not primitive --ref-* / --ui-* ramps).",
    "One emphasis=\"strong\" intent=\"brand\" Button per view.",
    "Use layout classes from src/tokens/layout.css (.layout-content, .layout-stack, .layout-split) — do not invent per-page grids.",
    "Match closed enums in contracts. Color role prop is intent (never tone). Button uses emphasis × intent only.",
    "Icons: Google Material Symbols Outlined via the Icon component only.",
  ];

  const documents = {};
  for (const source of RULES_MARKDOWN_SOURCES) {
    const text = readMarkdown(source);
    if (text) documents[source] = text;
  }

  return {
    kit: version,
    rules: essentials,
    documents,
    primarySource: "CLAUDE.md",
  };
}
