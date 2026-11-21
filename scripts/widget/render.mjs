/**
 * Widget spec → TSX. A tile is one component file under src/app/(widgets)/widgets/<batch>/tiles/, drawn from the
 * nodes its template expands to, one branch per state. A small harness beside the tiles serves each one at
 * /widgets/<batch>/<name>, at its size, so the loop can render it, switch its state and theme, and use it.
 *
 *   renderTile(spec, { specPath })     — the TSX of one tile
 *   harnessFiles(batch, specs)         — the harness: a route, a client stage and the map of tiles
 *   tileFile(batch, name)              — where a tile is written
 *
 * The nodes are the screen spec's own shape, plus { $action: id } for a handler that reports to the tile's
 * onAction and { $node: node } for a kit component inside a value (a Table cell). Nothing else is drawn: every
 * tag is a kit piece with its contract import.
 */
import { piece, repoRoot } from "../review/catalog.mjs";
import { expand } from "../../templates/widgets/index.mjs";
import { loadSizes } from "./sizes.mjs";

/** Where the generated tiles and their harness live. Not committed: npm run widget -- build writes them. */
export const WIDGETS_DIR = "src/app/(widgets)/widgets";

export const pascal = (slug) =>
  String(slug)
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

export const tileFile = (batch, name) => `${WIDGETS_DIR}/${batch}/tiles/${name}.tsx`;

const attrString = (value) => `"${String(value).replace(/"/g, "&quot;")}"`;
const key = (name) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name));
const isAction = (v) => v && typeof v === "object" && !Array.isArray(v) && typeof v.$action === "string";
const isNode = (v) => v && typeof v === "object" && !Array.isArray(v) && v.$node && typeof v.$node === "object";
const handler = (id) => `() => onAction(${JSON.stringify(id)})`;

/** A value as a TSX expression: handlers and kit components inside it included. */
function expression(value, ctx, pad) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isAction(value)) return handler(value.$action);
  if (isNode(value)) return renderNode(value.$node, ctx, pad);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => `${pad}  ${expression(v, ctx, pad + "  ")},`).join("\n")}\n${pad}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  const flat = entries.every(([, v]) => v === null || typeof v !== "object");
  if (flat) return `{ ${entries.map(([k, v]) => `${key(k)}: ${expression(v, ctx, pad)}`).join(", ")} }`;
  return `{\n${entries.map(([k, v]) => `${pad}  ${key(k)}: ${expression(v, ctx, pad + "  ")},`).join("\n")}\n${pad}}`;
}

function attribute(name, value, ctx, pad) {
  if (isAction(value)) return `${name}={${handler(value.$action)}}`;
  if (typeof value === "string") return `${name}=${attrString(value)}`;
  if (value === true) return name;
  return `${name}={${expression(value, ctx, pad)}}`;
}

/** One kit node as JSX. Every line after the first is padded with `pad`. */
export function renderNode(node, ctx, pad = "") {
  const target = piece(node.component, ctx.root);
  if (!target || target.kind === "pattern") throw new Error(`"${node.component}" is not a kit component.`);
  ctx.used.add(target.name);
  const attrs = Object.entries(node.props ?? {}).map(([name, value]) => attribute(name, value, ctx, pad + "  "));
  const children = [];
  for (const [name, nodes] of Object.entries(node.slots ?? {})) {
    if (name === "children") {
      children.push(...nodes.map((child) => `${pad}  ${renderNode(child, ctx, pad + "  ")}`));
      continue;
    }
    if (nodes.length === 1) attrs.push(`${name}={${renderNode(nodes[0], ctx, pad + "  ")}}`);
    else attrs.push(`${name}={\n${pad}    <>\n${nodes.map((n) => `${pad}      ${renderNode(n, ctx, pad + "      ")}`).join("\n")}\n${pad}    </>\n${pad}  }`);
  }
  if (node.text !== undefined) {
    const text = String(node.text);
    children.push(`${pad}  ${/['"<>{}]/.test(text) ? `{${JSON.stringify(text)}}` : text}`);
  }
  const open = attrs.length === 0 ? `<${target.name}` : `<${target.name}\n${attrs.map((a) => `${pad}  ${a}`).join("\n")}\n${pad}`;
  if (children.length === 0) return `${open}${attrs.length === 0 ? " />" : "/>"}`;
  return `${open}>\n${children.join("\n")}\n${pad}</${target.name}>`;
}

/** The TSX of one tile: a branch per state the spec declares, ready last. */
export function renderTile(spec, { specPath = null, root = repoRoot } = {}) {
  const ctx = { used: new Set(), root };
  const branch = (state, pad) => `${pad}${renderNode(expand(spec, { state }), ctx, pad)}`;
  const others = spec.states.filter((s) => s !== "ready");
  const blocks = others.map((state) => `  if (state === ${JSON.stringify(state)}) {\n    return (\n${branch(state, "      ")}\n    );\n  }`);
  const ready = `  return (\n${branch("ready", "    ")}\n  );`;
  const imports = [...ctx.used]
    .map((name) => piece(name, root))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => `import { ${p.name} } from "${p.importPath}";`);
  const source = specPath ? ` from ${specPath}` : "";
  const component = `${pascal(spec.name)}Widget`;
  const used = /onAction\(/.test([...blocks, ready].join("\n"));
  return `"use client";
// Generated widget${source} (template ${spec.template}, size ${spec.size}).
// Change the spec and run npm run widget -- build; do not edit this file by hand.
${imports.join("\n")}

export type WidgetState = "ready" | "loading" | "empty" | "error";

export interface WidgetProps {
  state?: WidgetState;
  /** Called with the id of each action a person uses: a footer link, a header button, an opened row, retry. */
  onAction?: (id: string) => void;
}

export default function ${component}({ state = "ready"${used ? ", onAction = () => {}" : ""} }: WidgetProps) {
${blocks.join("\n")}${blocks.length ? "\n" : ""}${ready}
}
`;
}

/**
 * The harness for one batch: a route that serves every tile at its size, a client stage that holds the state,
 * the theme and the actions a person used (on window.__widget, for the loop), and the map of tiles.
 */
export function harnessFiles(batch, specs, { root = repoRoot } = {}) {
  const { sizes } = loadSizes(root);
  const dir = `${WIDGETS_DIR}/${batch}`;
  const entries = specs.map((spec) => {
    const size = sizes[spec.size];
    return `  ${JSON.stringify(spec.name)}: { Tile: ${pascal(spec.name)}Widget, width: ${size.width}, height: ${size.height}, states: ${JSON.stringify(spec.states)} },`;
  });
  const tilesTs = `// Generated by npm run widget -- build. The tiles in batch ${batch}, at their sizes.
import type { ComponentType } from "react";
${specs.map((s) => `import ${pascal(s.name)}Widget from "./tiles/${s.name}";`).join("\n")}

export interface TileEntry {
  Tile: ComponentType<{ state?: "ready" | "loading" | "empty" | "error"; onAction?: (id: string) => void }>;
  width: number;
  height: number;
  states: string[];
}

export const TILES: Record<string, TileEntry> = {
${entries.join("\n")}
};
`;
  const stageTsx = `"use client";
// Generated by npm run widget -- build. Holds one tile at its size, in a state and a theme the loop can switch.
import { useEffect, useState } from "react";
import { TILES } from "../tiles";

type State = "ready" | "loading" | "empty" | "error";
type Theme = "light" | "dark";

declare global {
  interface Window {
    __widget?: { actions: string[]; setState: (state: State) => void; setTheme: (theme: Theme) => void };
  }
}

export function Stage({ name, state: first, theme: firstTheme }: { name: string; state: State; theme: Theme }) {
  const [state, setState] = useState<State>(first);
  const [theme, setTheme] = useState<Theme>(firstTheme);
  const entry = TILES[name];

  useEffect(() => {
    window.__widget = { actions: [], setState, setTheme };
  }, []);

  if (!entry) return <p>No tile called {name} in this batch.</p>;
  const { Tile, width, height } = entry;
  return (
    <div data-theme={theme} data-widget-stage={name} data-state={state} style={{ minHeight: "100dvh", padding: "var(--layout-margin-md)", background: "var(--surface-flat)" }}>
      <div data-widget-tile={name} style={{ width, minHeight: height, maxWidth: "100%" }}>
        <Tile key={state} state={state} onAction={(id) => window.__widget?.actions.push(id)} />
      </div>
    </div>
  );
}
`;
  const pageTsx = `// Generated by npm run widget -- build. Serves one tile of batch ${batch} at /widgets/${batch}/<name>?state=&theme=.
import { Stage } from "./Stage";

type State = "ready" | "loading" | "empty" | "error";

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ state?: string; theme?: string }>;
}) {
  const { name } = await params;
  const query = await searchParams;
  const state = (["ready", "loading", "empty", "error"].includes(query.state ?? "") ? query.state : "ready") as State;
  return <Stage name={name} state={state} theme={query.theme === "dark" ? "dark" : "light"} />;
}
`;
  return [
    { file: `${dir}/tiles.ts`, code: tilesTs },
    { file: `${dir}/[name]/Stage.tsx`, code: stageTsx },
    { file: `${dir}/[name]/page.tsx`, code: pageTsx },
  ];
}
