/// <reference types="vite/client" />
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import index from "../contracts/index.json";
import type { Contract, Example } from "@/playground/Master";
import { registry } from "@/playground/registry";
import { axeViolations } from "./axe";

// Every piece in the index, driven by its own contract: it has a contract and a catalog entry, and each contract
// example renders the way the Variants tab renders it, with no React errors and no axe violations.
const files = import.meta.glob("../contracts/*.json", { eager: true, import: "default" }) as Record<string, Contract>;
const contractAt = (path: string): Contract | undefined => files[`../${path}`];
const pieces = [...index.components, ...index.patterns].map((entry) => ({ name: entry.name, contract: contractAt(entry.contract) }));

let errors: string[] = [];
beforeEach(() => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => { errors.push(args.map(String).join(" ").slice(0, 300)); });
});
afterEach(() => vi.restoreAllMocks());

describe.each(pieces)("$name", ({ name, contract }) => {
  it("has a contract and a catalog entry", () => {
    expect(contract, `contract file for ${name}`).toBeTruthy();
    expect(registry[name], `registry entry for ${name}`).toBeTruthy();
  });

  const examples: Example[] = contract?.examples ?? [];
  it.each(examples.map((ex) => [ex.title, ex] as const))("example \"%s\" renders cleanly and passes axe", async (_title, ex) => {
    const entry = registry[name];
    // Each item on its own, as a screen would hold it: two page headers side by side are the catalog's doing, not the
    // component's. Problems come back as one joined string so a failure prints every line of them.
    const problems: string[] = [];
    for (const [i, item] of ex.items.entries()) {
      const view = render(<div>{entry.render(item.props)}</div>);
      const caption = item.caption ?? `item ${i + 1}`;
      problems.push(...errors.map((e) => `[${caption}] React: ${e}`));
      errors = [];
      problems.push(...(await axeViolations()).map((v) => `[${caption}] axe ${v}`));
      view.unmount();
      cleanup();
    }
    expect(problems.join("\n")).toBe("");
  });
});
