import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND, everyToggle, figmaVarName, LAYOUT_TOKENS, layerPath, planFile, planRender, readMap, regionOrderOf, showToggles, swapMismatch, textFamily, toggleAsked } from "../scripts/figma/plan.mjs";
import { piece } from "../scripts/review/catalog.mjs";
import { auditScript, expectations, RULES } from "../scripts/figma/audit.js";
import { emitScript, MAX_SCRIPT, PAGE_AFTER, repairScript, TARGET_PAGE } from "../scripts/figma/emit.mjs";

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
    ? /swappable instance in Figma|no Figma slot for|draws at most|always draws/.test(error.message)
    : false;

/** Walk every node in a plan tree. */
function* nodes(node: Json): Generator<Json> {
  yield node;
  for (const child of node.children ?? []) yield* nodes(child);
  for (const list of Object.values(node.slots ?? {}) as Json[][]) for (const child of list) yield* nodes(child);
  for (const child of Object.values(node.swaps ?? {}) as Json[]) yield* nodes(child);
}

/**
 * Every node of a plan's first frame, flat. One frame is enough: the frames of a screen hold the
 * same tree and differ only in their modes, so walking all of them would count every node twice.
 */
const treeOf = (plan: Json, state?: string): Json[] => {
  const frame = state ? plan.frames.find((one: Json) => one.state === state) : plan.frames[0];
  return [...nodes(frame.fallback ? frame.parts.content : frame.root)];
};

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
    expect(frame.root.slots[slot][0].name).toBe("layout/stack");
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

  it("draws the regions in the order the pattern draws them, not in the order of the alphabet", () => {
    expect(regionOrderOf(piece("ListPage"))).toEqual(["above", "bulk", "toolbar", "content", "empty", "pagination"]);
    expect(regionOrderOf(piece("RecordPage"))).toEqual(["above", "header", "tabs", "notice", "toolbar", "summary", "content"]);
    const plan = makePlan(read("payments-empty.json"));
    const ready = plan.frames.find((frame: Json) => frame.state === "ready") as Json;
    // The bar over the rows, then the rows: a Toolbar before a Table.
    expect(ready.regions).toEqual(["toolbar", "content"]);
    const content = ready.root.slots[map.components.AppShell.props.children.figma][0];
    expect(content.name).toBe("layout/stack");
    expect(content.children.map((child: Json) => child.name)).toEqual(["layout/toolbar", "layout/content"]);
    expect(content.children[0].children[0].component).toBe("Toolbar");
    expect(content.children[1].children[0].component).toBe("Table");
  });

  it("lays the regions out in that order, each as its own layout frame", () => {
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
    // In the page slot the column is a stack: the shell's page frame already carries the inset.
    const stack = treeOf(plan).find((node) => node.name === "layout/stack") as Json;
    expect(stack.gap).toBe(LAYOUT_TOKENS.gap);
    expect(stack.padding).toBe(null);
    expect(stack.fill).toBe(null);
    // Without a page slot the column is the page, so it carries the inset and the background.
    const page = plan.frames[0].parts.content;
    expect(page.name).toBe("layout/content");
    expect(page.gap).toBe(LAYOUT_TOKENS.gap);
    expect(page.padding).toBe(LAYOUT_TOKENS.padding);
    expect(page.fill).toBe(LAYOUT_TOKENS.fill);
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
    // What the spec says, and the contract's own defaults for what it does not.
    expect(button.props).toEqual({ emphasis: "strong", intent: "brand", size: "sm", iconOnly: "false", loading: "false" });
    expect(button.texts).toEqual({ "label#110:0": "Save" });
  });

  it("refuses a list shorter than what the artboard always draws", () => {
    // The Scoreboard draws six cards and switches the last three, so three are always there. A
    // screen with two would be drawn out to three with the library's own card, and a reader would
    // take that card's figures for the screen's.
    expect(map.components.Scoreboard.slots.items.max).toBe(6);
    expect(map.components.Scoreboard.slots.items.show).toHaveLength(3);
    const plan = makePlan({
      name: "two-cards",
      title: "Two cards",
      pattern: "SettingsPage",
      regions: {
        content: [
          {
            component: "Scoreboard",
            props: {
              label: "Usage totals",
              items: [
                { id: "rated", title: "Rated usage", metric: "$482,900" },
                { id: "billed", title: "Billed usage", metric: "$311,400" },
              ],
            },
          },
        ],
      },
    });
    expect(plan.ok).toBe(false);
    const error = plan.errors.find((one: Issue) => one.path === "regions.content[0].props.items") as Issue;
    expect(error.message).toBe(
      "Scoreboard always draws 3 items in Figma and the spec has 2; the other 1 would keep the artboard's own example content.",
    );
    expect(error.fix).toBe("Give it 3 items, or draw a shorter scoreboard as its own Figma component.");
  });

  it("takes a list as long as the artboard always draws", () => {
    const plan = makePlan({
      name: "three-cards",
      title: "Three cards",
      pattern: "SettingsPage",
      regions: {
        content: [
          {
            component: "Scoreboard",
            props: {
              label: "Usage totals",
              items: [
                { id: "rated", title: "Rated usage", metric: "$482,900" },
                { id: "billed", title: "Billed usage", metric: "$311,400" },
                { id: "due", title: "Due", metric: "$18,220" },
              ],
            },
          },
        ],
      },
    });
    expect(plan.ok).toBe(true);
  });

  it("takes a short list the Figma component draws as its own copy either way", () => {
    // The Dropdown always draws five items and the map has no layer for their words, so the spec's
    // own labels never reach them however many there are. Padding the spec would change nothing, so
    // the count is not a fault; every row is reported as not in Figma instead.
    expect(map.components.Dropdown.slots.items.child).toBe(undefined);
    expect(textFamily(map.components.Dropdown, "items")).toBe(null);
    const plan = makePlan({
      name: "short-dropdown",
      title: "Short dropdown",
      pattern: "SettingsPage",
      regions: {
        content: [
          {
            component: "Dropdown",
            props: {
              label: "Product",
              trigger: "filter",
              items: [
                { id: "api", label: "Platform API" },
                { id: "storage", label: "Storage" },
              ],
            },
          },
        ],
      },
    });
    expect(plan.ok).toBe(true);
    expect(plan.dropped.some((item: Json) => /example copy/.test(item.why))).toBe(true);
  });

  it("refuses a table with fewer rows or columns than the artboard always draws", () => {
    const plan = makePlan({
      name: "small-grid",
      title: "Small grid",
      pattern: "SettingsPage",
      regions: {
        content: [
          {
            component: "DataGrid",
            props: {
              caption: "Accounts",
              columns: [{ key: "name", header: "Name" }],
              rows: [{ id: "1", name: "Northwind" }],
            },
          },
        ],
      },
    });
    expect(plan.ok).toBe(false);
    expect(plan.errors.some((error: Issue) => /DataGrid always draws \d+ columns in Figma and the spec has 1/.test(error.message))).toBe(true);
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

  it("says which of a form's own fields the artboard has no slot for", () => {
    // Read in the Figma file: the Form's content slot swaps in .Form fields, and that component
    // draws a fixed roster — three Inputs, a Select, a Lookup, a Textarea and a Checkbox — whatever
    // the spec asks for. account-create asks for three Selects and a DatePicker.
    expect(map.components.Form.props.children.swap.roster).toEqual([
      "Input",
      "Input",
      "Input",
      "Select",
      "Lookup",
      "Textarea",
      "Checkbox",
    ]);
    const plan = readPlan("account-create.json");
    expect(plan.ok).toBe(false);
    const error = plan.errors.find((one: Issue) => one.path === "regions.content[0].slots.children") as Issue;
    expect(error.path).toBe("regions.content[0].slots.children");
    expect(error.message).toMatch(/\.Form fields draws a fixed roster: Input, Input, Input, Select, Lookup, Textarea, Checkbox/);
    expect(error.message).toMatch(/asks for Select ×2, DatePicker, which the roster has no slot for/);
    expect(error.fix).toMatch(/Give \.Form fields a slot per field/);
  });

  it("says a blank slot takes one component and no more", () => {
    // .Section slot draws nothing of its own, so a Section's content is one component or none.
    expect(map.components.Section.props.children.swap.roster).toEqual([]);
    const plan = readPlan("approvals-queue.json");
    expect(plan.ok).toBe(false);
    expect(plan.errors[0].message).toMatch(/\.Section slot draws nothing of its own, so the slot takes exactly one component and the spec puts 8 in it/);
    expect(plan.errors[0].fix).toMatch(/Draw the 8 as one Figma component/);
  });

  it("says when the fields fit the roster by type but the rest of it would still show", () => {
    const prop = map.components.Form.props.children;
    const [message, fix] = swapMismatch("Form", "children", prop, [{ component: "Input" }, { component: "Checkbox" }]);
    expect(message).toMatch(/fit by type but the roster has no flag to hide the Input ×2, Select, Lookup, Textarea it would leave showing/);
    expect(fix).toMatch(/a form of Input ×3, Select, Lookup, Textarea, Checkbox fits/);
  });

  it("falls back to the plain message where the map records no roster", () => {
    const [message, fix] = swapMismatch("Modal", "children", { figma: "content#124:48", kind: "instanceSwap" }, [{ component: "Input" }, { component: "Input" }]);
    expect(message).toMatch(/the spec puts 2 components in it/);
    expect(fix).toMatch(/Put one component in the slot/);
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

  it("turns an artboard toggle on and says the action's own words on the instance inside it", () => {
    const plan = makePlan(read("payments-empty.json"));
    expect(plan.ok).toBe(true);
    const empty = treeOf(plan).find((node) => node.component === "EmptyState") as Json;
    expect(empty.props["showActions#114:0"]).toBe(true);
    // The empty state's own icon is a part too, so the action is picked out by the slot it fills.
    expect(empty.parts.filter((part: Json) => part.slot === "actions")).toEqual([
      {
        toggle: "showActions#114:0",
        index: 1,
        slot: "actions",
        component: "Button",
        path: ["actions", "Button 1"],
        props: { size: "sm", "iconStart#110:97": true, emphasis: "subtle", intent: "neutral", iconOnly: "false", loading: "false" },
        texts: { "label#110:0": "Import bank file" },
      },
    ]);
    // Its glyph is one the file's icon set does not hold, so the icon is on and the drop is said.
    expect(map.glyphs.upload_file).toBeUndefined();
    expect(plan.dropped.some((one: Json) => /no glyph named "upload_file"/.test(one.why))).toBe(true);
    // The empty state's own icon is one it does hold, swapped on the Icon the map points at.
    const icon = empty.parts.find((part: Json) => part.slot === "icon");
    expect(icon.path).toEqual(["well", "Icon"]);
    expect(icon.swaps["glyph#29:0"].component).toBe("Icon payments");
    // The second drawn button is off: the spec asked for one.
    expect(empty.props["showButton2#114:9"]).toBe(false);
  });

  it("sets a numbered action part through the layer the file keeps it in", () => {
    const plan = makePlan(read("payments-empty.json"));
    const toolbar = treeOf(plan, "ready").find((node) => node.component === "Toolbar") as Json;
    expect(toolbar.parts.filter((part: Json) => part.slot === "actions")).toHaveLength(1);
    expect(toolbar.parts.find((part: Json) => part.slot === "actions").path).toEqual(["bar", "end", "Action 1"]);
    expect(toolbar.parts[0].texts).toEqual({ "label#110:0": "Record payment" });
    const primary = toolbar.parts.find((part: Json) => part.slot === "actions");
    expect(primary.props.emphasis).toBe("strong");
    expect(primary.props.intent).toBe("brand");
  });

  it("fills a page header's own actions through the layers the file keeps them in", () => {
    // A pattern that draws its own header gets the screen's page-level actions: the spec puts them
    // in that PageHeader, and Figma draws them as the two exposed buttons beside the title.
    const plan = makePlan({
      name: "with-actions",
      title: "With actions",
      pattern: "FormPage",
      regions: {
        header: [
          {
            component: "PageHeader",
            props: { title: "With actions" },
            slots: {
              actions: [
                { component: "Button", props: { size: "sm" }, text: "Cancel" },
                { component: "Button", props: { size: "sm", emphasis: "strong", intent: "brand" }, text: "Save" },
              ],
            },
          },
        ],
        content: [{ component: "Callout", props: { intent: "info" }, text: "A note." }],
      },
    });
    expect(plan.ok).toBe(true);
    const header = treeOf(plan).find((node) => node.component === "PageHeader") as Json;
    expect(header.props["showAction1#194:24"]).toBe(true);
    expect(header.props["showAction2#194:20"]).toBe(true);
    expect(header.parts.map((part: Json) => part.path)).toEqual([
      ["bar", "controls", "Action 1"],
      ["bar", "controls", "Action 2"],
    ]);
    expect(header.parts[0].texts).toEqual({ "label#110:0": "Cancel" });
    expect(header.parts[1].texts).toEqual({ "label#110:0": "Save" });
    expect(header.parts[1].props.emphasis).toBe("strong");
    expect(header.parts[1].props.intent).toBe("brand");
  });

  it("keeps the screen on the page header's own left edge", () => {
    const plan = makePlan(read("payments-empty.json"));
    for (const frame of plan.frames) {
      // The shell draws this screen's header, so the audit measures the two left edges — against the
      // title layer itself, which is what the plan names here.
      expect(frame.align).toEqual({ title: plan.title, layer: "title" });
      const stack = frame.root.slots[map.components.AppShell.props.children.figma][0];
      // Nothing between the page and the screen carries an inset of its own.
      expect(stack.padding).toBe(null);
    }
  });

  it("keeps one strong brand Button, and draws the rest subtle neutral", () => {
    const plan = makePlan({
      name: "two-primaries",
      title: "Two primaries",
      pattern: "SettingsPage",
      regions: {
        content: [
          { component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Save" },
          { component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Publish" },
        ],
      },
    });
    const buttons = treeOf(plan).filter((node) => node.component === "Button");
    expect(buttons.map((button) => [button.props.emphasis, button.props.intent])).toEqual([
      ["strong", "brand"],
      ["subtle", "neutral"],
    ]);
    expect(plan.dropped.some((item: Json) => /one strong brand Button/.test(item.why))).toBe(true);
  });

  it("turns every part the spec did not ask for off, so no Figma default shows through", () => {
    const plan = makePlan(read("payments-empty.json"));
    const toolbar = treeOf(plan, "ready").find((node) => node.component === "Toolbar") as Json;
    // Every toggle the component has is said one way or the other.
    expect(Object.keys(toolbar.props).filter((key) => key.startsWith("show")).sort()).toEqual(everyToggle(map.components.Toolbar).sort());
    // The spec gives a search placeholder, an onRefresh and one action, and nothing else.
    expect(Object.entries(toolbar.props).filter(([, value]) => value === true).map(([key]) => key).sort()).toEqual([
      "showAction1#232:30",
      "showRefresh#232:20",
      "showSearch#232:5",
    ]);
    expect(toolbar.props["showAction2#232:35"]).toBe(false);
    expect(toolbar.props["showFilters#232:0"]).toBe(false);
    expect(toolbar.props["showView#232:15"]).toBe(false);
    expect(toolbar.props["showHelp#232:50"]).toBe(false);
    // A part the spec did ask for by another name stays on: the description under an empty state.
    const empty = treeOf(plan).find((node) => node.component === "EmptyState") as Json;
    expect(empty.props["showDescription#71:18"]).toBe(true);
  });

  it("reads an inverted toggle the right way round, and still switches the rest off", () => {
    const plan = makePlan({
      name: "labelled",
      title: "Labelled",
      pattern: "SettingsPage",
      regions: { content: [{ component: "Input", props: { label: "Name" } }] },
    });
    const input = treeOf(plan).find((node) => node.component === "Input") as Json;
    // hideLabel is false by its contract, and showLabel is its opposite, so the label is on.
    expect(input.props["showLabel#154:1015"]).toBe(true);
    expect(input.props["showPrefix#154:1595"]).toBe(false);
  });

  it("matches a toggle to the prop that asks for it", () => {
    expect(toggleAsked("showSearch#232:5", ["searchPlaceholder"])).toBe(true);
    expect(toggleAsked("showRefresh#232:20", ["onRefresh"])).toBe(true);
    expect(toggleAsked("showDescription#71:18", ["description"])).toBe(true);
    expect(toggleAsked("showView#232:15", ["searchPlaceholder", "onRefresh", "label"])).toBe(false);
    expect(toggleAsked("showHelp#232:50", ["label"])).toBe(false);
  });

  it("switches off every row the list does not fill, and on every one past the baseline", () => {
    const plan = makePlan(read("payments-empty.json"));
    const table = treeOf(plan, "ready").find((node) => node.component === "Table") as Json;
    // Three records: the three rows Figma always draws, and every switched row off.
    expect(table.items.rows.rows).toHaveLength(3);
    expect(table.items.rows.baseline).toBe(3);
    expect(table.items.rows.hidden).toHaveLength(7);
    for (const key of table.items.rows.hidden) expect(table.props[key]).toBe(false);
    // Five columns: the fifth is past the four always drawn, so its switch goes on.
    expect(table.props["showColumn5#252:51"]).toBe(true);
    expect(table.props["showColumn6#252:68"]).toBe(false);
  });

  it("reads a table down its columns, by the layer names the Figma file has", () => {
    // Read in the Agentic DS file: the Table holds a frame named columns, whose children are the
    // column frames Invoice, Status, Method, Amount, Column 5 to Column 8 and Actions, each with a
    // Header instance and Row 1 to Row 10 under it. A column is reached by its place, so a screen's
    // own columns do not have to be called what the artboard calls them.
    expect(map.components.Table.slots.columns.child).toBe("columns > @N > Header");
    expect(map.components.Table.slots.columns.layers).toEqual([
      "Invoice",
      "Status",
      "Method",
      "Amount",
      "Column 5",
      "Column 6",
      "Column 7",
      "Column 8",
    ]);
    expect(map.components.Table.slots.rows.child).toBe("columns > @N > Row R");

    const plan = makePlan(read("payments-empty.json"));
    const table = treeOf(plan, "ready").find((node) => node.component === "Table") as Json;
    expect(table.items.columns.rows.map((header: Json) => header.path)).toEqual([
      ["columns", "@1", "Header"],
      ["columns", "@2", "Header"],
      ["columns", "@3", "Header"],
      ["columns", "@4", "Header"],
      ["columns", "@5", "Header"],
    ]);
    expect(table.items.columns.rows[0].texts).toEqual({ "label#116:0": "Payment" });
    const third = table.items.rows.rows[2];
    expect(third.cells.map((cell: Json) => cell.path)).toEqual([
      ["columns", "@1", "Row 3"],
      ["columns", "@2", "Row 3"],
      ["columns", "@3", "Row 3"],
      ["columns", "@4", "Row 3"],
      ["columns", "@5", "Row 3"],
    ]);
    expect(third.cells[0].texts).toEqual({ "label#237:230": "PAY-2043" });
    // A numeric column ends its cells and its header.
    expect(third.cells[4].props).toEqual({ alignment: "end" });
    expect(table.items.columns.rows[4].props).toEqual({ alignment: "end" });
  });

  it("reads a DataGrid across its rows instead, because that is how the file draws it", () => {
    // Read in the same file: the DataGrid holds a frame named grid, with head and Row 1 to Row 4,
    // and each of those holds one cell per column — Field, Condition, Value, Column 4, Column 5.
    expect(map.components.DataGrid.slots.columns.child).toBe("grid > head > $column");
    expect(map.components.DataGrid.slots.columns.layers).toEqual(["Field", "Condition", "Value", "Column 4", "Column 5"]);
    expect(map.components.DataGrid.slots.rows.child).toBe("grid > Row R > $column");
  });

  it("walks a path the way the map writes one", () => {
    expect(layerPath("columns > @N > Row R", { n: 2, r: 3 })).toEqual(["columns", "@2", "Row 3"]);
    expect(layerPath("grid > head > $column", { n: 3, layers: ["Field", "Condition", "Value"] })).toEqual(["grid", "head", "Value"]);
    expect(layerPath("grid > Row R > $column", { n: 1, r: 4, layers: ["Field"] })).toEqual(["grid", "Row 4", "Field"]);
    expect(layerPath("actions > Button N", { n: 2 })).toEqual(["actions", "Button 2"]);
    expect(layerPath("Breadcrumb", { n: 1 })).toEqual(["Breadcrumb"]);
    expect(layerPath(null)).toEqual([]);
  });

  it("reaches an action part by the path the file has, not by a name it made up", () => {
    // Read in the file: a Toolbar's actions are bar > end > Action 1 and Action 2; an EmptyState's
    // are actions > Button 1 and Button 2; a PageHeader's are bar > controls > Action 1 and 2.
    expect(map.components.Toolbar.partLayers).toEqual({ actions: "bar > end > Action N", filters: "filters > chips > Chip N" });
    expect(map.components.EmptyState.partLayers).toEqual({ actions: "actions > Button N" });
    expect(map.components.PageHeader.partLayers).toEqual({ actions: "bar > controls > Action N" });

    const plan = makePlan(read("payments-empty.json"));
    expect((treeOf(plan, "ready").find((node) => node.component === "Toolbar") as Json).parts.find((part: Json) => part.slot === "actions").path).toEqual(["bar", "end", "Action 1"]);
    const emptyParts = (treeOf(plan).find((node) => node.component === "EmptyState") as Json).parts;
    expect(emptyParts.find((part: Json) => part.slot === "actions").path).toEqual(["actions", "Button 1"]);
  });

  it("fails when the map does not say where a component draws its columns and cells", () => {
    const bent = structuredClone(map);
    delete bent.components.Table.slots.columns.child;
    const plan = makePlan(read("payments-empty.json"), { map: bent });
    expect(plan.ok).toBe(false);
    expect(plan.errors[0].message).toMatch(/does not say where Table draws its columns and its cells/);
    expect(plan.errors[0].fix).toMatch(/Read the component in Figma/);
  });

  it("writes the contract's default for every prop the spec leaves out", () => {
    const plan = makePlan({
      name: "bare-button",
      title: "Bare button",
      pattern: "SettingsPage",
      regions: { content: [{ component: "Button" }, { component: "Input", props: { label: "Name" } }] },
    });
    const button = treeOf(plan).find((node) => node.component === "Button") as Json;
    // Button is subtle neutral md by its contract, so that is what Figma is told.
    expect(button.props.emphasis).toBe("subtle");
    expect(button.props.intent).toBe("neutral");
    expect(button.props.size).toBe("md");
    expect(button.props.loading).toBe("false");
    const input = treeOf(plan).find((node) => node.component === "Input") as Json;
    expect(input.props.size).toBe("md");
    // hideLabel is false by default and the toggle reads the other way round, so the label is on.
    expect(input.props["showLabel#154:1015"]).toBe(true);
  });

  it("gives a nested action button its defaults too, and counts the primaries after that", () => {
    const plan = makePlan(read("payments-empty.json"));
    const empty = treeOf(plan).find((node) => node.component === "EmptyState") as Json;
    const secondary = empty.parts.find((part: Json) => part.slot === "actions");
    // "Import bank file" says nothing about how it looks, so it is drawn subtle neutral.
    expect(secondary.texts).toEqual({ "label#110:0": "Import bank file" });
    expect(secondary.props.emphasis).toBe("subtle");
    expect(secondary.props.intent).toBe("neutral");
    // The screen's one strong brand Button is the Toolbar's, and it stays that way.
    const toolbar = treeOf(plan, "ready").find((node) => node.component === "Toolbar") as Json;
    expect(toolbar.parts[0].props.emphasis).toBe("strong");
    expect(toolbar.parts[0].props.intent).toBe("brand");
    expect(plan.dropped.some((item: Json) => /one strong brand Button/.test(item.why))).toBe(false);
  });

  it("reports a default the Figma component set does not draw rather than forcing it", () => {
    const bent = structuredClone(map);
    bent.components.Button.props.emphasis.values = ["strong", "minimal"];
    const plan = makePlan({ name: "odd", title: "Odd", pattern: "SettingsPage", regions: { content: [{ component: "Button" }] } }, { map: bent });
    expect(plan.ok).toBe(true);
    expect(plan.dropped.some((item: Json) => /default emphasis="subtle" is not one Figma draws/.test(item.why))).toBe(true);
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

  it("puts a screen in the slot the plan named, and in no other", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    // A slot the component does not have is a fault in the map, said out loud. Putting the screen in
    // whatever slot happened to be first drew it in the wrong place and read as if that was asked for.
    expect(code).not.toContain("|| slots[0]");
    expect(code).toContain('throw new Error(node.name + " has no slot named " + named');
    expect(code).toContain('; its slots: "');
  });

  it("touches the Plugin API only in the $fig helper", () => {
    const body = emitScript(readPlan("usage-overview.json")).code.split("// ---- render")[1];
    expect(body).not.toMatch(/\bfigma\./);
  });

  it("creates nothing but the page, the frame and the layout frames", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    const created = [...code.matchAll(/figma\.create(\w+)/g)].map((hit) => hit[1]);
    expect([...new Set(created)].sort()).toEqual(["AutoLayout", "Frame", "Page", "Section"]);
    expect(code).not.toMatch(/createRectangle|createText|createEllipse|createVector/);
  });

  it("writes to one page and names each frame by screen, state and theme", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    expect(TARGET_PAGE).toBe("Spec renders");
    expect(code).toContain(`"page":"${TARGET_PAGE}"`);
    expect(code).toContain(`"after":"${PAGE_AFTER}"`);
    expect(code).toContain('"name":"usage-overview/ready/light"');
  });

  it("puts a screen's frames in a section named after the spec, and reuses it", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    expect(code).toContain('"screen":"usage-overview"');
    expect(code).toContain("$fig.section(page, PLAN.screen)");
    // A section and a frame already by that name are found rather than made again.
    expect(code).toMatch(/const section = \(parent, name\) => \{\s*const found = parent\.children\.find/);
    expect(code).toMatch(/let node = parent\.children\.find\(\(c\) => c\.name === spec\.name && c\.type === "FRAME"\)/);
  });

  it("loads the fonts of an instance before it says anything about its text", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    const apply = code.slice(code.indexOf("const apply = async"));
    const body = apply.slice(0, apply.indexOf("\n  };"));
    expect(body).toContain("await loadFonts(node)");
    expect(body.indexOf("await loadFonts(node)")).toBeLessThan(body.indexOf("node.setProperties("));
    // Every font is loaded through the Plugin API, once per family and style.
    expect(code).toContain("await figma.loadFontAsync(name)");
    expect(code).toContain("const id = name.family + \"|\" + name.style;");
    expect(code).toContain("if (fonts.has(id)) continue;");
    // Nothing sets a property anywhere else, so nothing can set text with its font unloaded.
    expect([...code.matchAll(/setProperties\(/g)]).toHaveLength(1);
  });

  it("writes a regex that still matches an @N step after the template is written out", () => {
    // The helper is written inside a template literal, so a lost backslash turns \d into a plain d
    // and every column step stops matching. The test reads the regex back out and tries it.
    const nth = (code: string) => {
      const hit = /const nth = (\/.*?\/)\.exec/.exec(code);
      expect(hit).not.toBe(null);
      const body = String(hit?.[1]);
      return new RegExp(body.slice(1, -1));
    };
    const render = nth(emitScript(readPlan("payments-empty.json")).code);
    expect(render.test("@2")).toBe(true);
    expect(render.test("@12")).toBe(true);
    expect(render.test("Row 2")).toBe(false);
    const audit = nth(auditScript(readPlan("payments-empty.json")));
    expect(audit.test("@5")).toBe(true);
    expect(audit.test("columns")).toBe(false);
  });

  it("writes to another page when it is asked to", () => {
    const code = emitScript(readPlan("usage-overview.json"), { page: "Scratch" }).code;
    expect(code).toContain('"page":"Scratch"');
  });

  it("falls back to the header, the nav and a content frame when a page slot refuses children", () => {
    const code = emitScript(readPlan("usage-overview.json")).code;
    // Every frame carries both shapes, so the run time has somewhere to go.
    expect(code).toContain('"parts":{"header"');
    expect(code).toMatch(/try \{\s*await place\(board, tree\.root\);\s*\} catch \(error\) \{/);
    expect(code).toContain("$fig.clear(board)");
    expect(code).toContain("await beside(board, tree.parts)");
    expect(code).toContain("fellBack");
  });

  it("plans the second shape even when the map has a page slot", () => {
    const plan = readPlan("usage-overview.json");
    expect(plan.fallback).toBe(false);
    for (const frame of plan.frames) {
      expect(frame.parts.header.component).toBe("AppHeader");
      expect(frame.parts.nav.component).toBe("AppNav");
      expect(frame.parts.content.name).toBe("layout/content");
    }
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

describe("the repair script", () => {
  const finding = (node: string, id: string, props: Json): Json => ({ rule: "bp/figma-props", frame: "demo/ready/light", node, id, what: "x", set: { id, props } });

  it("touches only the nodes the audit named, by id", () => {
    const repair = repairScript([finding("Card 2", "1:2", { "showLine#176:35": true })]) as unknown as Json;
    expect(repair.nodes).toBe(1);
    expect(repair.frames).toEqual(["demo/ready/light"]);
    expect(repair.code).toContain('"id":"1:2"');
    expect(repair.code).toContain("figma.getNodeByIdAsync(one.id)");
    // A repair draws nothing: no frame, no instance, no removal.
    expect(repair.code).not.toMatch(/figma\.create|\.remove\(|createInstance/);
    expect(repair.size).toBeLessThanOrEqual(MAX_SCRIPT);
  });

  it("gathers every property of one node into one set", () => {
    const repair = repairScript([
      finding("Card 2", "1:2", { "showLine#176:35": true }),
      finding("Card 2", "1:2", { "title#176:0": "Rated usage" }),
      finding("Card 3", "1:3", { "showLine#176:35": false }),
    ]) as unknown as Json;
    expect(repair.nodes).toBe(2);
    expect(repair.code).toContain('{"showLine#176:35":true,"title#176:0":"Rated usage"}');
  });

  it("says there is nothing to repair node by node when no finding carries a set", () => {
    expect(repairScript([{ rule: "bp/figma-align", frame: "demo/ready/light", node: "layout/stack", id: "1:9", what: "24px apart" }])).toBe(null);
    expect(repairScript([])).toBe(null);
    expect(repairScript(undefined as unknown as Json[])).toBe(null);
  });

  it("parses as the body of one async call, and times itself", () => {
    const repair = repairScript([finding("Card 2", "1:2", { "showLine#176:35": true })]) as unknown as Json;
    expect(() => new AsyncFunction("figma", repair.code)).not.toThrow();
    expect(repair.code).toContain("ms: Date.now() - started");
  });
});

describe("the audit script", () => {
  it("parses, is read-only, and returns JSON only", () => {
    const code = auditScript(readPlan("usage-overview.json"));
    expect(() => new AsyncFunction("figma", code)).not.toThrow();
    expect(code).not.toMatch(/figma\.create|\.remove\(|appendChild|setProperties|setBoundVariable/);
    expect(code).toMatch(/return out\.length === 0 \? \{ ok: true, \.\.\.answer \} : \{ ok: false, findings: out, \.\.\.answer \}/);
    // One call per attempt: the ids the report links to come back with the findings.
    expect(code).toContain("const answer = { page: page.id, section:");
  });

  it("expects the modes and the tree the plan planned", () => {
    const plan = readPlan("usage-overview.json");
    const want = expectations(plan) as unknown as Json;
    expect(want.frames.map((frame: Json) => frame.name)).toEqual(plan.frames.map((frame: Json) => frame.name));
    expect(want.frames[0].modes).toEqual(plan.frames[0].modes);
    expect(want.frames[0].tree[0].component).toBe("AppShell");
  });

  it("reads the same page the emitter writes to, and looks in the screen's section", () => {
    const plan = readPlan("usage-overview.json");
    expect((expectations(plan) as unknown as Json).page).toBe(TARGET_PAGE);
    expect((expectations(plan, { page: "Scratch" }) as unknown as Json).page).toBe("Scratch");
    const code = auditScript(plan);
    expect(code).toContain('c.type === "SECTION" && c.name === EXPECT.screen');
  });

  it("expects the cells of a table and the words on an action part", () => {
    const want = expectations(readPlan("payments-empty.json")) as unknown as Json;
    const flat = JSON.stringify(want);
    expect(flat).toContain('"path":["columns","@5","Row 3"]');
    expect(flat).toContain('"path":["columns","@1","Header"]');
    expect(flat).toContain('"path":["bar","end","Action 1"]');
    // An action part also carries how to find it when the layer is not where the plan looked.
    expect(flat).toContain('"hint":{"component":"Button","index":1}');
  });

  it("says what each slot holds, and which frames are measured for alignment", () => {
    const want = expectations(readPlan("payments-empty.json")) as unknown as Json;
    expect(want.frames.every((frame: Json) => frame.align.title === "Payments and refunds" && frame.align.layer === "title")).toBe(true);
    // The words the spec wrote, so the example-content rule can tell them from the artboard's.
    expect(want.frames[0].words).toContain("Payments and refunds");
    expect(want.frames[0].tree[0].slots).toEqual({ page: ["layout/stack"] });
    const code = auditScript(readPlan("payments-empty.json"));
    expect(code).toContain("bp/figma-example-content");
    expect(code).toContain("bp/figma-align");
    // Both rules read the file and change nothing.
    expect(code).not.toMatch(/appendChild|setProperties|\.remove\(/);
  });

  it("times itself, so the report can say what a render and an audit cost", () => {
    expect(auditScript(readPlan("usage-overview.json"))).toContain("ms: Date.now() - started");
    expect(emitScript(readPlan("usage-overview.json")).code).toContain("ms: Date.now() - started");
  });

  it("finds a swapped instance by the component behind it, not by the layer's name", () => {
    // A Scoreboard put in a Section's content slot is called "content" in the file, so the audit
    // reads the main component as well as the layer name before it says the instance is missing.
    const code = auditScript(readPlan("usage-overview.json"));
    expect(code).toContain("const isOne = (n) => {");
    expect(code).toContain("main.parent.name === nested.component");
  });

  it("names every rule it can report", () => {
    const code = auditScript(readPlan("usage-overview.json"));
    for (const rule of RULES) expect(code).toContain(rule);
  });

  it("draws the line down every card but the last, for any number of cards", () => {
    // The kit's rule, from contracts/scoreboard.json: cards run side by side with no gap and every
    // card but the last has a thin line down its right side. In Figma that line is the card's own
    // showLine, so which card is last has to be written down — the artboard has it on the card that
    // was last there, not the one that is last now.
    expect(map.components.Scoreboard.slots.items.childDivider).toBe("showLine#176:35");

    const board = (count: number): Json => {
      const items = Array.from({ length: count }, (_, i) => ({ id: `m${i + 1}`, title: `Metric ${i + 1}`, metric: `${i + 1}` }));
      const spec = {
        name: "cards",
        title: "Cards",
        pattern: "SettingsPage",
        regions: { content: [{ component: "Scoreboard", props: { items } }] },
      };
      const plan = makePlan(spec);
      expect(plan.ok).toBe(true);
      return treeOf(plan).find((node) => node.component === "Scoreboard") as Json;
    };

    for (const count of [3, 4, 6]) {
      const rows = board(count).items.items.rows;
      expect(rows).toHaveLength(count);
      expect(rows.map((row: Json) => row.props["showLine#176:35"])).toEqual(
        Array.from({ length: count }, (_, i) => i < count - 1),
      );
    }

    // Four cards is the case the pilot got wrong: card 3 kept the artboard's line off while it was
    // no longer last, and card 4 kept one on while it was.
    const four = board(4).items.items.rows;
    expect(four[2].props["showLine#176:35"]).toBe(true);
    expect(four[3].props["showLine#176:35"]).toBe(false);
  });

  it("checks the cards' lines in the file, not against what the plan wrote", () => {
    const want = expectations(readPlan("usage-overview.json")) as unknown as Json;
    const flat = JSON.stringify(want);
    expect(flat).toContain('"divider":{"key":"showLine#176:35","cards":["Card 1","Card 2","Card 3","Card 4","Card 5","Card 6"]}');
    const code = auditScript(readPlan("usage-overview.json"));
    expect(code).toContain("bp/figma-dividers");
    // The rule reads which cards are showing rather than trusting the plan's own count.
    expect(code).toContain("if (card && card.visible) showing.push(card);");
    expect(code).toContain("const wants = i < showing.length - 1;");
    expect(RULES).toContain("bp/figma-dividers");
  });

  it("writes a row with the keys the parent exposes, not the child's own", () => {
    // Read in the file: a Card inside a Scoreboard takes title#176:0, not the Card's own
    // title#189:21, so the map holds the Scoreboard's keys for its cards.
    expect(map.components.Scoreboard.slots.items.childKeys).toEqual({
      title: "title#176:0",
      metric: "metric#176:5",
      metadata: "metadata#176:10",
    });
    const plan = readPlan("usage-overview.json");
    const board = treeOf(plan, "ready").find((node) => node.component === "Scoreboard") as Json;
    expect(board.items.items.rows[0].texts).toEqual({
      "title#176:0": "Rated usage",
      "metric#176:5": "$482,900",
      "metadata#176:10": "128 accounts",
    });
    // The fourth card is the one the spec switches on, and it carries its own words too.
    expect(board.items.items.rows[3].show).toBe("showCard4#176:40");
    expect(board.items.items.rows[3].texts["metric#176:5"]).toBe("$24,180");
  });

  it("turns on the switch that belongs to a slot the spec filled", () => {
    const plan = readPlan("usage-overview.json");
    const section = treeOf(plan, "ready").find((node) => node.component === "Section") as Json;
    // The Scoreboard goes in content#119:91; showContent is the switch that draws that layer.
    expect(Object.keys(section.swaps)).toEqual(["content#119:91"]);
    expect(section.props["showContent#119:78"]).toBe(true);
    // A part of the Section the spec did not ask for is still off.
    expect(section.props["showActions#119:52"]).toBe(false);
  });

  it("asks for the variant that draws a whole row of parts, and says what it cannot fill", () => {
    // Read in the file: the Toolbar's chips are filters > chips > Chip 1 to Chip 4, and they are
    // there only in the filtersOpen=true variant — there is no switch per chip.
    expect(map.components.Toolbar.partLayers.filters).toBe("filters > chips > Chip N");
    expect(map.components.Toolbar.partVariants.filters).toMatchObject({ prop: "filtersOpen", value: "true", count: 4 });

    const plan = readPlan("usage-overview.json");
    const toolbar = treeOf(plan, "ready").find((node) => node.component === "Toolbar") as Json;
    expect(toolbar.props.filtersOpen).toBe("true");
    const chips = toolbar.parts.filter((part: Json) => part.slot === "filters");
    expect(chips.map((part: Json) => part.path)).toEqual([
      ["filters", "chips", "Chip 1"],
      ["filters", "chips", "Chip 2"],
    ]);
    expect(plan.dropped.some((one: Json) => /always draws 4 filters and the spec fills 2/.test(one.why))).toBe(true);
  });

  it("calls a paint override a problem only when the paint is not a variable", () => {
    const code = auditScript(readPlan("settings-home.json"));
    // Swapping an icon's glyph records a fills override on the layer the glyph brings with it.
    // That paint is still bound, so the rule reads the node before it says anything.
    expect(code).toContain("are a colour, not a variable");
    expect(code).toContain("if (boundPaint(paints)) continue;");
    expect(code).not.toContain("are overridden on an instance");
  });

  it("swaps the glyph the spec names onto the nested Icon instance", () => {
    const plan = readPlan("settings-home.json");
    const tiles = treeOf(plan).filter((node) => node.component === "NavTile");
    expect(tiles.length).toBe(8);
    const first = tiles[0].parts.find((part: Json) => part.slot === "icon");
    // The path and the swap property were both read in the file, not guessed.
    expect(first.path).toEqual(["square", "Icon"]);
    expect(first.swaps["glyph#29:0"].component).toBe("Icon shield_person");
    expect(first.swaps["glyph#29:0"].key).toHaveLength(40);
    // The toggle goes on with it, so the icon the glyph sits in is drawn.
    expect(tiles[0].props["showIcon#73:69"]).toBe(true);
  });

  it("says which glyphs the file's icon set does not hold", () => {
    const plan = readPlan("settings-home.json");
    const said = plan.dropped.filter((one: Json) => one.path.endsWith(".props.icon"));
    expect(said.map((one: Json) => one.why)).toEqual([
      'the file\'s icon set has no glyph named "savings", so NavTile draws its own.',
      'the file\'s icon set has no glyph named "sync_alt", so NavTile draws its own.',
    ]);
    // The two tiles whose glyph is not there still draw an icon, and swap nothing.
    const tiles = treeOf(plan).filter((node) => node.component === "NavTile");
    for (const at of [3, 4]) {
      expect(tiles[at].props["showIcon#73:69"]).toBe(true);
      expect(tiles[at].parts.some((part: Json) => part.slot === "icon")).toBe(false);
    }
  });

  it("lays a region out across as many columns as the pattern draws", () => {
    const plan = readPlan("settings-home.json");
    const content = treeOf(plan).find((node) => node.name === "layout/content" && node.region === "content") as Json;
    expect(content.gap).toBe("layout/gutter-md");
    expect(content.children.map((row: Json) => row.name)).toEqual(["layout/content-row", "layout/content-row", "layout/content-row"]);
    expect(content.children.every((row: Json) => row.direction === "HORIZONTAL" && row.children.length === 3)).toBe(true);
    // The short last row is filled out, so its tiles keep the width of the ones above.
    expect(content.children[2].children.map((one: Json) => one.component ?? one.name)).toEqual(["NavTile", "NavTile", "layout/gap"]);
    // A region the map says nothing about is still one column.
    const intro = treeOf(plan).find((node) => node.name === "layout/intro") as Json;
    expect(intro.direction).toBe("VERTICAL");
    expect(intro.gap).toBe(LAYOUT_TOKENS.gap);
  });

  it("carries the glyph swap into the emitted script and into the audit", () => {
    const plan = readPlan("settings-home.json");
    const code = emitScript(plan).code;
    expect(code).toContain('"glyph#29:0"');
    expect(code).toContain("871f8619e7c287728737fac5dc8934a8ee544453");
    // The script resolves the component and sets it by id; it never writes a key as a value.
    expect(code).toContain("await $fig.component(swap)");
    const want = expectations(plan) as unknown as Json;
    expect(JSON.stringify(want)).toContain('"swaps":{"glyph#29:0":"Icon shield_person"}');
  });
});
