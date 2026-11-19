import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatReport, parseLoopArgs, saveSpec } from "../scripts/loop.mjs";
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
