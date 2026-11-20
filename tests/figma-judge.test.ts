import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FOR_PERSON, judge, readAudit, REPAIRABLE } from "../scripts/figma/judge.mjs";
import { RULES } from "../scripts/figma/audit.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a spec and an audit are plain JSON under test
type Json = Record<string, any>;

const REPO = join(import.meta.dirname, "..");
const REFERENCE = join(REPO, "docs", "references", "usage-overview.json");

/** A spec in a folder of its own, so a repair that is written back touches nothing in the repo. */
function scratch(spec: unknown, name = "screen.json") {
  const dir = mkdtempSync(join(tmpdir(), "figma-judge-"));
  const file = join(dir, name);
  writeFileSync(file, `${JSON.stringify(spec, null, 2)}\n`);
  return file;
}

const read = (file: string): Json => JSON.parse(readFileSync(file, "utf8"));

/** A screen with two strong brand Buttons: one of the repairs scripts/spec/fix.mjs makes. */
const twoPrimaries = {
  name: "two-primaries",
  title: "Two primaries",
  pattern: "SettingsPage",
  regions: {
    content: [
      { component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Save" },
      { component: "Button", props: { emphasis: "strong", intent: "brand" }, text: "Publish" },
    ],
  },
};

const finding = (rule: string, what = "something is off") => ({
  rule,
  frame: "two-primaries/ready/light",
  node: "layout/content",
  id: "1:2",
  what,
});

describe("the judge", () => {
  it("says a clean audit is done, and leaves the spec alone", () => {
    const file = scratch(read(REFERENCE));
    const before = readFileSync(file, "utf8");
    const result = judge({ specFile: file, audit: { ok: true } });
    expect(result.ok).toBe(true);
    expect(result.done).toBe(true);
    expect(result.render).toBe(false);
    expect(result.forPerson).toEqual([]);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("makes the repairs fix.mjs makes, writes the spec back, and asks for another render", () => {
    const file = scratch(twoPrimaries);
    const result = judge({ specFile: file, audit: { ok: false, findings: [finding("bp/figma-props", 'intent is "brand", the plan says "neutral"')] } });
    expect(result.repaired.map((fix: Json) => fix.rule)).toContain("bp/one-primary");
    expect(result.render).toBe(true);
    expect(result.wrote?.file).toBe(file);
    const after = read(file);
    expect(after.regions.content[1].props).toEqual({ emphasis: "subtle" });
    // The repair is an edit of the file's own text, so the rest of the file is byte for byte as it was.
    expect(readFileSync(file, "utf8")).toContain('"title": "Two primaries"');
  });

  it("leaves the spec on disk alone when it is asked not to write", () => {
    const file = scratch(twoPrimaries);
    const before = readFileSync(file, "utf8");
    const result = judge({ specFile: file, audit: { ok: false, findings: [finding("bp/figma-props")] }, write: false });
    expect(result.repaired.length).toBeGreaterThan(0);
    expect(result.wrote).toBe(null);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("hands a finding no fixer can answer to a person, with what to decide", () => {
    const file = scratch(read(REFERENCE));
    const result = judge({ specFile: file, audit: { ok: false, findings: [finding("bp/figma-overflow", "it sticks out of the frame")] } });
    expect(result.ok).toBe(false);
    expect(result.render).toBe(false);
    expect(result.forPerson).toEqual([
      {
        rule: "bp/figma-overflow",
        frame: "two-primaries/ready/light",
        node: "layout/content",
        id: "1:2",
        what: "it sticks out of the frame",
        decide: FOR_PERSON["bp/figma-overflow"],
      },
    ]);
  });

  it("says the same thing once, however many frames reported it", () => {
    const file = scratch(read(REFERENCE));
    const findings = ["light", "dark"].map((theme) => ({ ...finding("bp/figma-detached"), frame: `usage-overview/ready/${theme}` }));
    const result = judge({ specFile: file, audit: { ok: false, findings: [...findings, findings[0]] } });
    expect(result.forPerson).toHaveLength(2);
  });

  it("knows a rule for every rule the audit can report", () => {
    for (const rule of RULES) {
      expect(Object.keys(REPAIRABLE)).toContain(rule);
      expect((FOR_PERSON as Json)[rule]).toBeTruthy();
    }
  });

  it("reports a rule it has never heard of rather than swallowing it", () => {
    const file = scratch(read(REFERENCE));
    const result = judge({ specFile: file, audit: { ok: false, findings: [{ rule: "bp/figma-moon", frame: "f", node: "n", what: "the moon is wrong" }] } });
    expect(result.forPerson.some((item: Json) => /does not know/.test(item.what))).toBe(true);
  });

  it("reads an audit as an object, as JSON, or as a file", () => {
    expect(readAudit({ ok: true })).toEqual({ ok: true });
    expect(readAudit('{"ok":true}')).toEqual({ ok: true });
    const file = scratch({ ok: false, findings: [] }, "audit.json");
    expect(readAudit(file)).toEqual({ ok: false, findings: [] });
  });

  it("writes nothing when the repairs would leave the spec unbuildable", () => {
    // A spec the fixers change and the contracts then refuse: the empty state has nothing to show.
    const file = scratch({ ...twoPrimaries, states: ["empty"] });
    const before = readFileSync(file, "utf8");
    const result = judge({ specFile: file, audit: { ok: false, findings: [finding("bp/figma-props")] } });
    expect(result.render).toBe(false);
    expect(result.forPerson.some((item: Json) => /unbuildable/.test(item.what))).toBe(true);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("throws a readable message when there is no spec there", () => {
    expect(() => judge({ specFile: "docs/references/nope.json" })).toThrow(/There is no spec at/);
  });
});
