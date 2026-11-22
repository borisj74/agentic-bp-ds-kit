/**
 * line-chart: how values move over time, one kit LineChart line per series. Like the prototype's Invoices
 * Approved by Time: this month against the monthly average, by day.
 */
import { z } from "zod";
import { ChartIntent, Format, bodyHeight, capacityIssues, node, sizeOf, frame } from "./_shared.mjs";

export const id = "line-chart";
export const summary = "How values move over time, one LineChart line per series, sized to the tile.";
export const sizes = ["4x2", "6x2", "12x2", "6x3", "12x3"];
export const opens = false;
export const emptyIcon = "show_chart";

/** The least room a category takes along the bottom before its label has no space. */
export const CATEGORY_MIN = 40;
/** The legend row under the plot. */
export const LEGEND = 32;

export const params = z
  .object({
    area: z.boolean().default(false),
    points: z.boolean().default(false),
    format: Format.default("number"),
    legend: z.enum(["bottom", "top", "none"]).default("bottom"),
  })
  .strict();

export const data = z
  .object({
    categories: z.array(z.string().min(1).max(16)).min(2),
    series: z
      .array(z.object({ name: z.string().min(1).max(32), values: z.array(z.number()), intent: ChartIntent.optional() }).strict())
      .min(1),
  })
  .strict()
  .superRefine((d, ctx) => {
    d.series.forEach((s, i) => {
      if (s.values.length !== d.categories.length)
        ctx.addIssue({ code: "custom", path: ["series", i, "values"], message: `${s.values.length} values for ${d.categories.length} categories: give one value per category.` });
    });
  });

export function capacity(size) {
  const { width } = sizeOf(size);
  return {
    categories: { min: 2, max: Math.floor(width / CATEGORY_MIN), what: "categories", path: "data.categories" },
    series: { min: 1, max: 4, what: "series", path: "data.series" },
  };
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size), {
    categories: spec.data.categories.length,
    series: spec.data.series.length,
  });
}

/** The plot's own height: the body less its legend, on the 4px grid. */
export function plotHeight(spec) {
  const legend = spec.params.legend === "none" ? 0 : LEGEND;
  return Math.floor((bodyHeight(spec) - legend) / 4) * 4;
}

export function body(spec) {
  const p = spec.params;
  const props = {
    label: spec.copy.title,
    showHeader: false,
    categories: spec.data.categories,
    series: spec.data.series,
    format: p.format,
    height: plotHeight(spec),
  };
  if (p.area) props.area = true;
  if (p.points) props.showPoints = true;
  if (p.legend === "none") props.showLegend = false;
  else if (p.legend === "top") props.legendPosition = "top";
  return [node("LineChart", props)];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
