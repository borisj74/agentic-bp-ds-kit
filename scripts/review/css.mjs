/**
 * Reads one CSS (or CSS module) file into declarations that know their line.
 * audit-tokens already knows which tokens exist; this file only finds where each value sits.
 */

/** Replaces comments with spaces so positions stay the same. */
const blankComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/**
 * Every `property: value` in the file, with the line the property sits on.
 * @returns {{ property: string, value: string, line: number, custom: boolean }[]}
 */
export function readCss(code) {
  const text = blankComments(code);
  const out = [];
  for (const m of text.matchAll(/(^|[;{}])\s*(--[\w-]+|[a-zA-Z-]+)\s*:\s*([^;{}]+)/g)) {
    const [, , property, raw] = m;
    const at = m.index + m[0].indexOf(property);
    out.push({
      property,
      value: raw.replace(/\s+/g, " ").trim(),
      line: text.slice(0, at).split("\n").length,
      custom: property.startsWith("--"),
    });
  }
  return out;
}

/** Every `var(--name)` in the file, with its line. */
export function cssVarUses(code) {
  const text = blankComments(code);
  const out = [];
  for (const m of text.matchAll(/var\((--[a-z0-9-]+)/g)) {
    out.push({ name: m[1], line: text.slice(0, m.index).split("\n").length });
  }
  return out;
}
