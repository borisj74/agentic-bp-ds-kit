#!/usr/bin/env node
/**
 * npm run loop -- <spec.json>
 *
 * The whole loop in one command: spec → screen → render → review → fix → render again.
 *
 *   1. check the spec against the contracts
 *   2. write the screen under src/app/(examples)/<name>/, one page per state
 *   3. start next dev with NEXT_PUBLIC_BP_INSPECT=1 so the kit pieces wear their name tags
 *   4. review every page twice: its code, and the screen the server actually serves
 *   5. take a 1440x900 screenshot of each page, light and dark
 *   6. on any error, repair what can be repaired and go round again — three attempts at most
 *   7. write reports/loop/<name>.md: every rule, every attempt, every screenshot
 *
 * Exit code: 1 when the last attempt still has an error, 0 otherwise.
 */
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { RULES, reviewFiles, summarize } from "./review/index.mjs";
import { INSPECT_ENV, LIVE_RULES, reviewUrl } from "./review/live.mjs";
import { repoRoot } from "./review/catalog.mjs";
import { validateSpec } from "./spec/schema.mjs";
import { screenFiles } from "./spec/render.mjs";
import { fixSpec } from "./spec/fix.mjs";

export const LOOP_HELP = `Usage: npm run loop -- <spec.json> [options]

Builds the screen a spec describes, renders it, reviews the code and the served page, takes
screenshots, and repairs what it can — up to three attempts — then writes a report.

Options:
  --attempts <n>   How many attempts at most (default 3)
  --port <n>       Port for next dev (default 3123)
  --no-shots       Skip the screenshots
  --update-references  Copy the ready light screenshot into docs/references/screenshots/
  --json           One JSON object instead of text
  -h, --help       Show this help

Exit code: 1 when the last attempt still has an error, 0 otherwise.`;

/** Where the loop keeps what it made. */
export const REPORT_DIR = "reports/loop";
export const REFERENCE_SHOTS = "docs/references/screenshots";

/** The viewport every screenshot is taken at. */
export const VIEWPORT = { width: 1440, height: 900 };

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// ---- the dev server ------------------------------------------------------------------------------

/** Start next dev with the inspect env var and wait for it to answer. */
export async function startServer({ root = repoRoot, port = 3123, timeout = 180000, log = () => {} } = {}) {
  const child = spawn("npx", ["next", "dev", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, [INSPECT_ENV]: "1", NODE_ENV: "development", BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  const base = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (child.exitCode === null) child.kill("SIGTERM");
    await wait(200);
    if (child.exitCode === null) child.kill("SIGKILL");
  };
  process.on("exit", () => {
    if (child.exitCode === null) child.kill("SIGKILL");
  });

  const until = Date.now() + timeout;
  log(`  starting next dev on ${base} with ${INSPECT_ENV}=1`);
  while (Date.now() < until) {
    if (child.exitCode !== null) {
      throw new Error(`next dev stopped before it was ready:\n${output.join("").slice(-2000)}`);
    }
    try {
      const response = await fetch(base, { headers: { accept: "text/html" } });
      if (response.status < 500) return { base, port, stop, output };
    } catch {
      // not up yet
    }
    await wait(500);
  }
  await stop();
  throw new Error(`next dev did not answer on ${base} within ${Math.round(timeout / 1000)}s.`);
}

/** Ask for a page once so Next compiles it before it is reviewed or photographed. */
async function warm(url, { timeout = 180000 } = {}) {
  const until = Date.now() + timeout;
  let last = "no answer";
  while (Date.now() < until) {
    try {
      const response = await fetch(url, { headers: { accept: "text/html" } });
      if (response.ok) return true;
      last = `${response.status} ${response.statusText}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await wait(1000);
  }
  throw new Error(`${url} never came up: ${last}`);
}

// ---- the screenshots -----------------------------------------------------------------------------

/**
 * One screenshot per page per theme, 1440x900. Returns what it wrote, or why it could not.
 * Dark mode is the kit's own: the theme script on the page reads localStorage, so the shot is taken
 * with the theme already chosen rather than with a media query the tokens do not follow.
 */
export async function screenshots(pages, { base, root = repoRoot, name, log = () => {} } = {}) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    return { shots: [], skipped: `playwright is not installed: ${error instanceof Error ? error.message : String(error)}` };
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    return {
      shots: [],
      skipped: `chromium will not start (run npx playwright install chromium): ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  const folder = join(root, REPORT_DIR, name);
  mkdirSync(folder, { recursive: true });
  const shots = [];
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
      if (theme === "dark") {
        await context.addInitScript(() => {
          try {
            window.localStorage.setItem("theme", "dark");
          } catch {
            // a private window has no storage; the page still renders light
          }
        });
      }
      const page = await context.newPage();
      for (const spot of pages) {
        const file = join(folder, `${spot.state}-${theme}.png`);
        await page.goto(base + spot.route, { waitUntil: "networkidle" });
        await page.screenshot({ path: file });
        shots.push({ state: spot.state, theme, route: spot.route, file: relative(root, file).replace(/\\/g, "/") });
        log(`  shot ${spot.route} ${theme}`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return { shots, skipped: null };
}

// ---- one attempt ---------------------------------------------------------------------------------

const errorsOf = (findings) => findings.filter((f) => f.severity === "error");

/** Write the pages, review each one twice, and say what is wrong. */
async function attemptOnce(spec, { root, base, specPath, log }) {
  const pages = screenFiles(spec, { specPath, root });
  for (const page of pages) {
    const target = join(root, page.file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, page.code);
  }

  const code = reviewFiles(
    pages.map((page) => page.file),
    { root },
  );
  log(`  code: ${summarize(code)}`);

  const live = [];
  for (const page of pages) {
    const url = base + page.route;
    await warm(url);
    const result = await reviewUrl(url, { root });
    live.push({ state: page.state, url, findings: result.findings, pieces: result.live.pieces.length, patterns: result.live.patterns.map((p) => p.name) });
    const errors = errorsOf(result.findings).length;
    log(`  live ${page.route}: ${result.live.pieces.length} kit pieces, ${errors} ${errors === 1 ? "error" : "errors"}`);
  }

  const findings = [
    ...code.findings.map((f) => ({ ...f, where: "code" })),
    ...live.flatMap((page) => page.findings.map((f) => ({ ...f, where: `live ${page.state}`, file: page.url, line: 0 }))),
  ];
  return { pages, code, live, findings };
}

// ---- the report ----------------------------------------------------------------------------------

const tick = (ok) => (ok ? "pass" : "fail");

/** The report the loop leaves behind: every rule, every attempt, every screenshot. */
export function formatReport({ spec, specPath, attempts, shots, skipped, ok, port }) {
  const last = attempts[attempts.length - 1];
  const ruleRows = [...RULES, ...LIVE_RULES].map((rule) => {
    const hits = last?.findings.filter((f) => f.rule === rule) ?? [];
    const errors = errorsOf(hits).length;
    const warnings = hits.length - errors;
    const state = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";
    return `| ${rule} | ${state} | ${errors} | ${warnings} |`;
  });

  const lines = [
    `# Loop report — ${spec.title}`,
    "",
    `Spec: \`${specPath}\`  `,
    `Pattern: ${spec.pattern}  `,
    `States: ${[...new Set([spec.state ?? "ready", ...(spec.states ?? [])])].join(", ")}  `,
    `Attempts: ${attempts.length}  `,
    `Result: **${ok ? "pass" : "fail"}**`,
    "",
    "## Rules",
    "",
    "| Rule | Result | Errors | Warnings |",
    "| --- | --- | --- | --- |",
    ...ruleRows,
    "",
    "## Attempts",
    "",
  ];

  for (const attempt of attempts) {
    const errors = errorsOf(attempt.findings).length;
    lines.push(`### Attempt ${attempt.n} — ${tick(errors === 0)}`);
    lines.push("");
    lines.push(`Pages: ${attempt.pages.map((p) => `\`${p.route}\``).join(", ")}  `);
    lines.push(`Code review: ${attempt.codeSummary}  `);
    for (const page of attempt.live) {
      lines.push(
        `Live \`${page.state}\`: ${page.pieces} kit pieces, patterns ${page.patterns.join(", ") || "none"}, ${
          errorsOf(page.findings).length
        } errors  `,
      );
    }
    lines.push("");
    if (attempt.findings.length === 0) lines.push("Nothing to fix.");
    else
      for (const finding of attempt.findings)
        lines.push(`- **${finding.severity}** \`${finding.rule}\` (${finding.where}) ${finding.file}${finding.line ? ":" + finding.line : ""} — ${finding.message}`);
    if (attempt.fixes?.length) {
      lines.push("");
      lines.push("Repaired before the next attempt:");
      for (const fix of attempt.fixes) lines.push(`- \`${fix.rule}\` ${fix.what}`);
    }
    lines.push("");
  }

  lines.push("## Screenshots");
  lines.push("");
  if (skipped) lines.push(`None: ${skipped}`);
  else if (shots.length === 0) lines.push("None were asked for.");
  else for (const shot of shots) lines.push(`- \`${shot.state}\` ${shot.theme} (${VIEWPORT.width}×${VIEWPORT.height}) — \`${shot.file}\``);
  lines.push("");
  lines.push(`Server: next dev on port ${port} with \`${INSPECT_ENV}=1\`.`);
  lines.push("");
  return lines.join("\n");
}

// ---- the loop ------------------------------------------------------------------------------------

/**
 * Run the whole loop for one spec.
 * @returns {{ ok, attempts, shots, report, reportFile, spec }}
 */
export async function runLoop(
  specFile,
  { root = repoRoot, port = 3123, attempts: maxAttempts = 3, shots: wantShots = true, updateReferences = false, log = () => {} } = {},
) {
  const full = resolve(root, specFile);
  const specPath = relative(root, full).replace(/\\/g, "/");
  if (!existsSync(full)) throw new Error(`There is no spec at ${specPath}.`);
  let spec = JSON.parse(readFileSync(full, "utf8"));

  const first = validateSpec(spec, { root });
  if (!first.ok) {
    const repaired = fixSpec(spec);
    const second = repaired.fixes.length > 0 ? validateSpec(repaired.spec, { root }) : first;
    if (!second.ok) return { ok: false, invalid: first.errors, attempts: [], shots: [], spec, specPath };
    spec = repaired.spec;
    log(`  repaired the spec: ${repaired.fixes.map((f) => f.what).join(" ")}`);
  } else {
    spec = first.spec;
  }

  const server = await startServer({ root, port, log });
  const history = [];
  let shots = [];
  let skipped = null;
  let ok = false;
  let pages = [];

  try {
    for (let n = 1; n <= maxAttempts; n += 1) {
      log(`\n  attempt ${n} of ${maxAttempts}`);
      const attempt = await attemptOnce(spec, { root, base: server.base, specPath, log });
      pages = attempt.pages;
      const errors = errorsOf(attempt.findings);
      const row = {
        n,
        pages: attempt.pages.map(({ state, route, file }) => ({ state, route, file })),
        codeSummary: summarize(attempt.code),
        live: attempt.live,
        findings: attempt.findings,
        fixes: [],
      };
      history.push(row);

      if (errors.length === 0) {
        ok = true;
        break;
      }
      if (n === maxAttempts) break;

      const repaired = fixSpec(spec);
      if (repaired.fixes.length === 0) {
        log("  nothing the loop can repair on its own; stopping.");
        break;
      }
      row.fixes = repaired.fixes;
      spec = repaired.spec;
      for (const fix of repaired.fixes) log(`  fixed ${fix.rule}: ${fix.what}`);
    }

    if (wantShots) {
      const result = await screenshots(pages, { base: server.base, root, name: spec.name, log });
      shots = result.shots;
      skipped = result.skipped;
    }
  } finally {
    await server.stop();
  }

  if (updateReferences) {
    // The reference is the screen's own state in light: an empty screen's reference is its empty state.
    const ready = shots.find((shot) => shot.state === (spec.state ?? "ready") && shot.theme === "light");
    if (ready) {
      const target = join(root, REFERENCE_SHOTS, `${spec.name}.png`);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(root, ready.file), target);
      log(`  reference screenshot updated: ${relative(root, target)}`);
    }
  }

  const report = formatReport({ spec, specPath, attempts: history, shots, skipped, ok, port });
  const reportFile = join(root, REPORT_DIR, `${spec.name}.md`);
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, report);

  return { ok, attempts: history, shots, skipped, report, reportFile: relative(root, reportFile).replace(/\\/g, "/"), spec, specPath };
}

// ---- the command line ----------------------------------------------------------------------------

const bold = (s) => `\x1b[1m${s}\x1b[0m`;

async function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      attempts: { type: "string" },
      port: { type: "string" },
      shots: { type: "boolean", default: true },
      "update-references": { type: "boolean" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });
  if (values.help || positionals.length === 0) {
    console.log(LOOP_HELP);
    process.exit(values.help ? 0 : 1);
  }

  const log = values.json ? () => {} : (line) => console.log(line);
  let result;
  try {
    result = await runLoop(positionals[0], {
      port: values.port ? Number(values.port) : undefined,
      attempts: values.attempts ? Number(values.attempts) : undefined,
      shots: values.shots,
      updateReferences: Boolean(values["update-references"]),
      log,
    });
  } catch (error) {
    if (values.json) console.log(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    else console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (result.invalid) {
    console.error(`\n  ${bold("The spec is not buildable.")} Nothing was written.`);
    for (const issue of result.invalid) {
      console.error(`    ${issue.path}  ${issue.message}`);
      if (issue.fix) console.error(`        fix: ${issue.fix}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`\n  ${bold(result.ok ? "Pass." : "Still failing.")} ${result.attempts.length} attempt(s).`);
  console.log(`  Report: ${result.reportFile}`);
  if (result.skipped) console.log(`  No screenshots: ${result.skipped}`);
  else for (const shot of result.shots) console.log(`  ${shot.file}`);
  console.log("");
  process.exit(result.ok ? 0 : 1);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) await main(process.argv.slice(2));
