/**
 * The widget templates, by id. A widget spec names one of these; nothing else draws a tile.
 * To add a template: write templates/widgets/<id>.mjs with the same exports and list it here.
 */
import * as barChart from "./bar-chart.mjs";
import * as checklist from "./checklist.mjs";
import * as donut from "./donut.mjs";
import * as kpiStrip from "./kpi-strip.mjs";
import * as lineChart from "./line-chart.mjs";
import * as table from "./table.mjs";
import * as taskList from "./task-list.mjs";

export const TEMPLATES = Object.fromEntries(
  [kpiStrip, taskList, lineChart, barChart, donut, table, checklist].map((t) => [t.id, t]),
);

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

/** One template by id, or null. */
export function template(id) {
  return TEMPLATES[id] ?? null;
}

/**
 * A checked widget spec as kit nodes: one Section with a thin line, the template's body for the state, and the
 * footer Link under a ready body.
 */
export function expand(spec, { state = "ready" } = {}) {
  const t = template(spec.template);
  if (!t) throw new Error(`There is no widget template "${spec.template}".`);
  return t.expand(spec, { state });
}
