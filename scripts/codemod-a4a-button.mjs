#!/usr/bin/env node
// A4a codemod: Button variant -> emphasis x intent (docs/figma/bp-mapping.json, Button model).
//   primary -> emphasis="strong" intent="brand"      danger   -> emphasis="strong" intent="danger"
//   secondary -> emphasis="subtle"                    tertiary -> emphasis="minimal"
// Where it rewrites:
//   1. <Button> and <Dropdown> tags: variant="..." as above; <Button pressed> -> <Button toggle>.
//   2. <AlertDialog> tags: actionVariant="primary" -> actionIntent="brand", "danger" -> actionIntent="danger".
//   3. Object literals and JSON: variant: "primary" | "secondary" | "tertiary" | "danger" (Cell actions,
//      GuidedProcess actions, contract examples). Only Button looks use these four values in the kit.
//   4. Type names: AlertDialogActionVariant -> AlertDialogActionIntent.
// Run A2 and A3 (codemod-a2-rulings.mjs, codemod-a3-renames.mjs) first if the project is older than them.
//
// Usage: node scripts/codemod-a4a-button.mjs [paths...]   (default: src tests)
// Rewrites .ts, .tsx and .json files in place and prints the files it changed.
// Safe to run twice: the new props never match the old patterns.
// What it can't see: a variant held in a variable or an expression (variant={x}), a ButtonVariant type,
// and props passed through a spread. It prints a hint for each so you can fix it by hand.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

export const LOOK = {
  primary: { emphasis: "strong", intent: "brand" },
  secondary: { emphasis: "subtle" },
  tertiary: { emphasis: "minimal" },
  danger: { emphasis: "strong", intent: "danger" },
};

const jsxLook = (v) => Object.entries(LOOK[v]).map(([k, x]) => `${k}="${x}"`).join(" ");

// Finds the end of a JSX opening tag that starts at `from` (just after the tag name), skipping
// strings and {expressions}. Returns the index of the closing ">".
function tagEnd(src, from) {
  let depth = 0;
  let quote = null;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote && src[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

// Rewrites the attribute text of every <Name ...> opening tag with fn(attrs) -> attrs.
function eachTag(src, name, fn) {
  const re = new RegExp(`<${name}(?=[\\s/>])`, "g");
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    const end = tagEnd(src, start);
    if (end < 0) break;
    out += src.slice(last, start) + fn(src.slice(start, end), m.index);
    last = end;
    re.lastIndex = end;
  }
  return out + src.slice(last);
}

const VALUES = "primary|secondary|tertiary|danger";

export function transform(src, file = "", hints = []) {
  if (file.endsWith(".json")) {
    return src.replace(new RegExp(`^([ \\t]*)"variant": "(${VALUES})"`, "gm"), (_, indent, v) =>
      Object.entries(LOOK[v]).map(([k, x]) => `${indent}"${k}": "${x}"`).join(",\n"))
      .replace(/"actionVariant": "(primary|danger)"/g, (_, v) => `"actionIntent": "${v === "primary" ? "brand" : "danger"}"`);
  }
  // Line numbers are counted in the text as it is at that step, so they match the rewritten file.
  let out = src;
  const hint = (i, msg, text = out) => hints.push(`${file}:${text.slice(0, i).split("\n").length} ${msg}`);

  for (const name of ["Button", "Dropdown"]) {
    out = eachTag(out, name, (attrs, at) => {
      let a = attrs.replace(new RegExp(`(\\s)variant=(?:"(${VALUES})"|\\{"(${VALUES})"\\})`, "g"), (_, sp, v1, v2) => sp + jsxLook(v1 ?? v2));
      if (name === "Button") a = a.replace(/(\s)pressed(?=[\s=/>]|$)/g, "$1toggle");
      if (/\svariant=\{/.test(a)) hint(at, `<${name} variant={...}>: set emphasis and intent by hand (allowed pairs: strong brand|danger, subtle neutral, minimal neutral|brand|danger).`);
      if (/\{\.\.\./.test(a) && name === "Button") hint(at, `<${name} {...spread}>: check the spread for variant or pressed.`);
      return a;
    });
  }
  out = eachTag(out, "AlertDialog", (attrs, at) => {
    const a = attrs.replace(/(\s)actionVariant=(?:"(primary|danger)"|\{"(primary|danger)"\})/g, (_, sp, v1, v2) => `${sp}actionIntent="${(v1 ?? v2) === "primary" ? "brand" : "danger"}"`);
    if (/\sactionVariant=\{/.test(a)) hint(at, `<AlertDialog actionVariant={...}>: rename to actionIntent, values "brand" | "danger".`);
    return a;
  });
  // Object literals: { variant: "primary" } (Cell actions, GuidedProcess actions, contract-like data).
  out = out.replace(new RegExp(`(^|[\\s{,])variant: (["'])(${VALUES})\\2( as const)?(?=\\s*(?:[,}]|$))`, "gm"), (_, pre, _q, v, asConst) =>
    pre + Object.entries(LOOK[v]).map(([k, x]) => `${k}: "${x}"${asConst ?? ""}`).join(", "));
  for (const m of out.matchAll(new RegExp(`\\bvariant: [^\\n]*\\b(${VALUES})\\b`, "g"))) hint(m.index, "variant: <expression>: set emphasis and intent by hand.");
  out = out.replace(/\bAlertDialogActionVariant\b/g, "AlertDialogActionIntent");
  const tv = out.search(/\bButtonVariant\b/);
  if (tv >= 0) hint(tv, "ButtonVariant is gone: use ButtonEmphasis and ButtonIntent, or ButtonLook for a pass-through prop.");
  return out;
}

function walk(p, files = []) {
  const s = statSync(p);
  if (s.isDirectory()) {
    for (const f of readdirSync(p)) if (f !== "node_modules" && !f.startsWith(".")) walk(join(p, f), files);
  } else if ([".ts", ".tsx", ".json"].includes(extname(p))) files.push(p);
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const roots = process.argv.slice(2);
  const hints = [];
  let changed = 0;
  for (const f of (roots.length ? roots : ["src", "tests"]).flatMap((r) => walk(r))) {
    // Skip the codemods and their tests: their fixtures hold the old props on purpose.
    if (/codemod-[\w-]+\.(mjs|test\.ts)$/.test(f)) continue;
    const before = readFileSync(f, "utf8");
    const after = transform(before, f, hints);
    if (after !== before) {
      writeFileSync(f, after);
      changed++;
      console.log("changed", f);
    }
  }
  for (const h of hints) console.log("check by hand:", h);
  console.log(`${changed} file(s) changed`);
}
