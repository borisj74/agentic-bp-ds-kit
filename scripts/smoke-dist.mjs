// Smoke test for the built library (npm run smoke, after npm run build:lib).
//
// It is deliberately plain Node: no Next, no Vite, no vitest, no JSX. The point is that the kit works outside this
// app, so this renders Button from dist/ with react-dom/server the way any React host would, and checks the built
// stylesheet and types came out with it.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.join(import.meta.dirname, "..");
const dist = (p) => path.join(root, "dist", p);
const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
};

assert.ok(existsSync(dist("index.js")), "dist/index.js is missing: run npm run build:lib first");

const lib = await import(new URL("../dist/index.js", import.meta.url).href);

check("the entry exports Button", () => {
  assert.equal(typeof lib.Button, "function");
});

check("the entry exports the rest of the catalog", () => {
  const index = JSON.parse(readFileSync(path.join(root, "contracts/index.json"), "utf8"));
  const missing = [...index.components, ...index.patterns].map((c) => c.name).filter((n) => !(n in lib));
  assert.deepEqual(missing, [], `the built entry is missing ${missing.length} catalog pieces`);
});

check("Button renders to markup with no Next in sight", () => {
  const html = renderToStaticMarkup(createElement(lib.Button, { emphasis: "strong", intent: "brand" }, "Save"));
  assert.match(html, /<button/);
  assert.match(html, />Save</, "the label should be in the markup");
  const cls = html.match(/class="([^"]+)"/)?.[1].split(" ") ?? [];
  assert.ok(cls.length > 0, "the built component kept its stylesheet classes");
  const css = readFileSync(dist("styles.css"), "utf8");
  for (const c of cls) assert.ok(css.includes(`.${c}`), `the stylesheet has no rule for ${c}`);
});

check("a pattern renders too, so the bigger pieces came through", () => {
  const html = renderToStaticMarkup(createElement(lib.PageHeader, { title: "Invoices", badge: "Draft", badgeIntent: "hollow" }));
  assert.match(html, /Invoices/);
  assert.match(html, /Draft/);
});

check("the bundle leaves react to the host", () => {
  const code = readFileSync(dist("index.js"), "utf8");
  assert.match(code, /^"use client";/, "the entry should carry one use client directive");
  assert.match(code, /from\s*"react/, "react should be imported, not bundled");
  assert.doesNotMatch(code, /from\s*"next\//, "nothing in the bundle may import next");
});

check("one stylesheet ships with the tokens and the components", () => {
  // The stylesheet is minified, so the checks read it the way the minifier writes it: [data-theme=dark], unquoted.
  const css = readFileSync(dist("styles.css"), "utf8");
  const has = (re, why) => assert.ok(re.test(css), why);
  has(/--font-sans:/, "the token roles should be in the stylesheet");
  has(/sans-serif/, "the sans stack should end in a real sans-serif fallback");
  assert.ok(!/--font-sans:\s*var\(--font-inter\)\s*,/.test(css), "the next/font var needs its own fallback");
  has(/\[data-theme=["']?dark/, "dark mode should be in the stylesheet");
});

check("the types ship with it", () => {
  assert.ok(existsSync(dist("types/lib/index.d.ts")), "dist/types/lib/index.d.ts is missing");
  const types = readFileSync(dist("types/lib/index.d.ts"), "utf8");
  assert.match(types, /Button/);
});

check("the switch does not need a Next env var", () => {
  assert.equal(lib.inspectOn(), false);
  lib.setInspect(true);
  assert.deepEqual(lib.inspect("Button"), { "data-bp-kit": "Button" });
  lib.setInspect(undefined);
});

for (const name of checks) console.log(`  ok  ${name}`);
console.log(`\nsmoke: ${checks.length} checks passed against dist/`);
