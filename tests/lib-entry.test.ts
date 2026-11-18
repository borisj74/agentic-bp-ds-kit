import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// src/lib/index.ts is generated from contracts/index.json, the way the token CSS is. It is committed, so this
// checks it is still in sync: a new component in the catalog has to reach the published entry too.
describe("the library entry", () => {
  const entry = () => readFileSync("src/lib/index.ts", "utf8");

  it("is what the generator writes today", () => {
    const before = entry();
    execFileSync("node", ["scripts/build-lib-entry.mjs"], { stdio: "pipe" });
    expect(entry()).toBe(before);
  });

  it("exports every component and pattern in the catalog", () => {
    const index = JSON.parse(readFileSync("contracts/index.json", "utf8"));
    const src = entry();
    const missing = [...index.components, ...index.patterns]
      .map((c: { name: string }) => c.name)
      .filter((name) => !new RegExp(`\\b${name}\\b`).test(src));
    expect(missing).toEqual([]);
  });

  it("loads the tokens before the components, so the roles are there to read", () => {
    const src = entry();
    expect(src.indexOf('import "../tokens/primitives.css"')).toBeLessThan(src.indexOf('import "../tokens/semantic.css"'));
    expect(src.indexOf('import "../tokens/semantic.css"')).toBeLessThan(src.indexOf("export {"));
  });

  it("imports nothing from next, so the entry works in any React app", () => {
    expect(entry()).not.toMatch(/from "next/);
  });
});
