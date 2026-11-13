import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEVELS, findDrift } from "../scripts/sync-index.mjs";

const repoRoot = resolve(import.meta.dirname, "..");

type IndexRow = { name: string; contract: string; level?: string };
type Index = {
  components: IndexRow[];
  patterns: IndexRow[];
  foundations: IndexRow[];
};

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8"));
}

const index: Index = readJson("contracts/index.json");
const levelled = [
  ...index.components.map((row) => ({ ...row, kind: "component" as const })),
  ...index.patterns.map((row) => ({ ...row, kind: "pattern" as const })),
];

describe("contract levels", () => {
  it("has rows to check", () => {
    expect(index.components.length).toBeGreaterThan(50);
    expect(index.patterns.length).toBeGreaterThan(5);
  });

  it("every component and pattern contract has a level from LEVELS", () => {
    for (const row of levelled) {
      const contract = readJson(row.contract) as { level?: string };
      expect(LEVELS, `${row.name} contract level`).toContain(contract.level);
    }
  });

  it("every component and pattern index row has a level from LEVELS", () => {
    for (const row of levelled) {
      expect(LEVELS, `${row.name} index level`).toContain(row.level);
    }
  });

  it("patterns are templates and components are not", () => {
    for (const row of index.patterns) {
      const contract = readJson(row.contract) as { level?: string };
      expect(contract.level, `${row.name} is a pattern`).toBe("template");
    }
    for (const row of index.components) {
      const contract = readJson(row.contract) as { level?: string };
      expect(contract.level, `${row.name} is a component`).not.toBe("template");
    }
  });

  it("the index matches the contracts", () => {
    expect(findDrift()).toEqual([]);
  });
});
