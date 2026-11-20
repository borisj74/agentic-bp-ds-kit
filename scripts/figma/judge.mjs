/**
 * The judge: what to do with an audit.
 *
 * The audit comes back as JSON from one use_figma call. The judge reads it, decides which findings a
 * machine can repair and which need a person, makes the repairs in the spec — never in Figma, and
 * never in the generated page — and writes the spec back as an edit of its own text.
 *
 * The repairs are the ones scripts/spec/fix.mjs already makes for the web loop. The spec is the one
 * source of truth for a screen in code and in Figma, so a Figma finding that comes of the spec is
 * fixed in the spec and the render is run again.
 *
 *   judge({ specFile, audit, root })  — { ok, done, repaired, forPerson, wrote, render }
 *
 * `render` is true when something changed and the screen should be rendered again.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot } from "../review/catalog.mjs";
import { fixSpec } from "../spec/fix.mjs";
import { validateSpec } from "../spec/schema.mjs";
import { editSpecText, specFormat, specText } from "../spec/write.mjs";
import { RULES } from "./audit.js";

/**
 * Which Figma rule a spec repair can answer, and which only a person can.
 *
 * A Figma finding is about the file, so none of it is repaired in Figma. What the fixers can do is
 * make the spec say something a render can hold: one strong brand Button, one page header, no Home in
 * the breadcrumbs, a token in place of a raw value. Everything else is a decision.
 */
export const REPAIRABLE = {
  "bp/figma-props": ["bp/one-primary", "bp/landmark", "bp/screen-frame", "bp/raw-value"],
  "bp/figma-instance": [],
  "bp/figma-detached": [],
  "bp/figma-bound": ["bp/raw-value"],
  "bp/figma-modes": [],
  "bp/figma-overflow": [],
  "bp/figma-align": [],
  "bp/figma-example-content": [],
};

/** What a person has to decide about each rule, said once. */
export const FOR_PERSON = {
  "bp/figma-instance": "Something on the frame is not a library instance. Draw it as a component, or take it out.",
  "bp/figma-detached": "An instance lost its main component. Render the frame again rather than patching it.",
  "bp/figma-bound": "A value on a layout frame is not bound to a variable. Render again; if it comes back, the variable is missing in the file.",
  "bp/figma-props": "A property is not what the plan said. Render again; if it comes back, the map and the file disagree.",
  "bp/figma-modes": "A frame does not set its own modes. Render again; if it comes back, the collection or the mode is not in the file.",
  "bp/figma-overflow": "The screen does not fit its frame. Give the screen less, or split the section.",
  "bp/figma-align": "The screen does not start where its title starts. Something between the page and the screen carries an inset of its own; render again, and if it comes back the wrapper is padded twice.",
  "bp/figma-example-content": "A slot still holds the artboard's own example content. Render again: the render empties a slot before it fills it.",
};

/** The audit, however it arrived: an object, a JSON string, or a file to read. */
export function readAudit(input, { root = repoRoot } = {}) {
  if (input === null || input === undefined) return { ok: true };
  if (typeof input === "object") return input;
  const text = String(input);
  const file = resolve(root, text);
  if (existsSync(file) && !text.trim().startsWith("{")) return JSON.parse(readFileSync(file, "utf8"));
  return JSON.parse(text);
}

/**
 * Write a repaired spec back to its file as an edit of the file's own text, so the diff is the repair.
 * A file whose text cannot carry the change is written again in the formatting it came with.
 */
export function saveSpec(file, spec) {
  const before = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (before !== null) {
    try {
      const edited = editSpecText(before, JSON.parse(before), spec);
      if (edited !== null) {
        writeFileSync(file, edited);
        return { file, reformatted: false };
      }
    } catch {
      // not JSON any more, or not a text this can edit: written again below
    }
  }
  writeFileSync(file, specText(spec, before === null ? { eol: "\n", indent: 2, finalNewline: true } : specFormat(before)));
  return { file, reformatted: before !== null };
}

/**
 * One audit, judged.
 * @param {{ specFile: string, audit?: object|string, root?: string, write?: boolean }} options
 */
export function judge({ specFile, audit = null, root = repoRoot, write = true }) {
  const full = resolve(root, specFile);
  if (!existsSync(full)) throw new Error(`There is no spec at ${specFile}.`);
  const raw = JSON.parse(readFileSync(full, "utf8"));
  const result = readAudit(audit, { root });
  const findings = result.ok ? [] : (result.findings ?? []);

  const unknown = findings.filter((finding) => !RULES.includes(finding.rule));
  const repaired = fixSpec(raw, { root });
  const can = new Set(Object.entries(REPAIRABLE).filter(([rule]) => findings.some((f) => f.rule === rule)).flatMap(([, rules]) => rules));
  // A repair is only made when a fixer found something; the audit decides nothing about whether the
  // fix is right, because a fixer can only make the spec more like what the contracts already say.
  const fixes = repaired.fixes;

  let wrote = null;
  let spec = raw;
  if (fixes.length > 0) {
    const checked = validateSpec(repaired.spec, { root });
    if (!checked.ok)
      return {
        ok: false,
        done: false,
        render: false,
        repaired: [],
        forPerson: [{ rule: "bp/figma-props", what: "The repairs would leave the spec unbuildable, so nothing was written." }, ...checked.errors.map((e) => ({ rule: "spec", what: `${e.path}: ${e.message}` }))],
        findings,
        wrote: null,
      };
    spec = repaired.spec;
    if (write) wrote = saveSpec(full, repaired.spec);
  }

  const seen = new Set();
  const forPerson = [];
  for (const finding of findings) {
    const covered = (REPAIRABLE[finding.rule] ?? []).some((rule) => fixes.some((fix) => fix.rule === rule));
    if (covered) continue;
    const key = `${finding.rule}|${finding.frame}|${finding.node}|${finding.what}`;
    if (seen.has(key)) continue;
    seen.add(key);
    forPerson.push({ rule: finding.rule, frame: finding.frame, node: finding.node, id: finding.id ?? null, what: finding.what, decide: FOR_PERSON[finding.rule] ?? "Decide what to do." });
  }
  for (const item of repaired.report) forPerson.push({ rule: item.rule, what: item.what, decide: "The loop cannot change this one safely." });
  for (const item of unknown) forPerson.push({ rule: item.rule, what: `The audit reported a rule the judge does not know: ${item.what ?? ""}`.trim(), decide: "Check scripts/figma/audit.js." });

  return {
    ok: findings.length === 0,
    done: findings.length === 0 && fixes.length === 0,
    render: fixes.length > 0,
    repaired: fixes,
    repairable: [...can],
    forPerson,
    findings,
    spec,
    specPath: specFile,
    wrote,
  };
}

// ---- the command line ----------------------------------------------------------------------------

/** `npm run figma:judge -- <spec.json> --audit <file.json|-> [--dry]` */
async function main(argv) {
  const { parseArgs } = await import("node:util");
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { audit: { type: "string" }, dry: { type: "boolean", default: false }, json: { type: "boolean", default: false } },
  });
  if (positionals.length !== 1) {
    console.error("\n  npm run figma:judge -- <spec.json> --audit <file.json> [--dry] [--json]\n");
    process.exit(1);
  }

  let audit = null;
  if (values.audit === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    audit = Buffer.concat(chunks).toString("utf8");
  } else if (values.audit) {
    audit = values.audit;
  }

  let result;
  try {
    result = judge({ specFile: positionals[0], audit, write: !values.dry });
  } catch (error) {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  if (values.json) {
    console.log(JSON.stringify({ ...result, spec: undefined }, null, 2));
    process.exit(result.ok || result.render ? 0 : 1);
  }

  console.log(`\n  ${result.ok ? "The audit is clean." : `${result.findings.length} finding(s).`}`);
  for (const fix of result.repaired) console.log(`  fixed ${fix.rule}: ${fix.what}`);
  if (result.wrote) console.log(`  wrote the repairs back into ${result.specPath}${result.wrote.reformatted ? " (the whole file was reformatted)" : ""}`);
  for (const item of result.forPerson) console.log(`  left for you ${item.rule}: ${item.what}`);
  if (result.render) console.log("  Render again.");
  console.log("");
  process.exit(result.ok || result.render ? 0 : 1);
}

const { pathToFileURL } = await import("node:url");
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
