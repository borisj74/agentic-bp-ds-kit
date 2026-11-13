/**
 * The review engine: it reads screens and says where they drift from the kit's contracts.
 *
 * reviewFiles(paths)        — review files and folders on disk
 * reviewSource(code, name)  — review one draft before it is saved
 *
 * A finding is { rule, severity, file, line, contract, message, fix }.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { readCss, cssVarUses } from "./css.mjs";
import { readTsx } from "./tsx.mjs";
import { cssFindings, tsxFindings } from "./rules.mjs";
import { repoRoot } from "./catalog.mjs";

/** The kit's own folders. The review is for screens built from the kit, not for the kit itself. */
export const SKIPPED = [
  "src/ui",
  "src/patterns",
  "src/tokens",
  "src/playground",
  "src/app/(playground)",
  "tests",
  "node_modules",
  ".next",
];

export const RULES = [
  "bp/raw-value",
  "bp/primitive-token",
  "bp/local-cousin",
  "bp/closed-enum",
  "bp/one-primary",
  "bp/use-pattern",
  "bp/use-bigger-piece",
  "bp/screen-frame",
];

const posix = (p) => p.replace(/\\/g, "/");
const isReviewable = (file) => /\.tsx$/.test(file) || /\.css$/.test(file);

/** True when a repo-relative path sits in one of the kit's own folders. */
export function isSkipped(file) {
  const path = posix(file);
  return SKIPPED.some((dir) => path === dir || path.startsWith(dir + "/"));
}

function walk(dir, root, out) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") && name !== ".") continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, root, out);
    else if (isReviewable(name)) out.push(full);
  }
  return out;
}

/** Every reviewable file under the given paths, as repo-relative paths. */
export function collectFiles(paths, { root = repoRoot, all = false } = {}) {
  const files = [];
  for (const p of paths) {
    const full = isAbsolute(p) ? p : resolve(root, p);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, root, files);
    else files.push(full);
  }
  const seen = new Set();
  const out = [];
  for (const full of files) {
    const rel = posix(relative(root, full));
    if (seen.has(rel)) continue;
    seen.add(rel);
    if (!isReviewable(rel)) continue;
    if (!all && isSkipped(rel)) continue;
    out.push(rel);
  }
  return out.sort();
}

/** The TSX beside a CSS file: a screen may set its own custom property from there. */
function siblingTsx(cssFile) {
  const dir = dirname(cssFile);
  let names = [];
  try { names = readdirSync(dir); } catch { return ""; }
  return names
    .filter((n) => /\.tsx?$/.test(n))
    .map((n) => { try { return readFileSync(join(dir, n), "utf8"); } catch { return ""; } })
    .join("\n");
}

const bySeverity = { error: 0, warn: 1 };
const order = (a, b) =>
  a.file.localeCompare(b.file) || a.line - b.line || bySeverity[a.severity] - bySeverity[b.severity] || a.rule.localeCompare(b.rule);

/** Review one source string. `filename` decides which rules apply, so pass the path it will be saved to. */
export function reviewSource(code, filename = "draft.tsx", { root = repoRoot, siblings = "" } = {}) {
  const file = posix(isAbsolute(filename) ? relative(root, filename) : filename);
  if (/\.css$/.test(file)) {
    // A screen often sets its own custom property from its TSX, so the sibling files count as local source.
    return cssFindings({ decls: readCss(code), varUses: cssVarUses(code), file, code: code + "\n" + siblings, root }).sort(order);
  }
  const facts = readTsx(code, file);
  return tsxFindings({ facts, file, root }).sort(order);
}

/** Review files and folders on disk. Pass all: true to include the kit's own folders. */
export function reviewFiles(paths, { root = repoRoot, all = false } = {}) {
  const files = collectFiles(paths, { root, all });
  const findings = [];
  for (const file of files) {
    const code = readFileSync(resolve(root, file), "utf8");
    const siblings = /\.css$/.test(file) ? siblingTsx(resolve(root, file)) : "";
    findings.push(...reviewSource(code, file, { root, siblings }));
  }
  return { files, findings: findings.sort(order) };
}

/** One line a person or an agent can read at a glance. */
export function summarize({ files, findings }) {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  if (findings.length === 0) return `${count(files.length, "file", "files")}: nothing to fix.`;
  return `${count(files.length, "file", "files")}: ${count(errors, "error", "errors")}, ${count(warnings, "warning", "warnings")}.`;
}
