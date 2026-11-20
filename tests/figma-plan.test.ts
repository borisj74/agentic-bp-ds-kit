import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND, figmaVarName, LAYOUT_TOKENS, planFile, planRender, readMap, showToggles, textFamily } from "../scripts/figma/plan.mjs";
import { auditScript, expectations, RULES } from "../scripts/figma/audit.js";
import { emitScript, MAX_SCRIPT, TARGET_PAGE } from "../scripts/figma/emit.mjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a plan, a map and a spec are plain JSON under test
type Json = Record<string, any>;
type Issue = { path: string; message: string; fix?: string };

const REPO = join(import.meta.dirname, "..");
const REFERENCES = join(REPO, "docs", "references");
const specFiles = readdirSync(REFERENCES)
  .filter((name) => name.endsWith(".json"))
  .sort();

const map: Json = readMap();
const read = (file: string): Json => JSON.parse(readFileSync(join(REFERENCES, file), "utf8"));

/** The plan tools are plain JavaScript, so a test reads what they answer with through one cast. */
const makePlan = (spec: Json, options: Json = { map }): Json => planRender(spec, options) as unknown as Json;
const readPlan = (file: string, options: Json = {}): Json => planFile(join("docs", "references", file), options) as unknown as Json;

/** A plan error that says a slot or a drawn list cannot hold what the spec puts in it. */
const isSlotError = (error: Issue) =>
  /\.slots\.[A-Za-z]+$/.test(error.path) || /\.props\.[A-Za-z]+$/.test(error.path)
    ? /swappable instance in Figma|no Figma slot for|draws at most/.test(error.message)
    : false;

/** Walk every node in a plan tree. */
function* nodes(node: Json): Generator<Json> {
  yield node;
  for (const child of node.children ?? []) yield* nodes(child);
  for (const list of Object.values(node.slots ?? {}) as Json[][]) for (const child of list) yield* nodes(child);
  for (const child of Object.values(node.swaps ?? {}) as Json[]) yield* nodes(child);
}

/** Every node of every frame in a plan, flat. */
const treeOf = (plan: Json): Json[] => plan.frames.flatMap((frame: Json) => [...nodes(frame.fallback ? frame.parts.content : frame.root)]);

describe("the render plan", () => {
  it("turns a CSS custom property into a Figma variable name", () => {
    expect(figmaVarName("--layout-gutter-lg")).toBe("layout/gutter-lg");
    expect(figmaVarName("--bg-neutral-min")).toBe("bg/neutral-min");
    expect(figmaVarName("ref-space-700")).toBe("ref/space-700");
  });

  it("plans every reference screen cleanly, or fails with a clear slot error", () => {
    const summary = specFiles.map((file) => {
      const plan = readPlan(file);
      return {
        file,
        ok: plan.ok,
        // Every error has to be about a slot or a drawn list, and has to say what to do about it.
        unexplained: plan.errors
          .filter((error: Issue) => !isSlotError(error) || !error.fix)
          .map((error: Issue) => `${error.path}: ${error.message}`),
      };
    });
    expect(summary.flatMap((row) => row.unexplained)).toEqual([]);
    // Some of the reference screens do plan, so the renderer is not failing on everything.
    expect(summary.filter((row) => row.ok).length).toBeGreaterThan(0);
  });

  it("is deterministic: the same spec and the same map give the same plan", () => {
    const spec = read("usage-overview.json");
    expect(JSON.stringify(makePlan(spec))).toBe(JSON.stringify(makePlan(spec)));
  });

  it("draws one frame per state and theme, named and moded", () => {
    const plan = makePlan(read("usage-overview.json"));
    expect(plan.ok).toBe(true);
    expect(plan.frames.map((frame: Json) => frame.name)).toEqual([
      "usage-overview/ready/light",
      "usage-overview/ready/dark",
      "usage-overview/empty/light",
      "usage-overview/empty/dark",
    ]);
    for (const frame of plan.frames) {
      expect(frame.modes).toEqual({ Ref: DEFAULT_BRAND, Scheme: frame.theme, Semantic: frame.theme, Dimension: "Value", Density: "default" });
      expect(frame.width).toBe(1440);
    }
  });

  it("puts the screen in the AppShell page slot", () => {
    const plan = makePlan(read("usage-overview.json"));
    const [frame] = plan.frames;
    expect(frame.fallback).toBe(false);
    expect(frame.root.component).toBe("AppShell");
    const slot = Object.keys(frame.root.slots)[0];
    expect(slot).toBe(map.components.AppShell.props.children.figma);
    expect(frame.root.slots[slot][0].name).toBe("layout/content");
  });

  it("falls back to AppHeader, AppNav and a content frame when AppShell has no page slot", () => {
    const bent = structuredClone(map);
    bent.components.AppShell.props.children = { figma: "page#1623:51", kind: "instanceSwap" };
    const plan = makePlan(read("usage-overview.json"), { map: bent });
    expect(plan.fallback).toBe(true);
    const [frame] = plan.frames;
    expect(frame.parts.header.component).toBe("AppHeader");
    expect(frame.parts.nav.component).toBe("AppNav");
    expect(frame.parts.content.name).toBe("layout/content");
  });

  it("lays the regions out in contract order, each as its own layout frame", () => {
    const plan = makePlan(read("usage-overview.json"));
    const [frame] = plan.frames;
    const content = frame.root.slots[map.components.AppShell.props.children.figma][0];
    expect(content.children.map((child: Json) => child.name)).toEqual(frame.regions.map((region: string) => `layout/${region}`));
    expect(frame.regions).toEqual(plan.regionOrder.filter((region: string) => frame.regions.includes(region)));
  });

  it("names a variable for every bound value on a layout frame, and never a number or a colour", () => {
    const plan = makePlan(read("usage-overview.json"));
    for (const node of treeOf(plan).filter((node) => node.kind === "layout")) {
      for (const field of ["gap", "padding", "radius", "fill"]) {
        if (node[field] === null) continue;
        expect(typeof node[field]).toBe("string");
        expect(node[field]).toMatch(/^[a-z]+\/[a-z0-9-]+$/);
      }
    }
    const content = treeOf(plan).find((node) => node.name === "layout/content") as Json;
    expect(content.gap).toBe(LAYOUT_TOKENS.gap);
    expect(content.padding).toBe(LAYOUT_TOKENS.padding);
    expect(content.fill).toBe(LAYOUT_TOKENS.fill);
  });

  it("makes every node but a layout frame a library instance with a key", () => {
    const plan = makePlan(read("usage-overview.json"));
    for (const node of treeOf(plan)) {
      if (node.kind === "layout") {
        expect(String(node.name).startsWith("layout/")).toBe(true);
        continue;
      }
      expect(node.kind).toBe("instance");
      expect(node.key).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("sets props as Figma keys, and values the component set draws", () => {
    const plan = makePlan({
      name: "one-button",
      title: "One button",
      pattern: "SettingsPage",
      regions: { content: [{ component: "Button", props: { emphasis: "strong", intent: "brand", size: "sm" }, text: "Save" }] },
    });
    expect(plan.ok).toBe(true);
    const button = treeOf(plan).find((node) => node.component === "Button") as Json;
    expect(button.props).toEqual({ emphasis: "strong", intent: "brand", size: "sm" });
    expect(button.texts).toEqual({ "label#110:0": "Save" });
  });

  it("refuses a value the Figma component set does not draw", () => {
    const plan = makePlan({
      name: "bad-size",
      title: "Bad size",
      pattern: "SettingsPage",
      regions: { content: [{ component: "Table", props: { size: "lg" } }] },
    });
    expect(plan.ok).toBe(false);
    expect(plan.errors.some((error: Issue) => /Table size cannot be "lg" in Figma/.test(error.message))).toBe(true);
  });

  it("fails when a list is longer than the rows Figma draws", () => {
    const plan = readPlan("invoices-list.json");
    const error = plan.errors.find((error: Issue) => /draws at most/.test(error.message));
    expect(error.message).toMatch(/DataGrid draws at most 4 rows; the spec has 6\./);
    expect(error.fix).toMatch(/Cut the list to 4/);
  });

  it("turns the extra rows on with the show flags, and stops at the baseline", () => {
    const plan = makePlan({
      name: "crumbs",
      title: "Crumbs",
      pattern: "SettingsPage",
      regions: {
        content: [
          {
            component: "Breadcrumb",
            props: { items: [{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }, { label: "Northwind", href: "#" }] },
          },
        ],
      },
    });
    expect(plan.ok).toBe(true);
    const crumb = treeOf(plan).find((node) => node.component === "Breadcrumb") as Json;
    const rows = crumb.items.items.rows;
    expect(rows.map((row: Json) => row.show)).toEqual([null, null, "showCrumb3#82:45"]);
    expect(rows[0].texts).toEqual({ "crumb1#82:0": "Home" });
    expect(rows[2].texts).toEqual({ "crumb3#82:18": "Northwind" });
  });

  it("inverts a boolean the map marks as inverted", () => {
    const plan = makePlan({
      name: "no-label",
      title: "No label",
      pattern: "SettingsPage",
      regions: { content: [{ component: "Input", props: { label: "Name", hideLabel: true } }] },
    });
    const input = treeOf(plan).find((node) => node.component === "Input") as Json;
    expect(input.props["showLabel#154:1015"]).toBe(false);
  });

  it("reads a picker variant as the thing it picks, and says the words are the artboard's", () => {
    const plan = makePlan({
      name: "placeholder",
      title: "Placeholder",
      pattern: "SettingsPage",
      regions: { content: [{ component: "Input", props: { label: "Name", placeholder: "Northwind" } }] },
    });
    const input = treeOf(plan).find((node) => node.component === "Input") as Json;
    expect(input.props.content).toBe("placeholder");
    expect(plan.dropped.some((item: Json) => /example copy/.test(item.why))).toBe(true);
  });

  it("turns an artboard toggle on where Figma draws the slot as an example part", () => {
    const plan = makePlan(read("payments-empty.json"));
    expect(plan.ok).toBe(true);
    const empty = treeOf(plan).find((node) => node.component === "EmptyState") as Json;
    expect(Object.values(empty.props)).toContain(true);
    expect(plan.dropped.some((item: Json) => /cannot go in/.test(item.why))).toBe(true);
  });

  it("refuses a brand or a scheme the file has no mode for", () => {
    const plan = makePlan(read("usage-overview.json"), { map, brand: "mauve" });
    expect(plan.ok).toBe(false);
    expect(plan.errors[0].message).toMatch(/no mode called "mauve"/);
    expect(makePlan(read("usage-overview.json"), { map, themes: ["Dusk"] }).errors[0].message).toMatch(/no mode called "Dusk"/);
  });

  it("reports a component the map does not draw", () => {
    const bent = structuredClone(map);
    delete bent.components.Toolbar;
    const plan = makePlan(read("usage-overview.json"), { map: bent });
    expect(plan.ok).toBe(false);
    expect(plan.errors.some((error: Issue) => /no Figma component for Toolbar/.test(error.message))).toBe(true);
  });

  it("reads the numbered text family and the show toggles out of the map", () => {
    expect(textFamily(map.components.Breadcrumb, "items")).toEqual({
      1: "crumb1#82:0",
      2: "crumb2#82:9",
      3: "crumb3#82:18",
      4: "crumb4#82:27",
    });
    expect(textFamily(map.components.Button, "children")).toBe(null);
    expect(showToggles(map.components.PageHeader, "actions", undefined)).toEqual(["showAction1#194:24", "showAction2#194:20"]);
    expect(showToggles(map.components.Section, "actions", map.components.Section.props.actions)).toEqual([map.components.Section.props.actions.figma]);
  });

  it("will not plan a spec that does not check out against the contracts", () => {
    const plan = planFile(join("docs", "references", "usage-overview.json"), { map }) as unknown as Json;
    expect(plan.ok).toBe(true);
    const bent = planFile(join("docs", "references", "usage-overview.json"), { map, brand: "mauve" }) as unknown as Json;
    expect(bent.ok).toBe(false);
  });
});

/** The emitted script is only ever read by Figma, so the test reads it the way Figma does. */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

describe("the use_figma script", () => {
  it("parses as the body of one async call, and fits in one call", () => {
    for (const file of specFiles) {
      const plan = readPlan(file);
      if (!plan.ok) continue;
      const script = emitScript(plan);
      expect(script.size).toBeLessThanOrEqual(MAX_SCRIPT);
      expect(() => new AsyncFunction("figma", script.code)).not.toThrow();
      expect(script.frames).toEqual(plan.frames.map((frame: Json) => frame.name));
    }
  });

  it("touches the Plugin API only in the $fig helper", () => {
    const body = emitScript(readPlan("usage-overview.json")).code.split("// ---- render")[1];
    expect(body).not.toMatch(/\bfigma\./);
  });

  it("creates nothing but the page, the frame and the layout frames", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    const created = [...code.matchAll(/figma\.create(\w+)/g)].map((hit) => hit[1]);
    expect([...new Set(created)].sort()).toEqual(["AutoLayout", "Frame", "Page"]);
    expect(code).not.toMatch(/createRectangle|createText|createEllipse|createVector/);
  });

  it("writes to one page and names each frame by screen, state and theme", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    expect(code).toContain(`"page":"${TARGET_PAGE}"`);
    expect(code).toContain('"name":"usage-overview/ready/light"');
  });

  it("renders a subset when asked for one state or one theme", () => {
    const plan = readPlan("usage-overview.json");
    expect(emitScript(plan, { frames: ["Light"] }).frames).toEqual(["usage-overview/ready/light", "usage-overview/empty/light"]);
    expect(emitScript(plan, { frames: ["empty"] }).frames).toEqual(["usage-overview/empty/light", "usage-overview/empty/dark"]);
  });

  it("refuses to emit a script that will not fit in one call", () => {
    expect(() => emitScript(readPlan("usage-overview.json"), { max: 200 })).toThrow(/takes 200/);
  });

  it("will not emit a plan that does not hold", () => {
    const plan = readPlan("invoices-list.json");
    expect(plan.ok).toBe(false);
    expect(() => emitScript(plan)).toThrow(/does not hold/);
  });
});

describe("the audit script", () => {
  it("parses, is read-only, and returns JSON only", () => {
    const code = auditScript(readPlan("usage-overview.json"));
    expect(() => new AsyncFunction("figma", code)).not.toThrow();
    expect(code).not.toMatch(/figma\.create|\.remove\(|appendChild|setProperties|setBoundVariable/);
    expect(code).toMatch(/return out\.length === 0 \? \{ ok: true \}/);
  });

  it("expects the modes and the tree the plan planned", () => {
    const plan = readPlan("usage-overview.json");
    const want = expectations(plan) as unknown as Json;
    expect(want.frames.map((frame: Json) => frame.name)).toEqual(plan.frames.map((frame: Json) => frame.name));
    expect(want.frames[0].modes).toEqual(plan.frames[0].modes);
    expect(want.frames[0].tree[0].component).toBe("AppShell");
  });

  it("names every rule it can report", () => {
    const code = auditScript(readPlan("usage-overview.json"));
    for (const rule of RULES) expect(code).toContain(rule);
  });
});
