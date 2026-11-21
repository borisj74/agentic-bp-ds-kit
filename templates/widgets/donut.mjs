/**
 * donut: how a whole splits into a few parts, as a kit PieChart ring with the total in the hole. Like
 * payments by method.
 */
import { z } from "zod";
import { ChartIntent, Format, bodyHeight, capacityIssues, node, frame } from "./_shared.mjs";

export const id = "donut";
export const summary = "How a whole splits into a few parts: a PieChart ring with the total in the hole and a legend.";
export const sizes = ["4x2", "6x2", "6x3"];
export const opens = false;
export const emptyIcon = "pie_chart";

/** PieChart sizes, by the room the body has. */
export const RING = { sm: 160, md: 200, lg: 240 };
/** One legend row. */
export const LEGEND_ROW = 24;

export const params = z
  .object({
    format: Format.default("number"),
    legend: z.enum(["end", "bottom"]).default("end"),
    total: z.enum(["show", "hide"]).default("show"),
  })
  .strict();

export const data = z
  .object({
    totalLabel: z.string().min(1).max(16).optional(),
    slices: z
      .array(z.object({ label: z.string().min(1).max(24), value: z.number().positive(), intent: ChartIntent.optional() }).strict())
      .min(2),
  })
  .strict();

/** The biggest ring that leaves room for a legend under it, when the legend sits under it. */
export function ringSize(spec) {
  const room = bodyHeight(spec) - (spec.params.legend === "bottom" ? 3 * LEGEND_ROW + 16 : 0);
  return room >= RING.lg ? "lg" : room >= RING.md ? "md" : "sm";
}

export function capacity(size, p = {}, spec = { size, actions: [], params: p }) {
  const sized = { ...spec, size, params: { legend: "end", ...p } };
  // Beside the ring the legend runs down its height; under it, a few rows are all the tile has room for.
  const legend = sized.params.legend;
  const max =
    legend === "bottom"
      ? Math.max(2, Math.floor((bodyHeight(sized) - RING[ringSize(sized)] - 16) / LEGEND_ROW))
      : Math.min(6, Math.floor(RING[ringSize(sized)] / LEGEND_ROW));
  return { slices: { min: 2, max: Math.min(6, max), what: "slices", path: "data.slices" } };
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), { slices: spec.data.slices.length });
}

export function body(spec) {
  const p = spec.params;
  const props = {
    label: spec.copy.title,
    showHeader: false,
    donut: true,
    data: spec.data.slices,
    format: p.format,
    size: ringSize(spec),
  };
  if (p.total === "hide") props.showTotal = false;
  if (spec.data.totalLabel) props.totalLabel = spec.data.totalLabel;
  if (p.legend === "bottom") props.legendPosition = "bottom";
  return [node("PieChart", props)];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
