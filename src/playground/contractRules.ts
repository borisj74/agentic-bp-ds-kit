import type { Contract } from "./Master";

/**
 * A contract's doNot array mixes two kinds of rule.
 *
 * 1. Rules about this piece being the wrong choice, and rules that hold while you use it: "Do not use it for a
 *    flat list. Use Select.", "Do not put sentences in a Badge.", "Do not put search or filters in the table."
 *    All of those are things a person decides while laying out a screen, so they read on the page, under
 *    When not to use beside When to use.
 * 2. The two mechanical stops: "Do not invent a local cousin" and "Do not use raw hex". Those are not a design
 *    choice at all — they are where an agent stops and asks instead of writing its own version — so they sit in
 *    the agent panel under stops if.
 *
 * Splitting it the other way round was tried first, with only the "Do not use it for …" rules on the page: it
 * left 22 of 95 contracts with no right column and put most of every contract's rules inside the panel.
 */
const STOPS = /\binvent\b|raw hex/i;

/** The sentence shape that names a job this piece is the wrong tool for, which reads better rewritten. */
const WRONG_TOOL = /^Do not use (it |this |them |these )?(for|as|to|when|on|in|where)\b/i;

export function splitDoNot(doNot: readonly string[] = []): { notUse: string[]; stops: string[] } {
  const notUse: string[] = [];
  const stops: string[] = [];
  for (const rule of doNot) (STOPS.test(rule) ? stops : notUse).push(rule);
  return { notUse, stops };
}

/**
 * A When-not-to-use bullet. A wrong-tool rule reads as the job rather than as an order: "Do not use it for a
 * flat list. Use Select." becomes "a flat list — Select". Every other rule keeps the contract's own sentence,
 * because there is nothing to turn around in "Do not put sentences in a Badge". Only the full stop goes.
 */
export function notUseText(rule: string): string {
  if (!WRONG_TOOL.test(rule)) return rule.replace(/\.$/, "");
  const s = rule
    .replace(/^Do not use (it |this |them |these )?/i, "")
    .replace(/^for /i, "")
    .replace(/\s*\((?:use|see) ([^)]+)\)/i, " — $1")
    .replace(/\.\s*Use ([^.]+)\.$/i, " — $1");
  return s.replace(/\.$/, "");
}

export type DefaultEntry = { name: string; value: string };

/** The props that carry a default, written the way the panel shows them: name then value. */
export function defaults(contract: Contract): DefaultEntry[] {
  return Object.entries(contract.props ?? {})
    .filter(([, p]) => p.default !== undefined)
    .map(([name, p]) => ({ name, value: literal(p.default) }));
}

function literal(value: unknown): string {
  if (typeof value === "string") return value.length === 0 ? '""' : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "—";
}

/** How a screen imports the piece: the kit rule is @/ui/<Name>/<Name>, which contract.path already holds. */
export function importLine(contract: Contract): string {
  const base = contract.path.replace(/^src\//, "@/").replace(/\.tsx?$/, "");
  return `import { ${contract.name} } from "${base}";`;
}

/** A contract writes an item shape either as one line of text or as a map of field name to type. */
export type ItemShape = string | Record<string, string>;

/**
 * The type half of a shape field. A contract often writes the note into the type — "string? Material Symbols
 * name. Shown in a tinted tile." — and the props table only has room for the type, so the prose comes off: at
 * the "? " that ends an optional type, else where a sentence starts after it. A type with neither, like
 * "boolean?" or a union, comes back whole.
 */
function fieldType(value: string): string {
  const optional = value.indexOf("? ");
  if (optional !== -1) return value.slice(0, optional + 1);
  const sentence = value.match(/^(.*?)\s+[A-Z]/);
  return sentence ? sentence[1] : value;
}

/** An item shape as one line: a written one as it stands, a map as { name: type; name: type }. */
export function itemShapeText(shape: ItemShape): string {
  if (typeof shape === "string") return shape;
  const fields = Object.entries(shape).map(([name, type]) => `${name}: ${fieldType(String(type))}`);
  return fields.length > 0 ? `{ ${fields.join("; ")} }` : "";
}

/** The notes column: the prop's own note, with an object or array prop's item shape in front of it. */
export function propNote(p: { note?: string; itemShape?: ItemShape }): string {
  return [p.itemShape ? itemShapeText(p.itemShape) : "", p.note].filter(Boolean).join(" — ");
}

export const contractFile = (contract: Contract) => `contracts/${contract.name.toLowerCase()}.json`;
