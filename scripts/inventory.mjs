#!/usr/bin/env node
// Measures every piece in the catalog and writes docs/inventory.json.
// The contracts and src/ are the source of truth. Never hand-type a count here or in the sheet.
//
//   node scripts/inventory.mjs          write docs/inventory.json
//   node scripts/inventory.mjs --check  say what drifts from the measurement, exit 1 if any
//
// Columns come out in the order the inventory sheet reads them, so a sync writes a row at a time.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, statSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The committed inventory. Repo is public, so nothing private goes in here. */
const outPath = join(root, "docs", "inventory.json");

// The Figma mirror lives under docs/figma/, which .gitignore keeps out of the repo: its links carry the
// file key of a private file. So the Figma columns go to their own file beside the board, never to outPath.
const figmaOutPath = join(root, "docs", "figma", "inventory-figma.json");

/** Where the catalog pages live, for the Playground column. */
const CATALOG = "https://agentic-bp-ds-kit.vercel.app";

/** Where a contract can be read, for the Contract column. */
const REPO_BLOB = "https://github.com/borisj74/agentic-bp-ds-kit/blob/main";

/** The states a piece can style, in the order the sheet lists them. */
const STATES = [
  "hover",
  "focus",
  "active",
  "selected",
  "disabled",
  "loading",
  "error",
  "empty",
  "read-only",
];

/** A colour written out instead of taken from a token. */
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/g;

/** A px value in a declaration. 0, 1 and 2 are hairlines and borders, not sizing. */
const PX_DECLARATION = /([-a-z]+)\s*:\s*([^;{}]*?(?<![\w-])\d+(?:\.\d+)?px[^;{}]*);/g;

const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const MEDIA_BLOCK = /@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g;

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

/** Every file under a folder whose name ends in one of the extensions. */
function filesUnder(relativeDir, extensions) {
  const dir = join(root, relativeDir);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...filesUnder(join(relativeDir, entry), extensions));
    } else if (extensions.some((extension) => entry.endsWith(extension))) {
      out.push(path);
    }
  }
  return out;
}

function read(paths) {
  return paths.map((path) => readFileSync(path, "utf8")).join("\n");
}

/** The folder a piece lives in. Patterns sit beside components, not inside them. */
function sourceDir(name, level) {
  return `${level === "template" ? "src/patterns" : "src/ui"}/${name}`;
}

/** Colours written out in a piece's own code. Expect 0 everywhere but the brand art. */
function colourLiterals(code) {
  return (code.match(COLOUR_LITERAL) ?? []).length;
}

/**
 * px values a piece sets in its own CSS declarations, outside comments and media queries.
 * A max-width on a dialog is deliberate; a padding in px would mean density cannot move it.
 */
function hardPx(css) {
  const stripped = css.replace(CSS_COMMENT, "").replace(MEDIA_BLOCK, "");
  const out = [];
  for (const [, property, value] of stripped.matchAll(PX_DECLARATION)) {
    const first = value.match(/(?<![\w-])(\d+(?:\.\d+)?)px/);
    if (first && Number(first[1]) > 2) out.push({ property, value: value.trim() });
  }
  return out;
}

/** The states a piece styles itself. A state its parts own is not its own. */
function ownStates(css, tsx, props) {
  const has = new Set();
  if (css.includes(":hover")) has.add("hover");
  if (css.includes(":focus")) has.add("focus");
  if (css.includes(":active")) has.add("active");
  if (/:disabled|\[disabled\]|aria-disabled|\.disabled/.test(css) || props.has("disabled")) {
    has.add("disabled");
  }
  if (["loading", "isLoading", "busy"].some((p) => props.has(p)) || css.includes("loading")) {
    has.add("loading");
  }
  if (["error", "errorMessage", "invalid"].some((p) => props.has(p)) || css.includes("error")) {
    has.add("error");
  }
  if (["empty", "emptyMessage", "emptyState"].some((p) => props.has(p)) || css.includes("empty")) {
    has.add("empty");
  }
  if (
    ["selected", "current", "checked"].some((p) => props.has(p)) ||
    css.includes("selected") ||
    tsx.includes("aria-current")
  ) {
    has.add("selected");
  }
  if (["readOnly", "readonly"].some((p) => props.has(p))) has.add("read-only");
  return STATES.filter((state) => has.has(state));
}

/**
 * What the live Figma file holds for each piece, read from docs/figma/pages.json.
 * That file is a snapshot of the real file, captured through the read-only Figma tooling —
 * never parsed out of PLAN.md, which records some work in prose and reads as missing.
 * docs/figma/ is gitignored, so this is empty on a fresh clone and in CI.
 */
export function readFigmaPages() {
  const snapshotPath = join(root, "docs", "figma", "pages.json");
  if (!existsSync(snapshotPath)) return { fileKey: null, pages: {} };
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  return { fileKey: snapshot.fileKey, pages: snapshot.pages ?? {} };
}


/** One row per piece, with every column the sheet shows. */
function measure(row, figma) {
  const contract = readJson(row.contract);
  const level = contract.level;
  const dir = sourceDir(row.name, level);
  const css = read(filesUnder(dir, [".css"]));
  const tsx = read(filesUnder(dir, [".tsx", ".ts"]));
  const props = new Set(Object.keys(contract.props ?? {}));
  const composes = contract.composes ?? [];
  const states = ownStates(css.replace(CSS_COMMENT, ""), tsx, props);
  const colours = colourLiterals(`${css}\n${tsx}`);
  const px = hardPx(css);
  const slug = row.name.toLowerCase();
  const page = figma.pages[row.name] ?? null;

  return {
    name: row.name,
    level,
    category: row.category ?? null,
    intent: contract.intent ?? "",
    props: props.size,
    // An example is a titled group with its own usage line; its items are the instances the playground draws.
    examples: (contract.examples ?? []).length,
    exampleItems: (contract.examples ?? []).reduce(
      (total, example) => total + (example.items ?? []).length,
      0,
    ),
    composes,
    playground: `${CATALOG}/${level === "template" ? "patterns" : "components"}/${slug}`,
    usageRules: (contract.useWhen ?? []).length + (contract.doNot ?? []).length,
    colourLiterals: colours,
    importPath: `@/${(contract.path ?? "").replace(/^src\//, "").replace(/\.tsx$/, "")}`,
    contract: `${REPO_BLOB}/${row.contract}`,
    darkMode: colours === 0 ? "Via tokens" : "Brand colours",
    density:
      row.name === "Density" ? "Sets it" : colours === 0 ? "Follows" : "Fixed artwork",
    hardPx: px,
    statesCovered: states.length > 0 ? states.join(", ") : composes.length > 0 ? "In its parts" : "Static",
    ownStates: states.length,
    figma: {
      page: page
        ? `https://www.figma.com/design/${figma.fileKey}/Agentic-DS?node-id=${page.node.replace(":", "-")}`
        : null,
      // Every page in the live file carries the kit's own name, so this says what is on the page.
      name: !page ? "No page" : page.sets + page.loose === 0 ? "Page empty" : "Same",
      sets: page ? page.sets + page.loose : 0,
      variants: page ? page.variants : 0,
    },
  };
}

/**
 * Splits a measured piece into the part that may be committed and the Figma part that may not.
 * The Figma row keeps the kit name under `piece`, because `name` there is the name Figma uses.
 */
function split(piece) {
  const { figma, ...open } = piece;
  return {
    open,
    figma: {
      piece: piece.name,
      page: figma.page,
      name: figma.name,
      sets: figma.sets,
      variants: figma.variants,
    },
  };
}

/**
 * The whole inventory, measured fresh.
 * `inventory` is what gets committed; `figma` is the mirror's own file and stays out of the repo.
 */
export function buildInventory() {
  const index = readJson("contracts/index.json");
  const figma = readFigmaPages();
  const measured = {
    components: index.components.map((row) => split(measure(row, figma))),
    patterns: index.patterns.map((row) => split(measure(row, figma))),
  };
  const all = [...measured.components, ...measured.patterns];
  const open = all.map((piece) => piece.open);

  return {
    inventory: {
      version: 1,
      counts: {
        pieces: open.length,
        byLevel: Object.fromEntries(
          ["atom", "molecule", "organism", "template"].map((level) => [
            level,
            open.filter((piece) => piece.level === level).length,
          ]),
        ),
        examples: open.reduce((total, piece) => total + piece.examples, 0),
        exampleItems: open.reduce((total, piece) => total + piece.exampleItems, 0),
        props: open.reduce((total, piece) => total + piece.props, 0),
        usageRules: open.reduce((total, piece) => total + piece.usageRules, 0),
        piecesWithoutColourLiterals: open.filter((piece) => piece.colourLiterals === 0).length,
        piecesWithOwnStates: open.filter((piece) => piece.ownStates > 0).length,
      },
      components: measured.components.map((piece) => piece.open),
      patterns: measured.patterns.map((piece) => piece.open),
    },
    figma: {
      version: 1,
      note: "Local only: docs/figma/* is gitignored because these links carry a private file's key.",
      pagesFound: all.filter((piece) => piece.figma.page !== null).length,
      pagesWithComponents: all.filter((piece) => piece.figma.sets > 0).length,
      variants: all.reduce((total, piece) => total + piece.figma.variants, 0),
      pieces: all.map((piece) => piece.figma),
    },
  };
}

/**
 * What docs/inventory.json does not match. Empty when it is current.
 * Only the committed file is checked, so this passes on a clone with no Figma board.
 */
export function findDrift() {
  if (!existsSync(outPath)) return [{ what: "docs/inventory.json", why: "missing" }];
  const onDisk = readFileSync(outPath, "utf8");
  const fresh = serialise(buildInventory().inventory);
  if (onDisk === fresh) return [];

  const before = JSON.parse(onDisk);
  const after = JSON.parse(fresh);
  const drift = [];
  for (const group of ["components", "patterns"]) {
    const was = new Map((before[group] ?? []).map((piece) => [piece.name, piece]));
    const now = new Map((after[group] ?? []).map((piece) => [piece.name, piece]));
    for (const name of now.keys()) {
      if (!was.has(name)) drift.push({ what: name, why: "added" });
    }
    for (const name of was.keys()) {
      if (!now.has(name)) drift.push({ what: name, why: "gone" });
    }
    for (const [name, piece] of now) {
      const old = was.get(name);
      if (!old) continue;
      const fields = Object.keys(piece).filter(
        (field) => JSON.stringify(piece[field]) !== JSON.stringify(old[field]),
      );
      if (fields.length > 0) drift.push({ what: name, why: `changed: ${fields.join(", ")}` });
    }
  }
  if (drift.length === 0) drift.push({ what: "counts", why: "changed" });
  return drift;
}

function serialise(inventory) {
  return `${JSON.stringify(inventory, null, 2)}\n`;
}

/** Writes docs/inventory.json, and the Figma file beside the board when that board is here. */
export function writeInventory() {
  const { inventory, figma } = buildInventory();
  writeFileSync(outPath, serialise(inventory));
  const boardIsHere = existsSync(dirname(figmaOutPath));
  if (boardIsHere) writeFileSync(figmaOutPath, serialise(figma));
  return { inventory, figma, wroteFigma: boardIsHere };
}

function main() {
  if (process.argv.includes("--check")) {
    const drift = findDrift();
    if (drift.length === 0) {
      console.log("docs/inventory.json is in sync.");
      return;
    }
    console.error(`${drift.length} change(s) the inventory does not record:`);
    for (const row of drift) console.error(`  ${row.what}: ${row.why}`);
    console.error("Run: npm run inventory");
    process.exitCode = 1;
    return;
  }
  const { inventory, figma, wroteFigma } = writeInventory();
  console.log(
    `docs/inventory.json written: ${inventory.counts.pieces} pieces, ${inventory.counts.usageRules} usage rules.`,
  );
  console.log(
    wroteFigma
      ? `docs/figma/inventory-figma.json written (local only): ${figma.pagesFound} pieces have a Figma page.`
      : "No docs/figma/ here, so the Figma columns were not written.",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
