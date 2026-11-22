/**
 * What every widget template shares: the spec parts that do not depend on the template (copy, actions,
 * states), the frame every tile is drawn in, and the bodies the loading, empty and error states put in it.
 *
 * A template only says what its ready body is, which sizes it allows and how much fits each of them. The
 * frame is always the same: one kit Section with a thin line, its body, and an optional footer Link. Nothing
 * here lays anything out by hand: every node is a kit component by its contract name.
 *
 * Nodes are the screen spec's own shape ({ component, props, slots, text }) with two additions the widget
 * renderer understands:
 *   { $action: "id" }  as a prop value  — a handler that reports the action to the tile's onAction
 *   { $node: node }    inside a value   — a kit component where the contract takes a ReactNode, like a Table cell
 */
import { z } from "zod";
import { BUTTON_PAIRS } from "../../scripts/review/rules.mjs";
import { loadSizes } from "../../scripts/widget/sizes.mjs";

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The states a tile answers. ready is always drawn; the others are drawn when the spec lists them. */
export const WIDGET_STATES = ["ready", "loading", "empty", "error"];

/** The action id the error state's retry reports. A spec cannot take it for an action of its own. */
export const RETRY = "retry";

/** The px a Section header takes: its 28px title row, the 8px under it and its 1px line, then the 16px gap to the body. */
export const HEADER = 28 + 8 + 1 + 16;
/** The footer Link: one 20px line and the 16px gap above it. */
export const FOOTER = 20 + 16;
/** The gap between blocks in a Section body (--layout-gutter-md). */
export const BLOCK_GAP = 16;

export const ChartIntent = z.enum(["green", "olive", "cyan", "orange", "pink", "gray", "purple", "yellow", "red", "mint"]);
export const Format = z.enum(["number", "currency", "percent"]);
export const StatusIntent = z.enum(["neutral", "info", "success", "warning", "danger"]);

const text = (max) => z.string().trim().min(1, "Write the words.").max(max, `Keep it to ${max} characters.`);

export const copySchema = z
  .object({
    title: text(60),
    help: text(200).optional(),
    emptyTitle: text(60).optional(),
    emptyDescription: text(200).optional(),
    error: text(200).optional(),
    retry: text(24).optional(),
  })
  .strict();

const actionId = z.string().regex(SLUG, "Use a slug: lowercase words joined by single dashes.");

export const actionSchema = z.discriminatedUnion("type", [
  z.object({ id: actionId, type: z.literal("footer"), label: text(48) }).strict(),
  z
    .object({
      id: actionId,
      type: z.literal("button"),
      label: text(32),
      emphasis: z.enum(["strong", "subtle", "minimal"]).default("minimal"),
      intent: z.enum(["brand", "neutral", "danger"]).optional(),
      icon: z.string().regex(/^[a-z0-9_]+$/, "A Material Symbols name, like download.").optional(),
    })
    .strict(),
  z.object({ id: actionId, type: z.literal("open") }).strict(),
]);

/** The size table, read once. */
let sizeTable = null;
export function sizeOf(id) {
  sizeTable ??= loadSizes();
  const size = sizeTable.sizes[id];
  if (!size) throw new Error(`There is no widget size ${id}.`);
  return size;
}

/** The px a ready body has once the header and the footer are taken out. */
export function bodyHeight(spec) {
  const size = sizeOf(spec.size);
  const footer = (spec.actions ?? []).some((a) => a.type === "footer") ? FOOTER : 0;
  return size.height - HEADER - footer;
}

/**
 * The checks every template shares, on top of its own params and data: the action list, the copy each
 * declared state needs, and the size.
 * @returns {{ path: string, message: string, fix?: string }[]}
 */
export function commonIssues(spec, template) {
  const out = [];
  const say = (path, message, fix) => out.push(fix ? { path, message, fix } : { path, message });
  const actions = spec.actions ?? [];
  const states = spec.states ?? WIDGET_STATES;

  if (!template.sizes.includes(spec.size))
    say("size", `${template.id} does not come in ${spec.size}.`, `Use one of: ${template.sizes.join(", ")}.`);

  const seen = new Set();
  actions.forEach((action, i) => {
    if (action.id === RETRY) say(`actions[${i}].id`, `"${RETRY}" is the error state's own action.`, "Pick another id.");
    if (seen.has(action.id)) say(`actions[${i}].id`, `Two actions are called "${action.id}".`, "Give each action its own id.");
    seen.add(action.id);
    if (action.type === "button") {
      const allowed = BUTTON_PAIRS[action.emphasis];
      const intent = action.intent ?? (action.emphasis === "subtle" ? "neutral" : action.emphasis === "minimal" ? "brand" : undefined);
      if (!intent) say(`actions[${i}].intent`, "A strong Button needs an intent.", 'Use "brand" for the one main action, or "danger".');
      else if (!allowed.includes(intent))
        say(`actions[${i}].intent`, `Button emphasis="${action.emphasis}" intent="${intent}" is not an allowed pair.`, `With ${action.emphasis} the intent can only be ${allowed.join(" or ")}.`);
    }
    if (action.type === "open" && !template.opens)
      say(`actions[${i}]`, `A ${template.id} has no rows to open.`, "Drop the open action, or use a template whose rows open (task-list, table).");
  });
  const count = (type) => actions.filter((a) => a.type === type).length;
  if (count("footer") > 1) say("actions", "A tile has one footer link.", "Keep the one that says where the whole tile leads.");
  if (count("footer") > 0 && template.footer === false)
    out.push({
      path: "actions",
      message: `A ${template.id} has no room under its body for a footer link.`,
      fix: 'Make it a header button: { "type": "button", "emphasis": "minimal" } with the same id and label.',
      code: "no-footer",
    });
  if (count("button") > 2) say("actions", "A tile header holds two buttons at most.", "Move the rest to the page, or behind the footer link.");
  if (count("open") > 1) say("actions", "One open action per tile.", "Rows open one way.");
  const strong = actions.filter((a) => a.type === "button" && a.emphasis === "strong");
  if (strong.length > 1)
    say("actions", `${strong.length} strong buttons in one tile.`, "A tile has one strong action at most (bp/one-strong-action); make the rest minimal.");
  if (template.opens && template.requiresOpen && count("open") === 0 && template.openWhen?.(spec))
    say("actions", `This ${template.id} has link cells but no open action for them.`, 'Add { "id": "open-row", "type": "open" }.');

  const copy = spec.copy ?? {};
  if (states.includes("empty") && !copy.emptyTitle)
    say("copy.emptyTitle", "The tile lists an empty state but has no words for it.", "Add copy.emptyTitle, like No invoices this period.");
  if (states.includes("error") && !copy.error)
    say("copy.error", "The tile lists an error state but has no words for it.", "Add copy.error: what failed, in one sentence.");
  return out;
}

/**
 * Compare what the data asks for with what the size holds. `limits` is { key: { max, min?, what } } and
 * `used` is { key: n }. Over capacity is an error, and its fix names the smallest allowed size that holds it.
 */
export function capacityIssues(spec, template, limits, used) {
  const out = [];
  for (const [key, limit] of Object.entries(limits)) {
    const n = used[key];
    if (n === undefined) continue;
    if (limit.min !== undefined && n < limit.min) {
      out.push({
        path: limit.path ?? `data.${key}`,
        message: `${n} ${limit.what} is fewer than a ${template.id} draws (${limit.min} at least).`,
        fix: `Add ${limit.min - n} more, or use another template.`,
      });
    }
    if (n > limit.max) {
      const bigger = template.sizes.find((id) => {
        const other = template.capacity(id, spec.params ?? {}, spec)[key];
        return other && n <= other.max && (other.min === undefined || n >= other.min);
      });
      out.push({
        path: limit.path ?? `data.${key}`,
        message: `${n} ${limit.what} do not fit a ${spec.size} ${template.id}: it holds ${limit.max}.`,
        fix: bigger ? `Use size ${bigger}, or keep the first ${limit.max}.` : `Keep the first ${limit.max}; no ${template.id} size holds ${n}.`,
        over: { key, n, max: limit.max, size: bigger ?? null },
      });
    }
  }
  return out;
}

// ---- nodes ---------------------------------------------------------------------------------------

export const node = (component, props = {}, slots, text) => {
  const out = { component, props };
  if (slots) out.slots = slots;
  if (text !== undefined) out.text = text;
  return out;
};
export const act = (id) => ({ $action: id });
export const cell = (props) => ({ $node: node("Cell", props) });

/** The buttons a tile header carries, in the order the spec lists them. */
function headerButtons(spec) {
  return (spec.actions ?? [])
    .filter((a) => a.type === "button")
    .map((a) => {
      const props = { size: "sm", emphasis: a.emphasis };
      if (a.intent) props.intent = a.intent;
      else if (a.emphasis === "minimal") props.intent = "brand";
      if (a.icon) props.iconStart = a.icon;
      props.onClick = act(a.id);
      return node("Button", props, undefined, a.label);
    });
}

function footerLink(spec) {
  const footer = (spec.actions ?? []).find((a) => a.type === "footer");
  return footer ? [node("Link", { onClick: act(footer.id) }, undefined, footer.label)] : [];
}

/** What stands in for a body that has not arrived: one block the size of the body. */
export function skeletonBody(spec, height = bodyHeight(spec)) {
  return [node("Skeleton", { shape: "rect", height: Math.max(24, Math.floor(height / 4) * 4), label: `Loading ${spec.copy.title}` })];
}

function emptyBody(spec, template) {
  const size = sizeOf(spec.size);
  const props = { title: spec.copy.emptyTitle, headingLevel: 3 };
  // A one-row tile has no room for the icon well: the title and its line say it.
  if (spec.copy.emptyDescription && size.rows > 1) props.description = spec.copy.emptyDescription;
  if (size.rows > 1) {
    props.icon = template.emptyIcon ?? "inbox";
    props.iconStyle = "well";
  }
  return [node("EmptyState", props)];
}

function errorBody(spec) {
  return [
    node(
      "Callout",
      { intent: "danger", actionLabel: spec.copy.retry ?? "Try again", onAction: act(RETRY) },
      undefined,
      spec.copy.error,
    ),
  ];
}

/**
 * The whole tile for one state: a Section with a thin line, the body, and the footer Link under a ready
 * body. The header's help and buttons only show once the tile has arrived.
 */
export function frame(spec, template, state = "ready") {
  const props = { title: spec.copy.title, line: "thin", heading: "sm" };
  if (spec.copy.help) props.help = spec.copy.help;
  const slots = {};
  if (state === "loading") {
    props.loading = true;
    slots.children = template.loading ? template.loading(spec) : skeletonBody(spec);
  } else if (state === "empty") {
    slots.children = emptyBody(spec, template);
  } else if (state === "error") {
    slots.children = errorBody(spec);
  } else {
    const buttons = headerButtons(spec);
    if (buttons.length > 0) slots.actions = buttons;
    slots.children = [...template.body(spec), ...footerLink(spec)];
  }
  return node("Section", props, slots);
}

/** Which actions a tile in a given state should report when a person uses them. */
export function firedActions(spec, state) {
  if (state === "error") return [{ id: RETRY, type: "retry", label: spec.copy.retry ?? "Try again" }];
  if (state !== "ready") return [];
  return (spec.actions ?? []).map((a) => ({ ...a }));
}
