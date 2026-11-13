import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DROP, addStarter, parseArgs } from "../packages/create-agentic-bp-ds/index.mjs";

// The installer's own tests. They live apart from tests/new-screen.test.ts, and in the installer's DROP list,
// because the installer drops packages/ from a prototype: a test file left behind that imports from there would
// break the prototype's own typecheck, build and tests. Nothing is downloaded here — the folder these run
// against is one this test makes itself.
const REPO = join(import.meta.dirname, "..");

let root = "";
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "create-installer-"));
  cpSync(join(REPO, "starters"), join(root, "starters"), { recursive: true });
  cpSync(join(REPO, "scripts", "new-screen.mjs"), join(root, "scripts", "new-screen.mjs"), { recursive: true });
  mkdirSync(join(root, "src", "app"), { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("the installer's flags", () => {
  it("reads the folder name, --template and --route", () => {
    expect(parseArgs(["my-app"])).toEqual({ name: "my-app" });
    expect(parseArgs(["my-app", "--template", "dashboard"])).toEqual({ name: "my-app", template: "dashboard" });
    expect(parseArgs(["my-app", "--template", "dashboard", "--route", "sales"])).toEqual({
      name: "my-app",
      template: "dashboard",
      route: "sales",
    });
    expect(parseArgs(["--template=dashboard", "my-app", "--route=sales"])).toEqual({
      name: "my-app",
      template: "dashboard",
      route: "sales",
    });
    // No folder name given: the installer asks for one.
    expect(parseArgs(["--template", "dashboard"])).toEqual({ template: "dashboard" });
    // A flag is never mistaken for the folder name.
    expect(parseArgs([]).name).toBeUndefined();
  });
});

describe("the installer's starter step", () => {
  it("writes the screen into the unpacked folder", () => {
    expect(addStarter(root, { template: "dashboard", route: "sales" })).toEqual({ route: "sales" });
    expect(existsSync(join(root, "src", "app", "sales", "page.tsx"))).toBe(true);
  });

  it("falls back to the starter's id when no route is given", () => {
    expect(addStarter(root, { template: "Dashboard" })).toEqual({ route: "dashboard" });
  });

  it("prints the lowercased address for a route typed in capitals", () => {
    expect(addStarter(root, { template: "dashboard", route: "Sales" })).toEqual({ route: "sales" });
    expect(existsSync(join(root, "src", "app", "sales", "page.tsx"))).toBe(true);
  });

  it("does nothing without --template", () => {
    expect(addStarter(root, {})).toBeNull();
    expect(existsSync(join(root, "src", "app", "dashboard"))).toBe(false);
  });

  it("carries on when the kit version has no starters folder", () => {
    rmSync(join(root, "starters"), { recursive: true, force: true });
    expect(addStarter(root, { template: "dashboard" })).toBeNull();
  });
});

// What a prototype is left with has to stand on its own. The installer drops whole folders, so no test file
// that stays behind may import from one of them.
describe("what the installer leaves behind", () => {
  const dropped = DROP.map((entry: string) => entry.replace(/\/+$/, ""));
  const stays = readdirSync(join(REPO, "tests"))
    .filter((f) => /\.test\.tsx?$/.test(f))
    .filter((f) => !dropped.includes(`tests/${f}`));

  it("drops this file, so its own import of the installer is fine", () => {
    expect(dropped).toContain("tests/create-installer.test.ts");
  });

  it("keeps some tests, so the check below is not vacuous", () => {
    expect(stays.length).toBeGreaterThan(0);
    expect(stays).toContain("new-screen.test.ts");
  });

  it.each(stays)("%s imports nothing the installer drops", (file) => {
    const source = readFileSync(join(REPO, "tests", file), "utf8");
    // Every from "..." and import("...") in the file, resolved against tests/ and read back as a repo path.
    const targets = [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const reaching = targets
      .filter((t) => t.startsWith("."))
      .map((t) => join("tests", t).replace(/\\/g, "/"))
      .filter((path) => dropped.some((d) => path === d || path.startsWith(`${d}/`)));
    expect(reaching, `${file} imports from a folder the installer drops`).toEqual([]);
  });
});
