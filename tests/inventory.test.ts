import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildInventory, findDrift, readFigmaPages } from "../scripts/inventory.mjs";

const repoRoot = resolve(import.meta.dirname, "..");

type Piece = {
  name: string;
  level: string;
  intent: string;
  props: number;
  examples: number;
  exampleItems: number;
  importPath: string;
  playground: string;
  contract: string;
  colourLiterals: number;
  darkMode: string;
  density: string;
  statesCovered: string;
  ownStates: number;
};

const { inventory, figma } = buildInventory() as {
  inventory: { counts: Record<string, unknown>; components: Piece[]; patterns: Piece[] };
  figma: {
    pagesFound: number;
    pagesWithComponents: number;
    variants: number;
    pieces: { piece: string; page: string | null; name: string; sets: number; variants: number }[];
  };
};
const pieces = [...inventory.components, ...inventory.patterns];

describe("the inventory records the catalog", () => {
  it("has one row per piece in the index", () => {
    const index = JSON.parse(readFileSync(resolve(repoRoot, "contracts/index.json"), "utf8"));
    expect(inventory.components.map((p) => p.name)).toEqual(
      index.components.map((row: { name: string }) => row.name),
    );
    expect(inventory.patterns.map((p) => p.name)).toEqual(
      index.patterns.map((row: { name: string }) => row.name),
    );
  });

  it("is committed and current, so a new or changed piece has to be recorded", () => {
    expect(findDrift()).toEqual([]);
  });

  it("gives every piece an intent, a level and at least one example", () => {
    for (const piece of pieces) {
      expect(piece.intent, piece.name).not.toBe("");
      expect(["atom", "molecule", "organism", "template"], piece.name).toContain(piece.level);
      expect(piece.examples, piece.name).toBeGreaterThan(0);
    }
  });

  it("counts at least as many example instances as example groups", () => {
    for (const piece of pieces) {
      expect(piece.exampleItems, piece.name).toBeGreaterThanOrEqual(piece.examples);
    }
  });
});

describe("the measured columns point at real things", () => {
  it("names an import path that resolves to the piece's own file", () => {
    for (const piece of pieces) {
      const file = piece.importPath.replace(/^@\//, "src/");
      expect(existsSync(resolve(repoRoot, `${file}.tsx`)), piece.importPath).toBe(true);
    }
  });

  it("names a contract file that is in the repo", () => {
    for (const piece of pieces) {
      const path = piece.contract.split("/blob/main/")[1];
      expect(existsSync(resolve(repoRoot, path)), piece.contract).toBe(true);
    }
  });

  it("builds the playground link from the catalog's own slug", () => {
    for (const piece of pieces) {
      const group = piece.level === "template" ? "patterns" : "components";
      expect(piece.playground).toBe(
        `https://agentic-bp-ds-kit.vercel.app/${group}/${piece.name.toLowerCase()}`,
      );
    }
  });
});

describe("the columns the sheet reads as claims", () => {
  it("says dark mode comes from tokens only where no colour is written out", () => {
    for (const piece of pieces) {
      expect(piece.darkMode, piece.name).toBe(
        piece.colourLiterals === 0 ? "Via tokens" : "Brand colours",
      );
    }
  });

  it("keeps the brand art as the only pieces with colours of their own", () => {
    const written = pieces.filter((piece) => piece.colourLiterals > 0).map((piece) => piece.name);
    expect(written.sort()).toEqual(["Illustration", "Logo", "LogoAI"]);
  });

  it("only says Density sets the density, and only artwork ignores it", () => {
    for (const piece of pieces) {
      const expected =
        piece.name === "Density" ? "Sets it" : piece.colourLiterals === 0 ? "Follows" : "Fixed artwork";
      expect(piece.density, piece.name).toBe(expected);
    }
  });

  it("counts a state only where the piece styles it, and says so when it does not", () => {
    for (const piece of pieces) {
      if (piece.ownStates > 0) {
        expect(piece.statesCovered.split(", "), piece.name).toHaveLength(piece.ownStates);
      } else {
        expect(["In its parts", "Static"], piece.name).toContain(piece.statesCovered);
      }
    }
  });
});

describe("the Figma columns come from the live file and stay out of the repo", () => {
  it("writes no Figma link into docs/inventory.json", () => {
    expect(readFileSync(resolve(repoRoot, "docs/inventory.json"), "utf8")).not.toContain(
      "figma.com",
    );
  });

  it("has a Figma row for every piece, page or no page", () => {
    expect(figma.pieces.map((row) => row.piece).sort()).toEqual(
      pieces.map((piece) => piece.name).sort(),
    );
  });

  it("reads the snapshot of the live file, so every page it names is a real piece", () => {
    const names = new Set(pieces.map((piece) => piece.name));
    for (const name of Object.keys(readFigmaPages().pages)) {
      expect(names, name).toContain(name);
    }
  });

  it("only calls a page built when the live file put components on it", () => {
    for (const row of figma.pieces) {
      const expected = !row.page ? "No page" : row.sets === 0 ? "Page empty" : "Same";
      expect(row.name, row.piece).toBe(expected);
      if (row.sets === 0) expect(row.variants, row.piece).toBe(0);
    }
  });

  it("counts the same pages and variants as the rows it lists", () => {
    expect(figma.pagesFound).toBe(figma.pieces.filter((row) => row.page !== null).length);
    expect(figma.pagesWithComponents).toBe(figma.pieces.filter((row) => row.sets > 0).length);
    expect(figma.variants).toBe(figma.pieces.reduce((total, row) => total + row.variants, 0));
  });
});
