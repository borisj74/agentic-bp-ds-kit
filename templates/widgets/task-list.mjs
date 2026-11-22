/**
 * task-list: the steps of a piece of work, one kit ListView row each, with a status Badge and a chevron that
 * opens the step. Like the prototype's Tasks tile: close invoices, generate PDFs, approve, send, collect.
 */
import { z } from "zod";
import { StatusIntent, act, bodyHeight, capacityIssues, node, frame } from "./_shared.mjs";

export const id = "task-list";
export const summary = "The steps of a piece of work, one ListView row each, with a status Badge; rows open with a chevron.";
export const sizes = ["4x2", "6x2", "6x3"];
export const opens = true;
export const emptyIcon = "task_alt";

/** A ListView row, as drawn: 72px, with a second line or without one. */
export const ROW = { two: 72, one: 72 };

export const params = z
  .object({
    lines: z.enum(["one", "two"]).default("two"),
    status: z.enum(["badge", "none"]).default("badge"),
  })
  .strict();

export const data = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1).max(48),
            detail: z.string().max(80).optional(),
            status: z.object({ label: z.string().min(1).max(16), intent: StatusIntent }).strict().optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export function capacity(size, p = {}, spec = { size, actions: [] }) {
  const row = ROW[p.lines ?? "two"];
  return { items: { min: 1, max: Math.max(1, Math.floor(bodyHeight({ ...spec, size }) / row)), what: "rows" } };
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), { items: spec.data.items.length });
}

export function body(spec) {
  const open = (spec.actions ?? []).find((a) => a.type === "open");
  const items = spec.data.items.map((item) => {
    const row = { id: item.id, primary: item.title };
    if (item.detail && spec.params.lines === "two") row.secondary = item.detail;
    if (item.status && spec.params.status === "badge") {
      row.badge = item.status.label;
      row.badgeIntent = item.status.intent;
    }
    return row;
  });
  const props = { label: spec.copy.title, items };
  if (open) {
    props.interaction = "drill";
    props.onOpen = act(open.id);
  }
  return [node("ListView", props)];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
