import { existsSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DROP, DROP_DEPS, DROP_SCRIPTS, addStarter, parseArgs } from "../packages/create-agentic-bp-ds/index.mjs";

// The installer's own tests. The installer drops all of tests/ from a prototype, so these run only in the kit
// repo. Nothing is downloaded here — the folder these run against is one this test makes itself.
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

// What a prototype is left with has to stand on its own. The installer drops whole folders, so nothing that
// stays behind may reach into one of them, and nothing it drops may have gone missing from the kit.
describe("what the installer leaves behind", () => {
  const dropped = (DROP as string[]).map((entry) => entry.replace(/\/+$/, ""));

  it("drops the kit's own repo files", () => {
    for (const entry of ["packages", "bin", "mcp", ".github", "LICENSE"]) expect(dropped).toContain(entry);
  });

  it("drops the kit's tests and their runner, so a prototype does not run them", () => {
    expect(dropped).toContain("tests");
    expect(dropped).toContain("vitest.config.mts");
    expect(DROP_SCRIPTS).toContain("test");
    expect(DROP_SCRIPTS).toContain("test:watch");
  });

  it("drops every test-only devDependency with them", () => {
    const testOnly = [
      "vitest",
      "@vitejs/plugin-react",
      "vite-tsconfig-paths",
      "jsdom",
      "axe-core",
      "@testing-library/dom",
      "@testing-library/jest-dom",
      "@testing-library/react",
      "@testing-library/user-event",
    ];
    for (const dep of testOnly) expect(DROP_DEPS).toContain(dep);
    // Nothing in the kit's own package.json that only the tests need may be left out of the list above.
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
    const left = Object.keys(pkg.devDependencies ?? {}).filter(
      (dep) => /vitest|testing-library|jsdom|axe-core|vite-/.test(dep) && !(DROP_DEPS as string[]).includes(dep),
    );
    expect(left, "a test-only devDependency is missing from DROP_DEPS").toEqual([]);
  });

  it("drops the catalog's anomaly-detection prototypes", () => {
    for (const page of ["anomaly-detection", "anomaly-detection-nodes", "anomaly-detection-tree"]) {
      expect(dropped).toContain(`src/app/${page}`);
    }
  });

  it("drops .claude/launch.json but keeps the prototype-from-kit skill", () => {
    expect(dropped).toContain(".claude/launch.json");
    expect(dropped).not.toContain(".claude");
    expect(dropped.some((d) => ".claude/skills".startsWith(d))).toBe(false);
    expect(existsSync(join(REPO, ".claude", "skills", "prototype-from-kit", "SKILL.md"))).toBe(true);
  });

  it("names only paths the kit really has, so a rename cannot leave a drop behind", () => {
    const missing = dropped.filter((entry) => !existsSync(join(REPO, entry)));
    expect(missing, "DROP names a path that is not in the kit").toEqual([]);
  });

  // Every source file that stays has to compile without the dropped folders. The kit's imports are either
  // relative or @/-prefixed, so both forms are resolved back to a repo path and checked against the list.
  const sourceFiles: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(REPO, dir))) {
      if (entry === "node_modules" || entry === ".next") continue;
      const rel = `${dir}/${entry}`;
      if (statSync(join(REPO, rel)).isDirectory()) walk(rel);
      else if (/\.(ts|tsx|mjs)$/.test(entry)) sourceFiles.push(rel);
    }
  };
  for (const top of ["src", "scripts", "starters"]) walk(top);
  const stays = sourceFiles.filter((f) => !dropped.some((d) => f === d || f.startsWith(`${d}/`)));

  it("keeps source files, so the check below is not vacuous", () => {
    expect(stays.length).toBeGreaterThan(100);
  });

  it("leaves nothing behind that imports from a dropped folder", () => {
    const reaching: string[] = [];
    for (const file of stays) {
      const source = readFileSync(join(REPO, file), "utf8");
      const targets = [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
      for (const target of targets) {
        const path = target.startsWith("@/")
          ? `src/${target.slice(2)}`
          : target.startsWith(".")
            ? join(file, "..", target).replace(/\\/g, "/")
            : null;
        if (path && dropped.some((d) => path === d || path.startsWith(`${d}/`))) reaching.push(`${file} -> ${target}`);
      }
    }
    expect(reaching, "a file that stays imports from a folder the installer drops").toEqual([]);
  });
});
