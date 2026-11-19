/**
 * Writing a repaired spec back to its file as an edit, not as a rewrite.
 *
 * A repair changes one value. The file it changes is written by hand — inline arrays, inline props
 * objects, its own key order — and JSON.stringify knows none of that: re-serializing the whole spec
 * moves every line and buries the repair in a diff nobody can read. So the spec's own text is edited
 * in place: the value each repair touched is found in the original text and replaced, and every other
 * byte of the file stays as it was.
 *
 *   specFormat(text)             — the file's indent, line ending and last newline
 *   editSpecText(text, a, b)     — the text with b's changes applied, or null when it cannot be done
 */

/** How a spec file is written, for the rare case where the whole thing has to be written again. */
export function specFormat(text) {
  const eol = /\r\n/.test(text) ? "\r\n" : "\n";
  const indentOf = text.match(/^[ \t]+(?=["\]}])/m)?.[0];
  const indent = indentOf ? (indentOf.includes("\t") ? "\t" : indentOf.length) : 2;
  return { eol, indent, finalNewline: /\r?\n$/.test(text) || text === "" };
}

/** A spec as a whole file, in the shape `format` describes. */
export function specText(spec, { eol, indent, finalNewline }) {
  const body = JSON.stringify(spec, null, indent).split("\n").join(eol);
  return finalNewline ? `${body}${eol}` : body;
}

const pathKey = (path) => path.map((step) => (typeof step === "number" ? `[${step}]` : `.${step}`)).join("");

/**
 * Where every value in a JSON text starts and ends, by path: `.regions.content[0].props.style.padding`.
 * A hand-written file is still JSON, so this is a plain scan — no comments, no trailing commas.
 */
export function valueSpans(text) {
  const spans = new Map();
  let at = 0;
  const space = () => {
    while (at < text.length && /\s/.test(text[at])) at += 1;
  };
  const string = () => {
    const from = at;
    at += 1;
    while (at < text.length) {
      if (text[at] === "\\") at += 2;
      else if (text[at] === '"') {
        at += 1;
        break;
      } else at += 1;
    }
    return JSON.parse(text.slice(from, at));
  };
  const value = (path) => {
    space();
    const start = at;
    const char = text[at];
    if (char === "{") {
      at += 1;
      space();
      if (text[at] === "}") at += 1;
      else
        for (;;) {
          space();
          const key = string();
          space();
          at += 1; // :
          value([...path, key]);
          space();
          if (text[at] === ",") {
            at += 1;
            continue;
          }
          at += 1; // }
          break;
        }
    } else if (char === "[") {
      at += 1;
      space();
      if (text[at] === "]") at += 1;
      else {
        let index = 0;
        for (;;) {
          value([...path, index]);
          index += 1;
          space();
          if (text[at] === ",") {
            at += 1;
            continue;
          }
          at += 1; // ]
          break;
        }
      }
    } else if (char === '"') string();
    else while (at < text.length && !/[\s,\]}]/.test(text[at])) at += 1;
    spans.set(pathKey(path), { start, end: at });
  };
  value([]);
  return spans;
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * The smallest set of values that differ between two specs: a changed leaf where only a leaf changed,
 * and the node itself where its shape changed (a key gone, an item spliced out of an array).
 */
export function changedPaths(before, after, path = [], out = []) {
  if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
    for (const [i, item] of before.entries()) changedPaths(item, after[i], [...path, i], out);
    return out;
  }
  if (isObject(before) && isObject(after)) {
    const keys = Object.keys(before);
    const same = keys.length === Object.keys(after).length && keys.every((key) => key in after);
    if (same) {
      for (const key of keys) changedPaths(before[key], after[key], [...path, key], out);
      return out;
    }
    out.push({ path, key: pathKey(path), value: after });
    return out;
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) out.push({ path, key: pathKey(path), value: after });
  return out;
}

/** A value on one line, the way a hand-written spec writes a short array or a props object. */
function inlineJson(value) {
  if (Array.isArray(value)) return `[${value.map(inlineJson).join(", ")}]`;
  if (isObject(value)) {
    const body = Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}: ${inlineJson(item)}`)
      .join(", ");
    return body ? `{ ${body} }` : "{}";
  }
  return JSON.stringify(value);
}

/** A value over several lines, indented to sit where the value it replaces sat. */
function blockJson(value, indent, column, eol) {
  const step = typeof indent === "number" ? " ".repeat(indent) : indent;
  return JSON.stringify(value, null, step).split("\n").join(`${eol}${column}`);
}

/** The whitespace at the start of the line a span begins on. */
const columnOf = (text, start) => {
  const line = text.lastIndexOf("\n", start - 1) + 1;
  return text.slice(line, start).match(/^[ \t]*/)[0];
};

/**
 * The original text with the changes from `before` to `after` applied, and nothing else touched.
 *
 * A value that was written on one line comes back on one line; a value that spanned several lines comes
 * back over several, indented where it sat. Returns null when the edit cannot be trusted — a path the
 * text does not hold, or a result that no longer reads back as `after` — and the caller then writes the
 * whole file instead.
 *
 * @param {string} text The file as it is on disk.
 * @param {object} before What that text parses to.
 * @param {object} after The repaired spec.
 * @returns {string | null}
 */
export function editSpecText(text, before, after) {
  const changes = changedPaths(before, after);
  if (changes.length === 0) return text;
  // A change at the root is the whole file; there is nothing to keep.
  if (changes.some((change) => change.path.length === 0)) return null;

  let spans;
  try {
    spans = valueSpans(text);
  } catch {
    return null;
  }
  const { eol, indent } = specFormat(text);
  const edits = [];
  for (const change of changes) {
    const span = spans.get(change.key);
    if (!span) return null;
    const was = text.slice(span.start, span.end);
    const column = columnOf(text, span.start);
    const written = was.includes("\n") ? blockJson(change.value, indent, column, eol) : inlineJson(change.value);
    edits.push({ ...span, written });
  }

  let out = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.written + out.slice(edit.end);
  }
  try {
    if (JSON.stringify(JSON.parse(out)) !== JSON.stringify(after)) return null;
  } catch {
    return null;
  }
  return out;
}
