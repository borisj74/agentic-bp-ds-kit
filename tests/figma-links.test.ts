import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { figmaUrl } from "@/playground/figma";

const repoRoot = resolve(import.meta.dirname, "..");
const FILE_KEY = "ELFJs16lnRVQaOrxhMVrVf";
// The index and the two foundation contracts are not components, so they carry no Figma component.
const NOT_COMPONENTS = new Set(["density.json", "index.json", "layout.json"]);
// figma-map.json is the contract to Figma map, not a contract. tests/figma-map.test.ts checks it.
// widget-sizes.json is the tile size table derived from the layout tokens. tests/widget.test.ts checks it.
const NOT_CONTRACTS = new Set(["figma-map.json", "widget-sizes.json"]);

type Contract = { name: string; figma?: { fileKey?: string; nodeId?: string } };

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8"));
}

const files = readdirSync(resolve(repoRoot, "contracts")).filter((f) => f.endsWith(".json") && !NOT_COMPONENTS.has(f) && !NOT_CONTRACTS.has(f));

describe("figma links", () => {
  it("has contracts to check", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)("%s records its Figma component", (file) => {
    const contract = readJson(`contracts/${file}`) as Contract;
    expect(contract.figma?.nodeId, `${file} figma.nodeId`).toMatch(/^\d+:\d+$/);
    expect(contract.figma?.fileKey, `${file} figma.fileKey`).toBe(FILE_KEY);
  });

  it("the index and the foundation contracts carry no Figma component", () => {
    for (const file of NOT_COMPONENTS) {
      const contract = readJson(`contracts/${file}`) as Contract;
      expect(contract.figma, `${file} figma`).toBeUndefined();
    }
  });

  it("the node id goes into the URL with a dash", () => {
    expect(figmaUrl({ figma: { fileKey: FILE_KEY, nodeId: "81:22" } })).toBe(
      `https://www.figma.com/design/${FILE_KEY}/Agentic-DS?node-id=81-22`,
    );
  });

  it("a contract with no Figma component has no URL", () => {
    expect(figmaUrl({})).toBeNull();
    expect(figmaUrl({ figma: { fileKey: FILE_KEY, nodeId: "" } })).toBeNull();
  });
});
