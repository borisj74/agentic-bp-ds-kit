/**
 * table: a few rows that explain a number, as a kit Table. Each column is plain text, a status (a kit Cell
 * with a coloured dot) or a link (a kit Cell that opens the row). Like the prototype's Invoices by Error Type.
 */
import { z } from "zod";
import { StatusIntent, act, bodyHeight, capacityIssues, cell, node, sizeOf, frame } from "./_shared.mjs";

export const id = "table";
export const summary = "A few rows that explain a number: a Table whose cells are plain, status or link.";
export const sizes = ["6x2", "12x2", "6x3", "12x3"];
export const opens = true;
export const requiresOpen = true;
export const emptyIcon = "table_rows";

/** Row heights by Table size, and the header row. */
export const ROW = { sm: 36, md: 40 };
export const HEAD = 40;
/** The narrowest a column reads. */
export const COLUMN_MIN = 96;

export const params = z
  .object({
    density: z.enum(["sm", "md"]).default("sm"),
    line: z.enum(["thin", "medium"]).default("thin"),
  })
  .strict();

const statusValue = z.object({ label: z.string().min(1).max(24), intent: StatusIntent }).strict();

export const data = z
  .object({
    columns: z
      .array(
        z
          .object({
            key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "A key like amount or lastRun."),
            header: z.string().min(1).max(24),
            type: z.enum(["plain", "status", "link"]).default("plain"),
            numeric: z.boolean().optional(),
            emphasis: z.boolean().optional(),
          })
          .strict(),
      )
      .min(2),
    rows: z.array(z.record(z.union([z.string().max(64), statusValue]))),
    footer: z.object({ label: z.string().min(1).max(24), value: z.string().min(1).max(24) }).strict().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const ids = new Set();
    d.rows.forEach((row, i) => {
      if (typeof row.id !== "string" || !row.id) ctx.addIssue({ code: "custom", path: ["rows", i, "id"], message: "Every row needs an id." });
      else if (ids.has(row.id)) ctx.addIssue({ code: "custom", path: ["rows", i, "id"], message: `Two rows are called "${row.id}".` });
      ids.add(row.id);
      for (const column of d.columns) {
        const value = row[column.key];
        if (value === undefined) {
          ctx.addIssue({ code: "custom", path: ["rows", i, column.key], message: `No value for ${column.key}.` });
          continue;
        }
        if (column.type === "status" && typeof value === "string")
          ctx.addIssue({ code: "custom", path: ["rows", i, column.key], message: `${column.key} is a status column: give { label, intent }.` });
        if (column.type !== "status" && typeof value !== "string")
          ctx.addIssue({ code: "custom", path: ["rows", i, column.key], message: `${column.key} is a ${column.type} column: give the words.` });
      }
      for (const key of Object.keys(row))
        if (key !== "id" && !d.columns.some((c) => c.key === key))
          ctx.addIssue({ code: "custom", path: ["rows", i, key], message: `No column is called ${key}.` });
    });
    if (d.columns.filter((c) => c.type === "link").length > 1)
      ctx.addIssue({ code: "custom", path: ["columns"], message: "One link column per table: it is the row's way in." });
  });

export function capacity(size, p = {}, spec = { size, actions: [], data: {} }) {
  const row = ROW[p.density ?? "sm"];
  const footer = spec.data?.footer ? row : 0;
  return {
    rows: { min: 1, max: Math.max(1, Math.floor((bodyHeight({ ...spec, size }) - HEAD - footer) / row)), what: "rows", path: "data.rows" },
    columns: { min: 2, max: Math.floor(sizeOf(size).width / COLUMN_MIN), what: "columns", path: "data.columns" },
  };
}

export function openWhen(spec) {
  return spec.data.columns.some((c) => c.type === "link");
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), {
    rows: spec.data.rows.length,
    columns: spec.data.columns.length,
  });
}

export function body(spec) {
  const size = spec.params.density;
  const open = (spec.actions ?? []).find((a) => a.type === "open");
  const columns = spec.data.columns.map((c) => {
    const out = { key: c.key, header: c.header };
    if (c.numeric) out.numeric = true;
    if (c.emphasis) out.emphasis = true;
    return out;
  });
  const rows = spec.data.rows.map((row) => {
    const out = { id: row.id };
    for (const c of spec.data.columns) {
      const value = row[c.key];
      if (c.type === "status") out[c.key] = cell({ type: "status", size, label: value.label, intent: value.intent });
      else if (c.type === "link") out[c.key] = cell({ type: "link", size, label: value, onClick: act(open?.id ?? "open") });
      else out[c.key] = value;
    }
    return out;
  });
  const props = { columns, rows, size, line: spec.params.line, rowLabel: spec.data.columns[0].key };
  if (spec.data.footer) props.footer = spec.data.footer;
  return [node("Table", props)];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
