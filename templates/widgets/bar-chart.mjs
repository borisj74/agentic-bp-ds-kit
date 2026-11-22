/**
 * bar-chart: values side by side, one kit BarChart bar or stack per category. Like the prototype's Approved
 * by Account (stacked, across) and Records by Collector.
 */
import { z } from "zod";
import { ChartIntent, Format, bodyHeight, capacityIssues, node, sizeOf, frame } from "./_shared.mjs";

export const id = "bar-chart";
export const summary = "Values side by side, one BarChart bar or stack per category, upright or across.";
export const sizes = ["4x2", "6x2", "12x2", "6x3", "12x3"];
export const opens = false;
export const emptyIcon = "bar_chart";

/** The least room a category takes: along the bottom when upright, down the side when across. */
export const CATEGORY_MIN = { vertical: 48, horizontal: 32 };
export const LEGEND = 32;

export const params = z
  .object({
    orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
    stacked: z.boolean().default(false),
    format: Format.default("number"),
    legend: z.enum(["bottom", "top", "none"]).default("bottom"),
  })
  .strict();

export const data = z
  .object({
    categories: z.array(z.string().min(1).max(28)).min(1),
    series: z
      .array(z.object({ name: z.string().min(1).max(32), values: z.array(z.number().min(0)), intent: ChartIntent.optional() }).strict())
      .min(1),
  })
  .strict()
  .superRefine((d, ctx) => {
    d.series.forEach((s, i) => {
      if (s.values.length !== d.categories.length)
        ctx.addIssue({ code: "custom", path: ["series", i, "values"], message: `${s.values.length} values for ${d.categories.length} categories: give one value per category.` });
    });
  });

export function plotHeight(spec) {
  const legend = spec.params.legend === "none" ? 0 : LEGEND;
  return Math.floor((bodyHeight(spec) - legend) / 4) * 4;
}

export function capacity(size, p = {}, spec = { size, actions: [], params: p }) {
  const orientation = p.orientation ?? "vertical";
  const sized = { ...spec, size, params: { legend: "bottom", ...p } };
  // Across, every category is a row of the plot, less the value axis along the bottom.
  const max =
    orientation === "horizontal"
      ? Math.floor((plotHeight(sized) - 24) / CATEGORY_MIN.horizontal)
      : Math.floor(sizeOf(size).width / CATEGORY_MIN.vertical);
  return {
    categories: { min: 1, max, what: "categories", path: "data.categories" },
    series: { min: 1, max: p.stacked ? 5 : 3, what: "series", path: "data.series" },
  };
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), {
    categories: spec.data.categories.length,
    series: spec.data.series.length,
  });
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
  if (p.orientation === "horizontal") props.orientation = "horizontal";
  if (p.stacked) props.stacked = true;
  if (p.legend === "none") props.showLegend = false;
  else if (p.legend === "top") props.legendPosition = "top";
  return [node("BarChart", props)];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
