/**
 * Reading a contract's `itemShape`, so a row in a list of records is checked like any other value.
 *
 * Contracts write an itemShape in one of two ways:
 *
 *   an object of notes   { "id": "string", "intent": "neutral | brand? Tints the circle." }
 *   a TypeScript-ish line "{ id: string; trend?: { status?: \"success\" | \"danger\" } }"
 *
 * Both say the same things: which fields a row has, which are required, and which hold a closed set.
 * parseItemShape reads either into one shape, and checkItem walks a row against it.
 *
 * A shape written with an index signature — `{ id?: string; [key: string]: ReactNode }`, which a Table
 * row is — is open: it names the fields it knows and lets a row carry any other, so a column key is
 * never reported as an unknown field.
 */

/** A field's closed set, when its type is a union of literals. `string` and `number` are not sets. */
function literals(type) {
  const parts = String(type)
    .split("|")
    .map((part) => part.trim().replace(/^["']|["']$/g, ""));
  if (parts.length < 2) return null;
  if (!parts.every((part) => /^[A-Za-z][A-Za-z0-9 _-]*$/.test(part))) return null;
  if (parts.some((part) => ["string", "number", "boolean", "ReactNode"].includes(part))) return null;
  return parts;
}

/** Split on a separator that sits outside braces, brackets and quotes. */
function splitTop(text, separator) {
  const out = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "{" || char === "[") depth += 1;
    if (char === "}" || char === "]") depth -= 1;
    if (char === separator && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out.map((part) => part.trim()).filter(Boolean);
}

/** One field: what it is called, whether it has to be there, and what it may hold. */
function field(name, type) {
  const optional = name.endsWith("?") || /\?\s*$/.test(type) || /\?\s/.test(type);
  const plain = String(type)
    .replace(/\?(\s|$)/, "$1")
    .trim();
  const head = plain.split(/\.\s|\n/)[0].trim();
  const isList = head.endsWith("[]");
  const inner = isList ? head.slice(0, -2).trim() : head;
  // A nested shape is read only when it is written in full. Prose like "{ label, href? }" names the
  // fields without their types, so it is left alone rather than half-read.
  const nested = inner.startsWith("{") && inner.endsWith("}") ? parseItemShape(inner) : null;
  return {
    name: name.replace(/\?$/, "").trim(),
    optional,
    list: isList,
    type: inner,
    values: nested ? null : literals(inner),
    shape: nested,
  };
}

/**
 * A contract's itemShape as one shape, or null when there is nothing to read.
 * @returns {{ fields: Record<string, { optional: boolean, list: boolean, type: string, values: string[] | null, shape: object | null }>, open: boolean } | null}
 */
export function parseItemShape(itemShape) {
  if (!itemShape) return null;

  if (typeof itemShape === "object" && !Array.isArray(itemShape)) {
    const fields = {};
    for (const [name, note] of Object.entries(itemShape)) {
      // "neutral | brand? Tints the circle." — the type is everything before the first sentence.
      const head = String(note).split(/\?\s|\.\s/)[0].trim();
      const optional = /\?/.test(String(note).split(/\.\s/)[0]);
      const parsed = field(name, head);
      fields[parsed.name] = { ...parsed, optional };
    }
    return Object.keys(fields).length > 0 ? { fields, open: false } : null;
  }

  const text = String(itemShape).trim();
  if (!text.startsWith("{")) return null;
  const body = text.replace(/^\{/, "").replace(/\}$/, "");
  const fields = {};
  const entries = splitTop(body, ";");
  let open = false;
  for (const entry of entries) {
    if (entry.trim().startsWith("[")) {
      open = true;
      continue;
    }
    const at = entry.indexOf(":");
    // A field written without its type ("{ label, href? }") means the shape is prose, not a type.
    if (at < 0) return null;
    const parsed = field(entry.slice(0, at).trim(), entry.slice(at + 1).trim());
    if (!parsed.name || !parsed.type) return null;
    fields[parsed.name] = parsed;
  }
  return Object.keys(fields).length > 0 ? { fields, open } : null;
}

/**
 * Walk one row against a shape. `say(path, message, fix)` is called for every problem.
 * Only what the shape states is checked: a field it does not describe is left alone.
 */
export function checkItem(item, shape, path, say) {
  if (!shape || !item || typeof item !== "object" || Array.isArray(item)) return;

  for (const [name, given] of Object.entries(item)) {
    const spec = shape.fields[name];
    if (!spec) {
      // An open shape (a Table row) carries a value per column, so any other field belongs to the row.
      if (shape.open) continue;
      say(`${path}.${name}`, `No field called "${name}" in this list.`, `Its fields: ${Object.keys(shape.fields).join(", ")}.`);
      continue;
    }
    if (given === null || given === undefined) continue;
    if (spec.values && typeof given === "string" && !spec.values.includes(given)) {
      say(`${path}.${name}`, `${name} cannot be "${given}".`, `The contract allows: ${spec.values.join(", ")}.`);
      continue;
    }
    if (spec.shape) {
      if (spec.list && Array.isArray(given)) given.forEach((row, i) => checkItem(row, spec.shape, `${path}.${name}[${i}]`, say));
      else checkItem(given, spec.shape, `${path}.${name}`, say);
      continue;
    }
    if (spec.list) {
      if (!Array.isArray(given)) say(`${path}.${name}`, `${name} is a list.`);
      continue;
    }
    if (spec.type === "string" && typeof given !== "string") say(`${path}.${name}`, `${name} is a string.`);
    else if (spec.type === "number" && typeof given !== "number") say(`${path}.${name}`, `${name} is a number.`);
    else if (spec.type === "boolean" && typeof given !== "boolean") say(`${path}.${name}`, `${name} is true or false.`);
  }

  for (const [name, spec] of Object.entries(shape.fields)) {
    if (spec.optional) continue;
    if (item[name] === undefined) say(`${path}.${name}`, `Every row needs ${name}.`, `Its fields: ${Object.keys(shape.fields).join(", ")}.`);
  }
}
