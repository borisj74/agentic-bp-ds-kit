/**
 * The batch: many specs through the code loop, then the Figma scripts for the ones that passed it.
 *
 * The run itself needs a dev server, so what is tested here is the two pure parts: which files a
 * `--dir` run takes, and the summary — failures in full, passes as one row each.
 */
import { describe, expect, it } from "vitest";
import { BATCH_DIR, BATCH_REPORT, formatBatch, specsIn } from "../scripts/figma/batch.mjs";

const ready = {
  spec: "docs/references/payments-empty.json",
  ok: true,
  name: "payments-empty",
  loopMs: 42_000,
  planMs: 820,
  frames: ["payments-empty/empty/light", "payments-empty/empty/dark"],
  render: "reports/figma-loop/batch/payments-empty.render.js",
  audit: "reports/figma-loop/batch/payments-empty.audit.js",
};

const broken = {
  spec: "docs/references/usage-import.json",
  ok: false,
  stage: "the plan does not hold",
  loopMs: 30_000,
  planMs: 400,
  frames: [],
  report: "reports/loop/usage-import.md",
  errors: [{ path: "regions.content[0].slots.children", message: "Form children is one swappable instance in Figma.", fix: "Give .Form fields a slot per field." }],
};

describe("the spec batch", () => {
  it("takes every spec in a directory, in name order", () => {
    const specs = specsIn("docs/references");
    expect(specs[0]).toBe("docs/references/account-create.json");
    expect(specs.every((spec) => spec.endsWith(".json"))).toBe(true);
    expect(specs).toEqual([...specs].sort());
    expect(() => specsIn("docs/no-such-folder")).toThrow(/There is no directory at/);
  });

  it("writes its scripts and its summary where the skill looks for them", () => {
    expect(BATCH_DIR).toBe("reports/figma-loop/batch");
    expect(BATCH_REPORT).toBe("reports/figma-loop/batch.md");
  });

  it("names what is ready to render, with the time each step took", () => {
    const report = formatBatch([ready], { out: BATCH_DIR, page: "Spec renders" });
    expect(report).toContain("1 spec(s): 1 ready to render, 0 failed. Page **Spec renders**.");
    expect(report).toContain("`docs/references/payments-empty.json` | 2 | 42.0s | 820ms");
    expect(report).toContain("`reports/figma-loop/batch/payments-empty.render.js`");
    expect(report).toContain("## Failed\n\nNone.");
  });

  it("spells out a failure, and renders nothing for it", () => {
    const report = formatBatch([ready, broken], { out: BATCH_DIR, page: "Spec renders" });
    expect(report).toContain("2 spec(s): 1 ready to render, 1 failed.");
    expect(report).toContain("### `docs/references/usage-import.json`");
    expect(report).toContain("the plan does not hold — 30.4s. Nothing was rendered.");
    expect(report).toContain("`regions.content[0].slots.children`  Form children is one swappable instance in Figma.");
    expect(report).toContain("fix: Give .Form fields a slot per field.");
    expect(report).toContain("Code loop report: `reports/loop/usage-import.md`");
    // A spec that failed is not in the list of things to send to Figma.
    const renderable = report.slice(report.indexOf("## Ready to render"), report.indexOf("## Failed"));
    expect(renderable).not.toContain("usage-import");
  });

  it("says plainly when nothing is ready", () => {
    const report = formatBatch([broken], { out: BATCH_DIR, page: "Spec renders" });
    expect(report).toContain("None. Nothing is rendered into Figma.");
  });
});
