#!/usr/bin/env node
/**
 * npm run loop -- <spec.json>
 *
 * The whole loop in one command: spec → screen → render → review → fix → render again.
 *
 *   1. check the spec against the contracts
 *   2. write the screen under src/app/(examples)/<name>/, one page per state
 *   3. start next dev with NEXT_PUBLIC_BP_INSPECT=1 so the kit pieces wear their name tags
 *   4. review every page twice: its code, and the screen the server actually serves, and type-check it
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
import { TYPE_RULE, typecheckPages } from "./spec/typecheck.mjs";
import { editSpecText, specFormat, specText } from "./spec/write.mjs";

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

/** How long a page gets after it goes quiet, so charts finish drawing before the shot. */
export const SETTLE_MS = 800;

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// ---- the dev server ------------------------------------------------------------------------------

/**
 * next dev, and the local `next` binary rather than `npx`: npx is a process of its own that spawns
 * next as a child, so killing npx leaves next running and holding the port.
 */
export function devCommand(root) {
  const local = join(root, "node_modules", ".bin", "next");
  if (existsSync(local)) return { command: local, args: ["dev"] };
  return { command: "npx", args: ["next", "dev"] };
}

/**
 * Start next dev with the inspect env var and wait for it to answer.
 *
 * The server runs in its own process group (`detached`), and stop() signals the whole group rather
 * than the one process it spawned: next dev forks workers, and under npx there is a wrapper process
 * in between. Signalling only the first one leaves a server listening on the port after the loop ends.
 *
 * `command` and `args` are the seam a test uses in place of a real dev server. The command line never
 * passes either.
 *
 * @param {{ root?: string, port?: number, timeout?: number, log?: (line: string) => void,
 *   command?: string, args?: string[] }} [options]
 */
export async function startServer({ root = repoRoot, port = 3123, timeout = 180000, log = () => {}, command, args } = {}) {
  const dev = devCommand(root);
  const run = command ?? dev.command;
  const runArgs = command ? (args ?? []) : [...dev.args, "--port", String(port)];
  const child = spawn(run, runArgs, {
    cwd: root,
    env: { ...process.env, [INSPECT_ENV]: "1", NODE_ENV: "development", BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  // The group, when the child is still a group of its own; the child alone once it has been reaped.
  const signal = (sig) => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    try {
      process.kill(-child.pid, sig);
    } catch {
      try {
        child.kill(sig);
      } catch {
        // already gone
      }
    }
  };

  // localhost, not 127.0.0.1: next dev treats the numeric host as a cross-origin request, refuses the
  // HMR websocket, and the page then never hydrates — charts stay empty and nothing is clickable.
  const base = `http://localhost:${port}`;
  const ended = new Promise((done) => child.once("exit", done));
  const stop = async () => {
    signal("SIGTERM");
    await Promise.race([ended, wait(2000)]);
    signal("SIGKILL");
    await Promise.race([ended, wait(1000)]);
  };
  const onExit = () => signal("SIGKILL");
  process.on("exit", onExit);
  ended.then(() => process.removeListener("exit", onExit));

  const until = Date.now() + timeout;
  log(`  starting next dev on ${base} with ${INSPECT_ENV}=1`);
  while (Date.now() < until) {
    if (child.exitCode !== null) {
      throw new Error(`next dev stopped before it was ready:\n${output.join("").slice(-2000)}`);
    }
    try {
      const response = await fetch(base, { headers: { accept: "text/html" } });
      if (response.status < 500) return { base, port, stop, output, pid: child.pid };
    } catch {
      // not up yet
    }
    await wait(500);
  }
  await stop();
  throw new Error(`next dev did not answer on ${base} within ${Math.round(timeout / 1000)}s.`);
}

/** Ask for a page once so Next compiles it before it is reviewed or photographed. */
async function warm(url, { timeout = 180000, fetchImpl = fetch } = {}) {
  const until = Date.now() + timeout;
  let last = "no answer";
  while (Date.now() < until) {
    try {
      const response = await fetchImpl(url, { headers: { accept: "text/html" } });
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
      const SETTLE = SETTLE_MS;

      for (const spot of pages) {
        const file = join(folder, `${spot.state}-${theme}.png`);
        await page.goto(base + spot.route, { waitUntil: "networkidle" });
        // The dev server draws its own badge over the bottom left corner. It is not part of the
        // screen, so it is hidden rather than photographed.
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
        // A chart measures its box and then draws, and the drawing is animated: without this the shot
        // can catch bars that have not grown yet.
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(SETTLE);
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
async function attemptOnce(spec, { root, base, specPath, log, fetchImpl = fetch }) {
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

  // A page can pass both reviews and still not compile: `style` on a component whose props do not take
  // it is a prop no contract lists and no rule reads. TypeScript is the one that knows.
  const types = typecheckPages(pages.map((page) => page.file), { root });
  if (types.skipped) log(`  types: not checked — ${types.skipped}`);
  else log(`  types: ${types.findings.length === 0 ? "clean" : `${types.findings.length} ${types.findings.length === 1 ? "error" : "errors"}`}`);

  const live = [];
  for (const page of pages) {
    const url = base + page.route;
    await warm(url, { fetchImpl });
    const result = await reviewUrl(url, { root, fetchImpl });
    live.push({ state: page.state, url, findings: result.findings, pieces: result.live.pieces.length, patterns: result.live.patterns.map((p) => p.name) });
    const errors = errorsOf(result.findings).length;
    log(`  live ${page.route}: ${result.live.pieces.length} kit pieces, ${errors} ${errors === 1 ? "error" : "errors"}`);
  }

  const findings = [
    ...code.findings.map((f) => ({ ...f, where: "code" })),
    ...types.findings.map((f) => ({ ...f, where: "types" })),
    ...live.flatMap((page) => page.findings.map((f) => ({ ...f, where: `live ${page.state}`, file: page.url, line: 0 }))),
  ];
  return { pages, code, live, types, findings };
}

// ---- the report ----------------------------------------------------------------------------------

const tick = (ok) => (ok ? "pass" : "fail");

/** The report the loop leaves behind: every rule, every attempt, every screenshot. */
export function formatReport({ spec, specPath, attempts, shots, skipped, ok, saved = [], forPerson = [] }) {
  const last = attempts[attempts.length - 1];
  const ruleRows = [...RULES, ...LIVE_RULES, TYPE_RULE].map((rule) => {
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
  lines.push("## Repairs written back to the spec");
  lines.push("");
  if (saved.length === 0) lines.push(`The spec was built as it was written: \`${specPath}\` is unchanged.`);
  else {
    lines.push(`These were written back into \`${specPath}\`, so the next run starts from the repaired spec:`);
    lines.push("");
    for (const fix of saved) lines.push(`- \`${fix.rule}\` ${fix.what}`);
  }
  lines.push("");
  lines.push("## Left for a person");
  lines.push("");
  if (forPerson.length === 0) lines.push("Nothing: every raw value the loop met had a token it could write.");
  else {
    lines.push("The loop looked at these and left them as they are, since no token fits without changing what the value means:");
    lines.push("");
    for (const item of forPerson) lines.push(`- \`${item.rule}\` ${item.what}`);
  }
  lines.push("");
  lines.push(`Served by next dev with \`${INSPECT_ENV}=1\`.`);
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
  {
    root = repoRoot,
    port = 3123,
    attempts: maxAttempts = 3,
    shots: wantShots = true,
    updateReferences = false,
    log = () => {},
    // The two seams a test uses in place of a real dev server: the server it talks to, and how it asks
    // for a page. The command line never passes either.
    server: openServer = startServer,
    fetchImpl = fetch,
  } = {},
) {
  const full = resolve(root, specFile);
  const specPath = relative(root, full).replace(/\\/g, "/");
  if (!existsSync(full)) throw new Error(`There is no spec at ${specPath}.`);
  // Two objects, on purpose. `raw` is the spec exactly as the file holds it, and it is the one every
  // repair is made to and the one written back: it carries the file's own key order and nothing the
  // schema filled in. `spec` is what the check hands back — the same spec with its defaults — and it is
  // what the screen is built from. Writing `spec` back would reorder every key in the file.
  let raw = JSON.parse(readFileSync(full, "utf8"));
  let spec = raw;

  const saved = [];
  const forPerson = [];
  /** Repair `raw`, and take the checked spec that comes of it. */
  const repairRaw = () => {
    const repaired = fixSpec(raw, { root });
    if (repaired.fixes.length > 0) {
      raw = repaired.spec;
      const checked = validateSpec(raw, { root });
      if (checked.spec) spec = checked.spec;
    }
    return repaired;
  };

  const first = validateSpec(raw, { root });
  if (!first.ok) {
    const repaired = repairRaw();
    const second = repaired.fixes.length > 0 ? validateSpec(raw, { root }) : first;
    if (!second.ok) return { ok: false, invalid: first.errors, attempts: [], shots: [], saved: [], report: repaired.report, spec, specPath };
    saved.push(...repaired.fixes);
    forPerson.push(...repaired.report);
    log(`  repaired the spec: ${repaired.fixes.map((f) => f.what).join(" ")}`);
  } else {
    spec = first.spec;
  }

  const server = await openServer({ root, port, log });
  const history = [];
  let shots = [];
  let skipped = null;
  let ok = false;
  let pages = [];

  try {
    for (let n = 1; n <= maxAttempts; n += 1) {
      log(`\n  attempt ${n} of ${maxAttempts}`);
      const attempt = await attemptOnce(spec, { root, base: server.base, specPath, log, fetchImpl });
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

      const repaired = repairRaw();
      for (const item of repaired.report) {
        if (forPerson.some((seen) => seen.what === item.what)) continue;
        forPerson.push(item);
        log(`  left for you ${item.rule}: ${item.what}`);
      }
      if (repaired.fixes.length === 0) {
        log("  nothing the loop can repair on its own; stopping.");
        break;
      }
      row.fixes = repaired.fixes;
      saved.push(...repaired.fixes);
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

  // The spec is the source of truth, so a repair that only reached the generated page would be undone
  // by the next build. Whatever the loop fixed is written back into the spec file itself.
  if (saved.length > 0) {
    const written = saveSpec(full, raw);
    log(`  wrote ${saved.length} ${saved.length === 1 ? "repair" : "repairs"} back into ${specPath}`);
    if (written.reformatted) log(`  note: ${specPath} is not written the way JSON.stringify writes it, so the whole file was reformatted.`);
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

  const report = formatReport({ spec, specPath, attempts: history, shots, skipped, ok, saved, forPerson });
  const reportFile = join(root, REPORT_DIR, `${spec.name}.md`);
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, report);

  return {
    ok,
    attempts: history,
    shots,
    skipped,
    saved,
    forPerson,
    report,
    reportFile: relative(root, reportFile).replace(/\\/g, "/"),
    spec,
    specPath,
  };
}

/**
 * Write a repaired spec back to its file as an edit of the file's own text.
 *
 * The spec is written by hand: inline arrays, inline props objects, its own key order. A repair changes
 * one value, so that one value is replaced where it sits and every other byte stays as it was — the
 * diff is the repair. A file whose text cannot carry the change (a key added or gone at the top level)
 * is written again in the formatting it came with, and `reformatted` says so.
 *
 * @returns {{ file: string, reformatted: boolean }}
 */
export function saveSpec(file, spec) {
  const before = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (before !== null) {
    try {
      const edited = editSpecText(before, JSON.parse(before), spec);
      if (edited !== null) {
        writeFileSync(file, edited);
        return { file, reformatted: false };
      }
    } catch {
      // not JSON any more, or not a text this can edit: written again below
    }
  }
  writeFileSync(file, specText(spec, before === null ? { eol: "\n", indent: 2, finalNewline: true } : specFormat(before)));
  return { file, reformatted: before !== null };
}

export { specFormat };

// ---- the command line ----------------------------------------------------------------------------

const bold = (s) => `\x1b[1m${s}\x1b[0m`;

/**
 * The loop's flags. allowNegative is what makes --no-shots the off switch for shots, rather than an
 * unknown option the command refuses.
 */
export function parseLoopArgs(argv) {
  return parseArgs({
    args: argv,
    allowNegative: true,
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
}

async function main(argv) {
  const { values, positionals } = parseLoopArgs(argv);
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
  if (result.saved?.length) console.log(`  Wrote ${result.saved.length} repair(s) back into ${result.specPath}`);
  for (const item of result.forPerson ?? []) console.log(`  Left for you: ${item.what}`);
  console.log(`  Report: ${result.reportFile}`);
  if (result.skipped) console.log(`  No screenshots: ${result.skipped}`);
  else for (const shot of result.shots) console.log(`  ${shot.file}`);
  console.log("");
  process.exit(result.ok ? 0 : 1);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) await main(process.argv.slice(2));
