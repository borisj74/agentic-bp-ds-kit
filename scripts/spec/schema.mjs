/**
 * The screen spec: the JSON a screen is written as before any code exists.
 *
 * A spec names one pattern (level template), fills its regions with kit components by their contract
 * name, and says which states the screen has to answer. Every name, prop and value is checked against
 * contracts/index.json and the contracts themselves, so a spec that could not be built fails here —
 * before a single line of the screen is written.
 *
 *   parseSpec(json)            — shape only (zod), returns { ok, spec, errors }
 *   validateSpec(json, opts)   — shape and the contracts, returns { ok, spec, errors, warnings }
 *
 * An error is { path, message, fix? }. `path` is where it sits in the spec, like
 * regions.toolbar[0].props.size.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { catalog, isFreeProp, piece, repoRoot } from "../review/catalog.mjs";

/** A route and file name: lowercase words joined by single dashes. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The states a screen can declare. `ready` is always there, listed or not. */
export const STATES = ["ready", "loading", "empty", "error"];

/** The region every pattern has: its children. */
export const CONTENT_REGION = "content";

/** The region that sits inside the frame, above the pattern. Sections only. */
export const ABOVE_REGION = "above";

/** How long a copy string may be, by what the key is for. */
export const COPY_LIMITS = [
  { test: /(title|heading|label|action|button)/i, max: 60 },
  { test: /(description|body|help|notice|message|error)/i, max: 200 },
];
export const COPY_MAX = 240;

/** A copy reference inside a prop value: "$copy.emptyTitle". */
const COPY_REF = /^\$copy\.([A-Za-z0-9_]+)$/;

const jsonValue = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(jsonValue)]),
);

const nodeSchema = z.lazy(() =>
  z
    .object({
      component: z.string().min(1, "Name the kit component."),
      props: z.record(jsonValue).optional(),
      slots: z.record(z.array(nodeSchema)).optional(),
      text: z.string().max(COPY_MAX).optional(),
      note: z.string().optional(),
    })
    .strict(),
);

export const specSchema = z
  .object({
    name: z.string().regex(SLUG, "Use a slug: lowercase words joined by single dashes."),
    title: z.string().min(1).max(60),
    pattern: z.string().min(1),
    section: z.string().regex(SLUG, "A side-nav id, like billing-invoices.").optional(),
    breadcrumbs: z.array(z.string().min(1).max(40)).max(4).optional(),
    about: z.string().max(240).optional(),
    props: z.record(jsonValue).optional(),
    copy: z.record(z.string()).optional(),
    state: z.enum(STATES).optional(),
    states: z.array(z.enum(STATES)).optional(),
    regions: z.record(z.array(nodeSchema)),
  })
  .strict();

/** Shape only: zod, no contracts. */
export function parseSpec(input) {
  const result = specSchema.safeParse(input);
  if (result.success) return { ok: true, spec: result.data, errors: [] };
  return {
    ok: false,
    spec: null,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join(".") || "(spec)",
      message: issue.message,
    })),
  };
}

// ---- the side nav --------------------------------------------------------------------------------

const navSlug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * Every id the kit's own side nav carries, read out of src/patterns/AppShell/appNav.ts.
 * The file builds its ids from `menu(section, labels)` and `group(section, label, labels)`, so the ids
 * are derived the same way here rather than kept as a second list that could drift.
 */
export function navIds(root = repoRoot) {
  const file = join(root, "src/patterns/AppShell/appNav.ts");
  if (!existsSync(file)) return new Set();
  const text = readFileSync(file, "utf8");
  const ids = new Set();
  for (const match of text.matchAll(/\bid:\s*"([^"]+)"/g)) ids.add(match[1]);
  const labels = (list) => [...list.matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter((l) => l && l !== "-");
  for (const match of text.matchAll(/\bmenu\(\s*"([^"]+)"\s*,\s*\[([^\]]*)\]/g)) {
    for (const label of labels(match[2])) ids.add(`${match[1]}-${navSlug(label)}`);
  }
  for (const match of text.matchAll(/\bgroup\(\s*"([^"]+)"\s*,\s*"[^"]*"\s*,\s*\[([^\]]*)\]/g)) {
    for (const label of labels(match[2])) ids.add(`${match[1]}-${navSlug(label)}`);
  }
  return ids;
}

// ---- the contracts -------------------------------------------------------------------------------

// A prop that takes components: one node, or a list of them (GuidedProcessPage intro).
const isNodeProp = (prop) => prop?.type === "ReactNode" || prop?.type === "ReactNode[]";

/**
 * The closed set a field of an itemShape allows, when the contract writes one.
 * `"neutral | brand | success | warning | danger? Tints the circle."` is a closed set;
 * `"string? One line under the title."` is not.
 */
export function shapeEnum(description) {
  const head = String(description ?? "").split("?")[0].trim();
  if (!head.includes("|")) return null;
  const parts = head.split("|").map((part) => part.trim());
  if (parts.length < 2) return null;
  if (!parts.every((part) => /^[a-z][a-z0-9-]*$/.test(part))) return null;
  return parts;
}
const isHandlerProp = (prop) => prop?.type === "function" || /=>/.test(String(prop?.type ?? ""));

/**
 * The regions a pattern has: its props that take components, plus above for the frame and, when the
 * pattern takes children, content for them. A pattern with no children (ListDetail) has no content
 * region: everything it draws goes in a named one.
 */
export function regionsOf(pattern) {
  const props = pattern.props ?? {};
  const nodes = Object.entries(props)
    .filter(([name, prop]) => name !== "children" && isNodeProp(prop))
    .map(([name]) => name);
  const content = isNodeProp(props.children) ? [CONTENT_REGION] : [];
  return [ABOVE_REGION, ...content, ...nodes.sort()];
}

function copyLimit(key) {
  for (const rule of COPY_LIMITS) if (rule.test.test(key)) return rule.max;
  return COPY_MAX;
}

/**
 * A spec against the kit: the pattern, the regions, every component, every prop and every value.
 * @returns {{ ok: boolean, spec: object | null, errors: object[], warnings: object[], regions: string[] }}
 */
export function validateSpec(input, { root = repoRoot } = {}) {
  const shape = parseSpec(input);
  if (!shape.ok) return { ...shape, warnings: [], regions: [] };

  const spec = shape.spec;
  const errors = [];
  const warnings = [];
  const say = (list, path, message, fix) => list.push(fix ? { path, message, fix } : { path, message });
  const fail = (path, message, fix) => say(errors, path, message, fix);
  const warn = (path, message, fix) => say(warnings, path, message, fix);

  const copy = spec.copy ?? {};
  for (const [key, text] of Object.entries(copy)) {
    const max = copyLimit(key);
    if (text.length > max) fail(`copy.${key}`, `"${key}" is ${text.length} characters; the limit is ${max}.`, "Say it shorter.");
    if (!text.trim()) fail(`copy.${key}`, `"${key}" is empty.`, "Write the words, or drop the key.");
  }

  const pattern = piece(spec.pattern, root);
  if (!pattern || pattern.kind !== "pattern") {
    const names = [...catalog(root).pieces.values()].filter((p) => p.kind === "pattern").map((p) => p.name);
    return {
      ok: false,
      spec,
      regions: [],
      warnings,
      errors: [
        ...errors,
        {
          path: "pattern",
          message: `"${spec.pattern}" is not a pattern in this kit.`,
          fix: `Use one of: ${names.join(", ")}.`,
        },
      ],
    };
  }

  const regions = regionsOf(pattern);
  const patternStates = pattern.props?.state?.enum ?? null;
  const states = [...new Set([spec.state ?? "ready", ...(spec.states ?? [])])];

  if (spec.section) {
    const ids = navIds(root);
    if (ids.size > 0 && !ids.has(spec.section))
      fail("section", `No side-nav link has the id "${spec.section}".`, "Read src/patterns/AppShell/appNav.ts and use one of its ids.");
  }
  if (spec.breadcrumbs?.some((label) => label.toLowerCase() === "home"))
    fail("breadcrumbs", "Home is added for you.", "List only the sections under Home; PageHeader adds the page title last.");

  let primaries = 0;

  // The pattern's own values: columns, labelPosition, sticky and the like. Its ReactNode props are
  // regions, so they are filled there instead.
  const patternProps = pattern.props ?? {};

  const checkValue = (path, name, prop, value) => {
    if (typeof value === "string") {
      const ref = COPY_REF.exec(value);
      if (ref && !(ref[1] in copy)) {
        fail(path, `copy has no "${ref[1]}".`, "Add it under copy, or write the words here.");
        return;
      }
      if (ref) return;
    }
    if (isHandlerProp(prop)) {
      if (value !== true)
        fail(path, `${name} is a handler.`, "Set it to true and the screen gets a no-op handler, or leave it out.");
      return;
    }
    if (Array.isArray(prop?.enum)) {
      const allowed = prop.enum.map(String);
      if (!allowed.includes(String(value)))
        fail(path, `${name} cannot be ${JSON.stringify(value)}.`, `The contract allows: ${allowed.join(", ")}.`);
      return;
    }
    // A list of records: the contract's itemShape says what each row may hold, so a value outside a
    // closed set in that shape fails here rather than at the typecheck.
    const shape = prop?.itemShape;
    if (Array.isArray(value) && shape && typeof shape === "object") {
      value.forEach((item, i) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return;
        for (const [field, given] of Object.entries(item)) {
          const allowed = shapeEnum(shape[field]);
          if (!allowed || typeof given !== "string") continue;
          if (!allowed.includes(given))
            fail(`${path}[${i}].${field}`, `${field} cannot be "${given}".`, `The contract allows: ${allowed.join(", ")}.`);
        }
      });
      return;
    }

    const type = String(prop?.type ?? "");
    if (type === "boolean" && typeof value !== "boolean") fail(path, `${name} is a boolean.`);
    else if (type === "number" && typeof value !== "number") fail(path, `${name} is a number.`);
    else if (type === "string" && typeof value !== "string") fail(path, `${name} is a string.`);
  };

  const checkNode = (node, path) => {
    const target = piece(node.component, root);
    if (!target) {
      fail(path + ".component", `Nothing in the kit is called "${node.component}".`, "Search the catalog; never add a local cousin.");
      return;
    }
    if (target.kind === "pattern") {
      fail(path + ".component", `${target.name} is a pattern, so it cannot sit inside one.`, "Put kit components in the regions.");
      return;
    }

    const props = target.props ?? {};
    for (const [name, value] of Object.entries(node.props ?? {})) {
      const prop = props[name];
      if (!prop) {
        // The props every React element takes (className, id, form, aria-*, on*) are not in a contract,
        // and the review does not flag them either.
        if (isFreeProp(name)) {
          if (/^on[A-Z]/.test(name) && value !== true)
            fail(`${path}.props.${name}`, `${name} is a handler.`, "Set it to true and the screen gets a no-op handler.");
          continue;
        }
        fail(
          `${path}.props.${name}`,
          `${target.name} has no prop called "${name}".`,
          `Its props: ${Object.keys(props).join(", ") || "none"}.`,
        );
        continue;
      }
      // A ReactNode prop takes words as well as components: FormDisplay value is usually a line of
      // text. Components for it go under slots.
      if (isNodeProp(prop)) {
        if (typeof value === "string" || typeof value === "number") {
          checkValue(`${path}.props.${name}`, name, { type: typeof value === "number" ? "number" : "string" }, value);
          continue;
        }
        fail(`${path}.props.${name}`, `${name} takes components or words.`, `Put components under slots.${name}.`);
        continue;
      }
      checkValue(`${path}.props.${name}`, name, prop, value);
    }

    for (const [name, children] of Object.entries(node.slots ?? {})) {
      const prop = name === "children" ? props.children : props[name];
      if (!prop) {
        const slots = Object.entries(props)
          .filter(([, p]) => isNodeProp(p))
          .map(([n]) => n);
        fail(`${path}.slots.${name}`, `${target.name} has no slot called "${name}".`, `Its slots: ${["children", ...slots].join(", ")}.`);
        continue;
      }
      if (!isNodeProp(prop) && prop.type !== "ReactNode" && name !== "children")
        fail(`${path}.slots.${name}`, `${name} is not a slot on ${target.name}.`, "Pass it under props.");
      children.forEach((child, i) => checkNode(child, `${path}.slots.${name}[${i}]`));
    }

    for (const [name, prop] of Object.entries(props)) {
      if (!prop.required) continue;
      const given = node.props?.[name] !== undefined || node.slots?.[name] !== undefined;
      const asChildren = name === "children" && (node.text !== undefined || node.slots?.children !== undefined);
      if (!given && !asChildren)
        fail(`${path}.props.${name}`, `${target.name} needs ${name}.`, prop.note ? String(prop.note).split(". ")[0] + "." : undefined);
    }

    if (target.name === "Button" && node.props?.emphasis === "strong" && node.props?.intent === "brand") primaries += 1;
  };

  for (const [name, value] of Object.entries(spec.props ?? {})) {
    const prop = patternProps[name];
    if (!prop) {
      if (isFreeProp(name)) continue;
      const values = Object.entries(patternProps)
        .filter(([, p]) => p?.type !== "ReactNode")
        .map(([n]) => n);
      fail(`props.${name}`, `${pattern.name} has no prop called "${name}".`, `Its values: ${values.join(", ")}.`);
      continue;
    }
    if (prop.type === "ReactNode") {
      fail(`props.${name}`, `${name} takes components.`, `Put them under regions.${name}.`);
      continue;
    }
    if (name === "state") {
      fail("props.state", "The state belongs to the screen, not to its props.", 'Use "state" and "states" at the top of the spec.');
      continue;
    }
    checkValue(`props.${name}`, name, prop, value);
  }

  for (const [region, nodes] of Object.entries(spec.regions ?? {})) {
    if (!regions.includes(region)) {
      fail(`regions.${region}`, `${pattern.name} has no region called "${region}".`, `Its regions: ${regions.join(", ")}.`);
      continue;
    }
    if (region === ABOVE_REGION) {
      for (const [i, node] of nodes.entries()) {
        if (node.component !== "Section")
          warn(`regions.above[${i}]`, `${node.component} sits above the pattern.`, "Wrap what goes above the pattern in a Section.");
      }
    }
    nodes.forEach((node, i) => checkNode(node, `regions.${region}[${i}]`));
  }

  const takesChildren = isNodeProp(patternProps.children);
  if (takesChildren && !spec.regions?.[CONTENT_REGION]?.length)
    fail(`regions.${CONTENT_REGION}`, "The pattern has nothing in it.", `Put the screen's rows, groups or form under regions.${CONTENT_REGION}.`);
  if (!takesChildren && Object.values(spec.regions ?? {}).every((nodes) => nodes.length === 0))
    fail("regions", "The pattern has nothing in it.", `Fill its regions: ${regions.join(", ")}.`);

  if (primaries > 1)
    fail("regions", `${primaries} strong brand Buttons on one screen.`, "Keep one; make the rest subtle neutral, or minimal.");
  // A pattern whose own parts include a Button is expected to carry the screen's main action. A home
  // of tiles (SettingsPage) is not, so it is not asked for one.
  if (primaries === 0 && (pattern.composes ?? []).includes("Button"))
    warn("regions", "No strong brand Button on the screen.", "Give the screen its one main action, if it has one.");

  for (const state of states) {
    if (state === "ready") continue;
    if (patternStates && !patternStates.includes(state)) {
      fail("states", `${pattern.name} has no "${state}" state.`, `Its states: ${patternStates.join(", ")}.`);
      continue;
    }
    if (state === "empty" && !spec.regions?.empty?.length)
      fail("states", "The screen says it has an empty state but nothing to show in it.", "Put an EmptyState under regions.empty.");
    if (state === "error" && !copy.error)
      fail("states", "The screen says it has an error state but no words for it.", 'Add copy.error: what failed and what to do.');
  }

  return { ok: errors.length === 0, spec, errors, warnings, regions, states, pattern: pattern.name };
}

/** Read a spec file and validate it. Throws a readable message when the file is missing or not JSON. */
export function validateSpecFile(file, { root = repoRoot } = {}) {
  if (!existsSync(file)) throw new Error(`There is no spec at ${file}.`);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
  return { file, ...validateSpec(parsed, { root }) };
}

/** The spec's copy with its references resolved: "$copy.key" becomes the words. */
export function resolveCopy(value, copy = {}) {
  if (typeof value === "string") {
    const ref = COPY_REF.exec(value);
    return ref ? (copy[ref[1]] ?? value) : value;
  }
  if (Array.isArray(value)) return value.map((v) => resolveCopy(v, copy));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveCopy(v, copy);
    return out;
  }
  return value;
}
