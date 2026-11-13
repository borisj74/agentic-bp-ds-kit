import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
// The engine is plain Node ESM, so these come in untyped; the test states the shapes it expects.
import { RULES, reviewFiles, reviewSource, summarize } from "../scripts/review/index.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const cliEntry = resolve(repoRoot, "scripts/review/cli.mjs");
const fixtures = resolve(repoRoot, "tests/fixtures/review");

type Finding = {
  rule: string;
  severity: "error" | "warn";
  file: string;
  line: number;
  contract: string | null;
  message: string;
  fix: string;
};

/** The line a fixture marks with `BAD: <rule>`, which is where the finding belongs. */
function markedLine(file: string, rule: string) {
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.findIndex((line) => line.includes(`BAD: ${rule}`));
  expect(at, `${file} marks the bad line`).toBeGreaterThan(-1);
  // The marker sits on the comment line above the code it talks about.
  return at + 2;
}

const review = (paths: string[], options: Record<string, unknown> = {}) =>
  reviewFiles(paths, { all: true, ...options }) as { files: string[]; findings: Finding[] };

describe("review rules", () => {
  it("every rule has a bad fixture", () => {
    const named = new Set<string>();
    const walk = (dir: string) => {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        if (name.isDirectory()) walk(join(dir, name.name));
        else named.add(name.name.replace(/\.(tsx|module\.css|css)$/, ""));
      }
    };
    walk(join(fixtures, "bad"));
    for (const rule of RULES as string[]) {
      const stem = rule.replace("bp/", "");
      expect(named.has(stem) || named.has("page"), `fixture for ${rule}`).toBe(true);
    }
  });

  it.each([
    ["bp/raw-value", "bad/raw-value.tsx", "error"],
    ["bp/primitive-token", "bad/primitive-token.module.css", "error"],
    ["bp/local-cousin", "bad/local-cousin.tsx", "error"],
    ["bp/closed-enum", "bad/closed-enum.tsx", "error"],
    ["bp/one-primary", "bad/one-primary.tsx", "error"],
    ["bp/use-pattern", "bad/use-pattern.tsx", "warn"],
    ["bp/use-bigger-piece", "bad/use-bigger-piece.tsx", "warn"],
  ])("%s is found in %s, and nothing else is", (rule, relative, severity) => {
    const file = join(fixtures, relative);
    const { findings } = review([file]);
    expect(findings.length).toBeGreaterThan(0);
    expect([...new Set(findings.map((f) => f.rule))]).toEqual([rule]);
    expect(findings[0].severity).toBe(severity);
    expect(findings[0].line).toBe(markedLine(file, rule));
    expect(findings[0].fix.length).toBeGreaterThan(10);
  });

  it("bp/screen-frame is found on a full screen with no AppShell", () => {
    const code = readFileSync(join(fixtures, "bad/screen-frame/page.tsx"), "utf8");
    const findings = reviewSource(code, "src/app/screen-frame/page.tsx") as Finding[];
    expect([...new Set(findings.map((f) => f.rule))]).toEqual(["bp/screen-frame"]);
    expect(findings[0].severity).toBe("warn");
    // The frame is missing from the whole file, so the finding sits at its first line.
    expect(findings[0].line).toBe(1);
    expect(findings[0].fix).toContain("APP_NAV");
  });

  it("bp/screen-frame reads the breadcrumbs and the page grid", () => {
    const code = [
      'import { AppShell } from "@/patterns/AppShell/AppShell";',
      'import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";',
      'import { AppNav } from "@/ui/AppNav/AppNav";',
      'import { PageHeader } from "@/ui/PageHeader/PageHeader";',
      "export default function Page() {",
      "  return (",
      "    <AppShell",
      '      nav={<AppNav items={APP_NAV} endItems={APP_NAV_END} />}',
      '      pageHeader={<PageHeader title="Invoices" breadcrumbs={[{ label: "Billing", href: "#" }]} />}>',
      '      <div style={{ display: "grid" }}>rows</div>',
      "    </AppShell>",
      "  );",
      "}",
    ].join("\n");
    const findings = reviewSource(code, "src/app/invoices/page.tsx") as Finding[];
    expect(findings.every((f) => f.rule === "bp/screen-frame")).toBe(true);
    expect(findings.some((f) => f.message.includes("not Home"))).toBe(true);
    expect(findings.some((f) => f.message.includes("grid"))).toBe(true);
  });

  it("bp/local-cousin leaves the screen's own folder alone", () => {
    const code = [
      'import { RunPanel } from "./RunPanel";',
      'import { Button } from "@/ui/Button/Button";',
      "export default function Page() {",
      "  return <RunPanel><Button>Run</Button></RunPanel>;",
      "}",
    ].join("\n");
    const findings = reviewSource(code, "src/app/runs/page.tsx") as Finding[];
    expect(findings.filter((f) => f.rule === "bp/local-cousin")).toEqual([]);
  });

  it("bp/local-cousin still names a kit piece imported from the screen's own folder", () => {
    const code = 'import { Dialog } from "./Dialog";\nexport const Go = () => <Dialog />;\n';
    const findings = reviewSource(code, "src/app/runs/page.tsx") as Finding[];
    const cousins = findings.filter((f) => f.rule === "bp/local-cousin");
    expect(cousins).toHaveLength(1);
    expect(cousins[0].message).toContain("cousin of a kit piece");
  });

  it("bp/local-cousin names a kit piece imported from anywhere else", () => {
    const code = 'import { Card } from "../cards/Card";\nexport const Go = () => <Card />;\n';
    const findings = reviewSource(code, "src/app/runs/page.tsx") as Finding[];
    const cousins = findings.filter((f) => f.rule === "bp/local-cousin");
    expect(cousins.some((f) => f.message.includes("the kit already has Card (molecule)"))).toBe(true);
    expect(cousins.some((f) => f.fix.includes("@/ui/Card/Card"))).toBe(true);
  });

  it("bp/local-cousin flags UI taken from another screen's folder", () => {
    const code = 'import { RunPanel } from "../runs/RunPanel";\nexport const Go = () => <RunPanel />;\n';
    const findings = reviewSource(code, "src/app/other/page.tsx") as Finding[];
    const cousins = findings.filter((f) => f.rule === "bp/local-cousin");
    expect(cousins).toHaveLength(1);
    expect(cousins[0].message).toContain("../runs/RunPanel");
    expect(cousins[0].fix).toContain("another screen's folder");
  });

  it("the kit's own folders are skipped unless --all is passed", () => {
    const skipped = reviewFiles(["src/ui"]) as { files: string[] };
    expect(skipped.files).toHaveLength(0);
    const included = reviewFiles(["src/ui"], { all: true }) as { files: string[] };
    expect(included.files.length).toBeGreaterThan(50);
  });
});

describe("review on clean code", () => {
  it("the good fixtures come back clean", () => {
    const { files, findings } = review([join(fixtures, "good")]);
    expect(files.length).toBe(2);
    expect(findings).toEqual([]);
    expect(summarize({ files, findings })).toContain("nothing to fix");
  });

  it("every starter screen comes back clean", () => {
    const { files, findings } = reviewFiles(["starters"]) as { files: string[]; findings: Finding[] };
    expect(files.length).toBeGreaterThan(5);
    expect(findings).toEqual([]);
  });
});

describe("review output", () => {
  it("--json has the shape an agent can read", () => {
    const run = spawnSync(process.execPath, [cliEntry, "--json", "starters/list/page.tsx"], {
      encoding: "utf8",
      cwd: repoRoot,
    });
    expect(run.status).toBe(0);
    const data = JSON.parse(run.stdout) as {
      summary: string;
      files: string[];
      counts: { error: number; warn: number };
      findings: Finding[];
    };
    expect(data.files).toEqual(["starters/list/page.tsx"]);
    expect(data.counts).toEqual({ error: 0, warn: 0 });
    expect(data.findings).toEqual([]);
    expect(data.summary).toContain("nothing to fix");
  });

  it("--json on a bad file carries every field of every finding", () => {
    const run = spawnSync(process.execPath, [cliEntry, "--all", "--json", "tests/fixtures/review/bad/closed-enum.tsx"], {
      encoding: "utf8",
      cwd: repoRoot,
    });
    expect(run.status).toBe(1);
    const data = JSON.parse(run.stdout) as { counts: { error: number }; findings: Finding[] };
    expect(data.counts.error).toBe(1);
    const [finding] = data.findings;
    expect(Object.keys(finding).sort()).toEqual(["contract", "file", "fix", "line", "message", "rule", "severity"]);
    expect(finding.contract).toBe("contracts/button.json");
    expect(finding.fix).toContain("intent");
  });

  it("exits 1 on an error, 0 on warnings only", () => {
    const bad = spawnSync(process.execPath, [cliEntry, "--all", "tests/fixtures/review/bad/raw-value.tsx"], {
      encoding: "utf8",
      cwd: repoRoot,
    });
    expect(bad.status).toBe(1);
    expect(bad.stdout).toContain("bp/raw-value");

    const warned = spawnSync(process.execPath, [cliEntry, "--all", "tests/fixtures/review/bad/use-pattern.tsx"], {
      encoding: "utf8",
      cwd: repoRoot,
    });
    expect(warned.status).toBe(0);
    expect(warned.stdout).toContain("bp/use-pattern");
    expect(warned.stdout).toContain("new-screen -- --template list");
  });

  it("says what it needs when no path is given", () => {
    const run = spawnSync(process.execPath, [cliEntry], { encoding: "utf8", cwd: repoRoot });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("which file or folder");
  });
});

describe("review of a draft", () => {
  it("reviewSource reads code that was never saved", () => {
    const findings = reviewSource(
      'import { Button } from "@/ui/Button/Button";\nexport const Go = () => <Button emphasis="strong" intent="neutral">Go</Button>;\n',
      "src/app/go/draft.tsx",
    ) as Finding[];
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe("bp/closed-enum");
    expect(findings[0].message).toContain("not an allowed pair");
    expect(findings[0].file).toBe("src/app/go/draft.tsx");
  });
});
