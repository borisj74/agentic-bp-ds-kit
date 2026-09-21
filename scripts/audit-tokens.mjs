// Audits semantic token names and how components use them.
//
// Code checks (exact, free, always run):
//   grammar   token names in src/tokens/source/semantic.txt follow role/family/intensity/state
//   unknown   components reference a token that is not generated
//   primitive components reference a --ref-* or --ui-* ramp instead of a semantic role
//   role      a token's role does not match the CSS property it paints (bg token on border-color)
//
// TypeSafe judgments (need TYPESAFE_API_KEY, skipped with --offline):
//   fit       Score: does the token's color family (brand, danger, neutral, red ...) suit what the element means?
//   justified Noul, only for role findings: does a comment or the component intent give a deliberate reason?
//
// Usage: npm run audit:tokens [-- --offline] [--component RadioGroup] [--out token-audit.json]
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---- Token name grammar -------------------------------------------------------------------------

export const ROLES = ["background", "text", "icon", "border", "link", "surface", "outline"];
export const SURFACES = ["flat", "sunken", "raised", "floating", "backdrop", "backdrop-soft"];
export const FAMILIES = [
  "neutral", "brand", "info", "success", "warning", "danger", "highlight",
  "red", "orange", "yellow", "olive", "green", "mint", "cyan", "purple", "pink", "gray",
];
// Modifier slots, in the order they must appear after the family.
export const INTENSITIES = ["min", "faint", "subtle", "strong", "intense", "max", "field"];
export const STATICS = ["static"]; // same value in light and dark
export const SELECTIONS = ["selected"];
export const INTERACTIONS = ["hover", "press"];

/** Returns the grammar problems for one source token name like "background/brand/hover". */
export function checkName(name) {
  const [role, family, ...mods] = name.split("/");
  if (!ROLES.includes(role)) return [`unknown role "${role}"`];
  if (role === "surface") {
    if (!SURFACES.includes(family)) return [`unknown surface "${family}"`];
    return mods.length ? [`surface tokens take no modifiers`] : [];
  }
  if (!FAMILIES.includes(family)) return [`unknown family "${family}"`];
  const slots = [INTENSITIES, STATICS, SELECTIONS, INTERACTIONS];
  const problems = [];
  let slot = 0;
  for (const m of mods) {
    const at = slots.findIndex((s) => s.includes(m));
    if (at === -1) problems.push(`unknown modifier "${m}"`);
    else if (at < slot) problems.push(`modifier "${m}" is out of order (intensity, static, selected, then hover/press)`);
    else slot = at + 1;
  }
  return problems;
}

// Same mapping as scripts/build-tokens.mjs.
export const cssName = (name) => "--" + name.replace(/\//g, "-").replace(/^background-/, "bg-");

export function readSemantic(file = resolve(root, "src/tokens/source/semantic.txt")) {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("|")[0]);
}

/** Map of css var name -> { source, role, family } for every semantic color token. */
export function tokenIndex(names) {
  return new Map(names.map((n) => {
    const [role, family] = n.split("/");
    return [cssName(n), { source: n, role, family }];
  }));
}

// ---- CSS scanning -------------------------------------------------------------------------------

// Which token roles each property is meant to take. Properties not listed are not role-checked.
const PROPERTY_ROLES = [
  [/^(color|-webkit-text-fill-color|caret-color|text-decoration-color)$/, ["text", "icon", "link"]],
  [/^fill$/, ["icon", "text", "background"]],
  [/^stroke$/, ["icon", "text", "border"]],
  [/^background(-color)?$/, ["background", "surface"]],
  [/^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?$/, ["border", "outline"]],
  [/^box-shadow$/, ["border", "outline"]],
];
export const propertyRoles = (prop) => PROPERTY_ROLES.find(([re]) => re.test(prop))?.[1] ?? null;

const comments = (s) => [...s.matchAll(/\/\*([\s\S]*?)\*\//g)].map((m) => m[1].trim());
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ");

/** Flat list of { selector, property, value, comment } from a CSS module. Handles one level of @media nesting. */
export function parseCss(css) {
  const out = [];
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const [, head, body] = m;
    const selector = stripComments(head).replace(/^[\s\S]*@[^{]*$/, "").replace(/\s+/g, " ").trim();
    if (!selector) continue;
    const comment = [...comments(head), ...comments(body)].join(" ");
    for (const decl of stripComments(body).split(";")) {
      const i = decl.indexOf(":");
      if (i === -1) continue;
      const property = decl.slice(0, i).trim();
      const value = decl.slice(i + 1).replace(/\s+/g, " ").trim();
      if (property && value) out.push({ selector, property, value, comment });
    }
  }
  return out;
}

/** Code checks over one CSS file. Returns { findings, uses } where uses are color-token declarations. */
export function scanCss(css, tokens, knownVars, localSource = css) {
  const findings = [];
  const uses = [];
  const decls = parseCss(css);
  // Comments on any rule that styles the same element, so a hover rule inherits the reason given on its base rule.
  const notes = new Map();
  for (const d of decls) {
    const el = element(d.selector);
    if (el && d.comment) notes.set(el, new Set([...(notes.get(el) ?? []), d.comment]));
  }
  for (const d of decls) {
    for (const [, v] of d.value.matchAll(/var\((--[a-z0-9-]+)/g)) {
      if (/^--(ref|ui)-/.test(v)) findings.push({ check: "primitive", ...d, token: v });
      else if (!knownVars.has(v) && isTokenLike(v, knownVars) && !localVar(localSource, v)) findings.push({ check: "unknown", ...d, token: v });
      const t = tokens.get(v);
      if (!t) continue;
      const expected = d.property.startsWith("--") ? null : propertyRoles(d.property);
      const roleMismatch = expected ? !expected.includes(t.role) : false;
      const elementNotes = [...(notes.get(element(d.selector)) ?? [])].filter((c) => c !== d.comment);
      const use = { ...d, token: v, tokenRole: t.role, family: t.family, propertyRoles: expected, roleMismatch, elementNotes };
      uses.push(use);
      if (roleMismatch) findings.push({ check: "role", ...use });
    }
  }
  return { findings, uses };
}

/** The element a selector styles: the last class of its first comma part, ignoring pseudo parts (".a:hover .box::after" -> ".box"). */
export const element = (selector) => {
  const last = selector.split(",")[0].trim().split(/\s*[\s>+~]\s*/).pop() ?? "";
  return last.replace(/::?[a-z-]+(\([^)]*\))?/g, "").match(/\.[\w-]+/g)?.pop() ?? null;
};

// Only names in a token namespace (--space-*, --bg-* ...) count. Others like --fs are set by the component.
const isTokenLike = (v, knownVars) => {
  const ns = v.split("-")[2];
  for (const k of knownVars) if (k.split("-")[2] === ns) return true;
  return false;
};

// A custom property the component defines itself (in its CSS or set from its TSX) is not a missing token.
const localVar = (src, v) => new RegExp(v + "[\"'`]?\\s*[:,]").test(src);

function knownVarNames() {
  const names = new Set();
  for (const f of readdirSync(resolve(root, "src/tokens")).filter((f) => f.endsWith(".css"))) {
    for (const m of readFileSync(resolve(root, "src/tokens", f), "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g)) names.add(m[1]);
  }
  // Set by next/font in src/app/layout.tsx.
  names.add("--font-inter").add("--font-roboto-mono");
  return names;
}

function cssFiles(component) {
  const files = [];
  for (const dir of ["src/ui", "src/patterns"]) {
    const base = resolve(root, dir);
    if (!existsSync(base)) continue;
    for (const name of readdirSync(base)) {
      if (component && name !== component) continue;
      const folder = resolve(base, name);
      let entries;
      try { entries = readdirSync(folder); } catch { continue; }
      const tsx = entries.filter((f) => /\.tsx?$/.test(f)).map((f) => readFileSync(resolve(folder, f), "utf8")).join("\n");
      for (const f of entries) if (f.endsWith(".module.css")) files.push({ component: name, path: resolve(folder, f), tsx });
    }
  }
  return files;
}

function contractIntent(component) {
  const file = resolve(root, "contracts", component.toLowerCase() + ".json");
  if (!existsSync(file)) return null;
  const c = JSON.parse(readFileSync(file, "utf8"));
  return c.intent ?? null;
}

// ---- TypeSafe -----------------------------------------------------------------------------------

const KIT = {
  roles: {
    background: "fills behind content", surface: "page and elevation layers (flat, sunken, raised, floating, backdrop)",
    text: "text color", icon: "icons and small graphic strokes", border: "edges and dividers",
    link: "link text", outline: "focus rings",
  },
  families: {
    neutral: "default UI: plain text, resting controls, dividers, containers",
    brand: "the accent: primary actions, selected, checked, current or active items, focus",
    info: "informational status messages", success: "success or completed status",
    warning: "warning status that needs attention", danger: "errors, invalid fields, destructive actions",
    highlight: "emphasis that is not a status, like a search match or a new item",
    "red, orange, yellow, olive, green, mint, cyan, purple, pink, gray":
      "decorative categories with no status meaning: tags, avatars, chart series",
  },
};

export const FIT_LEVELS = [
  "The token's color family says the opposite of what the element shows, such as a danger or success color on an element with no error or success state, or a decorative hue used to signal a status",
  "The color family has no clear link to the element's meaning, and another family in the kit is the obvious choice, such as the brand accent on a plain resting label",
  "The color family is plausible for the element, but a different family in the kit would express its meaning more directly",
  "The color family matches what the element means and the state it is in, such as neutral for resting text or brand for a checked control",
];

/** Builds one System One request body for a chunk of declarations from one component. */
export function buildRequest(component, intent, uses) {
  const questions = {};
  uses.forEach((u, i) => {
    questions[`fit_${i}`] = {
      type: "score",
      instructions: `Look at \`declarations[${i}]\` in the \`${component}\` component (intent: \`component.intent\`). ` +
        `Its token's color family is \`declarations[${i}].family\`; \`kit.families\` says what each family means. ` +
        `Judge only whether that family suits what the styled element means in this state, not whether the token role suits the CSS property.`,
      criteria: FIT_LEVELS,
    };
    if (u.roleMismatch) {
      questions[`justified_${i}`] = {
        type: "noul",
        instructions: `\`declarations[${i}]\` paints \`declarations[${i}].property\` with a \`declarations[${i}].tokenRole\` token, ` +
          `though that property normally takes one of \`declarations[${i}].propertyRoles\`. ` +
          `Do \`declarations[${i}].selector\`, \`declarations[${i}].comment\`, \`declarations[${i}].elementNotes\` (comments on other rules for the same element) or \`component.intent\` give a deliberate reason, such as a contrast requirement, ` +
          `an element that is itself a line (a divider or rule painted with a border color), or an edge that matches the fill of the same control?`,
        criteria: {
          true: "A reason is stated or clearly implied, so the mismatch is on purpose",
          false: "No reason is given; it reads as a slip where a token of the expected role should be used",
        },
      };
    }
  });
  return {
    model: "jev-latest",
    state: {
      kit: KIT,
      component: { name: component, intent },
      declarations: uses.map(({ selector, property, value, comment, elementNotes, token, tokenRole, family, propertyRoles }) =>
        ({ selector, property, value, token, tokenRole, family, propertyRoles, comment: comment || null, elementNotes })),
    },
    questions,
  };
}

async function systemOne(body, key, attempt = 0) {
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status === 529) && attempt < 5) {
    await new Promise((r) => setTimeout(r, 2 ** attempt * 1000 + Math.random() * 500));
    return systemOne(body, key, attempt + 1);
  }
  if (!res.ok) throw new Error(`TypeSafe ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// Starting thresholds. Tune them against findings you have reviewed by hand.
export const FIT_FLAG = 1.5;
export const JUSTIFIED_FLAG = 0.5;

// ---- Main ---------------------------------------------------------------------------------------

function args(argv) {
  const a = { offline: false, component: null, out: "token-audit.json", chunk: 40 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--offline") a.offline = true;
    else if (argv[i] === "--component") a.component = argv[++i];
    else if (argv[i] === "--out") a.out = argv[++i];
    else if (argv[i] === "--chunk") a.chunk = Number(argv[++i]);
  }
  return a;
}

async function main() {
  const opt = args(process.argv.slice(2));
  const names = readSemantic();
  const tokens = tokenIndex(names);
  const known = knownVarNames();

  const grammar = names.flatMap((n) => checkName(n).map((problem) => ({ check: "grammar", token: n, problem })));
  const perFile = cssFiles(opt.component).map((f) => {
    const css = readFileSync(f.path, "utf8");
    const { findings, uses } = scanCss(css, tokens, known, css + "\n" + f.tsx);
    const file = f.path.slice(root.length + 1);
    const meta = { ...f };
    delete meta.tsx;
    return { ...meta, file, findings: findings.map((x) => ({ ...x, component: f.component, file })), uses };
  });
  const codeFindings = [...grammar, ...perFile.flatMap((f) => f.findings)];

  const counts = codeFindings.reduce((c, f) => ({ ...c, [f.check]: (c[f.check] ?? 0) + 1 }), {});
  console.log(`Tokens: ${names.length}. CSS files: ${perFile.length}. Color token uses: ${perFile.reduce((n, f) => n + f.uses.length, 0)}.`);
  console.log(`Code findings: ${JSON.stringify(counts)}`);

  const key = process.env.TYPESAFE_API_KEY;
  let judged = [];
  let usage = { input_tokens: 0, output_tokens: 0 };
  if (opt.offline || !key) {
    if (!opt.offline) console.log("TYPESAFE_API_KEY not set: skipping TypeSafe judgments. Add it to .env.local or pass --offline.");
  } else {
    const jobs = perFile.flatMap((f) => {
      const intent = contractIntent(f.component);
      const chunks = [];
      for (let i = 0; i < f.uses.length; i += opt.chunk) chunks.push({ f, intent, uses: f.uses.slice(i, i + opt.chunk) });
      return chunks;
    });
    console.log(`Asking TypeSafe: ${jobs.length} requests.`);
    const started = Date.now();
    const queue = [...jobs];
    const worker = async () => {
      for (let job; (job = queue.shift()); ) {
        const res = await systemOne(buildRequest(job.f.component, job.intent, job.uses), key);
        usage.input_tokens += res.usage?.input_tokens ?? 0;
        usage.output_tokens += res.usage?.output_tokens ?? 0;
        job.uses.forEach((u, i) => {
          const fit = res.answers[`fit_${i}`];
          const just = res.answers[`justified_${i}`];
          judged.push({
            component: job.f.component, file: job.f.file, selector: u.selector, property: u.property, token: u.token,
            roleMismatch: u.roleMismatch, comment: u.comment || null,
            fit: fit?.score ?? null, fitConfidence: fit?.confidence ?? null, fitProbabilities: fit?.probabilities ?? null,
            justified: just?.noul ?? null,
          });
        });
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    console.log(`TypeSafe done in ${((Date.now() - started) / 1000).toFixed(1)}s. Tokens in/out: ${usage.input_tokens}/${usage.output_tokens}.`);
  }

  const flagged = judged
    .filter((j) => (j.fit !== null && j.fit < FIT_FLAG) || (j.roleMismatch && j.justified !== null && j.justified < JUSTIFIED_FLAG))
    .sort((a, b) => (a.fit ?? 3) - (b.fit ?? 3));

  const print = (label, rows, fmt) => {
    if (!rows.length) return;
    console.log(`\n${label} (${rows.length})`);
    rows.slice(0, 25).forEach((r) => console.log("  " + fmt(r)));
    if (rows.length > 25) console.log(`  ... ${rows.length - 25} more in ${opt.out}`);
  };
  print("Grammar", grammar, (r) => `${r.token}: ${r.problem}`);
  for (const check of ["primitive", "unknown"]) {
    print(check === "primitive" ? "Primitive ramps in components" : "Unknown tokens",
      codeFindings.filter((f) => f.check === check), (r) => `${r.file}  ${r.selector} { ${r.property}: ${r.token} }`);
  }
  if (!judged.length) {
    print("Role mismatches (code only)", codeFindings.filter((f) => f.check === "role"),
      (r) => `${r.file}  ${r.selector} { ${r.property}: ${r.token} }${r.comment ? "  /* has comment */" : ""}`);
  }
  print("Flagged by TypeSafe", flagged, (r) =>
    `fit ${r.fit.toFixed(2)} (conf ${r.fitConfidence.toFixed(2)})` +
    (r.justified !== null ? `, justified ${r.justified.toFixed(2)}` : "") +
    `  ${r.file}  ${r.selector} { ${r.property}: ${r.token} }`);

  writeFileSync(resolve(root, opt.out), JSON.stringify({ generatedAt: new Date().toISOString(), thresholds: { FIT_FLAG, JUSTIFIED_FLAG }, counts, usage, codeFindings, flagged, judged }, null, 2));
  console.log(`\nFull report: ${opt.out}`);
}

if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
