import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import { devCommand, formatReport, parseLoopArgs, runLoop, saveSpec, specFormat, startServer } from "../scripts/loop.mjs";
import { fixSpec } from "../scripts/spec/fix.mjs";
import { validateSpec } from "../scripts/spec/schema.mjs";

// The loop itself drives a dev server and a browser, so what is checked here is everything around that:
// its flags, the spec it writes back, and the report it leaves behind.

let folder = "";
beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "loop-"));
});
afterEach(() => rmSync(folder, { recursive: true, force: true }));

const report = (over: Record<string, unknown> = {}) =>
  formatReport({
    spec: { title: "Usage overview", name: "usage-overview", pattern: "ListPage", states: ["ready", "empty"] },
    specPath: "docs/references/usage-overview.json",
    attempts: [
      {
        n: 1,
        pages: [{ state: "ready", route: "/usage-overview", file: "src/app/(examples)/usage-overview/page.tsx" }],
        codeSummary: "1 file: nothing to fix.",
        live: [{ state: "ready", url: "x", findings: [], pieces: 22, patterns: ["ListPage"] }],
        findings: [],
        fixes: [],
      },
    ],
    shots: [{ state: "ready", theme: "light", route: "/usage-overview", file: "reports/loop/usage-overview/ready-light.png" }],
    skipped: null,
    ok: true,
    ...over,
  }) as string;

describe("the loop's flags", () => {
  it("takes --no-shots as the off switch, not as an unknown option", () => {
    expect(parseLoopArgs(["spec.json", "--no-shots"]).values.shots).toBe(false);
    expect(parseLoopArgs(["spec.json"]).values.shots).toBe(true);
    expect(parseLoopArgs(["spec.json", "--no-shots"]).positionals).toEqual(["spec.json"]);
  });

  it("reads the rest of its flags", () => {
    const { values } = parseLoopArgs(["spec.json", "--attempts", "1", "--port", "3200", "--update-references", "--json"]);
    expect(values).toMatchObject({ attempts: "1", port: "3200", "update-references": true, json: true });
  });
});

describe("the spec the loop writes back", () => {
  it("writes it the way the references are written", () => {
    const file = join(folder, "spec.json");
    saveSpec(file, { name: "demo", title: "Demo" });
    const written = readFileSync(file, "utf8");
    expect(written.endsWith("\n")).toBe(true);
    expect(written).toBe('{\n  "name": "demo",\n  "title": "Demo"\n}\n');
  });

  it("carries the repair, so the next run starts from the repaired spec", () => {
    const draft = {
      name: "demo-screen",
      title: "Demo",
      pattern: "ListPage",
      regions: {
        toolbar: [
          {
            component: "Toolbar",
            props: { label: "Rows" },
            slots: {
              actions: [
                { component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "New" },
                { component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Also new" },
              ],
            },
          },
        ],
        content: [{ component: "Table", props: { columns: [{ key: "id", header: "Id" }], rows: [{ id: "1" }] } }],
      },
    };
    expect(validateSpec(draft).ok).toBe(false);

    const { spec: repaired, fixes } = fixSpec(draft) as { spec: typeof draft; fixes: { rule: string }[] };
    expect(fixes.map((fix) => fix.rule)).toContain("bp/one-primary");
    expect(validateSpec(repaired).ok).toBe(true);

    const file = join(folder, "spec.json");
    writeFileSync(file, JSON.stringify(draft));
    saveSpec(file, repaired);
    const back = JSON.parse(readFileSync(file, "utf8"));
    expect(back.regions.toolbar[0].slots.actions[1].props).toEqual({ emphasis: "subtle" });
  });
});

describe("the loop's report", () => {
  it("says the spec is unchanged when nothing was repaired", () => {
    const text = report();
    expect(text).toContain("## Repairs written back to the spec");
    expect(text).toContain("docs/references/usage-overview.json` is unchanged");
  });

  it("lists what it wrote back into the spec", () => {
    const text = report({
      saved: [{ rule: "bp/one-primary", what: "regions.toolbar[0] is now subtle neutral." }],
    });
    expect(text).toContain("bp/one-primary");
    expect(text).toContain("regions.toolbar[0] is now subtle neutral.");
    expect(text).toContain("so the next run starts from the repaired spec");
  });

  it("does not name the port it happened to use, since the next run picks its own", () => {
    expect(report()).not.toMatch(/on port \d+/i);
    expect(report()).not.toMatch(/localhost:\d+/);
    expect(report()).toContain("Served by next dev with `NEXT_PUBLIC_BP_INSPECT=1`.");
  });

  it("still names every rule, the attempts and the screenshots", () => {
    const text = report();
    expect(text).toContain("| bp/raw-value | pass | 0 | 0 |");
    expect(text).toContain("### Attempt 1 — pass");
    expect(text).toContain("reports/loop/usage-overview/ready-light.png");
  });
});

// A problem the spec check cannot refuse and only the review of the written screen reports: a raw value
// in a `style` prop. `style` is a prop every React element takes, so no contract lists it and no enum
// covers its values — the loop meets it as bp/raw-value and repairs it between attempts.
describe("the loop's retry", () => {
  const REPO = join(import.meta.dirname, "..");
  const NAME = "loop-fixture-screen";
  const SPEC_FILE = `reports/loop/${NAME}.spec.json`;
  const draft = () => ({
    name: NAME,
    title: "Loop fixture",
    pattern: "ListPage",
    regions: {
      toolbar: [
        {
          component: "Toolbar",
          props: { label: "Rows" },
          slots: {
            actions: [
              { component: "Button", props: { emphasis: "strong", intent: "brand", style: { padding: "13px" } }, text: "New" },
            ],
          },
        },
      ],
      content: [{ component: "Table", props: { columns: [{ key: "id", header: "Id" }], rows: [{ id: "1" }] } }],
    },
  });

  // In place of next dev: a page that wears the name tags the live check looks for, so the live rules
  // pass and the only error is the one the code review finds in the screen the loop just wrote.
  const served = [
    '<html><body><main><nav><a href="/">Home</a></nav>',
    `<h1>Loop fixture</h1><div data-bp-kit="ListPage"><table data-bp-kit="Table"></table></div>`,
    "</main></body></html>",
  ].join("");
  const fakeServer = async () => ({ base: "http://loop.test", port: 0, stop: async () => {}, output: [], pid: undefined });
  const fakeFetch = async () => new Response(served, { status: 200, headers: { "content-type": "text/html" } });

  const clean = () => {
    rmSync(join(REPO, SPEC_FILE), { force: true });
    rmSync(join(REPO, "src/app/(examples)", NAME), { recursive: true, force: true });
    rmSync(join(REPO, "reports/loop", `${NAME}.md`), { force: true });
  };
  beforeEach(() => {
    clean();
    mkdirSync(join(REPO, "reports/loop"), { recursive: true });
    writeFileSync(join(REPO, SPEC_FILE), `${JSON.stringify(draft(), null, 2)}\n`);
  });
  afterEach(clean);

  it("repairs on the second attempt, saves the spec and says so in the report", async () => {
    const result = await runLoop(SPEC_FILE, { shots: false, server: fakeServer, fetchImpl: fakeFetch });

    // Attempt 1 wrote the screen with the raw value in it and the code review said so.
    const first = result.attempts[0];
    const raw = first.findings.filter((f: { rule: string }) => f.rule === "bp/raw-value");
    expect(raw.length).toBeGreaterThan(0);
    expect(first.fixes.map((f: { rule: string }) => f.rule)).toContain("bp/raw-value");

    // Attempt 2 built the repaired spec, and nothing is left to fix.
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[1].findings.filter((f: { severity: string }) => f.severity === "error")).toEqual([]);
    expect(result.ok).toBe(true);

    // The repair went back into the spec file, so the next run starts from it.
    const saved = JSON.parse(readFileSync(join(REPO, SPEC_FILE), "utf8"));
    expect(saved.regions.toolbar[0].slots.actions[0].props.style.padding).toBe("var(--space-small)");

    // And the screen that is on disk is the repaired one.
    const page = readFileSync(join(REPO, "src/app/(examples)", NAME, "page.tsx"), "utf8");
    expect(page).toContain("var(--space-small)");
    expect(page).not.toContain("13px");

    // The report names the repair under its own heading.
    expect(existsSync(join(REPO, result.reportFile))).toBe(true);
    const report = readFileSync(join(REPO, result.reportFile), "utf8");
    expect(report).toContain("## Repairs written back to the spec");
    expect(report).toContain("bp/raw-value");
    expect(report).toContain("var(--space-small)");
    // Both attempts type-checked the pages they wrote, and the repaired screen compiles.
    expect(result.attempts[1].findings.filter((f: { rule: string }) => f.rule === "bp/typecheck")).toEqual([]);
  }, 120000);
});

// ---- the typecheck ------------------------------------------------------------------------------

// A prop a component does not take is a fault no rule reads: `style` is free, so no contract lists it
// and no enum covers it, and the code review and the live review both pass. The screen does not
// compile, so the loop type-checks what it wrote and will not call it a pass.
describe("the typecheck of the pages the loop writes", () => {
  const REPO = join(import.meta.dirname, "..");
  const NAME = "loop-typecheck-screen";
  const SPEC_FILE = `reports/loop/${NAME}.spec.json`;
  const served = [
    '<html><body><main><nav><a href="/">Home</a></nav>',
    '<h1>Typecheck fixture</h1><div data-bp-kit="ListPage"><table data-bp-kit="Table"></table></div>',
    "</main></body></html>",
  ].join("");
  const fakeServer = async () => ({ base: "http://types.test", port: 0, stop: async () => {}, output: [], pid: undefined });
  const fakeFetch = async () => new Response(served, { status: 200, headers: { "content-type": "text/html" } });

  const clean = () => {
    rmSync(join(REPO, SPEC_FILE), { force: true });
    rmSync(join(REPO, "src/app/(examples)", NAME), { recursive: true, force: true });
    rmSync(join(REPO, "reports/loop", `${NAME}.md`), { force: true });
  };
  beforeEach(clean);
  afterEach(clean);

  it("fails the screen when a Section is given a style it does not take", async () => {
    // display: flex is no raw value, so no fixer touches it: the only thing wrong is the prop itself.
    const draft = {
      name: NAME,
      title: "Typecheck fixture",
      pattern: "ListPage",
      regions: {
        above: [{ component: "Section", props: { title: "Totals", style: { display: "flex" } } }],
        content: [{ component: "Table", props: { columns: [{ key: "id", header: "Id" }], rows: [{ id: "1" }] } }],
      },
    };
    mkdirSync(join(REPO, "reports/loop"), { recursive: true });
    writeFileSync(join(REPO, SPEC_FILE), `${JSON.stringify(draft, null, 2)}\n`);
    // The spec check cannot refuse it, and neither review reads it.
    expect(validateSpec(draft).ok).toBe(true);

    const result = await runLoop(SPEC_FILE, { shots: false, attempts: 1, server: fakeServer, fetchImpl: fakeFetch });
    expect(result.ok).toBe(false);
    const types = result.attempts[0].findings.filter((f: { rule: string }) => f.rule === "bp/typecheck");
    expect(types.length).toBeGreaterThan(0);
    expect(types[0]).toMatchObject({ severity: "error", where: "types" });
    expect(types[0].file).toContain(NAME);
    expect(types[0].message).toContain("SectionProps");
    expect(readFileSync(join(REPO, result.reportFile), "utf8")).toContain("bp/typecheck");
  }, 120000);
});

// ---- the dev server ------------------------------------------------------------------------------

/** True when something is listening on the port. */
const listening = (port: number) =>
  new Promise<boolean>((done) => {
    const probe = createServer();
    probe.once("error", () => done(true));
    probe.once("listening", () => probe.close(() => done(false)));
    probe.listen(port, "127.0.0.1");
  });

const settle = async (port: number, want: boolean, tries = 40) => {
  for (let i = 0; i < tries; i += 1) {
    if ((await listening(port)) === want) return true;
    await new Promise((done) => setTimeout(done, 100));
  }
  return false;
};

describe("the dev server the loop starts", () => {
  const REPO = join(import.meta.dirname, "..");
  const STUB = join(REPO, "tests/fixtures/loop/stub-server.mjs");
  const port = 3987;
  let pid: number | undefined;

  afterEach(() => {
    if (pid === undefined) return;
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      // already gone
    }
    pid = undefined;
  });

  it("runs the local next binary, not npx, so there is no wrapper process in the way", () => {
    const dev = devCommand(REPO);
    expect(dev.command.endsWith("node_modules/.bin/next")).toBe(true);
    expect(dev.args).toEqual(["dev"]);
    // A checkout with no node_modules still works, through npx.
    expect(devCommand(join(REPO, "no-such-folder"))).toEqual({ command: "npx", args: ["next", "dev"] });
  });

  // The stub spawns a grandchild that holds the port, the way npx spawns next and next spawns its
  // workers. Signalling the one process the loop started would leave that grandchild listening.
  it("leaves nothing listening after it stops, children and all", async () => {
    expect(await listening(port)).toBe(false);

    const server = await startServer({
      root: REPO,
      port,
      timeout: 30000,
      command: process.execPath,
      args: [STUB, String(port)],
    });
    pid = server.pid;
    expect(server.base).toBe(`http://localhost:${port}`);
    expect(await listening(port)).toBe(true);

    await server.stop();
    expect(await settle(port, false)).toBe(true);
    await expect(fetch(server.base)).rejects.toThrow();
  }, 60000);
});

// ---- the formatting of the spec it writes back ---------------------------------------------------

describe("the spec file's own formatting", () => {
  it("keeps the indent, the line ending and the last newline, so the diff is the repair alone", () => {
    const file = join(folder, "tabs.json");
    const original = '{\n\t"name": "demo",\n\t"title": "Demo"\n}';
    writeFileSync(file, original);
    const result = saveSpec(file, { name: "demo", title: "Repaired" });
    expect(readFileSync(file, "utf8")).toBe('{\n\t"name": "demo",\n\t"title": "Repaired"\n}');
    expect(result.reformatted).toBe(false);
  });

  it("changes only the line the repair touched", () => {
    const file = join(folder, "spec.json");
    const spec = { name: "demo", title: "Demo", regions: { content: [{ component: "Table", props: { style: { padding: "13px" } } }] } };
    writeFileSync(file, `${JSON.stringify(spec, null, 2)}\n`);
    const before = readFileSync(file, "utf8").split("\n");
    spec.regions.content[0].props.style.padding = "var(--space-small)";
    saveSpec(file, spec);
    const after = readFileSync(file, "utf8").split("\n");
    expect(after).toHaveLength(before.length);
    const changed = after.filter((line, i) => line !== before[i]);
    expect(changed).toEqual(['            "padding": "var(--space-small)"']);
  });

  it("keeps a folded file folded, since the edit goes where the value is", () => {
    const file = join(folder, "folded.json");
    writeFileSync(file, '{ "name": "demo", "title": "Demo" }\n');
    expect(saveSpec(file, { name: "demo", title: "Repaired" }).reformatted).toBe(false);
    expect(readFileSync(file, "utf8")).toBe('{ "name": "demo", "title": "Repaired" }\n');
  });

  it("writes the file again, and says so, when its text cannot carry the change", () => {
    const file = join(folder, "grown.json");
    writeFileSync(file, '{ "name": "demo" }\n');
    // A key the text does not hold: there is no value to replace, so the file is written again.
    expect(saveSpec(file, { name: "demo", title: "Demo" }).reformatted).toBe(true);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ name: "demo", title: "Demo" });
    expect(specFormat('{\n    "a": 1\n}\n')).toEqual({ eol: "\n", indent: 4, finalNewline: true });
  });

  // The references are written by hand: inline arrays, inline props objects, their own key order. A
  // repair has to read as a change to the value it repaired and nothing else.
  it("edits a hand-written reference spec in place, down to the line", () => {
    const reference = readFileSync(join(import.meta.dirname, "../docs/references/usage-overview.json"), "utf8");
    // Two faults, in two shapes the file writes on one line: Home in an inline array, and a raw value
    // in an inline props object.
    const broken = reference
      .replace('"breadcrumbs": ["Mediation"]', '"breadcrumbs": ["Home", "Mediation"]')
      .replace(
        '"props": { "size": "sm", "emphasis": "strong", "intent": "brand", "iconStart": "download" }',
        '"props": { "size": "sm", "emphasis": "strong", "intent": "brand", "iconStart": "download", "style": { "padding": "13px" } }',
      );
    expect(broken).not.toBe(reference);

    const file = join(folder, "usage-overview.json");
    writeFileSync(file, broken);
    const { spec: repaired, fixes } = fixSpec(JSON.parse(broken)) as { spec: object; fixes: { rule: string }[] };
    expect(fixes.map((fix) => fix.rule).sort()).toEqual(["bp/raw-value", "bp/screen-frame"]);
    expect(saveSpec(file, repaired).reformatted).toBe(false);

    const after = readFileSync(file, "utf8").split("\n");
    const before = broken.split("\n");
    expect(after).toHaveLength(before.length);
    const touched = after.map((line, i) => [i, line, before[i]]).filter(([, line, was]) => line !== was);
    expect(touched.map(([i]) => i)).toEqual([6, 109]);
    // The inline array stays inline, and the file is the reference again but for the repaired value.
    expect(after[6]).toBe('  "breadcrumbs": ["Mediation"],');
    expect(after[109]).toContain('"style": { "padding": "var(--space-small)" }');
    expect(after[109].trimStart().startsWith('"props": { "size": "sm"')).toBe(true);
  });
});
