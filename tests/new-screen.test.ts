import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NewScreenError, findStarter, newScreen, parseArgs, readStarters } from "../scripts/new-screen.mjs";

const REPO = join(import.meta.dirname, "..");
const COPIER = join(REPO, "scripts", "new-screen.mjs");
const starters = readStarters(REPO);

// Each test gets its own folder: starters/ copied in as the kit ships it, and an empty src/app to write into.
let root = "";
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "new-screen-"));
  cpSync(join(REPO, "starters"), join(root, "starters"), { recursive: true });
  mkdirSync(join(root, "src", "app"), { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("starters/index.json", () => {
  it("lists the starter set, each with a page of its own", () => {
    expect(starters.map((s) => s.id)).toEqual([
      "list",
      "record",
      "form",
      "dashboard",
      "list-detail",
      "settings",
      "guided-process",
      "blank",
    ]);
    for (const s of starters) {
      expect(s.title, `title for ${s.id}`).toBeTruthy();
      expect(s.about, `about line for ${s.id}`).toBeTruthy();
      expect(existsSync(join(REPO, "starters", s.id, "page.tsx")), `page for ${s.id}`).toBe(true);
    }
  });

  it("names a pattern that is in the contracts index, or null for blank", async () => {
    const index = JSON.parse(readFileSync(join(REPO, "contracts", "index.json"), "utf8"));
    const names = index.patterns.map((p: { name: string }) => p.name);
    for (const s of starters) {
      if (s.template === null) continue;
      expect(names, `${s.id} names a real pattern`).toContain(s.template);
    }
  });
});

describe("newScreen", () => {
  it.each(starters.map((s) => [s.id, s] as const))("writes the %s page and keeps its pattern import", (_id, starter) => {
    const made = newScreen({ root, template: starter.id });
    expect(made.route).toBe(starter.id);
    expect(made.file).toBe(`src/app/${starter.id}/page.tsx`);

    const written = readFileSync(join(root, made.file), "utf8");
    // The page is the starter, byte for byte.
    expect(written).toBe(readFileSync(join(REPO, "starters", starter.id, "page.tsx"), "utf8"));
    // Every screen sits in the frame; a starter built on a pattern imports that pattern.
    expect(written).toContain('from "@/patterns/AppShell/AppShell"');
    if (starter.template) expect(written).toContain(`from "@/patterns/${starter.template}/${starter.template}"`);
  });

  it("takes the pattern's own name, in any case", () => {
    expect(newScreen({ root, template: "Dashboard", route: "one" }).id).toBe("dashboard");
    expect(newScreen({ root, template: "GUIDEDPROCESSPAGE", route: "two" }).id).toBe("guided-process");
    expect(newScreen({ root, template: "List-Detail", route: "three" }).id).toBe("list-detail");
  });

  it("puts the screen on the route it is given", () => {
    const made = newScreen({ root, template: "dashboard", route: "sales" });
    expect(made.route).toBe("sales");
    expect(made.url).toBe("http://localhost:3000/sales");
    expect(existsSync(join(root, "src", "app", "sales", "page.tsx"))).toBe(true);
  });

  it("refuses a page that is already there, and overwrites it with force", () => {
    newScreen({ root, template: "dashboard" });
    writeFileSync(join(root, "src", "app", "dashboard", "page.tsx"), "mine\n");

    expect(() => newScreen({ root, template: "dashboard" })).toThrow(NewScreenError);
    expect(() => newScreen({ root, template: "dashboard" })).toThrow(/already exists/);
    expect(readFileSync(join(root, "src", "app", "dashboard", "page.tsx"), "utf8")).toBe("mine\n");

    newScreen({ root, template: "dashboard", force: true });
    expect(readFileSync(join(root, "src", "app", "dashboard", "page.tsx"), "utf8")).toContain("AppShell");
  });

  it("refuses a route the playground owns", () => {
    for (const taken of ["components", "patterns", "foundations", "start"]) {
      expect(() => newScreen({ root, template: "dashboard", route: taken })).toThrow(/already owns/);
      expect(existsSync(join(root, "src", "app", taken))).toBe(false);
    }
  });

  it("lowercases the route it is given", () => {
    const made = newScreen({ root, template: "dashboard", route: "Sales" });
    expect(made.route).toBe("sales");
    expect(made.url).toBe("http://localhost:3000/sales");
    expect(existsSync(join(root, "src", "app", "sales", "page.tsx"))).toBe(true);
    // A reserved route is still reserved however it is typed.
    expect(() => newScreen({ root, template: "dashboard", route: "Components" })).toThrow(/already owns/);
  });

  it("refuses a route that is not a plain slug", () => {
    for (const bad of ["my screen", "sales/orders", "-sales", "sales-", "sa--les", "../escape"]) {
      expect(() => newScreen({ root, template: "dashboard", route: bad })).toThrow(/is not a route/);
    }
  });

  it("fails on an unknown template and hands back the real ones", () => {
    try {
      newScreen({ root, template: "chatwindow" });
      throw new Error("expected it to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(NewScreenError);
      const e = error as NewScreenError;
      expect(e.message).toContain('no starter called "chatwindow"');
      expect(e.templates?.map((t: { id: string }) => t.id)).toEqual(starters.map((s) => s.id));
    }
  });

  it("fails when no template is named", () => {
    expect(() => newScreen({ root })).toThrow(/--template/);
  });

  it("says so when the kit has no starters folder", () => {
    rmSync(join(root, "starters"), { recursive: true, force: true });
    expect(() => newScreen({ root, template: "dashboard" })).toThrow(/no starters\/index.json/);
  });
});

describe("findStarter", () => {
  it("finds nothing for an empty name", () => {
    expect(findStarter(starters, "")).toBeUndefined();
    expect(findStarter(starters, undefined)).toBeUndefined();
  });
});

describe("the command line", () => {
  it("reads the flags either way round", () => {
    expect(parseArgs(["--template", "dashboard", "--route", "sales"])).toEqual({
      force: false,
      template: "dashboard",
      route: "sales",
    });
    expect(parseArgs(["--template=dashboard", "--route=sales", "--force"])).toEqual({
      force: true,
      template: "dashboard",
      route: "sales",
    });
    expect(parseArgs([])).toEqual({ force: false });
  });

  it("writes the screen and prints the next steps", () => {
    const out = execFileSync(process.execPath, [COPIER, "--template", "dashboard", "--route", "sales"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(out).toContain("src/app/sales/page.tsx");
    expect(out).toContain("npm run dev");
    expect(out).toContain("http://localhost:3000/sales");
    expect(out).toContain("ask for a change in your own words");
  });

  it("lists the starters and exits 1 on an unknown template", () => {
    let status = 0;
    let stderr = "";
    try {
      execFileSync(process.execPath, [COPIER, "--template", "nope"], { cwd: root, encoding: "utf8", stdio: "pipe" });
    } catch (error) {
      const e = error as { status: number; stderr: string };
      status = e.status;
      stderr = e.stderr;
    }
    expect(status).toBe(1);
    expect(stderr).toContain('no starter called "nope"');
    for (const s of starters) expect(stderr).toContain(s.id);
  });
});
