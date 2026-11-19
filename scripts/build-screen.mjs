#!/usr/bin/env node
/**
 * npm run build-screen -- <spec.json>
 *
 * Validates a screen spec against the contracts, then writes the screen it describes under
 * src/app/(examples)/<name>/, one page per state the spec declares. Nothing is written when the spec
 * has a single error: an invalid spec never becomes code.
 *
 *   --dry      print what it would write, write nothing
 *   --json     one JSON object, for a machine
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { repoRoot } from "./review/catalog.mjs";
import { validateSpecFile } from "./spec/schema.mjs";
import { screenFiles } from "./spec/render.mjs";

export const BUILD_SCREEN_HELP = `Usage: npm run build-screen -- <spec.json> [--dry] [--json]

Writes the screen a spec describes, using kit components and patterns only.

The spec is checked against contracts/index.json first: an unknown pattern, an unknown component, a
prop that is not in a contract or a value outside a closed enum stops the build before any file is
written.

Options:
  --dry     Print the files and their size, write nothing
  --json    One JSON object: { spec, ok, errors, warnings, files }
  -h        Show this help

Exit code: 1 when the spec is invalid, 0 otherwise.`;

/**
 * Validate a spec and write its pages.
 * @returns {{ ok: boolean, spec: object | null, errors: object[], warnings: object[], files: object[] }}
 */
export function buildScreen(specPath, { root = repoRoot, dry = false } = {}) {
  const full = resolve(root, specPath);
  const rel = relative(root, full).replace(/\\/g, "/");
  const checked = validateSpecFile(full, { root });
  if (!checked.ok) return { ok: false, spec: checked.spec, errors: checked.errors, warnings: checked.warnings, files: [] };

  const files = screenFiles(checked.spec, { specPath: rel, root });
  if (!dry) {
    for (const page of files) {
      const target = join(root, page.file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, page.code);
    }
  }
  return {
    ok: true,
    spec: checked.spec,
    errors: [],
    warnings: checked.warnings,
    files: files.map((page) => ({ ...page, bytes: Buffer.byteLength(page.code) })),
  };
}

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/** Errors and warnings as text, one line each with its fix. */
export function formatIssues(issues, label) {
  if (issues.length === 0) return "";
  const lines = ["", `  ${label}`];
  for (const issue of issues) {
    lines.push(`    ${issue.path}  ${issue.message}`);
    if (issue.fix) lines.push(`        fix: ${issue.fix}`);
  }
  return lines.join("\n");
}

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { dry: { type: "boolean" }, json: { type: "boolean" }, help: { type: "boolean", short: "h" } },
    allowPositionals: true,
  });
  if (values.help || positionals.length === 0) {
    console.log(BUILD_SCREEN_HELP);
    process.exit(values.help ? 0 : 1);
  }

  let result;
  try {
    result = buildScreen(positionals[0], { dry: Boolean(values.dry) });
  } catch (error) {
    if (values.json) console.log(JSON.stringify({ ok: false, errors: [{ path: "(spec)", message: error.message }] }, null, 2));
    else console.error(`\n  ${error.message}\n`);
    process.exit(1);
  }

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (!result.ok) {
    console.error(`\n  ${bold("The spec is not buildable.")} Nothing was written.`);
    console.error(formatIssues(result.errors, "errors"));
    console.error(formatIssues(result.warnings, "warnings"));
    console.error("");
    process.exit(1);
  }

  console.log(`\n  ${bold(values.dry ? "Would write:" : "Wrote:")}`);
  for (const page of result.files) console.log(`    ${page.file}  ${dim(`${page.state}  ${page.route}`)}`);
  if (result.warnings.length > 0) console.log(formatIssues(result.warnings, "warnings"));
  console.log(`\n  ${dim("Next: npm run loop -- " + positionals[0])}\n`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main(process.argv.slice(2));
