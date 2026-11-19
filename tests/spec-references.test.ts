import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateSpec } from "../scripts/spec/schema.mjs";
import { screenFiles } from "../scripts/spec/render.mjs";
import { reviewSource } from "../scripts/review/index.mjs";
import { compare, pngSize, readPng, signature } from "../scripts/spec/png.mjs";

const REPO = join(import.meta.dirname, "..");
const REFERENCES = join(REPO, "docs", "references");
const SHOTS = join(REFERENCES, "screenshots");
const LOOP = join(REPO, "reports", "loop");

/** The viewport the loop takes every screenshot at. */
const VIEWPORT = { width: 1440, height: 900 };

/** How far a cell of the grid may drift before the screens are not the same screen any more. */
const TOLERANCE = 12;

const specFiles = readdirSync(REFERENCES).filter((name) => name.endsWith(".json")).sort();

type Spec = {
  name: string;
  pattern?: string;
  state?: string;
  states?: string[];
  [key: string]: unknown;
};

const read = (file: string): Spec => JSON.parse(readFileSync(join(REFERENCES, file), "utf8"));

describe("the reference specs", () => {
  it("are there, one per screen pattern a spec can build", () => {
    expect(specFiles).toEqual([
      "account-create.json",
      "account-record.json",
      "approvals-queue.json",
      "billing-dashboard.json",
      "invoices-list.json",
      "payments-empty.json",
      "settings-home.json",
      "usage-import.json",
      "usage-overview.json",
    ]);
  });

  it("cover every screen pattern the kit has", () => {
    // AppShell is the frame every screen already uses, AccountFlow is a flow of screens rather than one,
    // and ChatWindow is the assistant panel, not a page.
    const framesAndFlows = ["AppShell", "AccountFlow", "ChatWindow"];
    const index = JSON.parse(readFileSync(join(REPO, "contracts", "index.json"), "utf8")) as {
      patterns: { name: string }[];
    };
    const wanted = index.patterns.map((row) => row.name).filter((name) => !framesAndFlows.includes(name));
    const covered = [...new Set(specFiles.map((file) => read(file).pattern as string))];
    expect(wanted.filter((name) => !covered.includes(name))).toEqual([]);
  });

  it.each(specFiles)("%s only names things the contracts have", (file) => {
    const result = validateSpec(read(file));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it.each(specFiles)("%s renders the screen that is committed", (file) => {
    const spec = read(file);
    for (const page of screenFiles(spec, { specPath: `docs/references/${file}` }) as { file: string; code: string }[]) {
      const committed = join(REPO, page.file);
      expect(existsSync(committed)).toBe(true);
      expect(readFileSync(committed, "utf8")).toBe(page.code);
    }
  });

  it.each(specFiles)("%s renders a screen the review has nothing to say about", (file) => {
    const spec = read(file);
    for (const page of screenFiles(spec, { specPath: `docs/references/${file}` }) as { file: string; code: string }[]) {
      expect(reviewSource(page.code, page.file)).toEqual([]);
    }
  });
});

// The loop is only followed if the places that tell an agent what to do actually name it.
describe("what the docs tell an agent to do", () => {
  const read = (...path: string[]) => readFileSync(join(REPO, ...path), "utf8");

  it("the skill starts with the spec and ends with the review", () => {
    const skill = read(".claude", "skills", "prototype-from-kit", "SKILL.md");
    const steps = skill.slice(skill.indexOf("## Steps"));
    const first = steps.slice(0, steps.indexOf("2. **"));
    expect(first).toContain("Write the spec first");
    expect(first).toContain("docs/references/");
    expect(first).toContain("validate_spec");
    expect(first).toContain("npm run build-screen");
    expect(first).toContain("npm run loop");
    expect(steps).toContain("npm run review");
    expect(steps.indexOf("npm run review")).toBeGreaterThan(steps.indexOf("npm run loop"));
  });

  it("CLAUDE.md counts the worked examples it actually has", () => {
    const claude = read("CLAUDE.md");
    expect(claude).toContain("nine worked examples");
    expect(specFiles).toHaveLength(9);
  });

  it("the README and the Start pages name the three new ways in", () => {
    for (const file of [
      ["README.md"],
      ["src", "app", "(playground)", "start", "mcp", "page.tsx"],
      ["src", "app", "(playground)", "start", "prompting", "page.tsx"],
    ]) {
      const text = read(...file);
      expect(text, file.join("/")).toContain("validate_spec");
      expect(text, file.join("/")).toContain("build-screen");
      expect(text, file.join("/")).toContain("loop");
    }
  });

  it("AGENTS.md writes the spec rule outside the block next dev owns", () => {
    const agents = read("AGENTS.md");
    const end = agents.indexOf("<!-- END:nextjs-agent-rules -->");
    expect(end).toBeGreaterThan(0);
    const ours = agents.indexOf("# Screens come from a spec");
    expect(ours, "the spec rule sits inside the block next dev rewrites").toBeGreaterThan(end);
    expect(agents).toContain("npm run loop");
  });
});

describe("the reference screenshots", () => {
  it.each(specFiles)("%s has a 1440x900 reference screenshot", (file) => {
    const spec = read(file);
    const shot = join(SHOTS, `${spec.name}.png`);
    expect(existsSync(shot)).toBe(true);
    expect(pngSize(readFileSync(shot))).toEqual(VIEWPORT);
  });

  // The visual snapshot: after a loop run, the screen it photographed has to look like the reference.
  // Without a loop run there is nothing to compare, so the test says so and stops there.
  it.each(specFiles)("%s still looks like its reference after a loop run", (file) => {
    const spec = read(file);
    const state = spec.state ?? "ready";
    const fresh = join(LOOP, spec.name, `${state}-light.png`);
    const reference = join(SHOTS, `${spec.name}.png`);
    if (!existsSync(fresh)) {
      expect(existsSync(reference)).toBe(true);
      return;
    }
    const before = signature(readPng(readFileSync(reference)));
    const after = signature(readPng(readFileSync(fresh)));
    const diff = compare(before, after, { tolerance: TOLERANCE });
    expect(diff).toMatchObject({ same: true });
  });
});
