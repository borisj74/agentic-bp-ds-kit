#!/usr/bin/env node
// A2 codemod: ruling R6 from docs/figma/bp-mapping.json.
//   R6  the color-role prop `tone` becomes `intent` (values stay), with every compound
//       name that carries it: badgeTone -> badgeIntent, BadgeTone -> BadgeIntent, tones -> intents.
// Size values keep the kit's sm / md / lg convention (R1 dropped by the user, 2026-09-24).
//
// Usage: node scripts/codemod-a2-rulings.mjs [paths...]   (default: src contracts tests)
// Rewrites .ts, .tsx and .json files in place and prints the files it changed.
// It never touches .css: the --tone-* custom properties some components use inside their
// own CSS module are internal and keep their names.
// Safe to run twice: the new words do not match the old patterns.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

export function transform(text) {
  return text
    .replace(/\ba tone\b/g, "an intent")
    .replace(/\bA tone\b/g, "An intent")
    // tone, tones, toneVar ... but not the --tone-* custom properties set inline.
    .replace(/(?<![-\w])tone/g, "intent")
    // BadgeTone, badgeTone, Tones ... but not words that only end in "tone" (Keystone).
    .replace(/Tone/g, "Intent")
    .replace(/\bTONES\b/g, "INTENTS");
}

const EXT = new Set([".ts", ".tsx", ".json"]);
function* files(p) {
  const s = statSync(p);
  if (s.isFile()) { if (EXT.has(extname(p))) yield p; return; }
  for (const name of readdirSync(p)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    yield* files(join(p, name));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const roots = process.argv.slice(2);
  let changed = 0;
  for (const root of roots.length ? roots : ["src", "contracts", "tests"]) {
    for (const f of files(root)) {
      const before = readFileSync(f, "utf8");
      const after = transform(before);
      if (after !== before) { writeFileSync(f, after); changed++; console.log(f); }
    }
  }
  console.log(`${changed} files changed`);
}
