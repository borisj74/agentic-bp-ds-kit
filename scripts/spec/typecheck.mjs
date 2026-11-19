/**
 * Does the screen the loop just wrote compile?
 *
 * The review reads the code and the served page, and neither of them asks TypeScript. A page can pass
 * both and still be a screen nobody can build: `style` on a component whose props do not take it,
 * a prop spelled the way the contract spells it but typed another way. So each attempt type-checks the
 * pages it wrote, and a type error is a finding like any other — one the loop cannot repair on its own,
 * so it names it and stops rather than handing back a screen that does not compile.
 *
 *   typecheckPages(files, { root }) — { findings, skipped }
 */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../review/catalog.mjs";

/** The rule a type error is reported under. */
export const TYPE_RULE = "bp/typecheck";

/** `file(12,34): error TS2322: message` — one diagnostic, as tsc writes it with --pretty false. */
const DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

/** The local tsc, for the same reason the loop runs the local next: no wrapper process in the way. */
function tscCommand(root) {
  const local = join(root, "node_modules", ".bin", "tsc");
  return existsSync(local) ? { command: local, args: [] } : { command: "npx", args: ["tsc"] };
}

/**
 * Type-check a few files inside the repo's own project: the same compiler options, the same path
 * aliases and the same Next types the app is built with, but only these files as the entry points.
 *
 * @param {string[]} files Repo-relative paths, as the loop writes them.
 * @param {{ root?: string, label?: string }} [options] label names the temporary tsconfig; it is unique
 *   per run by default, so two runs at once do not write over each other.
 * @returns {{ findings: object[], skipped: string | null }}
 */
let runs = 0;

export function typecheckPages(files, { root = repoRoot, label = `loop-${process.pid}-${(runs += 1)}` } = {}) {
  const pages = files.filter((file) => /\.tsx?$/.test(file));
  if (pages.length === 0) return { findings: [], skipped: null };

  const project = join(root, `.tsconfig.${label}.json`);
  const { command, args } = tscCommand(root);
  try {
    writeFileSync(
      project,
      `${JSON.stringify(
        {
          extends: "./tsconfig.json",
          // The project's own build writes a tsbuildinfo; this run must not touch it.
          compilerOptions: { incremental: false, noEmit: true },
          include: ["next-env.d.ts", ...pages],
        },
        null,
        2,
      )}\n`,
    );
    const run = spawnSync(command, [...args, "--noEmit", "--pretty", "false", "-p", project], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    if (run.error) return { findings: [], skipped: `tsc will not run: ${run.error.message}` };

    const wanted = new Set(pages.map((page) => page.replace(/\\/g, "/")));
    const findings = [];
    for (const line of `${run.stdout ?? ""}${run.stderr ?? ""}`.split(/\r?\n/)) {
      const hit = DIAGNOSTIC.exec(line.trim());
      if (!hit) continue;
      const [, file, at, , code, message] = hit;
      // A diagnostic in the kit itself, or in a file this screen only imports, is not this screen's
      // doing: the loop reports the pages it wrote.
      const where = file.replace(/\\/g, "/");
      if (!wanted.has(where)) continue;
      findings.push({
        rule: TYPE_RULE,
        severity: "error",
        file: where,
        line: Number(at),
        contract: null,
        message: `${code}: ${message}`,
        fix: "Pass the props the contract lists, in the types the component takes. A prop a component does not accept (style on a Section) belongs on a piece whose contract has it, or nowhere.",
      });
    }
    // tsc failed, and none of it was about these pages: say so rather than calling the screen clean.
    if (findings.length === 0 && run.status !== 0) {
      const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().slice(-500);
      return { findings: [], skipped: `tsc exited ${run.status} with nothing about these pages: ${output || "no output"}` };
    }
    return { findings, skipped: null };
  } finally {
    rmSync(project, { force: true });
  }
}
