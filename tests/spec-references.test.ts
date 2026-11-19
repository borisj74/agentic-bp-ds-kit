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
  state?: string;
  states?: string[];
  [key: string]: unknown;
};

const read = (file: string): Spec => JSON.parse(readFileSync(join(REFERENCES, file), "utf8"));

describe("the reference specs", () => {
  it("are there, one per screen the kit is asked for most", () => {
    expect(specFiles).toEqual([
      "account-create.json",
      "account-record.json",
      "billing-dashboard.json",
      "invoices-list.json",
      "payments-empty.json",
      "usage-overview.json",
    ]);
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
