#!/usr/bin/env node
// npm run new-screen -- --template dashboard --route sales
// Copies a starter page from starters/<template>/page.tsx to src/app/<route>/page.tsx, so you open a
// working screen instead of a blank file. Plain Node, no dependencies.
//
// newScreen() does the work and throws clear errors; the CLI at the bottom turns them into messages and
// exit codes. The installer (packages/create-agentic-bp-ds) runs this same file after it unpacks the kit.

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Routes the playground owns. A screen cannot take one of these: it would hide a catalog page.
const RESERVED = ["components", "patterns", "foundations", "start"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class NewScreenError extends Error {
  constructor(message, { templates } = {}) {
    super(message);
    this.name = "NewScreenError";
    // When the template is the problem, the CLI prints the list of real ones after the message.
    this.templates = templates;
  }
}

/** Every starter in starters/index.json, in file order. */
export function readStarters(root) {
  const file = join(root, "starters", "index.json");
  if (!existsSync(file)) throw new NewScreenError("This kit has no starters/index.json, so there are no starter pages to copy.");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new NewScreenError("starters/index.json is not valid JSON.");
  }
  const starters = parsed?.starters;
  if (!Array.isArray(starters) || starters.length === 0) throw new NewScreenError("starters/index.json lists no starters.");
  return starters;
}

/**
 * Finds a starter by its id or by the pattern it is built on, either way it is spelled:
 * dashboard, Dashboard and DASHBOARD all find the dashboard starter.
 */
export function findStarter(starters, template) {
  const want = String(template ?? "").trim().toLowerCase();
  if (!want) return undefined;
  return starters.find((s) => s.id.toLowerCase() === want || String(s.template ?? "").toLowerCase() === want);
}

/**
 * Copies one starter page into src/app/<route>/page.tsx.
 * @param {object} options
 * @param {string} options.root The kit folder (the one holding starters/ and src/).
 * @param {string} [options.template] A starter id, or the name of the pattern it is built on.
 * @param {string} [options.route] The URL the screen gets, lowercased. Defaults to the starter's id.
 * @param {boolean} [options.force] Overwrite a page that is already there.
 * @returns {{ id: string, title: string, template: string | null, route: string, file: string, url: string }}
 */
export function newScreen({ root, template, route, force = false }) {
  const starters = readStarters(root);

  if (!template) throw new NewScreenError("Say which starter to copy with --template.", { templates: starters });
  const starter = findStarter(starters, template);
  if (!starter) throw new NewScreenError(`There is no starter called "${template}".`, { templates: starters });

  // A route is lowercase, so Sales becomes sales rather than being refused. Everything else about it still has
  // to be a plain slug.
  const slug = String(route ?? starter.id).trim().toLowerCase();
  if (!SLUG.test(slug)) {
    throw new NewScreenError(
      `"${slug}" is not a route. Use letters, numbers and single dashes, like sales or sales-orders.`,
    );
  }
  if (RESERVED.includes(slug)) {
    throw new NewScreenError(`The catalog already owns /${slug}. Pick another route.`);
  }

  const source = join(root, "starters", starter.id, "page.tsx");
  if (!existsSync(source)) throw new NewScreenError(`The ${starter.id} starter has no page.tsx, so there is nothing to copy.`);

  const folder = join(root, "src", "app", slug);
  const file = join(folder, "page.tsx");
  if (existsSync(file) && !force) {
    throw new NewScreenError(`src/app/${slug}/page.tsx already exists. Run it again with --force to overwrite it.`);
  }

  mkdirSync(folder, { recursive: true });
  writeFileSync(file, readFileSync(source, "utf8"));

  return {
    id: starter.id,
    title: starter.title ?? starter.id,
    template: starter.template ?? null,
    route: slug,
    file: `src/app/${slug}/page.tsx`,
    url: `http://localhost:3000/${slug}`,
  };
}

// ---- The command line ----------------------------------------------------------------------------

/** Reads --template, --route and --force. Accepts --route=sales as well as --route sales. */
export function parseArgs(argv) {
  const out = { force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") {
      out.force = true;
    } else if (arg === "--template" || arg === "--route") {
      out[arg.slice(2)] = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--template=") || arg.startsWith("--route=")) {
      const [key, ...rest] = arg.slice(2).split("=");
      out[key] = rest.join("=");
    }
  }
  return out;
}

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function printTemplates(starters) {
  console.error("\n  The starters in this kit:\n");
  const width = Math.max(...starters.map((s) => s.id.length));
  for (const s of starters) console.error(`    ${s.id.padEnd(width)}  ${s.about ?? s.title ?? ""}`);
  console.error(`\n  ${dim("npm run new-screen -- --template dashboard --route sales")}\n`);
}

function main() {
  const { template, route, force } = parseArgs(process.argv.slice(2));
  let made;
  try {
    made = newScreen({ root: process.cwd(), template, route, force });
  } catch (error) {
    if (!(error instanceof NewScreenError)) throw error;
    console.error(`\n  ${error.message}`);
    if (error.templates) printTemplates(error.templates);
    else console.error("");
    process.exit(1);
  }

  console.log(`
  ${bold("Done.")} ${made.title} is at ${bold(made.file)}.

  Next:
    1. npm run dev
    2. Open ${bold(made.url)}
    3. Open the folder in Claude and ask for a change in your own words.
`);
}

// Run only when this file is the command, not when something imports it. Both sides are followed to the real
// file first: on macOS a path under /var/folders is a symlink to /private/var/folders, and the two spellings
// would otherwise never match.
const real = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
};
const thisFile = () => {
  try {
    return real(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
};
const here = thisFile();
if (here && process.argv[1] && real(process.argv[1]) === here) main();
