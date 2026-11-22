/**
 * kpi-strip: a tile of the few numbers that matter, one kit Scoreboard card each.
 * Like the prototype's Invoice Period strip: open invoices, total volume, invoices this month.
 */
import { z } from "zod";
import { capacityIssues, node, sizeOf, frame } from "./_shared.mjs";

export const id = "kpi-strip";
export const summary = "The few numbers that matter, one Scoreboard card each, with an optional trend and spark line.";
export const sizes = ["6x1", "12x1"];
export const opens = false;
/** One row has room for the cards and nothing under them: a link goes in the header as a minimal button. */
export const footer = false;
export const emptyIcon = "monitoring";

/** The narrowest a Scoreboard card reads (--layout-metrics-min). */
export const CARD_MIN = 192;
/** A card with a spark line beside its trend needs this much, or the trend wraps under the metric. */
export const CARD_MIN_SPARK = 256;

/** True when some card will draw both a trend and a spark line. */
const sparkWithTrend = (spec) =>
  spec?.params?.trend !== "hide" && spec?.params?.spark !== "hide" && (spec?.data?.items ?? []).some((item) => item.trend && item.chart);

const trend = z
  .object({
    value: z.string().min(1).max(12),
    unit: z.string().max(16).optional(),
    status: z.enum(["success", "danger", "neutral"]).optional(),
    direction: z.enum(["up", "down", "none"]).optional(),
  })
  .strict();

export const params = z
  .object({
    trend: z.enum(["show", "hide"]).default("show"),
    spark: z.enum(["show", "hide"]).default("show"),
  })
  .strict();

export const data = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1).max(32),
            metric: z.string().min(1).max(12),
            metadata: z.string().max(32).optional(),
            trend: trend.optional(),
            chart: z
              .object({ points: z.array(z.number()).min(3).max(12), status: z.enum(["success", "danger", "neutral"]).optional() })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export function capacity(size, p = {}, spec = null) {
  const { width } = sizeOf(size);
  const spark = sparkWithTrend(spec ? { ...spec, params: { ...p, ...spec.params } } : null);
  const card = spark ? CARD_MIN_SPARK : CARD_MIN;
  return { items: { min: 3, max: Math.min(6, Math.floor(width / card)), what: spark ? "cards with a trend and a spark line" : "cards" } };
}

export function issues(spec) {
  const out = capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), { items: spec.data.items.length });
  if (sparkWithTrend(spec)) for (const issue of out) if (issue.over) issue.fix += ' Or set params.spark to "hide": plain cards need less room.';
  return out;
}

/**
 * What the loop may change when the cards do not fit and no size is bigger: drop the spark lines, which keeps
 * every number and its trend. Returns the params to use, or null when there is nothing left to drop.
 */
export function relieve(raw) {
  if (raw.params?.spark === "hide") return null;
  return { params: { ...(raw.params ?? {}), spark: "hide" }, what: 'params.spark is now "hide": the cards did not fit with their spark lines.' };
}

export function body(spec) {
  const { trend: showTrend, spark } = spec.params;
  const items = spec.data.items.map((item) => {
    const out = { ...item };
    if (showTrend === "hide") delete out.trend;
    if (spark === "hide") delete out.chart;
    return out;
  });
  return [node("Scoreboard", { label: spec.copy.title, items })];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon }, state);
}
