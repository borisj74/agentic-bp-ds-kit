import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
// Plain Node ESM, so these come in untyped; the test states the shapes it reads.
import { parseSpec, validateSpec, validateWidgetSpec } from "../scripts/spec/schema.mjs";
import * as widgets from "../templates/widgets/index.mjs";
import { HEADER, FOOTER, sizeOf } from "../templates/widgets/_shared.mjs";
import { SIZE_IDS, SIZES_FILE, deriveSizes, readLayoutTokens } from "../scripts/widget/sizes.mjs";
import { renderTile as renderTileUntyped } from "../scripts/widget/render.mjs";
import {
  batchId,
  biggerSize,
  checkBatch,
  formatWidgetReport,
  loadWidgetSpecs,
  parseWidgetArgs,
  passCsv,
  repairWidget,
  runWidgetLoop,
} from "../scripts/widget/cli.mjs";
import { reviewSource } from "../scripts/review/index.mjs";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;
// The templates are plain .mjs, so TypeScript infers narrow shapes from them; the test reads them as JSON.
const TEMPLATES: Json = widgets.TEMPLATES;
const TEMPLATE_IDS: string[] = widgets.TEMPLATE_IDS;
const expand = widgets.expand as (spec: Json, options?: Json) => Json;
const renderTile = renderTileUntyped as (spec: Json, options?: Json) => string;
const repair = repairWidget as (raw: Json, findings: Json[]) => Json;

const repoRoot = resolve(import.meta.dirname, "..");
const docs = join(repoRoot, "docs/widgets/billing");
const billing = Object.fromEntries(
  readdirSync(docs).map((name) => [name.replace(/\.json$/, ""), JSON.parse(readFileSync(join(docs, name), "utf8"))]),
);

const kpi = (over: Json = {}) => ({
  kind: "widget",
  name: "open-ar",
  template: "kpi-strip",
  size: "12x1",
  copy: { title: "Accounts receivable", emptyTitle: "No receivables yet", error: "The numbers did not load." },
  data: {
    items: [
      { id: "a", title: "Open AR", metric: "$1.2M" },
      { id: "b", title: "Overdue", metric: "$312K" },
      { id: "c", title: "DSO", metric: "42" },
    ],
  },
  ...over,
});

const checked = (spec: Json) => {
  const result = validateWidgetSpec(spec) as Json;
  expect(result.errors, JSON.stringify(result.errors)).toEqual([]);
  return result.spec;
};
const paths = (spec: Json) => (validateWidgetSpec(spec) as Json).errors.map((e: Json) => e.path);

describe("widget sizes", () => {
  it("contracts/widget-sizes.json is what the layout tokens give", () => {
    const onDisk = JSON.parse(readFileSync(join(repoRoot, SIZES_FILE), "utf8"));
    expect(onDisk).toEqual(deriveSizes(readLayoutTokens(repoRoot)));
  });

  it("widths follow the 12-column grid and its gutter", () => {
    const { frame, sizes } = deriveSizes(readLayoutTokens(repoRoot)) as Json;
    expect(Object.keys(sizes)).toEqual(SIZE_IDS);
    expect(frame.columns).toBe(12);
    expect(sizes["12x1"].width).toBe(frame.content);
    // Two halves and the gutter between them are the whole row.
    expect(sizes["6x1"].width * 2 + frame.gutter).toBeCloseTo(sizes["12x1"].width, 1);
    expect(sizes["4x2"].width * 3 + 2 * frame.gutter).toBeCloseTo(sizes["12x2"].width, 1);
    expect(sizes["6x2"].height).toBe(2 * frame.row + frame.gutter);
    for (const size of Object.values(sizes) as Json[]) expect(size.height % 4).toBe(0);
  });
});

describe("widget spec schema", () => {
  it("checks every billing tile from the prototype", () => {
    expect(Object.keys(billing)).toHaveLength(14);
    for (const spec of Object.values(billing)) checked(spec);
  });

  it("leaves screen specs as they were", () => {
    const screen = JSON.parse(readFileSync(join(repoRoot, "docs/references/billing-dashboard.json"), "utf8"));
    expect((validateSpec(screen) as Json).ok).toBe(true);
    // A widget is not a screen: the screen schema refuses its kind.
    expect((parseSpec(kpi()) as Json).ok).toBe(false);
  });

  it("fills in the defaults a template expands", () => {
    const spec = checked(kpi());
    expect(spec.params).toEqual({ trend: "show", spark: "show" });
    expect(spec.actions).toEqual([]);
    expect(spec.states).toEqual(["ready", "loading", "empty", "error"]);
  });

  it("refuses what no template can draw", () => {
    expect(paths(kpi({ template: "gauge" }))).toEqual(["template"]);
    expect(paths(kpi({ size: "5x2" }))).toEqual(["size"]);
    expect(paths(kpi({ size: "6x2" }))).toEqual(["size"]);
    expect(paths(kpi({ params: { trend: "maybe" } }))).toEqual(["params.trend"]);
    expect(paths(kpi({ params: { colour: "red" } }))).toEqual(["params"]);
    expect(paths(kpi({ data: { items: [{ id: "a", title: "Open AR" }] } }))).toContain("data.items[0].metric");
  });

  it("asks for the words each declared state needs", () => {
    expect(paths(kpi({ copy: { title: "AR" } }))).toEqual(["copy.emptyTitle", "copy.error"]);
    expect(paths(kpi({ copy: { title: "AR" }, states: ["ready", "loading"] }))).toEqual([]);
  });

  it("keeps actions inside the rules", () => {
    const button = (id: string, emphasis: string, intent?: string) => ({ id, type: "button", label: id, emphasis, ...(intent ? { intent } : {}) });
    expect(paths(kpi({ actions: [button("a", "strong", "brand"), button("b", "strong", "danger")] }))).toEqual(["actions"]);
    expect(paths(kpi({ actions: [button("a", "strong")] }))).toEqual(["actions[0].intent"]);
    expect(paths(kpi({ actions: [button("a", "subtle", "brand")] }))).toEqual(["actions[0].intent"]);
    expect(paths(kpi({ actions: [{ id: "retry", type: "button", label: "Again" }] }))).toEqual(["actions[0].id"]);
    expect(paths(kpi({ actions: [{ id: "open-row", type: "open" }] }))).toEqual(["actions[0]"]);
    // A kpi-strip is one row: no room for a footer link.
    expect((validateWidgetSpec(kpi({ actions: [{ id: "more", type: "footer", label: "More" }] })) as Json).errors[0].code).toBe("no-footer");
    // A table with link cells needs the open action they report.
    const table = structuredClone(billing["invoices-by-error-type"]);
    table.actions = table.actions.filter((a: Json) => a.type !== "open");
    expect(paths(table)).toEqual(["actions"]);
  });
});

describe("widget capacity", () => {
  it("every template allows only known sizes, and holds more as it grows", () => {
    for (const id of TEMPLATE_IDS) {
      const t = TEMPLATES[id];
      for (const size of t.sizes) expect(SIZE_IDS).toContain(size);
      const limits = t.sizes.map((size: string) => t.capacity(size, {}, { size, actions: [], params: {}, data: {} }));
      for (const key of Object.keys(limits[0])) for (const limit of limits) expect(limit[key].max, `${id} ${key}`).toBeGreaterThanOrEqual(limit[key].min ?? 0);
    }
    const rows = (size: string) => TEMPLATES["task-list"].capacity(size, {}, { size, actions: [] }).items.max;
    expect(rows("6x3")).toBeGreaterThan(rows("6x2"));
    const columns = (size: string) => TEMPLATES.table.capacity(size, {}, { size, actions: [], data: {} }).columns.max;
    expect(columns("12x2")).toBeGreaterThan(columns("6x2"));
  });

  it("counts rows from the size, less the header and the footer", () => {
    const body = sizeOf("6x3").height - HEADER - FOOTER;
    const spec = { size: "6x3", actions: [{ type: "footer" }] };
    expect(TEMPLATES["task-list"].capacity("6x3", {}, spec).items.max).toBe(Math.floor(body / TEMPLATES["task-list"].ROW.two));
  });

  it("over capacity is an error whose fix names the size that holds it", () => {
    const tasks = structuredClone(billing["close-tasks"]);
    tasks.size = "6x2";
    const [error] = (validateWidgetSpec(tasks) as Json).errors;
    expect(error.path).toBe("data.items");
    expect(error.message).toContain("do not fit a 6x2 task-list");
    expect(error.fix).toContain("6x3");
    expect(error.over).toMatchObject({ n: 5, size: "6x3" });
  });

  it("a card with a spark line beside its trend needs more room", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: `k${i}`, title: `Metric ${i}`, metric: "1", trend: { value: "2", direction: "up" }, chart: { points: [1, 2, 3] } }));
    const spark = validateWidgetSpec(kpi({ data: { items } })) as Json;
    expect(spark.ok).toBe(false);
    expect(spark.errors[0].fix).toContain('params.spark to "hide"');
    expect((validateWidgetSpec(kpi({ data: { items }, params: { spark: "hide" } })) as Json).ok).toBe(true);
  });
});

describe("widget expand", () => {
  it("every tile is one Section with a thin line, in every state", () => {
    for (const raw of Object.values(billing)) {
      const spec = checked(raw);
      for (const state of spec.states) {
        const tile = expand(spec, { state });
        expect(tile.component).toBe("Section");
        expect(tile.props).toMatchObject({ title: spec.copy.title, line: "thin" });
      }
    }
  });

  it("a ready body ends in the footer Link, and the header carries the buttons", () => {
    const spec = checked({ ...billing["invoices-approved-by-time"], actions: [...billing["invoices-approved-by-time"].actions, { id: "export", type: "button", label: "Export", icon: "download" }] });
    const tile = expand(spec);
    const children = tile.slots.children;
    expect(children[0].component).toBe("LineChart");
    expect(children[0].props.showHeader).toBe(false);
    expect(children.at(-1)).toMatchObject({ component: "Link", props: { onClick: { $action: "view-approved-report" } }, text: "View invoices approved by time report" });
    expect(tile.slots.actions).toEqual([
      { component: "Button", props: { size: "sm", emphasis: "minimal", intent: "brand", iconStart: "download", onClick: { $action: "export" } }, text: "Export" },
    ]);
  });

  it("loading, empty and error stand in for the body", () => {
    const spec = checked(billing["close-tasks"]);
    const loading = expand(spec, { state: "loading" });
    expect(loading.props.loading).toBe(true);
    expect(loading.slots.children.map((n: Json) => n.component)).toEqual(["Skeleton"]);
    expect(loading.slots.actions).toBeUndefined();
    const empty = expand(spec, { state: "empty" });
    expect(empty.slots.children[0]).toMatchObject({ component: "EmptyState", props: { title: spec.copy.emptyTitle, icon: "task_alt" } });
    const error = expand(spec, { state: "error" });
    expect(error.slots.children[0]).toMatchObject({ component: "Callout", props: { intent: "danger", actionLabel: "Try again", onAction: { $action: "retry" } }, text: spec.copy.error });
  });

  it("a one-row tile's empty state has no icon well", () => {
    const empty = expand(checked(billing["invoice-period-kpis"]), { state: "empty" });
    expect(empty.slots.children[0].props.icon).toBeUndefined();
  });

  it("table cells become kit Cells: status with its intent, link with the open action", () => {
    const tile = expand(checked(billing["invoices-by-error-type"]));
    const table = tile.slots.children[0];
    expect(table.component).toBe("Table");
    const row = table.props.rows[0];
    expect(row.type.$node).toMatchObject({ component: "Cell", props: { type: "link", label: "E-invoice submission failed", onClick: { $action: "open-row" } } });
    expect(row.severity.$node).toMatchObject({ component: "Cell", props: { type: "status", intent: "danger", label: "Blocking" } });
    expect(row.amount).toBe("$725.25");
  });

  it("task rows open with the drill chevron only when the spec opens them", () => {
    const spec = checked(billing["close-tasks"]);
    expect(expand(spec).slots.children[0].props).toMatchObject({ interaction: "drill", onOpen: { $action: "open-row" } });
    const closed = checked({ ...billing["close-tasks"], actions: [] });
    expect(expand(closed).slots.children[0].props.interaction).toBeUndefined();
  });

  it("charts fit their plot to the tile", () => {
    const spec = checked(billing["approved-by-account"]);
    const chart = expand(spec).slots.children[0];
    expect(chart.props).toMatchObject({ orientation: "horizontal", stacked: true, format: "currency" });
    expect(chart.props.height).toBeLessThanOrEqual(sizeOf("6x3").height - HEADER - FOOTER);
  });
});

describe("widget tiles", () => {
  it("a generated tile draws kit pieces only and passes the review", () => {
    for (const raw of Object.values(billing)) {
      const spec = checked(raw);
      const code = renderTile(spec, { specPath: `docs/widgets/billing/${spec.name}.json` });
      expect(code).not.toMatch(/style=|className=|<div/);
      for (const line of code.split("\n").filter((l: string) => l.startsWith("import "))) expect(line).toMatch(/from "@\/ui\//);
      const errors = (reviewSource(code, `src/app/(widgets)/widgets/test/tiles/${spec.name}.tsx`) as Json[]).filter((f) => f.severity === "error");
      expect(errors, spec.name).toEqual([]);
    }
  });

  it("a tile has a branch for each declared state", () => {
    const code = renderTile(checked({ ...billing["needs-attention"], states: ["ready", "error"] }));
    expect(code).toContain('if (state === "error")');
    expect(code).not.toContain('if (state === "loading")');
  });
});

describe("widget batches", () => {
  it("reads a .jsonl batch a spec a line, and names the batch after its path", () => {
    const items = loadWidgetSpecs("widgets/billing.jsonl", repoRoot) as Json[];
    expect(items).toHaveLength(160);
    expect(items[0].line).toBe(1);
    expect(batchId("widgets/billing.jsonl", repoRoot)).toBe("widgets-billing");
    expect(batchId("docs/widgets/billing", repoRoot)).toBe("docs-widgets-billing");
  });

  it("the billing batch has 20 variants of every template, and all of them check", () => {
    const result = checkBatch("widgets/billing.jsonl", { root: repoRoot }) as Json;
    expect(result.items.filter((i: Json) => !i.ok).map((i: Json) => [i.name, i.errors])).toEqual([]);
    const counts: Record<string, number> = {};
    for (const item of result.items) counts[item.spec.template] = (counts[item.spec.template] ?? 0) + 1;
    expect(counts).toEqual(Object.fromEntries(TEMPLATE_IDS.map((id: string) => [id, 20])));
  });

  it("repairs over capacity with the size that holds it", () => {
    const raw = { ...structuredClone(billing["close-tasks"]), size: "6x2" };
    const { raw: fixed, fixes } = repairWidget(raw, (validateWidgetSpec(raw) as Json).errors) as Json;
    expect(fixed.size).toBe("6x3");
    expect(fixes[0].rule).toBe("widget/capacity");
    expect((validateWidgetSpec(fixed) as Json).ok).toBe(true);
  });

  it("repairs a footer on a one-row tile into a header button, and drops spark lines when no size is bigger", () => {
    const footer = kpi({ actions: [{ id: "more", type: "footer", label: "View the report" }] });
    const moved = repairWidget(footer, (validateWidgetSpec(footer) as Json).errors) as Json;
    expect(moved.raw.actions).toEqual([{ id: "more", type: "button", label: "View the report", emphasis: "minimal" }]);
    const items = Array.from({ length: 5 }, (_, i) => ({ id: `k${i}`, title: `M${i}`, metric: "1", trend: { value: "2" }, chart: { points: [1, 2, 3] } }));
    const spark = kpi({ data: { items } });
    const relieved = repairWidget(spark, (validateWidgetSpec(spark) as Json).errors) as Json;
    expect(relieved.raw.params).toEqual({ spark: "hide" });
    expect((validateWidgetSpec(relieved.raw) as Json).ok).toBe(true);
  });

  it("repairs a tile drawn too tall with the next taller size, and leaves the rest for a person", () => {
    expect(biggerSize("line-chart", "6x2")).toBe("6x3");
    expect(biggerSize("donut", "4x2")).toBe("6x2");
    expect(biggerSize("table", "12x3")).toBeNull();
    const raw = structuredClone(billing["needs-attention"]);
    const fit = repair(raw, [{ rule: "widget/fit", severity: "error", message: "too tall" }]) as Json;
    expect(fit.raw.size).toBe("6x3");
    const action = repair(raw, [{ rule: "widget/action", severity: "error", message: "nothing reported" }]) as Json;
    expect(action.fixes).toEqual([]);
    expect(action.left).toEqual([{ rule: "widget/action", what: "nothing reported" }]);
  });

  it("never resizes for content wider than the tile: only a tile drawn too tall gets a taller size", () => {
    const raw = structuredClone(billing["approved-by-account"]);
    const wide = repair(raw, [{ rule: "widget/overflow-x", severity: "error", message: "ready light: the content is 602px wide in a 599px tile." }]) as Json;
    expect(wide.raw.size).toBe(raw.size);
    expect(wide.fixes).toEqual([]);
    expect(wide.left).toEqual([{ rule: "widget/overflow-x", what: "ready light: the content is 602px wide in a 599px tile." }]);
  });

  it("the report lists only failures, and the CSV only passes", () => {
    const spec = checked(billing["needs-attention"]);
    const rows = [
      { item: { file: "a.jsonl", line: 1 }, spec, ok: true, attempts: [{ n: 1, findings: [] }], fixes: [], shots: [{}, {}], fired: ["open-row", "retry"] },
      { item: { file: "a.jsonl", line: 2 }, spec: { ...spec, name: "broken" }, ok: false, attempts: [{ n: 1, findings: [{ rule: "widget/fit", severity: "error", message: "ready light: 400px tall" }] }], fixes: [], shots: [], fired: [] },
    ];
    const report = formatWidgetReport({ batch: "a", source: "a.jsonl", rows });
    expect(report).toContain("### broken");
    expect(report).not.toContain("### needs-attention");
    const csv = passCsv(rows).trim().split("\n");
    expect(csv).toHaveLength(2);
    expect(csv[1]).toMatch(/^needs-attention,table,6x2,/);
  });
});

describe("widget loop write-back", () => {
  // A spec over capacity is repaired before anything is built; zero attempts and a stub server keep the
  // browser out of it, so the test only sees what the loop does to the spec file.
  const run = async (options: Json = {}) => {
    const root = mkdtempSync(join(tmpdir(), "widget-loop-"));
    const source = "batch.jsonl";
    const text = JSON.stringify({ ...billing["close-tasks"], size: "6x2" }) + "\n";
    writeFileSync(join(root, source), text);
    // The kit's catalog is read from the root; the tiles are written under it, so only these are links.
    mkdirSync(join(root, "src"));
    for (const dir of ["contracts", "src/tokens", "src/ui", "src/patterns"]) symlinkSync(join(repoRoot, dir), join(root, dir), "dir");
    const server = async () => ({ base: "http://127.0.0.1:0", stop: async () => {} });
    try {
      const result = (await runWidgetLoop(source, { root, attempts: 0, shots: false, server, ...options })) as Json;
      return { before: text, after: readFileSync(join(root, source), "utf8"), report: readFileSync(join(root, result.reportFile), "utf8"), result };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };

  it("does not write repairs back by default", async () => {
    const { before, after, report, result } = await run();
    expect(result.rows[0].fixes.map((f: Json) => f.rule)).toEqual(["widget/capacity"]);
    expect(after).toBe(before);
    expect(report).toContain("## Repairs for this run");
    expect(report).toContain("--write");
  });

  it("writes repairs back with write: true", async () => {
    const { after, report } = await run({ write: true });
    expect(JSON.parse(after.trim()).size).toBe("6x3");
    expect(report).toContain("## Repairs written back");
  });

  it("the command line keeps write off unless --write is given", () => {
    const write = (argv: string[]) => (parseWidgetArgs(argv) as Json).values.write;
    expect(write(["loop", "a.jsonl"])).toBe(false);
    expect(write(["loop", "a.jsonl", "--write"])).toBe(true);
    expect(write(["loop", "a.jsonl", "--no-write"])).toBe(false);
  });
});

describe("status-breakdown template", () => {
  const SB: Json = TEMPLATES["status-breakdown"];
  const item = (status: string, count: number, tone = "neutral", label = status[0].toUpperCase() + status.slice(1)) => ({ status, label, count, tone });
  const sb = (over: Json = {}) => ({
    kind: "widget",
    name: "uploads-by-status",
    template: "status-breakdown",
    size: "6x1",
    copy: { title: "Usage collectors uploads by status", emptyTitle: "No records yet", error: "The uploads did not load." },
    data: { totalLabel: "uploads", items: [item("processed", 1180, "success"), item("pending", 42, "warning"), item("failed", 18, "danger")] },
    ...over,
  });
  const withItems = (items: Json[], over: Json = {}) => sb({ data: { items }, ...over });

  it("checks a spec and fills in its defaults", () => {
    const spec = checked(sb());
    expect(spec.params).toEqual({ showPercent: true, total: "show" });
  });

  it("refuses what it cannot draw", () => {
    expect(paths(withItems([item("paid", 3)]))).toEqual(["data.items"]);
    expect(paths(withItems([item("paid", 3), item("late", 1, "amber")]))).toEqual(["data.items[1].tone"]);
    expect(paths(withItems([item("paid", 3), item("late", -1)]))).toEqual(["data.items[1].count"]);
    expect(paths(withItems([item("paid", 3), item("late", 1.5)]))).toEqual(["data.items[1].count"]);
    expect(paths(withItems([item("paid", 3), item("paid", 1)]))).toEqual(["data.items[1].status"]);
    expect(paths(withItems([item("Paid now", 3), item("late", 1)]))).toEqual(["data.items[0].status"]);
    expect(paths(withItems([item("paid", 0), item("late", 0)]))).toEqual(["data.items"]);
    expect(paths(withItems([item("paid", 3), item("late", 1, "danger", "x".repeat(41))]))).toEqual(["data.items[1].label"]);
    expect(paths(sb({ params: { showPercent: "yes" } }))).toEqual(["params.showPercent"]);
    expect(paths(sb({ size: "12x2" }))).toEqual(["size"]);
    expect(paths(sb({ actions: [{ id: "open-row", type: "open" }] }))).toEqual(["actions[0]"]);
  });

  it("comes in 4x1, 6x1, 6x2 and 12x1, and holds 2 to 6 statuses", () => {
    expect(SB.sizes).toEqual(["4x1", "6x1", "6x2", "12x1"]);
    const max = (size: string, footer = false) => SB.capacity(size, {}, { size, actions: footer ? [{ type: "footer" }] : [] }).items.max;
    expect(SB.sizes.map((size: string) => max(size))).toEqual([6, 6, 6, 6]);
    // A footer link takes two of a one-row tile's three legend rows, and nothing a 6x2 needs.
    expect(SB.sizes.map((size: string) => max(size, true))).toEqual([2, 3, 6, 6]);
    for (const size of SB.sizes) expect(SB.capacity(size, {}, { size, actions: [] }).items.min).toBe(2);
  });

  it("a footer link on a one-row tile leaves room for one legend row", () => {
    const footer = { id: "view-report", type: "footer", label: "View uploads report" };
    expect(paths(sb({ actions: [footer] }))).toEqual([]);
    const four = withItems(["a", "b", "c", "d"].map((s) => item(s, 1)), { actions: [footer] });
    const result = validateWidgetSpec(four) as Json;
    expect(result.errors.map((e: Json) => e.path)).toEqual(["data.items"]);
    expect(result.errors[0].fix).toBe("Use size 6x2, or keep the first 3.");
    expect(paths({ ...four, size: "6x2" })).toEqual([]);
  });

  it("over capacity names the size that holds it", () => {
    const footer = { id: "view-report", type: "footer", label: "View uploads report" };
    const five = ["a", "b", "c", "d", "e"].map((s) => item(s, 1));
    const result = validateWidgetSpec(withItems(five, { size: "4x1", actions: [footer] })) as Json;
    expect(result.errors.map((e: Json) => e.path)).toEqual(["data.items"]);
    expect(result.errors[0].fix).toBe("Use size 6x2, or keep the first 2.");
    const seven = ["a", "b", "c", "d", "e", "f", "g"].map((s) => item(s, 1));
    expect((validateWidgetSpec(withItems(seven, { size: "12x1" })) as Json).errors[0].fix).toBe("Keep the first 6; no status-breakdown size holds 7.");
    const { raw } = repairWidget(withItems(five, { size: "4x1", actions: [footer] }), result.errors) as Json;
    expect(raw.size).toBe("6x2");
  });

  it("draws one UsageBar split by status and a Legend with each count and share", () => {
    const tile = expand(checked(withItems([item("valid", 98241, "success"), item("duplicate", 120, "warning"), item("rejected", 0, "danger"), item("queued", 1639, "info")])));
    const [bar, legend] = tile.slots.children;
    expect(bar).toMatchObject({ component: "UsageBar", props: { showLegend: false, label: "Usage collectors uploads by status" } });
    // A status with a count of 0 draws no part, but keeps its key.
    expect(bar.props.segments).toEqual([
      { id: "valid", value: 98241, intent: "green" },
      { id: "duplicate", value: 120, intent: "yellow" },
      { id: "queued", value: 1639, intent: "cyan" },
    ]);
    expect(legend.component).toBe("Legend");
    expect(legend.props.items.map((k: Json) => [k.id, k.intent, k.value])).toEqual([
      ["valid", "green", "98,241 · 98%"],
      ["duplicate", "yellow", "120 · <1%"],
      ["rejected", "red", "0 · 0%"],
      ["queued", "cyan", "1,639 · 2%"],
    ]);
    const plain = expand(checked(sb({ params: { showPercent: false } }))).slots.children[1];
    expect(plain.props.items.map((k: Json) => k.value)).toEqual(["1,180", "42", "18"]);
  });

  it("maps every status tone onto an existing chart colour", () => {
    expect(SB.TONE_INTENT).toEqual({ success: "green", warning: "yellow", danger: "red", info: "cyan", neutral: "gray" });
  });

  it("puts the total in the header as a neutral Count, before any button, only once the tile is ready", () => {
    const spec = checked(sb({ actions: [{ id: "export", type: "button", label: "Export", icon: "download" }] }));
    const [count, button] = expand(spec).slots.actions;
    expect(count).toEqual({ component: "Count", props: { intent: "neutral", count: 1240, max: 1240, label: "uploads" } });
    expect(button.component).toBe("Button");
    expect(expand(checked(sb({ params: { total: "hide" } }))).slots.actions).toBeUndefined();
    for (const state of ["loading", "empty", "error"]) expect(expand(spec, { state }).slots.actions).toBeUndefined();
  });

  it("answers every state in a Section with a thin line", () => {
    const spec = checked(sb({ size: "6x2", copy: { ...sb().copy, emptyDescription: "Uploads show here once a collector sends a file." }, actions: [{ id: "view-report", type: "footer", label: "View uploads report" }] }));
    const ready = expand(spec);
    expect(ready.props).toMatchObject({ title: spec.copy.title, line: "thin" });
    expect(ready.slots.children.map((n: Json) => n.component)).toEqual(["UsageBar", "Legend", "Link"]);
    expect(ready.slots.children[2]).toMatchObject({ props: { onClick: { $action: "view-report" } } });
    const loading = expand(spec, { state: "loading" });
    expect(loading.props.loading).toBe(true);
    expect(loading.slots.children.map((n: Json) => n.component)).toEqual(["Skeleton"]);
    expect(expand(spec, { state: "empty" }).slots.children[0]).toMatchObject({ component: "EmptyState", props: { title: "No records yet", icon: "stacked_bar_chart" } });
    // A one-row tile's empty state is the title alone.
    expect(expand(checked(sb()), { state: "empty" }).slots.children[0].props.icon).toBeUndefined();
    expect(expand(spec, { state: "error" }).slots.children[0]).toMatchObject({ component: "Callout", props: { intent: "danger", onAction: { $action: "retry" } }, text: "The uploads did not load." });
  });

  it("a generated tile draws kit pieces only and passes the review", () => {
    const items = (loadWidgetSpecs("widgets/billing.jsonl", repoRoot) as Json[]).filter((i) => i.raw?.template === "status-breakdown");
    expect(items).toHaveLength(20);
    for (const entry of items) {
      const spec = checked(entry.raw);
      const code = renderTile(spec);
      expect(code).not.toMatch(/style=|className=|<div/);
      expect(code).toContain("<UsageBar");
      const errors = (reviewSource(code, `src/app/(widgets)/widgets/test/tiles/${spec.name}.tsx`) as Json[]).filter((f) => f.severity === "error");
      expect(errors, spec.name).toEqual([]);
    }
  });
});
