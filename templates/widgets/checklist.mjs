/**
 * checklist: what has to be done before something closes, ticked off. One kit Timeline entry per item: a
 * green tick when it is done, an open circle while it is not, an amber clock once it is late.
 */
import { z } from "zod";
import { bodyHeight, capacityIssues, node, frame } from "./_shared.mjs";

export const id = "checklist";
export const summary = "What has to be done before something closes, one Timeline entry per item: done, open or late.";
export const sizes = ["4x2", "6x2", "6x3"];
export const opens = false;
export const emptyIcon = "checklist";

/** A Timeline entry with a timestamp over the title and a subtitle under it, as drawn. */
export const ROW = { sm: 96, md: 112 };

export const params = z
  .object({
    order: z.enum(["as-listed", "open-first"]).default("as-listed"),
    size: z.enum(["sm", "md"]).default("sm"),
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
            done: z.boolean(),
            late: z.boolean().optional(),
            owner: z.string().max(32).optional(),
            due: z.string().max(24).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export function capacity(size, p = {}, spec = { size, actions: [] }) {
  const row = ROW[p.size ?? "sm"];
  return { items: { min: 1, max: Math.max(1, Math.floor(bodyHeight({ ...spec, size }) / row)), what: "items" } };
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), { items: spec.data.items.length });
}

export function body(spec) {
  const list = [...spec.data.items];
  if (spec.params.order === "open-first") list.sort((a, b) => Number(a.done) - Number(b.done));
  const items = list.map((item) => {
    const entry = {
      id: item.id,
      title: item.title,
      icon: item.done ? "check_circle" : item.late ? "schedule" : "radio_button_unchecked",
      intent: item.done ? "success" : item.late ? "warning" : "neutral",
    };
    if (item.due) entry.timestamp = item.due;
    if (item.owner) entry.subtitle = item.owner;
    return entry;
  });
  return [node("Timeline", { label: spec.copy.title, size: spec.params.size, items })];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
