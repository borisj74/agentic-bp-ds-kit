/**
 * status-breakdown: how many records sit in each status, as one kit UsageBar split by status and a kit Legend
 * under it that writes each status, its count and its share. Like Usage collectors uploads by status.
 *
 * Every part of the bar is a used part in its status's colour, so the bar has no empty track: it is the whole
 * count, split. A status with a count of 0 keeps its legend key (0 · 0%) but draws no part, since a part of
 * nothing would still take a sliver of the bar. The total can sit in the header as a neutral kit Count.
 */
import { z } from "zod";
import { SLUG, StatusIntent, bodyHeight, capacityIssues, node, sizeOf, frame, BLOCK_GAP } from "./_shared.mjs";

export const id = "status-breakdown";
export const summary = "How many records sit in each status: one UsageBar split by status, and a Legend with each count and share.";
export const sizes = ["4x1", "6x1", "6x2", "12x1"];
export const opens = false;
export const emptyIcon = "stacked_bar_chart";

/**
 * The status tones on the chart colours the UsageBar and Legend paint with. UsageBar and Legend take only
 * chart intents, so each tone takes the chart colour nearest its status colour: no new colour is drawn.
 */
export const TONE_INTENT = { success: "green", warning: "yellow", danger: "red", info: "cyan", neutral: "gray" };

/** The UsageBar as drawn with no figures and no captions: its 28px track (--control-small) and nothing else. */
export const BAR = 28;
/** One legend row: 12px caption text at 1.5 line height. */
export const LEGEND_ROW = 18;
/** The gap between wrapped legend rows (--space-xsmall). */
export const LEGEND_ROW_GAP = 8;
/** The room one key takes across: a 10px swatch, 8px to its name, a name and a count with its share. */
export const KEY_WIDTH = 168;
/** The gap between keys on one row (--space-large). */
export const KEY_GAP = 24;
/** A breakdown is 2 to 6 statuses: past 6 the parts get too thin to tell apart. */
export const MIN = 2;
export const MAX = 6;

export const params = z
  .object({
    showPercent: z.boolean().default(true),
    total: z.enum(["show", "hide"]).default("show"),
  })
  .strict();

export const data = z
  .object({
    /** What the total counts, read after it by screen readers, like uploads. */
    totalLabel: z.string().min(1).max(24).optional(),
    items: z
      .array(
        z
          .object({
            status: z.string().regex(SLUG, "Use a slug: lowercase words joined by single dashes."),
            label: z.string().trim().min(1).max(40, "Keep it to 40 characters."),
            count: z.number().int("Counts are whole numbers.").min(0, "A count cannot be below 0."),
            tone: StatusIntent,
          })
          .strict(),
      )
      .min(MIN, `A breakdown has ${MIN} statuses at least.`),
  })
  .strict()
  .superRefine((d, ctx) => {
    const seen = new Set();
    d.items.forEach((item, i) => {
      if (seen.has(item.status)) ctx.addIssue({ code: "custom", path: ["items", i, "status"], message: `Two statuses are called "${item.status}": give each its own.` });
      seen.add(item.status);
    });
    if (d.items.every((item) => item.count === 0))
      ctx.addIssue({ code: "custom", path: ["items"], message: "Every count is 0: there is nothing to split. Show the empty state instead." });
  });

/** How many legend rows fit under the bar in a ready body. */
export function legendRows(spec) {
  const room = bodyHeight(spec) - BAR - BLOCK_GAP;
  return Math.max(0, Math.floor((room + LEGEND_ROW_GAP) / (LEGEND_ROW + LEGEND_ROW_GAP)));
}

/** How many keys sit on one legend row at a size. */
export function keysPerRow(size) {
  return Math.max(1, Math.floor((sizeOf(size).width + KEY_GAP) / (KEY_WIDTH + KEY_GAP)));
}

export function capacity(size, p = {}, spec = { size, actions: [], params: p }) {
  const sized = { ...spec, size };
  const max = Math.min(MAX, keysPerRow(size) * legendRows(sized));
  return { items: { min: MIN, max: Math.max(MIN, max), what: "statuses", path: "data.items" } };
}

export function issues(spec) {
  return capacityIssues(spec, { id, sizes, capacity }, capacity(spec.size, spec.params, spec), { items: spec.data.items.length });
}

const num = (n) => n.toLocaleString("en-US");

/** A share as people write it: whole percents, and <1% for a part that is there but rounds to nothing. */
export function percent(count, total) {
  if (total <= 0 || count <= 0) return "0%";
  const share = (count / total) * 100;
  return share < 1 ? "<1%" : `${Math.round(share)}%`;
}

export const totalOf = (spec) => spec.data.items.reduce((sum, item) => sum + item.count, 0);

/** The total in the header, as a neutral kit Count. Ready only: it waits with the rest of the tile. */
export function headerEnd(spec) {
  if (spec.params.total === "hide") return [];
  const total = totalOf(spec);
  return [node("Count", { intent: "neutral", count: total, max: Math.max(99, total), label: spec.data.totalLabel ?? "in total" })];
}

export function body(spec) {
  const total = totalOf(spec);
  const segments = spec.data.items
    .filter((item) => item.count > 0)
    .map((item) => ({ id: item.status, value: item.count, intent: TONE_INTENT[item.tone] }));
  const keys = spec.data.items.map((item) => ({
    id: item.status,
    label: item.label,
    intent: TONE_INTENT[item.tone],
    value: spec.params.showPercent ? `${num(item.count)} · ${percent(item.count, total)}` : num(item.count),
  }));
  return [
    node("UsageBar", { label: spec.copy.title, segments, showLegend: false }),
    node("Legend", { items: keys, alignment: "start", size: "sm", label: `${spec.copy.title} by status` }),
  ];
}

/** The tile for one state: a Section with a thin line, this body, and the footer Link under a ready body. */
export function expand(spec, { state = "ready" } = {}) {
  return frame(spec, { id, body, emptyIcon, headerEnd }, state);
}
