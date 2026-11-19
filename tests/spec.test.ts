import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { regionsOf, navIds, takenRoutes, validateSpec } from "../scripts/spec/schema.mjs";
import { checkItem, parseItemShape } from "../scripts/spec/shape.mjs";
import { renderScreen, screenFiles } from "../scripts/spec/render.mjs";
import { fixSpec } from "../scripts/spec/fix.mjs";
import { piece } from "../scripts/review/catalog.mjs";
import { reviewSource } from "../scripts/review/index.mjs";

/** What the spec tools answer with. The tools themselves are plain JavaScript. */
type Issue = { path: string; message: string; fix?: string };
type Checked = { ok: boolean; errors: Issue[]; warnings: Issue[]; pattern?: string; spec: Draft };
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a draft spec is plain JSON under test
type Draft = Record<string, any>;

const check = (draft: Draft): Checked => validateSpec(draft) as unknown as Checked;
const repair = (draft: Draft) =>
  fixSpec(draft) as unknown as { spec: Draft; fixes: { rule: string; what: string }[] };
const render = (draft: Draft): string => renderScreen(draft) as unknown as string;
const screens = (draft: Draft) => screenFiles(draft) as unknown as { file: string; code: string; route: string }[];
const review = (code: string, file: string) => reviewSource(code, file) as unknown as { severity: string }[];

const REPO = join(import.meta.dirname, "..");

/** The smallest spec that builds: a list with a toolbar, a table and an empty state. */
const spec = (): Draft => ({
  name: "test-screen",
  title: "Test screen",
  pattern: "ListPage",
  section: "billing-invoices",
  breadcrumbs: ["Billing"],
  states: ["ready", "empty"],
  copy: { emptyTitle: "Nothing here yet" },
  regions: {
    toolbar: [
      {
        component: "Toolbar",
        props: { label: "Rows", onRefresh: true },
        slots: {
          actions: [{ component: "Button", props: { size: "sm", emphasis: "strong", intent: "brand" }, text: "New row" }],
        },
      },
    ],
    content: [
      {
        component: "Table",
        props: { columns: [{ key: "id", header: "Id" }], rows: [{ id: "1" }], rowLabel: "id" },
      },
    ],
    empty: [{ component: "EmptyState", props: { headingLevel: 2, title: "$copy.emptyTitle" } }],
  },
});

const errorPaths = (result: Checked) => result.errors.map((e) => e.path);

describe("the screen spec", () => {
  it("takes a spec whose names, props and values all come from the contracts", () => {
    const result = check(spec());
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.pattern).toBe("ListPage");
  });

  it("names the regions a pattern actually has", () => {
    expect(regionsOf(piece("ListPage"))).toEqual(["above", "content", "bulk", "empty", "pagination", "toolbar"]);
  });

  it("refuses a pattern that is not in the kit", () => {
    const result = check({ ...spec(), pattern: "SplitScreen" });
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toContain("not a pattern");
  });

  it("refuses a region the pattern does not have", () => {
    const draft = spec();
    (draft.regions as Record<string, unknown>).sidebar = [{ component: "Card", props: { title: "Side" } }];
    expect(errorPaths(check(draft))).toContain("regions.sidebar");
  });

  it("refuses a component the kit does not have", () => {
    const draft = spec();
    draft.regions.content = [{ component: "DataTable", props: {} }] as never;
    expect(errorPaths(check(draft))).toContain("regions.content[0].component");
  });

  it("refuses a prop no contract lists", () => {
    const draft = spec();
    (draft.regions.content[0].props as Record<string, unknown>).striped = true;
    expect(errorPaths(check(draft))).toContain("regions.content[0].props.striped");
  });

  it("refuses a value outside a closed set inside a list of records", () => {
    const draft = spec();
    draft.regions.content = [
      {
        component: "Timeline",
        props: { label: "Activity", items: [{ id: "a1", title: "Invoice sent", intent: "info" }] },
      },
    ];
    const result = check(draft);
    expect(errorPaths(result)).toContain("regions.content[0].props.items[0].intent");
    expect(result.errors[0].fix).toContain("neutral, brand, success, warning, danger");
  });

  it("refuses a value outside a closed enum", () => {
    const draft = spec();
    (draft.regions.content[0].props as Record<string, unknown>).size = "xl";
    const result = check(draft);
    expect(errorPaths(result)).toContain("regions.content[0].props.size");
    expect(result.errors[0].fix).toContain("sm, md");
  });

  it("refuses a required prop that is missing", () => {
    const draft = spec();
    delete (draft.regions.content[0].props as Record<string, unknown>).rows;
    expect(errorPaths(check(draft))).toContain("regions.content[0].props.rows");
  });

  it("refuses a copy reference that has no words", () => {
    const draft = spec();
    draft.copy = {};
    expect(errorPaths(check(draft))).toContain("regions.empty[0].props.title");
  });

  it("holds copy to its length limit", () => {
    const draft = spec();
    draft.copy = { emptyTitle: "x".repeat(61) };
    expect(errorPaths(check(draft))).toContain("copy.emptyTitle");
  });

  it("refuses a side-nav id the app does not have", () => {
    const draft = { ...spec(), section: "billing-made-up" };
    expect(errorPaths(check(draft))).toContain("section");
    expect(navIds().has("billing-invoices")).toBe(true);
  });

  it("refuses two strong brand Buttons", () => {
    const draft = spec();
    draft.regions.empty[0] = {
      component: "EmptyState",
      props: { headingLevel: 2, title: "$copy.emptyTitle" },
      slots: { actions: [{ component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Start" }] },
    } as never;
    expect(errorPaths(check(draft))).toContain("regions");
  });

  it("refuses an empty state with nothing to show in it", () => {
    const draft = spec();
    delete (draft.regions as Record<string, unknown>).empty;
    expect(errorPaths(check(draft))).toContain("states");
  });

  it("refuses a pattern state the pattern does not have", () => {
    const draft: Draft = { ...spec(), pattern: "Dashboard", states: ["ready", "error"] };
    draft.regions = { content: spec().regions.content };
    expect(errorPaths(check(draft))).toContain("states");
  });
});

describe("a list of records", () => {
  it("reads a contract's itemShape, whichever way it is written", () => {
    const scoreboard = parseItemShape(piece("Scoreboard").props.items.itemShape) as {
      fields: Record<string, { optional: boolean; values: string[] | null }>;
      open: boolean;
    };
    expect(Object.keys(scoreboard.fields)).toContain("metric");
    expect(scoreboard.fields.metric.optional).toBe(false);
    expect(scoreboard.fields.metadata.optional).toBe(true);
    expect(scoreboard.open).toBe(false);

    // A Table row carries a value per column, so its shape is open and a column key is not an unknown field.
    const table = parseItemShape(piece("Table").props.rows.itemShape) as { open: boolean };
    expect(table.open).toBe(true);

    const timeline = parseItemShape(piece("Timeline").props.items.itemShape) as {
      fields: Record<string, { values: string[] | null }>;
    };
    expect(timeline.fields.intent.values).toEqual(["neutral", "brand", "success", "warning", "danger"]);
  });

  it("walks a row and says what is wrong with it", () => {
    const shape = parseItemShape(piece("Scoreboard").props.items.itemShape);
    const said: string[] = [];
    checkItem({ id: "a", title: "T", bogus: 1, trend: { value: "3", status: "good" } }, shape, "items[0]", (at: string) => said.push(at));
    expect(said).toContain("items[0].bogus");
    expect(said).toContain("items[0].trend.status");
    expect(said).toContain("items[0].metric");
  });

  it("refuses a nested value outside its closed set", () => {
    const draft = spec();
    draft.regions.above = [
      {
        component: "Scoreboard",
        props: {
          label: "Totals",
          items: [{ id: "a", title: "Open", metric: "$1", trend: { value: "2", status: "good" } }],
        },
      },
    ];
    expect(errorPaths(check(draft))).toContain("regions.above[0].props.items[0].trend.status");
  });

  it("refuses a field a row does not have, and a required one left out", () => {
    const draft = spec();
    draft.regions.content = [
      { component: "Timeline", props: { label: "Activity", items: [{ id: "a", subtitle: "x", whatever: 1 }] } },
    ];
    const paths = errorPaths(check(draft));
    expect(paths).toContain("regions.content[0].props.items[0].whatever");
    expect(paths).toContain("regions.content[0].props.items[0].title");
  });

  it("leaves a Table row alone, since its columns are its fields", () => {
    const draft = spec();
    draft.regions.content = [
      {
        component: "Table",
        props: { columns: [{ key: "account", header: "Account" }], rows: [{ id: "1", account: "Apex", amount: "$4" }] },
      },
    ];
    expect(check(draft).errors).toEqual([]);
  });
});

describe("a Button's look", () => {
  it("refuses a pair the kit does not have, by the review's own rule", () => {
    const draft = spec();
    draft.regions.toolbar[0].slots.actions[0].props = { emphasis: "subtle", intent: "brand" };
    const result = check(draft);
    expect(errorPaths(result)).toContain("regions.toolbar[0].slots.actions[0].props.intent");
    expect(result.errors[0].fix).toContain('"neutral"');
  });

  it("asks a strong Button for its intent", () => {
    const draft = spec();
    draft.regions.toolbar[0].slots.actions[0].props = { emphasis: "strong" };
    expect(errorPaths(check(draft))).toContain("regions.toolbar[0].slots.actions[0].props.intent");
  });

  it("takes the pairs the kit does have", () => {
    for (const props of [
      { emphasis: "strong", intent: "danger" },
      { emphasis: "minimal", intent: "danger" },
      { emphasis: "subtle", intent: "neutral" },
    ]) {
      const draft = spec();
      draft.regions.toolbar[0].slots.actions[0].props = props;
      expect(check(draft).errors, JSON.stringify(props)).toEqual([]);
    }
  });
});

describe("the screen's name", () => {
  it("refuses a name the app already serves", () => {
    expect([...takenRoutes()]).toContain("components");
    for (const name of ["components", "invoices", "foundations"]) {
      const result = check({ ...spec(), name });
      expect(errorPaths(result), name).toContain("name");
    }
  });

  it("takes a name of its own", () => {
    expect(check({ ...spec(), name: "usage-overview" }).errors).toEqual([]);
  });
});

describe("the pattern's own props", () => {
  it("takes the values the pattern's contract lists", () => {
    const draft: Draft = { ...spec(), pattern: "RecordPage", props: { columns: 2, labelPosition: "start" } };
    draft.regions = { header: [{ component: "PageHeader", props: { title: "A record" } }], content: spec().regions.content };
    delete draft.states;
    const result = check(draft);
    expect(result.errors).toEqual([]);
    expect(render(draft)).toContain("columns={2}");
  });

  it("refuses a value the pattern has no prop for", () => {
    const draft: Draft = { ...spec(), props: { density: "tight" } };
    expect(errorPaths(check(draft))).toContain("props.density");
  });

  it("sends a region to the regions, not to the props", () => {
    const draft: Draft = { ...spec(), props: { toolbar: true } };
    const result = check(draft);
    expect(errorPaths(result)).toContain("props.toolbar");
    expect(result.errors.find((issue) => issue.path === "props.toolbar")?.fix).toContain("regions.toolbar");
  });

  it("sends a list of components to the regions too", () => {
    const draft: Draft = {
      name: "test-guided",
      title: "Import usage",
      pattern: "GuidedProcessPage",
      props: { intro: true },
      regions: { content: [{ component: "Form", props: { id: "step" } }] },
    };
    const result = check(draft);
    expect(errorPaths(result)).toContain("props.intro");
    expect(result.errors.find((issue) => issue.path === "props.intro")?.fix).toContain("regions.intro");
  });

  it("takes words for a prop that also takes components", () => {
    const draft = spec();
    draft.regions.content = [
      { component: "Section", props: { title: "Details" }, slots: { children: [{ component: "FormDisplay", props: { label: "Owner", value: "Priya Raman" } }] } },
    ];
    expect(check(draft).errors).toEqual([]);
    expect(render(draft)).toContain('value="Priya Raman"');
  });
});

describe("the repairs the loop can make", () => {
  it("keeps one strong brand Button and makes the rest subtle neutral", () => {
    const draft = spec();
    draft.regions.empty[0] = {
      component: "EmptyState",
      props: { headingLevel: 2, title: "$copy.emptyTitle" },
      slots: { actions: [{ component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Start" }] },
    } as never;
    const { spec: fixed, fixes } = repair(draft);
    expect(fixes[0].rule).toBe("bp/one-primary");
    expect(fixed.regions.empty[0].slots.actions[0].props).toEqual({ emphasis: "subtle" });
    expect(check(fixed).ok).toBe(true);
  });

  it("drops Home from the breadcrumbs, since the frame adds it", () => {
    const { spec: fixed, fixes } = repair({ ...spec(), breadcrumbs: ["Home", "Billing"] });
    expect(fixed.breadcrumbs).toEqual(["Billing"]);
    expect(fixes.some((f: { rule: string }) => f.rule === "bp/screen-frame")).toBe(true);
  });

  it("removes a second PageHeader but keeps the one a pattern takes as its header", () => {
    const draft = spec();
    draft.regions.above = [{ component: "PageHeader", props: { title: "Second" } }] as never;
    expect(repair(draft).spec.regions.above).toEqual([]);

    const form = {
      name: "test-form",
      title: "Create",
      pattern: "FormPage",
      regions: {
        header: [{ component: "PageHeader", props: { title: "Create" } }],
        content: [{ component: "Form", props: { id: "f" } }],
      },
    };
    expect(repair(form).spec.regions.header).toHaveLength(1);
  });
});

describe("spec to screen", () => {
  it("writes a page per state, under src/app/(examples)", () => {
    const built = screens(spec());
    expect(built.map((page) => page.file)).toEqual([
      "src/app/(examples)/test-screen/page.tsx",
      "src/app/(examples)/test-screen/empty/page.tsx",
    ]);
    expect(built[1].code).toContain('state="empty"');
  });

  it("frames the screen with AppShell and the whole side nav", () => {
    const code = render(spec());
    expect(code).toContain('import { AppShell } from "@/patterns/AppShell/AppShell";');
    expect(code).toContain("items={APP_NAV}");
    expect(code).toContain("endItems={APP_NAV_END}");
    expect(code).toContain('breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]}');
  });

  it("writes the copy where the spec refers to it, and a no-op for a handler", () => {
    const code = render(spec());
    expect(code).toContain('title="Nothing here yet"');
    expect(code).toContain("onRefresh={() => {}}");
  });

  it("leaves the page header to a pattern that takes one", () => {
    const code = render({
      name: "test-form",
      title: "Create account",
      pattern: "FormPage",
      regions: {
        header: [{ component: "PageHeader", props: { title: "Create account" } }],
        content: [{ component: "Form", props: { id: "account" } }],
      },
    });
    expect(code).not.toContain("pageHeader={");
    expect(code.match(/<PageHeader/g)).toHaveLength(1);
  });

  it("writes a screen the review has nothing to say about", () => {
    const findings = review(render(spec()), "src/app/(examples)/test-screen/page.tsx");
    expect(findings.filter((f: { severity: string }) => f.severity === "error")).toEqual([]);
    expect(findings).toEqual([]);
  });

  it("refuses to render what it cannot name", () => {
    expect(() => render({ ...spec(), regions: { content: [{ component: "Nope" }] } })).toThrow(/Nothing in the kit/);
  });
});

describe("the MCP server", () => {
  it("offers validate_spec beside the review", () => {
    const source = readFileSync(join(REPO, "bin", "mcp.mjs"), "utf8");
    expect(source).toContain('"validate_spec"');
    expect(source).toContain("validateSpecFile");
  });
});
