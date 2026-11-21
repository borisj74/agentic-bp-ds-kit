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
import { renderHelpers } from "../scripts/figma/emit.mjs";

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
    loadFontAsync: async () => {},
  };
}

const TITLE_KEY = "title#1:1";
const CARD_LINE = "showLine#176:35";

/** A plan with one frame: an AppShell whose page slot holds a stack with one Scoreboard in it. */
function planOf({
  cards = 3,
  align = true as unknown,
  words = {} as Record<string, string>,
  skip = ["AppHeader", "AppNav", "assistant"],
  labels = {} as Record<string, string[]>,
} = {}) {
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
    exampleContent: { skip, labels },
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
  shellChrome = [] as Raw[],
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
                children: [...shellChrome, header, { id: "slot:page", name: "page", type: "SLOT", children: slotChildren }],
              },
            ],
          },
        ],
      },
    ],
  });
}

/** Put a node, and everything under it, inside a node of a tree already built. */
function attach(parent: Node, spec: Raw): Node {
  const node = tree(spec);
  node.parent = parent;
  parent.children.push(node);
  return node;
}

const byName = (file: Node, name: string) => file.findAll((n: Node) => n.name === name)[0];
/** The Scoreboard node of the plan above, to give it what a test needs. */
const scoreboardOf = (plan: Any) => plan.frames[0].root.slots["page#2:2"][0].children[0];

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
      expect(findings[0].what).toContain('"12% MoM" is showing and the spec never wrote it');
      expect(findings[0].id).toBe("extra:0");
    });

    it("leaves the words the spec wrote alone", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({ cards: [true, true, false] });
      expect(content(await runAudit(plan, { figma: fakeFigma(file) }))).toEqual([]);
    });

    it("passes over the shell's own chrome: the app header, the nav and the assistant", async () => {
      // The shell draws a search field, a signed-in name, a nav and an assistant panel. None of it
      // is the screen, and no spec can set any of it, so the map's skip list names those layers.
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({
        cards: [true, true, false],
        shellChrome: [
          {
            id: "chrome:header",
            name: "AppHeader",
            type: "INSTANCE",
            mainComponent: { name: "AppHeader" },
            componentProperties: {},
            children: [
              { id: "chrome:search", name: "Search", type: "TEXT", characters: "Search accounts", fontName: { family: "Inter", style: "Regular" } },
              { id: "chrome:user", name: "User", type: "TEXT", characters: "Dana Whitfield", fontName: { family: "Inter", style: "Medium" } },
            ],
          },
          {
            id: "chrome:nav",
            name: "AppNav",
            type: "INSTANCE",
            mainComponent: { name: "AppNav" },
            componentProperties: {},
            children: [{ id: "chrome:nav:1", name: "Item 1", type: "TEXT", characters: "Mediation", fontName: { family: "Inter", style: "Regular" } }],
          },
          {
            id: "chrome:assistant",
            name: "assistant",
            type: "FRAME",
            children: [{ id: "chrome:assistant:1", name: "Greeting", type: "TEXT", characters: "How can I help?", fontName: { family: "Inter", style: "Regular" } }],
          },
        ],
      });
      expect(content(await runAudit(plan, { figma: fakeFigma(file) }))).toEqual([]);
    });

    it("passes over a word a component draws that no spec can set, where the map says so", async () => {
      const file = fileOf({ cards: [true, true, false], extraText: [{ name: "Search", chars: "Search in list" }] });
      const loose = planOf({ words: { "title#176:0": "Rated usage" } });
      expect(content(await runAudit(loose, { figma: fakeFigma(file) }))).toHaveLength(1);
      const allowed = planOf({ words: { "title#176:0": "Rated usage" }, labels: { Scoreboard: ["Search in list"] } });
      expect(content(await runAudit(allowed, { figma: fakeFigma(fileOf({ cards: [true, true, false], extraText: [{ name: "Search", chars: "Search in list" }] })) }))).toEqual([]);
      // Only that word, and only in that component: the allowlist is a list, not a licence.
      const other = fileOf({ cards: [true, true, false], extraText: [{ name: "Trend", chars: "12% MoM" }] });
      expect(content(await runAudit(allowed, { figma: fakeFigma(other) }))).toHaveLength(1);
    });

    it("says where the words it flags are sitting", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const file = fileOf({ cards: [true, true, false], extraText: [{ name: "Trend", chars: "12% MoM" }] });
      const findings = content(await runAudit(plan, { figma: fakeFigma(file) }));
      expect(findings[0].what).toBe('"12% MoM" is showing and the spec never wrote it, inside Trend < Scoreboard < layout/stack < page');
    });

    it("flags the breadcrumb trail the shell draws of its own", async () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      const findings = of(await runAudit(plan, { figma: fakeFigma(fileOf({ cards: [true, true, false] })) }), "bp/figma-example-content");
      expect(findings).toHaveLength(1);
      expect(findings[0].node).toBe("Breadcrumb");
      expect(findings[0].what).toContain('"Home › Usage" is showing and the spec never wrote it');
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

  describe("bp/figma-overflow, inside the page slot", () => {
    /** The file above, with the page slot measured and the Scoreboard as tall as a test says. */
    const tall = (height: number, { clip = false, hiddenCard = false } = {}) => {
      const file = fileOf({ cards: [true, true, false] });
      byName(file, "page").absoluteBoundingBox = { x: 200, y: 0, width: 1240, height: 900 };
      byName(file, "layout/stack").clipsContent = clip;
      byName(file, "Scoreboard").absoluteBoundingBox = { x: 248, y: 120, width: 1000, height: hiddenCard ? 200 : height };
      if (hiddenCard) {
        const card = byName(file, "Card 3");
        card.visible = false;
        card.absoluteBoundingBox = { x: 248, y: 120, width: 300, height };
      }
      return file;
    };

    it("says how far the screen runs past the frame when the shell itself fits", async () => {
      // usage-overview/ready: the AppShell is 900 tall and fits, the screen in its slot ends at 937.
      const result = await runAudit(planOf(), { figma: fakeFigma(tall(817)) });
      const findings = of(result, "bp/figma-overflow");
      expect(findings).toHaveLength(1);
      expect(findings[0].node).toBe("layout/stack");
      expect(findings[0].id).toBe("stack");
      expect(findings[0].what).toBe("the screen in the page slot runs 37px past the bottom of the frame");
    });

    it("measures against the slot when the slot stops short of the frame", async () => {
      const file = tall(700);
      byName(file, "page").absoluteBoundingBox = { x: 200, y: 0, width: 1240, height: 800 };
      const findings = of(await runAudit(planOf(), { figma: fakeFigma(file) }), "bp/figma-overflow");
      expect(findings.map((f: Any) => f.what)).toEqual(["the screen in the page slot runs 20px past the bottom of the page slot"]);
    });

    it("says nothing when the screen fits", async () => {
      expect(of(await runAudit(planOf(), { figma: fakeFigma(tall(700)) }), "bp/figma-overflow")).toEqual([]);
    });

    it("passes over a hidden layer and what a clipping frame cuts off", async () => {
      expect(of(await runAudit(planOf(), { figma: fakeFigma(tall(900, { hiddenCard: true })) }), "bp/figma-overflow")).toEqual([]);
      expect(of(await runAudit(planOf(), { figma: fakeFigma(tall(900, { clip: true })) }), "bp/figma-overflow")).toEqual([]);
    });
  });

  describe("bp/figma-default-icon", () => {
    const ICON = { prop: "icon", path: ["square", "Icon"], key: "glyph#29:0" };
    /** The Scoreboard of the file above, with a tile's icon layer holding the library's shield. */
    const withIcon = ({ hidden = false } = {}) => {
      const file = fileOf({ cards: [true, true, false] });
      attach(byName(file, "page:1") ?? file, { id: "glyph:shield", name: "Icon shield", type: "COMPONENT" });
      attach(byName(file, "Scoreboard"), {
        id: "square",
        name: "square",
        type: "FRAME",
        visible: !hidden,
        children: [{ id: "icon:1", name: "Icon", type: "INSTANCE", mainComponent: { name: "Icon" }, componentProperties: { [ICON.key]: { value: "glyph:shield", type: "INSTANCE_SWAP" } } }],
      });
      return file;
    };
    const planWith = (asked: string | null) => {
      const plan = planOf();
      scoreboardOf(plan).icons = [{ ...ICON, asked }];
      return plan;
    };

    it("flags an icon the spec never set that still shows the library's glyph", async () => {
      const findings = of(await runAudit(planWith(null), { figma: fakeFigma(withIcon()) }), "bp/figma-default-icon");
      expect(findings).toHaveLength(1);
      expect(findings[0].id).toBe("icon:1");
      expect(findings[0].node).toBe("Scoreboard");
      expect(findings[0].what).toBe('icon on Scoreboard shows the library\'s own "Icon shield": the spec sets no icon');
    });

    it("says which glyph the spec asked for when the file's icon set lacks it", async () => {
      const findings = of(await runAudit(planWith("savings"), { figma: fakeFigma(withIcon()) }), "bp/figma-default-icon");
      expect(findings).toHaveLength(1);
      expect(findings[0].what).toContain('the spec asks for "savings", which the file\'s icon set does not hold');
    });

    it("leaves a hidden icon alone: nothing shows", async () => {
      expect(of(await runAudit(planWith(null), { figma: fakeFigma(withIcon({ hidden: true })) }), "bp/figma-default-icon")).toEqual([]);
    });

    it("leaves an icon alone when the plan swapped its glyph", async () => {
      // A swapped glyph is a part of the plan, so it carries no `icons` entry and is checked by props.
      expect(of(await runAudit(planOf(), { figma: fakeFigma(withIcon()) }), "bp/figma-default-icon")).toEqual([]);
    });
  });

  describe("the artboard's own words, written over", () => {
    const WORDS = [
      { was: "Total", text: "Total rated" },
      { was: "$2,250.00", text: "$308,977" },
    ];
    // The fixture's Scoreboard takes no title key of its own, which bp/figma-props says about every
    // plan here; these tests are about the words written over, so they read only those findings.
    const written = (result: Any) => of(result, "bp/figma-props").filter((f: Any) => /plan writes/.test(f.what));
    const planWords = () => {
      const plan = planOf({ words: { "title#176:0": "Rated usage" } });
      scoreboardOf(plan).words = WORDS;
      return plan;
    };
    const fileWords = () =>
      fileOf({
        cards: [true, true, false],
        extraText: [
          { name: "Label", chars: "Total" },
          { name: "Value", chars: "$2,250.00" },
        ],
      });

    it("flags the artboard's total while it still shows", async () => {
      const result = await runAudit(planWords(), { figma: fakeFigma(fileWords()) });
      const props = written(result);
      expect(props.map((f: Any) => f.what)).toEqual([
        '"Total" inside Scoreboard is the artboard\'s, the plan writes "Total rated"',
        '"$2,250.00" inside Scoreboard is the artboard\'s, the plan writes "$308,977"',
      ]);
    });

    it("writes the spec's words over the artboard's, and the audit then passes them", async () => {
      const file = fileWords();
      const figma = fakeFigma(file);
      const fig = await renderHelpers(figma);
      const scoreboard = byName(file, "Scoreboard");
      for (const one of WORDS) expect(await fig.write(scoreboard, one.was, one.text)).toBe(1);
      expect(byName(file, "Label").characters).toBe("Total rated");
      expect(byName(file, "Value").characters).toBe("$308,977");
      const result = await runAudit(planWords(), { figma });
      expect(written(result)).toEqual([]);
      expect(content(result)).toEqual([]);
    });

    it("writes nothing and says so when the artboard's words are not there", async () => {
      const fig = await renderHelpers(fakeFigma(fileWords()));
      expect(await fig.write(byName(fileWords(), "Scoreboard"), "Grand total", "x")).toBe(0);
    });
  });
});
