/**
 * Spec → screen. Turns a validated screen spec into the TSX of a page, one file per state.
 *
 * The frame is always the same: AppShell with the whole side nav, the kit AppHeader, the kit AppNav
 * and a PageHeader whose breadcrumbs start at Home. Everything else comes from the spec's regions,
 * so the generator can only write what the contracts allow.
 *
 *   renderScreen(spec, { state })  — the TSX of one page
 *   screenFiles(spec)              — [{ file, route, state, code }] for every state the spec declares
 *
 * Every renderer here returns a block whose first line carries no padding and whose later lines are
 * padded relative to `pad`. The caller indents the whole block where it belongs.
 */
import { piece, repoRoot } from "../review/catalog.mjs";
import { CONTENT_REGION, ABOVE_REGION, resolveCopy } from "./schema.mjs";

const isNodeProp = (prop) => prop?.type === "ReactNode";
const isHandlerProp = (prop) => prop?.type === "function" || /=>/.test(String(prop?.type ?? ""));

/** Where the frame's own nav constants come from. Every screen passes the whole side nav. */
const NAV_IMPORT = 'import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";';

const pascal = (slug) =>
  String(slug)
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

/**
 * Puts a rendered block where it belongs. A block already carries `pad` on every line after its
 * first, so only the first line is prefixed.
 */
const place = (block, pad) => pad + block;

const attrString = (value) => `"${String(value).replace(/"/g, "&quot;")}"`;

const key = (name) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name));

/** A JSON value as a TSX expression. Arrays and objects are printed over lines so the page stays readable. */
export function expression(value, pad = "") {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => `${pad}  ${expression(v, pad + "  ")},`).join("\n")}\n${pad}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  const flat = entries.every(([, v]) => v === null || typeof v !== "object");
  if (flat) return `{ ${entries.map(([k, v]) => `${key(k)}: ${expression(v)}`).join(", ")} }`;
  return `{\n${entries.map(([k, v]) => `${pad}  ${key(k)}: ${expression(v, pad + "  ")},`).join("\n")}\n${pad}}`;
}

/** One prop as a JSX attribute. */
function attribute(name, prop, value, pad) {
  if (isHandlerProp(prop) || (!prop && /^on[A-Z]/.test(name))) return `${name}={() => {}}`;
  if (typeof value === "string") return `${name}=${attrString(value)}`;
  if (value === true) return name;
  return `${name}={${expression(value, pad)}}`;
}

/**
 * A slot as a JSX attribute: one child inline, several wrapped in a fragment.
 * `render` draws one child at the padding it is given.
 */
function slotAttribute(name, nodes, pad, render) {
  if (nodes.length === 1) return `${name}={\n${place(render(nodes[0], pad + "    "), pad + "    ")}\n${pad}  }`;
  const inner = nodes.map((node) => place(render(node, pad + "      "), pad + "      ")).join("\n");
  return `${name}={\n${pad}    <>\n${inner}\n${pad}    </>\n${pad}  }`;
}

/** One node as JSX. `used` collects every kit name so the imports can be written. */
export function renderNode(node, { copy = {}, used = new Set(), pad = "", root = repoRoot } = {}) {
  const target = piece(node.component, root);
  if (!target) throw new Error(`Nothing in the kit is called "${node.component}".`);
  used.add(target.name);

  const props = target.props ?? {};
  const attrs = [];
  const children = [];

  for (const [name, raw] of Object.entries(node.props ?? {})) {
    attrs.push(attribute(name, props[name], resolveCopy(raw, copy), pad + "  "));
  }

  const draw = (child, childPad) => renderNode(child, { copy, used, pad: childPad, root });
  for (const [name, nodes] of Object.entries(node.slots ?? {})) {
    if (name === "children") {
      children.push(...nodes.map((child) => place(draw(child, pad + "  "), pad + "  ")));
      continue;
    }
    attrs.push(slotAttribute(name, nodes, pad, draw));
  }

  // Text that carries an apostrophe, a quote or a brace cannot sit in JSX as it is, so it goes in as a
  // string expression instead: the words stay exactly what the spec wrote.
  if (node.text !== undefined) {
    const text = String(resolveCopy(node.text, copy));
    children.push(pad + "  " + (/['"<>{}]/.test(text) ? `{${JSON.stringify(text)}}` : text));
  }

  const open = attrs.length === 0 ? `<${target.name}` : `<${target.name}\n${attrs.map((a) => `${pad}  ${a}`).join("\n")}\n${pad}`;
  if (children.length === 0) return `${open}${attrs.length === 0 ? " />" : "/>"}`;
  return `${open}>\n${children.join("\n")}\n${pad}</${target.name}>`;
}

/** The import lines for the kit pieces a screen uses: patterns first, then components, by name. */
function importLines(used, root) {
  const rows = [...used]
    .map((name) => piece(name, root))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
  const lines = [
    ...rows.filter((r) => r.kind === "pattern").map((r) => `import { ${r.name} } from "${r.importPath}";`),
    ...rows.filter((r) => r.kind === "component").map((r) => `import { ${r.name} } from "${r.importPath}";`),
  ];
  const shellAt = lines.findIndex((line) => line.includes("/patterns/AppShell/AppShell"));
  if (shellAt >= 0) lines.splice(shellAt + 1, 0, NAV_IMPORT);
  return lines;
}

/** What the pattern is told about the state it is in. */
function stateAttrs(pattern, state, copy) {
  const props = pattern.props ?? {};
  const attrs = [];
  const states = props.state?.enum ?? null;
  if (states && states.includes(state)) attrs.push(`state="${state}"`);
  else if (state === "loading" && props.loading) attrs.push("loading");
  if (state === "error" && props.error && copy.error) {
    attrs.push(`error=${attrString(copy.error)}`);
    if (props.onRetry) attrs.push("onRetry={() => {}}");
  }
  return attrs;
}

/**
 * The TSX of one page.
 * @param {object} spec A spec that has passed validateSpec.
 * @param {{ state?: string, specPath?: string | null, root?: string }} [options]
 */
export function renderScreen(spec, { state = "ready", specPath = null, root = repoRoot } = {}) {
  const pattern = piece(spec.pattern, root);
  if (!pattern || pattern.kind !== "pattern") throw new Error(`"${spec.pattern}" is not a pattern in this kit.`);

  const copy = spec.copy ?? {};
  const used = new Set(["AppShell", "AppHeader", "AppNav", "PageHeader", pattern.name]);
  // PageHeader is always used: either the frame draws it, or the pattern's own header region does.
  const regions = spec.regions ?? {};
  const pad = "        ";
  const draw = (node, nodePad) => renderNode(node, { copy, used, pad: nodePad, root });

  const attrs = [`label=${attrString(spec.title)}`, ...stateAttrs(pattern, state, copy)];
  for (const [name, prop] of Object.entries(pattern.props ?? {})) {
    if (name === "children" || !isNodeProp(prop)) continue;
    const nodes = regions[name] ?? [];
    if (nodes.length > 0) attrs.push(slotAttribute(name, nodes, pad, draw));
  }

  const content = (regions[CONTENT_REGION] ?? []).map((node) => place(draw(node, pad + "  "), pad + "  "));
  const above = (regions[ABOVE_REGION] ?? []).map((node) => place(draw(node, pad), pad));

  // A pattern that draws its own PageHeader (FormPage does) owns the page title, so the frame does not
  // draw a second one: a screen has one h1.
  const ownsHeader = (regions.header ?? []).some((node) => node.component === "PageHeader");

  const crumbs = [
    '{ label: "Home", href: "#" }',
    ...(spec.breadcrumbs ?? []).map((label) => `{ label: ${JSON.stringify(label)}, href: "#" }`),
  ];

  const patternJsx = [
    `${pad}<${pattern.name}`,
    ...attrs.map((a) => `${pad}  ${a}`),
    `${pad}>`,
    ...content,
    `${pad}</${pattern.name}>`,
  ].join("\n");

  const source = specPath ? ` from ${specPath}` : "";
  const name = pascal(spec.name) + (state === (spec.state ?? "ready") ? "" : pascal(state)) + "Screen";

  return `"use client";
// Generated screen${source}. Change the spec and run npm run build-screen; do not edit this file by hand.
${spec.about ? `// ${spec.about}\n` : ""}import { useState } from "react";
${importLines(used, root).join("\n")}

export default function ${name}() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState(${JSON.stringify(spec.section ?? "home-home-dashboards")});
  const [dark, setDark] = useState(false);

  return (
    <div data-theme={dark ? "dark" : undefined} style={{ height: "100dvh" }}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen}
            onNavToggle={() => setNavOpen((open) => !open)}
            searchShortcut="Ctrl+K"
            user={{ name: "Ana Petrovic" }}
            company={{ name: "Northwind Holdings" }}
            darkMode={dark}
            onDarkModeChange={setDark}
          />
        }
        nav={
          <AppNav
            items={APP_NAV}
            endItems={APP_NAV_END}
            current={section}
            onNavigate={setSection}
            expanded={navOpen}
          />
        }
        navOpen={navOpen}
        onNavClose={() => setNavOpen(false)}${
    ownsHeader
      ? ""
      : `
        pageHeader={
          <PageHeader
            title=${attrString(spec.title)}
            breadcrumbs={[${crumbs.join(", ")}]}
          />
        }`
  }
      >
${above.length > 0 ? above.join("\n") + "\n" : ""}${patternJsx}
      </AppShell>
    </div>
  );
}
`;
}

/**
 * Every page one spec becomes: the screen itself, and one route per extra state it declares.
 * @param {object} spec A spec that has passed validateSpec.
 * @param {{ specPath?: string | null, root?: string }} [options]
 * @returns {{ file: string, route: string, state: string, code: string }[]}
 */
export function screenFiles(spec, { specPath = null, root = repoRoot } = {}) {
  // The screen's own state is its route; every other state it declares gets a route under it, so a
  // loop can render and photograph each one.
  const main = spec.state ?? "ready";
  const states = [...new Set([main, ...(spec.states ?? [])])];
  return states.map((state) => {
    const folder = state === main ? spec.name : `${spec.name}/${state}`;
    return {
      state,
      file: `src/app/(examples)/${folder}/page.tsx`,
      route: `/${folder}`,
      code: renderScreen(spec, { state, specPath, root }),
    };
  });
}
