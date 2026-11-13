import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// The live check is plain Node ESM, so it comes in untyped; the test states the shapes it expects.
import {
  INSPECT_ATTR,
  INSPECT_ENV,
  LIVE_RULES,
  formatLive,
  liveFindings,
  liveResult,
  readLive,
  reviewUrl,
} from "../scripts/review/live.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const cliEntry = resolve(repoRoot, "scripts/review/cli.mjs");
const fixtures = resolve(repoRoot, "tests/fixtures/live");

type Piece = { name: string; count: number; kind: string | null; level: string; contract: string | null };
type Group = { level: string; pieces: Piece[] };
type Live = {
  pieces: Piece[];
  groups: Group[];
  landmarks: { main: number; nav: number; h1: number };
  tags: number;
  patterns: Piece[];
  unknown: Piece[];
};
type Finding = { rule: string; severity: "error" | "warn"; message: string; fix: string };

const html = (name: string) => readFileSync(resolve(fixtures, name), "utf8");

// The fixture server runs in this process, so the command has to run without blocking it: spawnSync would hold the
// event loop and the server could never answer.
function runCli(args: string[]) {
  return new Promise<{ status: number; stdout: string; stderr: string }>((done) => {
    execFile(process.execPath, [cliEntry, ...args], { cwd: repoRoot, encoding: "utf8" }, (error, stdout, stderr) => {
      const status = error && typeof error.code === "number" ? error.code : 0;
      done({ status, stdout, stderr });
    });
  });
}
const live = (name: string) => readLive(html(name)) as Live;
const findings = (one: Live) => liveFindings(one) as Finding[];

describe("reading a served screen", () => {
  it("groups the kit pieces it finds by level, biggest first", () => {
    const one = live("invoices.html");
    expect(one.groups.map((g) => g.level)).toEqual(["template", "organism", "molecule", "atom"]);
    const names = Object.fromEntries(one.groups.map((g) => [g.level, g.pieces.map((p) => p.name)]));
    expect(names.template).toEqual(["AppShell", "ListPage"]);
    expect(names.organism).toEqual(["AppHeader", "AppNav", "PageHeader", "Table", "Toolbar"]);
    expect(names.molecule).toEqual(["Cell", "Breadcrumb", "HeaderCell", "Pagination"]);
    expect(names.atom).toEqual(["Button", "Badge", "Input", "Logo"]);
  });

  it("counts a piece every time it is on the page", () => {
    const one = live("invoices.html");
    expect(one.pieces[0]).toMatchObject({ name: "Button", count: 2, kind: "component", level: "atom" });
    expect(one.pieces.find((p) => p.name === "Cell")).toMatchObject({ count: 2, level: "molecule" });
    expect(one.pieces).toHaveLength(15);
    expect(one.tags).toBe(17);
    expect(one.unknown).toEqual([]);
  });

  it("reads the landmarks and says a clean screen has nothing to fix", () => {
    const one = live("invoices.html");
    expect(one.landmarks).toEqual({ main: 1, nav: 2, h1: 1 });
    expect(findings(one)).toEqual([]);
    expect(liveResult({ url: "http://localhost:3000/invoices", live: one, findings: [] })).toMatchObject({
      url: "http://localhost:3000/invoices",
      summary: "15 kit pieces, 17 times: nothing to fix.",
      patterns: ["AppShell", "ListPage"],
      rules: LIVE_RULES,
    });
  });

  it("flags the missing landmarks and the screen that uses no pattern", () => {
    const one = live("bare.html");
    const rows = findings(one);
    expect(rows.filter((f) => f.rule === "bp/landmark").map((f) => f.message)).toEqual([
      "No <main> on the page.",
      "No <nav> on the page.",
      "2 <h1> elements on the page. A screen has one.",
    ]);
    const pattern = rows.find((f) => f.rule === "bp/no-pattern");
    expect(pattern).toMatchObject({ severity: "warn" });
    expect(one.patterns).toEqual([]);
  });

  it("says the name tags are missing when the page carries none", () => {
    const one = live("plain.html");
    expect(one.tags).toBe(0);
    const rows = findings(one);
    expect(rows).toHaveLength(1);
    expect(rows[0].rule).toBe("bp/no-tags");
    expect(rows[0].message).toContain(INSPECT_ATTR);
    expect(rows[0].fix).toContain(INSPECT_ENV);
  });

  it("writes the text a person reads", () => {
    const one = live("invoices.html");
    const text = formatLive({ url: "http://localhost:3000/invoices", live: one, findings: findings(one) });
    expect(text).toContain("http://localhost:3000/invoices");
    expect(text).toContain("  template");
    expect(text).toContain("    AppShell × 1  (pattern)");
    expect(text).toContain("    <main> × 1");
  });
});

describe("fetching the screen", () => {
  it("reviews what a url serves", async () => {
    const fetchImpl = async () => new Response(html("invoices.html"), { headers: { "content-type": "text/html" } });
    const run = (await reviewUrl("http://localhost:3000/invoices", { fetchImpl })) as {
      url: string;
      live: Live;
      findings: Finding[];
    };
    expect(run.live.tags).toBe(17);
    expect(run.findings).toEqual([]);
  });

  it("says plainly when the server does not answer", async () => {
    const fetchImpl = async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:3000");
    };
    await expect(reviewUrl("http://localhost:3000/invoices", { fetchImpl })).rejects.toThrow(/Is the dev server running\?/);
  });

  it("says plainly when the page is not there", async () => {
    const fetchImpl = async () => new Response("no", { status: 404, statusText: "Not Found" });
    await expect(reviewUrl("http://localhost:3000/nope", { fetchImpl })).rejects.toThrow(/404/);
  });
});

describe("the --url command", () => {
  let port = 0;
  const server = createServer((request, response) => {
    const file = request.url === "/bare" ? "bare.html" : "invoices.html";
    response.writeHead(200, { "content-type": "text/html" });
    response.end(html(file));
  });

  beforeAll(async () => {
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    port = typeof address === "object" && address ? address.port : 0;
  });

  afterAll(async () => {
    await new Promise<void>((done) => server.close(() => done()));
  });

  it("lists the pieces on a running screen and exits 0", async () => {
    const run = await runCli(["--url", `http://127.0.0.1:${port}/invoices`]);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("AppShell × 1  (pattern)");
    expect(run.stdout).toContain("nothing to fix.");
  });

  it("exits 1 on a screen with a missing landmark, and --json carries the findings", async () => {
    const run = await runCli(["--url", `http://127.0.0.1:${port}/bare`, "--json"]);
    expect(run.status).toBe(1);
    const data = JSON.parse(run.stdout) as { landmarks: { main: number }; findings: Finding[]; patterns: string[] };
    expect(data.landmarks.main).toBe(0);
    expect(data.patterns).toEqual([]);
    expect(data.findings.map((f) => f.rule)).toContain("bp/landmark");
  });

  it("takes no paths beside --url", async () => {
    const run = await runCli(["--url", `http://127.0.0.1:${port}/invoices`, "starters"]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("takes no paths");
  });
});
