/**
 * The audit's rules, run against a fake Figma tree.
 *
 * `runAudit` takes the very body the render sends — `auditFunction()` compiles the same text — so
 * these tests exercise the rules themselves and not a second copy of them. The fake is a plain tree
 * of nodes with the handful of Plugin API methods the audit calls: `findAll`, `findAllWithCriteria`,
 * `loadAsync`, and `figma.getNodeByIdAsync`.
 */
import { describe, expect, it } from "vitest";
import { runAudit } from "../scripts/figma/audit.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a Figma node and a plan are plain JSON under test
type Any = any;
type Raw = Record<string, unknown> & { children?: Raw[] };
type Node = Record<string, Any>;

/** One node and everything under it, with parents wired and the methods the audit uses. */
function tree(spec: Raw): Node {
  const node: Node = { visible: true, ...spec, children: (spec.children ?? []).map((child) => tree(child)) };
  for (const child of node.children) child.parent = node;
  node.findAll = (pred?: (n: Node) => boolean) => {
    const out: Node[] = [];
    const walk = (at: Node) => {
      for (const child of at.children ?? []) {
        if (!pred || pred(child)) out.push(child);
        walk(child);
      }
    };
    walk(node);
    return out;
  };
  node.findAllWithCriteria = ({ types }: { types: string[] }) => node.findAll((n: Node) => types.includes(n.type));
  node.loadAsync = async () => {};
  return node;
}

/** The Plugin API, as much of it as the audit asks for. */
function fakeFigma(page: Node) {
  const byId = new Map<string, Node>();
  const walk = (at: Node) => {
    if (at.id) byId.set(String(at.id), at);
    for (const child of at.children ?? []) walk(child);
  };
  walk(page);
  return {
    mixed: Symbol("mixed"),
    root: { children: [page] },
    variables: { getLocalVariableCollectionsAsync: async () => [{ id: "c1", name: "Scheme", modes: [{ modeId: "m1", name: "Light" }] }] },
    getNodeByIdAsync: async (id: string) => byId.get(String(id)) ?? null,
  };
}

const TITLE_KEY = "title#1:1";
const CARD_LINE = "showLine#176:35";

/** A plan with one frame: an AppShell whose page slot holds a stack with one Scoreboard in it. */
function planOf({ cards = 3, align = true as unknown, words = {} as Record<string, string> } = {}) {
  const scoreboard: Node = {
    kind: "instance",
    component: "Scoreboard",
    props: {},
    texts: words,
    swaps: {},
    slots: {},
    items: { items: { figmaSlot: "items", child: "Card N", childProps: "Card", max: cards, baseline: cards, rows: [], hidden: [], divider: CARD_LINE } },
    parts: [],
    hidden: [],
  };
  const stack: Node = { kind: "layout", name: "layout/stack", direction: "VERTICAL", gap: null, padding: null, radius: null, fill: null, children: [scoreboard] };
  const shell: Node = {
    kind: "instance",
    component: "AppShell",
    props: {},
    texts: {},
    swaps: {},
    slots: { "page#2:2": [stack] },
    items: {},
    parts: [{ path: ["PageHeader"], component: "PageHeader", index: 1, props: {}, texts: { [TITLE_KEY]: "Usage overview" } }],
    hidden: [],
  };
  return {
    ok: true,
    name: "demo",
    frames: [
      {
        name: "demo/ready/light",
        state: "ready",
        theme: "Light",
        title: "Usage overview",
        modes: {},
        fallback: false,
        align,
        root: shell,
        parts: { header: null, nav: null, content: stack },
      },
    ],
  };
}

/** The file the plan above should have produced, with whatever a test wants wrong in it. */
function fileOf({
  cards = [true, false, true],
  cardsVisible = [true, true, true],
  stackAt = 248,
  titleAt = 248,
  crumbAt = 200,
  title = "Usage overview" as string | null,
  extraText = [] as { name: string; chars: string; family?: string }[],
  slotExtra = null as Raw | null,
} = {}) {
  const cardNodes: Raw[] = cards.map((line, i) => ({
    id: `card:${i + 1}`,
    name: `Card ${i + 1}`,
    type: "INSTANCE",
    visible: cardsVisible[i] ?? true,
    mainComponent: { name: "Card" },
    componentProperties: { [CARD_LINE]: { value: String(line), type: "BOOLEAN" } },
    children: [{ id: `card:${i + 1}:t`, name: "Title", type: "TEXT", characters: "Rated usage", fontName: { family: "Inter", style: "Medium" } }],
  }));
  const header: Raw = {
    id: "header:1",
    name: "PageHeader",
    type: "INSTANCE",
    mainComponent: { name: "PageHeader" },
    componentProperties: { [TITLE_KEY]: { value: "Usage overview", type: "TEXT" } },
    children: [
      { id: "crumb", name: "Breadcrumb", type: "TEXT", characters: "Home › Usage", absoluteBoundingBox: { x: crumbAt, y: 40, width: 200, height: 16 }, fontName: { family: "Inter", style: "Regular" } },
      ...(title === null ? [] : [{ id: "title", name: "Title", type: "TEXT", characters: title, absoluteBoundingBox: { x: titleAt, y: 64, width: 300, height: 40 }, fontName: { family: "Inter", style: "Bold" } }]),
    ],
  };
  const slotChildren: Raw[] = [
    {
      id: "stack",
      name: "layout/stack",
      type: "FRAME",
      absoluteBoundingBox: { x: stackAt, y: 120, width: 1000, height: 400 },
      children: [
        {
          id: "scoreboard",
          name: "Scoreboard",
          type: "INSTANCE",
          mainComponent: { name: "Scoreboard" },
          componentProperties: {},
          absoluteBoundingBox: { x: stackAt, y: 120, width: 1000, height: 200 },
          children: [...cardNodes, ...extraText.map((text, i) => ({ id: `extra:${i}`, name: text.name, type: "TEXT", characters: text.chars, fontName: { family: text.family ?? "Inter", style: "Regular" } }))],
        },
      ],
    },
    ...(slotExtra ? [slotExtra] : []),
  ];
  return tree({
    id: "page:1",
    name: "Spec renders",
    type: "PAGE",
    children: [
      {
        id: "section:1",
        name: "demo",
        type: "SECTION",
        children: [
          {
            id: "frame:1",
            name: "demo/ready/light",
            type: "FRAME",
            explicitVariableModes: {},
            absoluteBoundingBox: { x: 0, y: 0, width: 1440, height: 900 },
            children: [
              {
                id: "shell",
                name: "AppShell",
                type: "INSTANCE",
                mainComponent: { name: "AppShell" },
                componentProperties: {},
                absoluteBoundingBox: { x: 0, y: 0, width: 1440, height: 900 },
                children: [header, { id: "slot:page", name: "page", type: "SLOT", children: slotChildren }],
              },
            ],
          },
        ],
      },
    ],
  });
}

const of = (result: Any, rule: string) => (result.findings ?? []).filter((finding: Any) => finding.rule === rule);
// The shell's own breadcrumb trail is example content too, and it has a test of its own below. Every
// other example-content test is about something else, so it is read without the trail.
const content = (result: Any) => of(result, "bp/figma-example-content").filter((finding: Any) => finding.node !== "Breadcrumb");

describe("the audit, against a fake Figma tree", () => {
  it("reads back the frame ids and its own time, whatever it found", async () => {
    const result = (await runAudit(planOf(), { figma: fakeFigma(fileOf()) })) as Any;
    expect(result.frames).toEqual([{ frame: "demo/ready/light", id: "frame:1" }]);
    expect(result.page).toBe("page:1");
    expect(result.section).toBe("section:1");
    expect(typeof result.ms).toBe("number");
  });

  describe("bp/figma-dividers", () => {
    it("passes when every card but the last carries the line", async () => {
      const result = await runAudit(planOf(), { figma: fakeFigma(fileOf({ cards: [true, true, false] })) });
      expect(of(result, "bp/figma-dividers")).toEqual([]);
    });

    it("names the card whose line is wrong, and what to set on it", async () => {
      const result = await runAudit(planOf(), { figma: fakeFigma(fileOf({ cards: [true, false, true] })) });
      const findings = of(result, "bp/figma-dividers");
      expect(findings).toHaveLength(2);
      expect(findings[0].node).toBe("Card 2");
      expect(findings[0].what).toContain("not the last of 3 showing and its line is off");
      expect(findings[0].set).toEqual({ id: "card:2", props: { [CARD_LINE]: true } });
      expect(findings[1].node).toBe("Card 3");
      expect(findings[1].set).toEqual({ id: "card:3", props: { [CARD_LINE]: false } });
    });

    it("counts the cards that are showing, not the ones the artboard draws", async () => {
      // Card 3 is hidden, so Card 2 is the last one showing and carries no line.
      const result = await runAudit(planOf(), { figma: fakeFigma(fileOf({ cards: [true, true, false], cardsVisible: [true, true, false] })) });
      const findings = of(result, "bp/figma-dividers");
      expect(findings).toHaveLength(1);
      expect(findings[0].node).toBe("Card 2");
      expect(findings[0].set).toEqual({ id: "card:2", props: { [CARD_LINE]: false } });
    });
  });

  describe("bp/figma-align", () => {
    it("measures the title layer, not the breadcrumb above it", async () => {
      const result = await runAudit(planOf(), { figma: fakeFigma(fileOf({ crumbAt: 200, titleAt: 248, stackAt: 248 })) });
      expect(of(result, "bp/figma-align")).toEqual([]);
    });

    it("says how far apart the screen and its title are", async () => {
      const result = await runAudit(planOf(), { figma: fakeFigma(fileOf({ titleAt: 248, stackAt: 272 })) });
      const findings = of(result, "bp/figma-align");
      expect(findings).toHaveLength(1);
      expect(findings[0].node).toBe("layout/stack");
      expect(findings[0].what).toBe("the screen starts at 272 and its title at 248, 24px apart");
    });

    it("finds the title by the words on it when the layer is called something else", async () => {
      const file = fileOf({ titleAt: 248, stackAt: 248 });
      const title = file.findAll((n: Node) => n.name === "Title")[0];
      title.name = "h1";
      const result = await runAudit(planOf(), { figma: fakeFigma(file) });
      expect(of(result, "bp/figma-align")).toEqual([]);
    });

    it("says so when the page header has no title layer at all", async () => {
      const result = await runAudit(planOf(), { figma: fakeFigma(fileOf({ title: null })) });
      const findings = of(result, "bp/figma-align");
      expect(findings).toHaveLength(1);
      expect(findings[0].what).toBe("there is no page header title layer to line the screen up with");
      expect(findings[0].node).toBe("PageHeader");
    });

    it("measures nothing when the plan does not ask for it", async () => {
      const result = await runAudit(planOf({ align: false }), { figma: fakeFigma(fileOf({ stackAt: 400 })) });
      expect(of(result, "bp/figma-align")).toEqual([]);
    });
  });

  describe("bp/figma-example-content", () => {
    it("flags a trend, a badge, a total and a pagination line the spec never wrote", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({
        cards: [true, true, false],
        extraText: [
          { name: "Trend", chars: "12% MoM" },
          { name: "Badge", chars: "Month" },
          { name: "Chip", chars: "Status: Pending" },
          { name: "Total", chars: "Total $2,250.00" },
          { name: "Pagination", chars: "Showing 1 to 10 of 59 rows" },
        ],
      });
      const findings = content(await runAudit(plan, { figma: fakeFigma(file) }));
      expect(findings.map((f: Any) => f.node)).toEqual(["Trend", "Badge", "Chip", "Total", "Pagination"]);
      expect(findings[0].what).toBe('"12% MoM" is showing and the spec never wrote it');
      expect(findings[0].id).toBe("extra:0");
    });

    it("leaves the words the spec wrote alone", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({ cards: [true, true, false] });
      expect(content(await runAudit(plan, { figma: fakeFigma(file) }))).toEqual([]);
    });

    it("flags the breadcrumb trail the shell draws of its own", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const findings = of(await runAudit(plan, { figma: fakeFigma(fileOf({ cards: [true, true, false] })) }), "bp/figma-example-content");
      expect(findings).toHaveLength(1);
      expect(findings[0].node).toBe("Breadcrumb");
      expect(findings[0].what).toBe('"Home › Usage" is showing and the spec never wrote it');
    });

    it("leaves an icon glyph alone: a symbol font is not a word", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({ cards: [true, true, false], extraText: [{ name: "glyph", chars: "speed", family: "Material Symbols Outlined" }] });
      expect(content(await runAudit(plan, { figma: fakeFigma(file) }))).toEqual([]);
    });

    it("says nothing twice: the same words in two places are one finding", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({
        cards: [true, true, false],
        extraText: [
          { name: "Trend 1", chars: "12% MoM" },
          { name: "Trend 2", chars: "12% MoM" },
        ],
      });
      expect(content(await runAudit(plan, { figma: fakeFigma(file) }))).toHaveLength(1);
    });

    it("passes over words inside a hidden layer", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({ cards: [true, true, false], extraText: [{ name: "Trend", chars: "12% MoM" }] });
      file.findAll((n: Node) => n.name === "Trend")[0].visible = false;
      expect(content(await runAudit(plan, { figma: fakeFigma(file) }))).toEqual([]);
    });

    it("still reads a slot's own children: a card the plan never put there", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({
        cards: [true, true, false],
        slotExtra: { id: "left:1", name: "Section", type: "INSTANCE", mainComponent: { name: "Section" }, componentProperties: {}, children: [{ id: "left:1:t", name: "Title", type: "TEXT", characters: "Last month", fontName: { family: "Inter", style: "Medium" } }] },
      });
      const findings = content(await runAudit(plan, { figma: fakeFigma(file) }));
      expect(findings.some((f: Any) => f.node === "Section" && f.what.includes("the page slot still holds"))).toBe(true);
    });
  });
});
