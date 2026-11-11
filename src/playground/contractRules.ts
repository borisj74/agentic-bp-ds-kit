import type { Contract } from "./Master";

/**
 * A contract's doNot array mixes two kinds of rule.
 *
 * 1. "Do not use it for a flat list. Use Select." — about reaching for this piece at all. That belongs under
 *    When not to use, beside When to use.
 * 2. "Do not invent a local cousin", "Do not use raw hex", "Do not put search in the table" — rules that hold
 *    while you are using the piece, where the agent stops and asks rather than inventing. That is stops if.
 *
 * The split is read off the sentence, not guessed: a rule is a When-not-to-use rule when it opens
 * "Do not use [it] for / as / to / when / on / in / where ...", which is the contract's own way of naming a job
 * this piece is the wrong tool for. "Do not invent ..." is never one, even when it names other pieces
 * ("Do not invent a local Accordion, Collapse or Disclosure"): it is a stop, not a choice of tool.
 */
const NOT_USE = /^Do not use (it |this |them |these )?(for|as|to|when|on|in|where)\b/i;

export function splitDoNot(doNot: readonly string[] = []): { notUse: string[]; stops: string[] } {
  const notUse: string[] = [];
  const stops: string[] = [];
  for (const rule of doNot) (NOT_USE.test(rule) && !/\binvent\b/i.test(rule) ? notUse : stops).push(rule);
  return { notUse, stops };
}

/**
 * A When-not-to-use bullet reads as the job, not as an order: "Do not use it for a flat list. Use Select."
 * becomes "a flat list — Select". Only the contract's own words move around; nothing is written here.
 */
export function notUseText(rule: string): string {
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

/** The notes column: the prop's own note, with an object or array prop's item shape in front of it. */
export function propNote(p: { note?: string; itemShape?: string }): string {
  return [p.itemShape, p.note].filter(Boolean).join(" — ");
}

export const contractFile = (contract: Contract) => `contracts/${contract.name.toLowerCase()}.json`;
