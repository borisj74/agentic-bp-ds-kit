#!/usr/bin/env node
/**
 * npm run widget -- check|build|loop <spec.json | folder | batch.jsonl>
 *
 *   check  every widget spec against its template: shape, size, params, data, copy, actions and capacity
 *   build  write each tile under src/app/(widgets)/widgets/<batch>/ and the harness that serves it
 *   loop   build, then render every tile in each state it declares, light and dark; review the code with the
 *          existing rules, type-check it, measure that it fits its size, use every declared action against a
 *          stub, take a screenshot of each, repair what can be repaired and go round again — three attempts
 *          at most. Writes reports/widgets/<batch>.md (failures only) and reports/widgets/<batch>.csv (passes).
 *          Repairs stay in this run unless --write saves them into the spec files.
 *   sizes  write contracts/widget-sizes.json from the layout tokens
 *
 * A batch is one .jsonl file (a spec a line), a folder of .json specs, or one spec. Its id is its path as a
 * slug: widgets/billing.jsonl is batch widgets-billing.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../review/catalog.mjs";
import { reviewFiles } from "../review/index.mjs";
import { validateWidgetSpec } from "../spec/schema.mjs";
import { typecheckPages } from "../spec/typecheck.mjs";
import { saveSpec, startServer } from "../loop.mjs";
import { template as widgetTemplate } from "../../templates/widgets/index.mjs";
import { firedActions } from "../../templates/widgets/_shared.mjs";
import { WIDGETS_DIR, harnessFiles, renderTile, tileFile } from "./render.mjs";
import { loadSizes, writeSizes } from "./sizes.mjs";

export const WIDGET_HELP = `Usage: npm run widget -- <check|build|loop|sizes> <spec.json | folder | batch.jsonl> [options]

  check   Check every widget spec against its template, size and capacity. Writes nothing.
  build   Write the tiles and the harness that serves them at /widgets/<batch>/<name>.
  loop    Build, render each state light and dark, review, type-check, measure the fit, use every action
          against a stub, screenshot, repair and retry (3 attempts at most), then write the report.
          Repairs apply to this run only; add --write to save them into the spec files.
  sizes   Write contracts/widget-sizes.json from the layout tokens.

Options:
  --attempts <n>   loop: attempts at most (default 3)
  --port <n>       loop: port for next dev (default 3124)
  --only <names>   comma-separated spec names to run from the batch
  --write          loop: write repairs back into the spec files (off by default)
  --no-write       loop: keep the spec files as they are (the default)
  --no-shots       loop: skip the screenshots
  --json           One JSON object instead of text
  -h, --help       Show this help

Exit code: 1 when a spec is invalid or still fails, 0 otherwise.`;

export const REPORT_DIR = "reports/widgets";
export const THEMES = ["light", "dark"];
const posix = (p) => p.replace(/\\/g, "/");
const errorsOf = (findings) => findings.filter((f) => f.severity === "error");

// ---- reading a batch -----------------------------------------------------------------------------

/** The batch id: the source's repo-relative path without its extension, as a slug. */
export function batchId(source, root = repoRoot) {
  const rel = posix(relative(root, resolve(root, source))).replace(/\.(jsonl|json)$/, "");
  return rel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "batch";
}

/**
 * Every spec in a source, with where it came from: { raw, file, line? }. A line that is not JSON comes back
 * with `error` instead of `raw`, so one bad line does not hide the rest.
 */
export function loadWidgetSpecs(source, root = repoRoot) {
  const full = resolve(root, source);
  if (!existsSync(full)) throw new Error(`There is nothing at ${source}.`);
  const out = [];
  const one = (file) => {
    const rel = posix(relative(root, file));
    try {
      out.push({ raw: JSON.parse(readFileSync(file, "utf8")), file: rel });
    } catch (error) {
      out.push({ file: rel, error: `${rel} is not valid JSON: ${error.message}` });
    }
  };
  if (statSync(full).isDirectory()) {
    for (const name of readdirSync(full).sort()) if (extname(name) === ".json") one(join(full, name));
  } else if (extname(full) === ".jsonl") {
    const rel = posix(relative(root, full));
    readFileSync(full, "utf8")
      .split(/\r?\n/)
      .forEach((text, i) => {
        if (!text.trim()) return;
        try {
          out.push({ raw: JSON.parse(text), file: rel, line: i + 1 });
        } catch (error) {
          out.push({ file: rel, line: i + 1, error: `${rel}:${i + 1} is not valid JSON: ${error.message}` });
        }
      });
  } else one(full);
  return out;
}

const where = (item) => (item.line ? `${item.file}:${item.line}` : item.file);

/** Check every spec in a batch. */
export function checkBatch(source, { root = repoRoot, only = null } = {}) {
  const items = loadWidgetSpecs(source, root)
    .filter((item) => !only || only.includes(item.raw?.name))
    .map((item) => {
      if (item.error) return { ...item, name: `(line ${item.line ?? 1})`, ok: false, errors: [{ path: "(spec)", message: item.error }] };
      const result = validateWidgetSpec(item.raw);
      return { ...item, name: item.raw?.name ?? "(unnamed)", ...result };
    });
  const names = new Map();
  for (const item of items) {
    if (!item.spec) continue;
    if (names.has(item.name)) {
      item.ok = false;
      item.errors = [...item.errors, { path: "name", message: `${where(names.get(item.name))} is called "${item.name}" too.`, fix: "Give every widget in a batch its own name." }];
    } else names.set(item.name, item);
  }
  return { batch: batchId(source, root), items, ok: items.every((item) => item.ok) };
}

// ---- building ------------------------------------------------------------------------------------

/**
 * Write the tiles for the valid specs of a batch, and the harness that serves them. A file whose text has not
 * changed is left alone, and a tile no longer in the batch is removed, so a dev server watching the folder only
 * recompiles what changed.
 */
export function writeBatch(batch, items, { root = repoRoot } = {}) {
  const dir = join(root, WIDGETS_DIR, batch);
  const specs = items.filter((item) => item.ok).map((item) => item.spec);
  const files = [];
  for (const item of items.filter((i) => i.ok)) {
    const file = tileFile(batch, item.spec.name);
    files.push({ name: item.spec.name, file, code: renderTile(item.spec, { specPath: where(item), root }) });
  }
  const harness = specs.length ? harnessFiles(batch, specs, { root }) : [];
  const keep = new Set(files.map((f) => basename(f.file)));
  if (existsSync(join(dir, "tiles")))
    for (const name of readdirSync(join(dir, "tiles"))) if (!keep.has(name)) rmSync(join(dir, "tiles", name), { force: true });
  if (specs.length === 0) rmSync(dir, { recursive: true, force: true });
  for (const out of [...files, ...harness]) {
    const target = join(root, out.file);
    if (existsSync(target) && readFileSync(target, "utf8") === out.code) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, out.code);
  }
  return { tiles: files, harness };
}

// ---- repairs -------------------------------------------------------------------------------------

/** The next size of the same template that is taller (and no narrower), or wider when nothing is taller. */
export function biggerSize(templateId, size) {
  const t = widgetTemplate(templateId);
  if (!t) return null;
  const { sizes } = loadSizes();
  const now = sizes[size];
  if (!now) return null;
  const taller = t.sizes.filter((id) => sizes[id].columns === now.columns && sizes[id].rows > now.rows).sort((a, b) => sizes[a].rows - sizes[b].rows);
  if (taller.length) return taller[0];
  const wider = t.sizes.filter((id) => sizes[id].columns > now.columns && sizes[id].rows >= now.rows).sort((a, b) => sizes[a].columns - sizes[b].columns || sizes[a].rows - sizes[b].rows);
  return wider[0] ?? null;
}

/**
 * Repair what a widget can repair on its own, always in the spec:
 *   - data over capacity: the smallest allowed size that holds it
 *   - a tile drawn taller than its size (widget/fit): the next taller size of the template. Content wider than
 *     the tile (widget/overflow-x) is never resized for: a taller size is no wider, so it is left for a person.
 *   - more than one strong Button (bp/one-strong-action, bp/one-primary): the rest become minimal
 * Everything else is left for a person. Returns { raw, fixes, left }.
 */
export function repairWidget(raw, findings) {
  const next = structuredClone(raw);
  const fixes = [];
  const left = [];
  const t = widgetTemplate(raw.template);
  // When no size is bigger, a template may say what it can drop instead (a kpi-strip drops its spark lines).
  const relieve = (rule) => {
    const change = t?.relieve?.(next);
    if (!change) return false;
    next.params = change.params;
    fixes.push({ rule, what: change.what });
    return true;
  };
  const over = findings.find((f) => f.over);
  if (over?.over.size) {
    next.size = over.over.size;
    fixes.push({ rule: "widget/capacity", what: `size ${raw.size} → ${next.size}: ${over.over.n} ${over.path.split(".").pop()} need it.` });
  } else if (over && relieve("widget/capacity")) {
    // relieved
  } else if (findings.some((f) => f.rule === "widget/fit")) {
    const bigger = biggerSize(raw.template, raw.size);
    if (bigger) {
      next.size = bigger;
      fixes.push({ rule: "widget/fit", what: `size ${raw.size} → ${bigger}: the tile was drawn taller than ${raw.size}.` });
    } else if (!relieve("widget/fit")) left.push({ rule: "widget/fit", what: `${raw.name} is drawn taller than ${raw.size} and its template has no bigger size; trim the data.` });
  }
  const noFooter = findings.find((f) => f.code === "no-footer");
  if (noFooter) {
    const footer = (next.actions ?? []).find((a) => a.type === "footer");
    if (footer && (next.actions ?? []).filter((a) => a.type === "button").length < 2) {
      footer.type = "button";
      footer.emphasis = "minimal";
      footer.label = footer.label.slice(0, 32);
      fixes.push({ rule: "widget/footer", what: `footer link ${footer.id} is now a minimal header button: a ${raw.template} has no room under its body.` });
    }
  }
  if (findings.some((f) => f.rule === "bp/one-strong-action" || f.rule === "bp/one-primary")) {
    let kept = false;
    for (const action of next.actions ?? []) {
      if (action.type !== "button" || action.emphasis !== "strong") continue;
      if (!kept) {
        kept = true;
        continue;
      }
      action.emphasis = "minimal";
      action.intent = action.intent === "danger" ? "danger" : "brand";
      fixes.push({ rule: "bp/one-strong-action", what: `button ${action.id} is now minimal; the tile keeps one strong action.` });
    }
  }
  for (const f of findings) {
    if (["widget/capacity", "widget/fit", "bp/one-strong-action", "bp/one-primary"].includes(f.rule) || f.over || f.code === "no-footer") continue;
    if (f.severity === "warn") continue;
    if (!left.some((l) => l.what === f.message)) left.push({ rule: f.rule ?? "widget/check", what: f.message });
  }
  return { raw: next, fixes, left };
}

/** Write a repaired spec back where it came from: its own .json file, or its line of the .jsonl. */
export function writeBack(item, raw, root = repoRoot) {
  const file = join(root, item.file);
  if (!item.line) return saveSpec(file, raw);
  const lines = readFileSync(file, "utf8").split("\n");
  lines[item.line - 1] = JSON.stringify(raw);
  writeFileSync(file, lines.join("\n"));
  return { file, reformatted: false };
}

// ---- rendering -----------------------------------------------------------------------------------

async function launch() {
  const { chromium } = await import("playwright");
  try {
    return await chromium.launch();
  } catch (error) {
    // A browser installed for another Playwright version: use it by path rather than downloading another.
    const fallback = process.env.BP_CHROMIUM ?? "/opt/pw-browsers/chromium";
    if (existsSync(fallback)) return chromium.launch({ executablePath: fallback, args: ["--no-sandbox"] });
    throw error;
  }
}

/** How to use one declared action on the rendered tile. */
function actionTarget(page, spec, action) {
  const tile = page.locator("[data-widget-tile]");
  if (action.type === "footer" || action.type === "button" || action.type === "retry")
    // A Link with no href is a button that acts in place, so a footer link answers to either role.
    return tile.getByRole("link", { name: action.label, exact: true }).or(tile.getByRole("button", { name: action.label, exact: true })).first();
  // open: the first row's way in — the first item's title, or the first link cell.
  if (spec.template === "table") {
    const column = spec.data.columns.find((c) => c.type === "link");
    return tile.getByText(spec.data.rows[0][column.key], { exact: true }).first();
  }
  return tile.getByText(spec.data.items[0].title, { exact: true }).first();
}

/**
 * Render one tile in every declared state, light and dark: measure it, photograph it, and use every action it
 * declares against the stub (window.__widget.actions). Returns { findings, shots, fired }.
 */
async function renderOne(page, { base, batch, spec, root, shots: wantShots }) {
  const findings = [];
  const shots = [];
  const fired = [];
  const consoleErrors = [];
  const listener = (msg) => {
    if (msg.type() === "error" && !/Failed to load resource|fonts\.(googleapis|gstatic)|\[HMR\]|Download the React DevTools/.test(msg.text())) consoleErrors.push(msg.text());
  };
  page.on("console", listener);
  const say = (rule, message, fix, extra = {}) => findings.push({ rule, severity: "error", message, fix, ...extra });
  const { sizes } = loadSizes(root);
  const size = sizes[spec.size];
  try {
    await page.goto(`${base}/widgets/${batch}/${spec.name}?state=ready&theme=light`, { waitUntil: "load", timeout: 180000 });
    await page.waitForFunction(() => Boolean(window.__widget), null, { timeout: 60000 });
    for (const theme of THEMES) {
      await page.evaluate((t) => window.__widget.setTheme(t), theme);
      for (const state of spec.states) {
        await page.evaluate((s) => window.__widget.setState(s), state);
        await page.waitForSelector(`[data-widget-stage][data-state="${state}"][data-theme="${theme}"]`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        const box = await page.evaluate(() => {
          const tile = document.querySelector("[data-widget-tile]");
          const section = tile?.firstElementChild;
          if (!section) return null;
          const r = section.getBoundingClientRect();
          return { height: Math.ceil(r.height), scrollWidth: section.scrollWidth, width: Math.floor(r.width), kit: tile.querySelectorAll("[data-bp-kit]").length };
        });
        if (!box) {
          say("widget/render", `${state} ${theme}: nothing was drawn.`, "Read the dev server's output: the tile threw.", { state, theme });
          continue;
        }
        if (box.height > size.height + 1)
          say("widget/fit", `${state} ${theme}: the tile is ${box.height}px tall; a ${spec.size} tile is ${size.height}px.`, "Use a taller size, or give it less data.", { state, theme });
        if (box.scrollWidth > box.width + 1)
          say("widget/overflow-x", `${state} ${theme}: the content is ${box.scrollWidth}px wide in a ${box.width}px tile.`, "Use a wider size, or fewer columns.", { state, theme });
        if (box.kit === 0 && theme === "light")
          say("bp/no-tags", `${state}: no kit piece wears its name tag.`, "Serve the tile with NEXT_PUBLIC_BP_INSPECT=1, and draw it from kit pieces only.", { state, theme });
        if (wantShots) {
          const file = join(root, REPORT_DIR, batch, spec.name, `${state}-${theme}.png`);
          mkdirSync(dirname(file), { recursive: true });
          await page.locator("[data-widget-tile]").screenshot({ path: file });
          shots.push({ state, theme, file: posix(relative(root, file)) });
        }
        if (theme !== "light") continue;
        for (const action of firedActions(spec, state)) {
          await page.evaluate(() => {
            window.__widget.actions.length = 0;
          });
          try {
            await actionTarget(page, spec, action).click({ timeout: 5000 });
            await page.waitForTimeout(50);
          } catch (error) {
            say("widget/action", `${state}: could not use "${action.label ?? action.id}" (${action.type}): ${String(error.message).split("\n")[0]}`, "The template has to draw a control for every action it accepts.", { state, action: action.id });
            continue;
          }
          const got = await page.evaluate(() => [...window.__widget.actions]);
          if (got.includes(action.id)) fired.push(action.id);
          else say("widget/action", `${state}: using "${action.label ?? action.id}" reported ${got.length ? got.join(", ") : "nothing"}, not ${action.id}.`, "Wire the control to onAction with the action's id.", { state, action: action.id });
          // An opened row may have changed the tile; start the next action from the same state.
          await page.evaluate((s) => window.__widget.setState(s === "ready" ? "loading" : "ready"), state);
          await page.evaluate((s) => window.__widget.setState(s), state);
          await page.waitForSelector(`[data-widget-stage][data-state="${state}"]`);
        }
      }
    }
  } catch (error) {
    say("widget/render", `The tile did not render: ${String(error.message).split("\n")[0]}`, "Read the dev server's output.");
  } finally {
    page.off("console", listener);
  }
  for (const text of [...new Set(consoleErrors)].slice(0, 3))
    findings.push({ rule: "widget/console", severity: "warn", message: `Console error: ${text.slice(0, 200)}`, fix: "Read the browser console for this tile." });
  return { findings, shots, fired };
}

async function renderAll(items, { base, batch, root, shots, log, concurrency = 4 }) {
  const browser = await launch();
  const results = new Map();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const queue = [...items];
    const worker = async () => {
      const page = await context.newPage();
      while (queue.length) {
        const item = queue.shift();
        const result = await renderOne(page, { base, batch, spec: item.spec, root, shots });
        results.set(item.spec.name, result);
        log(`  ${errorsOf(result.findings).length ? "fail" : "pass"} ${item.spec.name}`);
      }
      await page.close();
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    await context.close();
  } finally {
    await browser.close();
  }
  return results;
}

// ---- the loop ------------------------------------------------------------------------------------

/**
 * Run the whole loop for a batch.
 * @returns {{ ok, batch, results, reportFile, csvFile }}
 */
export async function runWidgetLoop(
  source,
  { root = repoRoot, port = 3124, attempts: maxAttempts = 3, write = false, shots = true, only = null, log = () => {}, server: openServer = startServer } = {},
) {
  const checked = checkBatch(source, { root, only });
  const batch = checked.batch;
  // One row per spec: where it came from, its spec as the file holds it, and what happened to it.
  const rows = checked.items.map((item) => ({ item, raw: item.raw, spec: item.spec, ok: item.ok, attempts: [], fixes: [], left: [], shots: [], fired: [] }));

  // A spec that does not check is repaired in the spec before anything is built, when it can be.
  for (const row of rows) {
    if (row.ok || !row.raw) continue;
    const repaired = repairWidget(row.raw, row.item.errors);
    if (repaired.fixes.length) {
      const again = validateWidgetSpec(repaired.raw);
      if (again.ok) {
        row.raw = repaired.raw;
        row.spec = again.spec;
        row.ok = true;
        row.fixes.push(...repaired.fixes);
        row.item = { ...row.item, ok: true, spec: again.spec, errors: [] };
        continue;
      }
    }
    row.attempts.push({ n: 0, findings: row.item.errors.map((e) => ({ ...e, rule: e.over ? "widget/capacity" : "widget/check", severity: "error" })) });
    row.left.push(...row.item.errors.map((e) => ({ rule: "widget/check", what: `${e.path}: ${e.message}${e.fix ? ` ${e.fix}` : ""}` })));
    row.ok = false;
    row.final = true;
  }

  let pending = rows.filter((r) => r.spec && !r.final);
  // The tiles are on disk before the server starts, so its first compile already has all of them.
  if (pending.length) writeBatch(batch, pending.map((r) => ({ ...r.item, ok: true, spec: r.spec })), { root });
  const server = pending.length ? await openServer({ root, port, log }) : null;
  try {
    for (let n = 1; n <= maxAttempts && pending.length; n += 1) {
      log(`\n  attempt ${n} of ${maxAttempts}: ${pending.length} ${pending.length === 1 ? "tile" : "tiles"}`);
      const live = rows.filter((r) => r.spec && !r.final);
      writeBatch(batch, live.map((r) => ({ ...r.item, ok: true, spec: r.spec })), { root });
      const files = pending.map((r) => tileFile(batch, r.spec.name));
      const code = reviewFiles(files, { root, all: false });
      const types = typecheckPages(files, { root });
      if (types.skipped) log(`  types: not checked — ${types.skipped}`);
      // The first request compiles the harness and every tile it imports.
      await fetch(`${server.base}/widgets/${batch}/${pending[0].spec.name}`).catch(() => {});
      const rendered = await renderAll(pending, { base: server.base, batch, root, shots, log });

      const still = [];
      for (const row of pending) {
        const file = tileFile(batch, row.spec.name);
        const result = rendered.get(row.spec.name) ?? { findings: [], shots: [], fired: [] };
        const findings = [
          ...code.findings.filter((f) => f.file === file).map((f) => ({ ...f, where: "code" })),
          ...types.findings.filter((f) => f.file === file).map((f) => ({ ...f, where: "types" })),
          ...result.findings.map((f) => ({ ...f, where: "render" })),
        ];
        row.attempts.push({ n, findings });
        row.shots = result.shots;
        row.fired = result.fired;
        if (errorsOf(findings).length === 0) {
          row.ok = true;
          continue;
        }
        row.ok = false;
        if (n === maxAttempts) continue;
        const repaired = repairWidget(row.raw, errorsOf(findings));
        const again = repaired.fixes.length ? validateWidgetSpec(repaired.raw) : null;
        if (again?.ok) {
          row.raw = repaired.raw;
          row.spec = again.spec;
          row.fixes.push(...repaired.fixes);
          still.push(row);
        } else {
          for (const l of repaired.left) if (!row.left.some((x) => x.what === l.what)) row.left.push(l);
        }
      }
      pending = still;
    }
  } finally {
    await server?.stop();
  }

  if (write)
    for (const row of rows) if (row.fixes.length) writeBack(row.item, row.raw, root);

  const report = formatWidgetReport({ batch, source: posix(relative(root, resolve(root, source))), rows, wrote: write });
  const csv = passCsv(rows);
  // A run of a few tiles (--only) does not write over the report of the whole batch.
  const stem = only ? `${batch}.only` : batch;
  const reportFile = join(root, REPORT_DIR, `${stem}.md`);
  const csvFile = join(root, REPORT_DIR, `${stem}.csv`);
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, report);
  writeFileSync(csvFile, csv);
  return {
    ok: rows.every((r) => r.ok),
    batch,
    rows,
    reportFile: posix(relative(root, reportFile)),
    csvFile: posix(relative(root, csvFile)),
  };
}

// ---- the report ----------------------------------------------------------------------------------

const cellText = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

/** The report: a summary, then only the tiles that still fail, with what failed and what was tried. */
export function formatWidgetReport({ batch, source, rows, wrote = false }) {
  const passed = rows.filter((r) => r.ok);
  const failed = rows.filter((r) => !r.ok);
  const repaired = rows.filter((r) => r.fixes.length);
  const byTemplate = new Map();
  for (const r of rows) {
    const t = r.spec?.template ?? r.raw?.template ?? "(unknown)";
    const entry = byTemplate.get(t) ?? { pass: 0, fail: 0 };
    entry[r.ok ? "pass" : "fail"] += 1;
    byTemplate.set(t, entry);
  }
  const lines = [
    `# Widget report — ${batch}`,
    "",
    `Source: \`${source}\`  `,
    `Tiles: ${rows.length} · pass ${passed.length} · fail ${failed.length} · repaired ${repaired.length}  `,
    `Each tile: its size × light and dark × every state it declares (ready, loading, empty, error with retry), reviewed with the kit rules, type-checked, measured against its size, and every declared action used against a stub.  `,
    `Passes are listed in \`${REPORT_DIR}/${batch}.csv\`; screenshots are in \`${REPORT_DIR}/${batch}/\` (not committed).`,
    "",
    "| Template | Pass | Fail |",
    "| --- | --- | --- |",
    ...[...byTemplate.entries()].sort().map(([t, c]) => `| ${t} | ${c.pass} | ${c.fail} |`),
    "",
    "## Failures",
    "",
  ];
  if (failed.length === 0) lines.push("None: every tile passed.", "");
  for (const r of failed) {
    const last = r.attempts[r.attempts.length - 1];
    const name = r.spec?.name ?? r.raw?.name ?? "(unnamed)";
    lines.push(`### ${name}`);
    lines.push("");
    lines.push(`Spec: \`${where(r.item)}\` · template ${r.spec?.template ?? r.raw?.template ?? "?"} · size ${r.spec?.size ?? r.raw?.size ?? "?"} · attempts ${r.attempts.filter((a) => a.n > 0).length}`);
    lines.push("");
    for (const f of errorsOf(last?.findings ?? []))
      lines.push(`- **${f.rule ?? "widget/check"}**${f.where ? ` (${f.where})` : ""}${f.path ? ` \`${f.path}\`` : ""} — ${cellText(f.message)}${f.fix ? ` Fix: ${cellText(f.fix)}` : ""}`);
    if (r.fixes.length) {
      lines.push("");
      lines.push("Tried:");
      for (const fix of r.fixes) lines.push(`- \`${fix.rule}\` ${fix.what}`);
    }
    lines.push("");
  }
  lines.push(wrote ? "## Repairs written back" : "## Repairs for this run");
  lines.push("");
  if (repaired.length === 0) lines.push("None: every spec was built as written.");
  else {
    lines.push(
      wrote
        ? "These were written back into the spec (--write), so the next run starts from them:"
        : "These were made for this run only; the spec files are unchanged. Copy them into the spec, or run again with --write to save them:",
    );
    lines.push("");
    for (const r of repaired) for (const fix of r.fixes) lines.push(`- \`${where(r.item)}\` ${r.spec?.name}: \`${fix.rule}\` ${fix.what}`);
  }
  lines.push("");
  return lines.join("\n");
}

/** One CSV line per tile that passed. */
export function passCsv(rows) {
  const q = (s) => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
  const out = ["name,template,size,states,attempts,repairs,actions_fired,screenshots,spec"];
  for (const r of rows.filter((x) => x.ok))
    out.push(
      [r.spec.name, r.spec.template, r.spec.size, r.spec.states.join(" "), r.attempts.filter((a) => a.n > 0).length, r.fixes.length, [...new Set(r.fired)].join(" "), r.shots.length, where(r.item)]
        .map(q)
        .join(","),
    );
  return `${out.join("\n")}\n`;
}

// ---- the command line ----------------------------------------------------------------------------

const bold = (s) => `\x1b[1m${s}\x1b[0m`;

function printIssues(items) {
  for (const item of items.filter((i) => !i.ok)) {
    console.error(`\n  ${bold(item.name)}  ${where(item)}`);
    for (const e of item.errors) {
      console.error(`    ${e.path}  ${e.message}`);
      if (e.fix) console.error(`        fix: ${e.fix}`);
    }
  }
}

/** Parse the command line. `write` is off unless --write is given. */
export function parseWidgetArgs(argv) {
  return parseArgs({
    args: argv,
    allowNegative: true,
    allowPositionals: true,
    options: {
      attempts: { type: "string" },
      port: { type: "string" },
      only: { type: "string" },
      write: { type: "boolean", default: false },
      shots: { type: "boolean", default: true },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
}

async function main(argv) {
  const { values, positionals } = parseWidgetArgs(argv);
  const [command, source] = positionals;
  if (values.help || !command) {
    console.log(WIDGET_HELP);
    process.exit(values.help ? 0 : 1);
  }
  if (command === "sizes") {
    const result = writeSizes();
    console.log(`  ${result.changed ? "Wrote" : "Unchanged:"} ${result.file}`);
    return;
  }
  if (!source || !["check", "build", "loop"].includes(command)) {
    console.log(WIDGET_HELP);
    process.exit(1);
  }
  const only = values.only ? values.only.split(",").map((s) => s.trim()) : null;
  const log = values.json ? () => {} : (line) => console.log(line);

  if (command === "check" || command === "build") {
    const checked = checkBatch(source, { only });
    let built = null;
    if (command === "build") built = writeBatch(checked.batch, checked.items);
    if (values.json) {
      console.log(JSON.stringify({ ok: checked.ok, batch: checked.batch, items: checked.items.map(({ name, ok, errors, file, line }) => ({ name, ok, errors, file, line })), tiles: built?.tiles.map((t) => t.file) }, null, 2));
    } else {
      const good = checked.items.filter((i) => i.ok).length;
      console.log(`\n  ${bold(checked.batch)}: ${good} of ${checked.items.length} ${checked.items.length === 1 ? "spec checks" : "specs check"}.`);
      printIssues(checked.items);
      if (built) console.log(`\n  Wrote ${built.tiles.length} tiles under ${WIDGETS_DIR}/${checked.batch}/; served at /widgets/${checked.batch}/<name>.`);
      console.log("");
    }
    process.exit(checked.ok ? 0 : 1);
  }

  const result = await runWidgetLoop(source, {
    port: values.port ? Number(values.port) : undefined,
    attempts: values.attempts ? Number(values.attempts) : undefined,
    write: values.write,
    shots: values.shots,
    only,
    log,
  });
  if (values.json) console.log(JSON.stringify({ ok: result.ok, batch: result.batch, reportFile: result.reportFile, csvFile: result.csvFile }, null, 2));
  else {
    const pass = result.rows.filter((r) => r.ok).length;
    console.log(`\n  ${bold(result.ok ? "Pass." : "Still failing.")} ${pass} of ${result.rows.length} tiles pass.`);
    console.log(`  Report: ${result.reportFile}`);
    console.log(`  Passes: ${result.csvFile}\n`);
  }
  process.exit(result.ok ? 0 : 1);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) await main(process.argv.slice(2));
