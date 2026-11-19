import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { regionsOf, navIds, validateSpec } from "../scripts/spec/schema.mjs";
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
