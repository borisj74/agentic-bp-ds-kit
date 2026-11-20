#!/usr/bin/env node
/**
 * npm run figma:batch -- <spec.json ...>
 *
 * Many specs, one pass: the code loop first, then the Figma scripts for the ones that passed it.
 *
 * The rule the skill works to is that only a screen that holds up in code is rendered into Figma.
 * One spec at a time that is a judgement call; a batch makes it a step. This runs `npm run loop` for
 * every spec given — one dev server for all of them, which is most of what a batch saves — plans and
 * emits the ones that pass, and writes a single report that spells out the failures and does no more
 * than name the passes.
 *
 * Nothing here talks to Figma. Each passing spec leaves two scripts behind:
 *
 *   <out>/<name>.render.js   the render, for one use_figma call
 *   <out>/<name>.audit.js    the audit, for one more
 *
 * Exit code: 1 when any spec failed the code loop or the plan, 0 otherwise.
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../review/catalog.mjs";
import { runLoop, startServer } from "../loop.mjs";
import { auditScript } from "./audit.js";
import { emitScript, TARGET_PAGE } from "./emit.mjs";
import { DEFAULT_BRAND, planFile, THEMES } from "./plan.mjs";

export const BATCH_HELP = `Usage: npm run figma:batch -- <spec.json ...> [options]

Runs the code loop on every spec, then writes the Figma render and audit scripts for the ones that
pass it. Only a screen that holds up in code is rendered.

Options:
  --dir <dir>      Take every *.json in this directory as a spec
  --out <dir>      Where the render and audit scripts go (default reports/figma-loop/batch)
  --report <file>  Where the summary goes (default reports/figma-loop/batch.md)
  --attempts <n>   Attempts per spec in the code loop (default 3)
  --port <n>       Port for the one dev server (default 3123)
  --shots          Take the code loop's screenshots too (off by default: a batch is slow enough)
  --brand <name>   The Ref mode every render uses (default ${DEFAULT_BRAND})
  --themes <list>  The schemes to render (default ${THEMES.join(",")})
  --page <name>    The Figma page to render to (default ${TARGET_PAGE})
  --json           One JSON object instead of text
  -h, --help       Show this help

Exit code: 1 when any spec failed, 0 otherwise.`;

/** Where the scripts and the summary go. */
export const BATCH_DIR = "reports/figma-loop/batch";
export const BATCH_REPORT = "reports/figma-loop/batch.md";

/** Every *.json in a directory, in name order: the specs a `--dir` run takes. */
export function specsIn(dir, root = repoRoot) {
  const full = resolve(root, dir);
  if (!existsSync(full) || !statSync(full).isDirectory()) throw new Error(`There is no directory at ${dir}.`);
  return readdirSync(full)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => relative(root, join(full, name)).replace(/\\/g, "/"));
}

const ms = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`);

/**
 * The summary: the failures in full, the passes as a list.
 *
 * A batch is read to find out what to do next, so what went wrong is spelled out and what went right
 * is one row. Every row carries the time it took, which is the other thing a batch is read for.
 */
export function formatBatch(runs, { out, page }) {
  const ready = runs.filter((run) => run.ok);
  const broken = runs.filter((run) => !run.ok);
  const lines = [
    "# Spec batch",
    "",
    `${runs.length} spec(s): ${ready.length} ready to render, ${broken.length} failed. Page **${page}**.`,
    "",
    "## Ready to render",
    "",
  ];
  if (ready.length === 0) {
    lines.push("None. Nothing is rendered into Figma.", "");
  } else {
    lines.push("| Spec | Frames | Code loop | Plan + emit | Render script | Audit script |", "|---|---|---|---|---|---|");
    for (const run of ready)
      lines.push(
        `| \`${run.spec}\` | ${run.frames.length} | ${ms(run.loopMs)} | ${ms(run.planMs)} | \`${run.render}\` | \`${run.audit}\` |`,
      );
    lines.push("", `Send each render as one \`use_figma\` call, then its audit as one more. The scripts are under \`${out}\`.`, "");
  }

  lines.push("## Failed", "");
  if (broken.length === 0) {
    lines.push("None.", "");
  } else {
    for (const run of broken) {
      lines.push(`### \`${run.spec}\``, "", `${run.stage} — ${ms(run.loopMs + (run.planMs ?? 0))}. Nothing was rendered.`, "");
      for (const issue of run.errors) lines.push(`- ${issue.path ? `\`${issue.path}\`  ` : ""}${issue.message}${issue.fix ? `\n  - fix: ${issue.fix}` : ""}`);
      if (run.report) lines.push("", `Code loop report: \`${run.report}\``);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

/**
 * One batch.
 * @param {string[]} specFiles
 * @param {object} [options]
 */
export async function runBatch(
  specFiles,
  {
    root = repoRoot,
    out = BATCH_DIR,
    port = 3123,
    attempts = 3,
    shots = false,
    brand = DEFAULT_BRAND,
    themes = THEMES,
    page = TARGET_PAGE,
    log = () => {},
    server: openServer = startServer,
  } = {},
) {
  if (specFiles.length === 0) throw new Error("No spec to run.");
  const outDir = resolve(root, out);
  mkdirSync(outDir, { recursive: true });

  // One dev server for the whole batch. Starting next dev costs more than a spec's own review, so the
  // loop is handed a server that is already up and a stop that does nothing.
  const server = await openServer({ root, port, log });
  const shared = async () => ({ ...server, stop: async () => {} });

  const runs = [];
  try {
    for (const spec of specFiles) {
      log(`\n  ${spec}`);
      const began = Date.now();
      let loop;
      try {
        loop = await runLoop(spec, { root, port, attempts, shots, log: () => {}, server: shared });
      } catch (error) {
        runs.push({ spec, ok: false, stage: "the spec could not be read", loopMs: Date.now() - began, errors: [{ message: error instanceof Error ? error.message : String(error) }], frames: [] });
        log("  failed: the spec could not be read");
        continue;
      }
      const loopMs = Date.now() - began;
      if (!loop.ok) {
        const errors = loop.invalid
          ? loop.invalid
          : (loop.attempts.at(-1)?.findings ?? []).filter((finding) => finding.severity === "error").map((finding) => ({ path: `${finding.file}:${finding.line}`, message: `${finding.rule} — ${finding.message}`, fix: finding.fix }));
        runs.push({ spec, ok: false, stage: loop.invalid ? "the spec does not check out" : "the code loop still has errors", loopMs, errors, report: loop.reportFile ?? null, frames: [] });
        log(`  failed in code: ${errors.length} error(s). Not rendered.`);
        continue;
      }

      const planBegan = Date.now();
      let plan;
      try {
        plan = planFile(spec, { root, brand, themes });
      } catch (error) {
        runs.push({ spec, ok: false, stage: "the plan could not be built", loopMs, planMs: Date.now() - planBegan, errors: [{ message: error instanceof Error ? error.message : String(error) }], report: loop.reportFile, frames: [] });
        log("  failed in the plan");
        continue;
      }
      if (!plan.ok) {
        runs.push({ spec, ok: false, stage: "the plan does not hold", loopMs, planMs: Date.now() - planBegan, errors: plan.errors, report: loop.reportFile, frames: [] });
        log(`  failed in the plan: ${plan.errors.length} error(s). Not rendered.`);
        continue;
      }

      let render;
      try {
        render = emitScript(plan, { page });
      } catch (error) {
        runs.push({ spec, ok: false, stage: "the render script could not be written", loopMs, planMs: Date.now() - planBegan, errors: [{ message: error instanceof Error ? error.message : String(error) }], report: loop.reportFile, frames: [] });
        log("  failed in emit");
        continue;
      }
      const renderFile = join(outDir, `${plan.name}.render.js`);
      const auditFile = join(outDir, `${plan.name}.audit.js`);
      writeFileSync(renderFile, render.code);
      writeFileSync(auditFile, auditScript(plan, { page }));
      runs.push({
        spec,
        ok: true,
        name: plan.name,
        loopMs,
        planMs: Date.now() - planBegan,
        frames: render.frames,
        dropped: plan.dropped,
        report: loop.reportFile,
        render: relative(root, renderFile).replace(/\\/g, "/"),
        audit: relative(root, auditFile).replace(/\\/g, "/"),
      });
      log(`  ready: ${render.frames.length} frame(s), ${render.size} characters`);
    }
  } finally {
    await server.stop();
  }

  const report = formatBatch(runs, { out, page });
  const reportFile = resolve(root, BATCH_REPORT);
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, report);
  return { ok: runs.every((run) => run.ok), runs, report, reportFile: relative(root, reportFile).replace(/\\/g, "/"), out };
}

// ---- the command line ----------------------------------------------------------------------------

async function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      dir: { type: "string" },
      out: { type: "string" },
      report: { type: "string" },
      attempts: { type: "string" },
      port: { type: "string" },
      shots: { type: "boolean", default: false },
      brand: { type: "string" },
      themes: { type: "string" },
      page: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  const specs = values.dir ? specsIn(values.dir) : positionals;
  if (values.help || specs.length === 0) {
    console.log(BATCH_HELP);
    process.exit(values.help ? 0 : 1);
  }

  const log = values.json ? () => {} : (line) => console.log(line);
  let result;
  try {
    result = await runBatch(specs, {
      out: values.out ?? BATCH_DIR,
      port: values.port ? Number(values.port) : undefined,
      attempts: values.attempts ? Number(values.attempts) : undefined,
      shots: values.shots,
      brand: values.brand ?? DEFAULT_BRAND,
      themes: values.themes ? values.themes.split(",").map((t) => t.trim()).filter(Boolean) : THEMES,
      page: values.page ?? TARGET_PAGE,
      log,
    });
  } catch (error) {
    if (values.json) console.log(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    else console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
  if (values.report && values.report !== BATCH_REPORT) writeFileSync(resolve(repoRoot, values.report), result.report);

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  const ready = result.runs.filter((run) => run.ok);
  console.log(`\n  ${ready.length} of ${result.runs.length} spec(s) ready to render.`);
  for (const run of result.runs.filter((r) => !r.ok)) console.log(`  failed  ${run.spec}: ${run.stage}`);
  console.log(`  Report: ${result.reportFile}`);
  console.log("");
  process.exit(result.ok ? 0 : 1);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) await main(process.argv.slice(2));
