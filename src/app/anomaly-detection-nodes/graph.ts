import { AGG_OPTIONS, ANOMALY_FILTER, COMPARE_OPTIONS, FIELD_PATHS, FIELD_VALUES, LOOKBACK_OPTIONS, OP_OPTIONS, SEED_CONFIGS } from "../anomaly-detection/data";

// The rule as a graph: blocks, what connects to what, which connections are allowed and what it all says in words.
// Sample data, local state only. Nothing is saved, and a reload starts over.

export type BlockKind = "invoices" | "condition" | "comparePer" | "values" | "model" | "action";
export interface WatchRow { id: string; field: string; agg: string }
interface At { id: string; x: number; y: number }
export type InvoicesBlock = At & { kind: "invoices"; dateField: string; lookback: string; record?: string };
export type ConditionBlock = At & { kind: "condition"; field: string | null; op: string; value: string };
export type ComparePerBlock = At & { kind: "comparePer"; per: string[] };
export type ValuesBlock = At & { kind: "values"; rows: WatchRow[] };
export type ModelBlock = At & { kind: "model"; branches: string[] };
export type ActionBlock = At & { kind: "action"; act: string };
export type Block = InvoicesBlock | ConditionBlock | ComparePerBlock | ValuesBlock | ModelBlock | ActionBlock;
export interface Link { id: string; from: string; port: string; to: string }
export interface Graph { name: string; nodes: Block[]; links: Link[]; record?: string }
export interface Port { id: string; label: string }

export const BLOCKS: { kind: BlockKind; label: string; icon: string }[] = [
  { kind: "invoices", label: "Invoices", icon: "receipt_long" },
  { kind: "condition", label: "Condition", icon: "call_split" },
  { kind: "comparePer", label: "Compare per", icon: "workspaces" },
  { kind: "values", label: "Values to watch", icon: "monitoring" },
  { kind: "model", label: "Model", icon: "model_training" },
  { kind: "action", label: "Action", icon: "bolt" },
];
export const blockLabel = (kind: BlockKind) => BLOCKS.find((b) => b.kind === kind)!.label;

export const ACTION_OPTIONS = [
  { value: "flag", label: "Show flag only" },
  { value: "hold", label: "Hold invoice" },
  { value: "notify", label: "Notify billing team" },
];
export const VALUE_OPTIONS = [
  { value: "rate", label: "Rate" },
  { value: "qty", label: "Quantity" },
  { value: "cost", label: "Cost" },
  { value: "standard", label: "Standard rate" },
  { value: "tax", label: "Tax amount" },
  { value: "total", label: "Grand total" },
];
// Reopened is left out on purpose: the locked conditions cover it, as they do in the wizard's field picker.
export const CONDITION_FIELDS = Object.keys(FIELD_VALUES).filter((f) => f !== "reopened").map((f) => ({ value: f, label: FIELD_PATHS[f] }));
export const NO_VALUE_OPS = ["empty", "notEmpty"];

// What a rule can check. Everything but invoices is a placeholder to react to: the review only covered invoices.
export interface RecordType {
  icon: string; label: string; one: string; many: string; filter: string; which: string; newOnes: string; when: string; odd: string;
  group: string; groupOne: string; compareHint: string; valueHint: string;
  compare: { value: string; label: string }[]; values: { value: string; label: string }[]; fields: { value: string; label: string }[]; anomalies: string[];
}
const OTHER_FIELDS = CONDITION_FIELDS.filter((f) => f.value === "currency" || f.value === "entity");
const ACCOUNT = { value: "account", label: "Account" };
const PRODUCT = { value: "product", label: "Product" };
export const RECORDS: Record<string, RecordType> = {
  invoice: {
    icon: "receipt_long", label: "Invoices", one: "invoice", many: "invoices", filter: "Closed, original", which: "Closed, original invoices only", newOnes: "new closed invoices",
    when: "Each invoice is checked when its status changes to Closed. Open invoices are not checked, because they can still change.",
    odd: "unusual charges", group: "Billing profiles", groupOne: "Billing profile",
    compareHint: "Billing profile suits most checks: each customer is compared with their own history.", valueHint: "rate, quantity or cost",
    compare: COMPARE_OPTIONS, values: VALUE_OPTIONS, fields: CONDITION_FIELDS, anomalies: ANOMALY_FILTER.map((a) => a.id),
  },
  charge: {
    icon: "request_page", label: "Invoice charges", one: "charge", many: "charges", filter: "On closed invoices", which: "Charges on closed, original invoices only", newOnes: "new charges on closed invoices",
    when: "Each charge is checked when its invoice closes. Charges on open invoices are not checked, because they can still change.",
    odd: "unusual charges", group: "Billing profiles", groupOne: "Billing profile",
    compareHint: "Billing profile suits most checks: each customer is compared with their own history.", valueHint: "rate, quantity or cost",
    compare: COMPARE_OPTIONS, values: VALUE_OPTIONS.filter((v) => ["rate", "qty", "cost", "standard"].includes(v.value)), fields: CONDITION_FIELDS, anomalies: ["Duplicate charge", "Missing recurring fee", "Rate"],
  },
  usage: {
    icon: "speed", label: "Usage records", one: "usage record", many: "usage records", filter: "Rated, final", which: "Rated, final usage records only", newOnes: "new rated usage records",
    when: "Each usage record is checked once it's rated. Records still being processed are not checked.",
    odd: "unusual usage", group: "Accounts", groupOne: "Account",
    compareHint: "Account suits most checks: each customer is compared with their own history.", valueHint: "volume or rated amount",
    compare: [ACCOUNT, PRODUCT, { value: "usageId", label: "Usage identifier" }],
    values: [{ value: "volume", label: "Volume" }, { value: "ratedAmount", label: "Rated amount" }], fields: OTHER_FIELDS, anomalies: ["Usage spike", "Usage drop"],
  },
  payment: {
    icon: "payments", label: "Payments", one: "payment", many: "payments", filter: "Settled", which: "Settled payments only", newOnes: "new settled payments",
    when: "Each payment is checked once it settles. Pending payments are not checked, because they can still change.",
    odd: "unusual payments", group: "Accounts", groupOne: "Account",
    compareHint: "Account suits most checks: each customer is compared with their own history.", valueHint: "amount or days to pay",
    compare: [ACCOUNT, { value: "paymentMethod", label: "Payment method" }],
    values: [{ value: "paymentAmount", label: "Payment amount" }, { value: "daysToPay", label: "Days to pay" }], fields: OTHER_FIELDS, anomalies: ["Unusual amount", "Late payment"],
  },
  credit: {
    icon: "credit_score", label: "Credit memos", one: "credit memo", many: "credit memos", filter: "Approved", which: "Approved credit memos only", newOnes: "new approved credit memos",
    when: "Each credit memo is checked once it's approved. Drafts are not checked, because they can still change.",
    odd: "unusual credits", group: "Accounts", groupOne: "Account",
    compareHint: "Account suits most checks: each customer is compared with their own history.", valueHint: "credit amount",
    compare: [ACCOUNT, PRODUCT],
    values: [{ value: "creditAmount", label: "Credit amount" }, { value: "invoiceShare", label: "Share of invoice" }], fields: OTHER_FIELDS, anomalies: ["Unusual credit", "Repeat credit"],
  },
  quote: {
    icon: "request_quote", label: "Quotes", one: "quote", many: "quotes", filter: "Accepted, latest version", which: "Accepted, latest version quotes only", newOnes: "new accepted quotes",
    when: "Each quote is checked when it's accepted. Drafts are not checked, because they can still change.",
    odd: "unusual quotes", group: "Accounts", groupOne: "Account",
    compareHint: "Account suits most checks: each customer is compared with their own history.", valueHint: "total or discount",
    compare: [ACCOUNT, PRODUCT, { value: "salesRep", label: "Sales rep" }],
    values: [{ value: "quoteTotal", label: "Quote total" }, { value: "discount", label: "Discount" }], fields: OTHER_FIELDS, anomalies: ["Unusual discount", "Unusual total"],
  },
};
export const RECORD_OPTIONS = Object.entries(RECORDS).map(([value, r]) => ({ value, label: r.label }));
export const recordOf = (record?: string) => RECORDS[record || "invoice"];
export const actionOptions = (r: RecordType) => ACTION_OPTIONS.map((a) => (a.value === "hold" ? { ...a, label: `Hold ${r.one}` } : a));
const ALL_COMPARE = [...COMPARE_OPTIONS, ...Object.values(RECORDS).flatMap((r) => r.compare)];
const ALL_VALUES = Object.values(RECORDS).flatMap((r) => r.values);

const labelOf = (options: { value: string; label: string }[], value: string) => options.find((o) => o.value === value)?.label ?? value;
const fieldName = (field: string) => FIELD_PATHS[field].split(" / ").pop()!;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const listWords = (w: string[]) => (w.length < 2 ? w.join("") : `${w.slice(0, -1).join(", ")} and ${w[w.length - 1]}`);
const anomalyLabel = (id: string) => ANOMALY_FILTER.find((a) => a.id === id)?.label ?? id;

let lastId = 0;
export const freshId = (prefix: string) => `${prefix}-${++lastId}`;

export function newBlock(kind: BlockKind, x: number, y: number): Block {
  const at = { id: freshId(kind), x, y };
  switch (kind) {
    case "invoices": return { ...at, kind, dateField: "closeDate", lookback: "12" };
    case "condition": return { ...at, kind, field: null, op: "is", value: "" };
    case "comparePer": return { ...at, kind, per: ["billingProfile"] };
    case "values": return { ...at, kind, rows: [] };
    case "model": return { ...at, kind, branches: [] };
    case "action": return { ...at, kind, act: "flag" };
  }
}

// The outputs a block has right now. A Model has one per anomaly type it splits out, then one for the rest.
export function outputs(node: Block): Port[] {
  switch (node.kind) {
    case "action": return [];
    case "condition": return [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }];
    case "model": return node.branches.length
      ? [...node.branches.map((id) => ({ id, label: anomalyLabel(id) })), { id: "otherwise", label: "Otherwise" }]
      : [{ id: "otherwise", label: "Any flag" }];
    default: return [{ id: "out", label: "Next" }];
  }
}

export function seedGraph(): Graph {
  const y = 176;
  const nodes: Block[] = [
    { id: "start", kind: "invoices", x: 20, y, dateField: "closeDate", lookback: "12" },
    { id: "monthly", kind: "condition", x: 208, y, field: "cycle", op: "is", value: "monthly" },
    { id: "per", kind: "comparePer", x: 396, y, per: ["billingProfile"] },
    { id: "watch", kind: "values", x: 584, y, rows: [{ id: "rate", field: "rate", agg: "avg" }, { id: "qty", field: "qty", agg: "sum" }, { id: "cost", field: "cost", agg: "sum" }] },
    { id: "model", kind: "model", x: 772, y, branches: ["Duplicate charge"] },
    { id: "hold", kind: "action", x: 960, y: 72, act: "hold" },
    { id: "flag", kind: "action", x: 960, y: 280, act: "flag" },
  ];
  const links: Link[] = [
    { id: "l1", from: "start", port: "out", to: "monthly" },
    { id: "l2", from: "monthly", port: "yes", to: "per" },
    { id: "l3", from: "per", port: "out", to: "watch" },
    { id: "l4", from: "watch", port: "out", to: "model" },
    { id: "l5", from: "model", port: "Duplicate charge", to: "hold" },
    { id: "l6", from: "model", port: "otherwise", to: "flag" },
  ];
  return { name: SEED_CONFIGS.find((c) => c.id === "s1")!.setup.name, nodes, links };
}

const reaches = (g: Graph, from: string, target: string, seen = new Set<string>()): boolean => {
  if (from === target) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return g.links.some((l) => l.from === from && reaches(g, l.to, target, seen));
};

// Why this connection can't be made, or null when it can.
export function refusal(g: Graph, fromId: string, port: string, toId: string): string | null {
  const from = g.nodes.find((n) => n.id === fromId)!;
  const to = g.nodes.find((n) => n.id === toId)!;
  if (from.id === to.id) return "A block can't connect to itself.";
  if (to.kind === "invoices") return "Invoices is where a rule starts, so nothing connects into it.";
  if (from.kind === "model" && to.kind !== "action") return "After the Model, only an Action can follow.";
  if (to.kind === "action" && from.kind !== "model") return "An Action needs a flag to act on, so it can only follow the Model.";
  const taken = g.links.find((l) => l.from === fromId && l.port === port);
  if (taken?.to === toId) return "These two are already connected.";
  if (taken) return `This output already goes to ${blockLabel(g.nodes.find((n) => n.id === taken.to)!.kind)}. Delete that connection first.`;
  if (reaches(g, to.id, from.id)) return "That would make a loop. A rule runs one way, from Invoices to the Model.";
  return null;
}

const reachedFromStart = (g: Graph) => {
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    g.links.filter((l) => l.from === id).forEach((l) => visit(l.to));
  };
  g.nodes.filter((n) => n.kind === "invoices").forEach((n) => visit(n.id));
  return seen;
};
const ancestorKinds = (g: Graph, id: string, seen = new Set<string>()): BlockKind[] => {
  if (seen.has(id)) return [];
  seen.add(id);
  const self = g.nodes.find((n) => n.id === id)!.kind;
  return [self, ...g.links.filter((l) => l.to === id).flatMap((l) => ancestorKinds(g, l.from, seen))];
};

// What a rule can't work without, in the order it gets built. Condition is optional, so it isn't here.
export function checklist(g: Graph): { kind: BlockKind; done: boolean }[] {
  const reached = g.nodes.filter((n) => reachedFromStart(g).has(n.id));
  return (["invoices", "comparePer", "values", "model", "action"] as BlockKind[]).map((kind) => ({
    kind, done: reached.some((n) => n.kind === kind && !blockUnset(n)),
  }));
}

// What can go on the end of this block's line.
export const followers = (node: Block): BlockKind[] => (node.kind === "model" ? ["action"] : ["condition", "comparePer", "values", "model"]);

// What this block most needs next: the first required block its path doesn't have yet.
function nextBlocks(g: Graph, node: Block): BlockKind[] {
  if (node.kind === "model") return ["action"];
  const before = ancestorKinds(g, node.id);
  const missing = (["comparePer", "values", "model"] as BlockKind[]).find((k) => !before.includes(k));
  if (!missing) return [];
  return node.kind === "invoices" ? ["condition", missing] : [missing];
}

// Where to offer a next step: every open output of the selected block, and the end of any path that stops short.
export function openSteps(g: Graph, selected: string | null): { node: Block; port: string; kinds: BlockKind[] }[] {
  const reached = reachedFromStart(g);
  const steps: { node: Block; port: string; kinds: BlockKind[] }[] = [];
  for (const node of g.nodes) {
    const open = outputs(node).filter((p) => !g.links.some((l) => l.from === node.id && l.port === p.id));
    const kinds = nextBlocks(g, node);
    if (!open.length || !kinds.length) continue;
    if (node.id === selected) open.forEach((p) => steps.push({ node, port: p.id, kinds: open.length > 1 ? kinds.slice(0, 1) : kinds }));
    else if (reached.has(node.id) && open.length === outputs(node).length) steps.push({ node, port: open[0].id, kinds });
  }
  return steps;
}

// The one line on a block.
export function blockText(node: Block, record?: string): string {
  const type = recordOf(node.kind === "invoices" ? node.record : record);
  switch (node.kind) {
    case "invoices": return `${type.filter} · last ${labelOf(LOOKBACK_OPTIONS, node.lookback)}`;
    case "condition": return conditionUnfinished(node) ? "Pick a field and a value" : conditionWords(node, true, false);
    case "comparePer": return node.per.length ? node.per.map((p) => labelOf(ALL_COMPARE, p)).join(", ") : "Pick what to compare per";
    case "values": return watching(node).length ? node.rows.filter((r) => r.field).map((r) => `${labelOf(ALL_VALUES, r.field)} (${lower(labelOf(AGG_OPTIONS, r.agg))})`).join(", ") : "Pick at least one value";
    case "model": return "Flags what looks unusual";
    case "action": return labelOf(actionOptions(type), node.act);
  }
}
export const blockUnset = (node: Block) =>
  (node.kind === "condition" && conditionUnfinished(node)) || (node.kind === "comparePer" && !node.per.length) || (node.kind === "values" && !watching(node).length);

const conditionUnfinished = (c: ConditionBlock) => !c.field || (!NO_VALUE_OPS.includes(c.op) && !c.value);
const watching = (v: ValuesBlock) => [...new Set(v.rows.filter((r) => r.field).map((r) => lower(labelOf(ALL_VALUES, r.field))))];

// The condition in words. The No side of a block reads as its opposite.
function conditionWords(c: ConditionBlock, yes: boolean, lowerField: boolean) {
  const flip: Record<string, string> = { is: "isNot", isNot: "is", empty: "notEmpty", notEmpty: "empty" };
  const op = yes ? c.op : flip[c.op];
  const name = fieldName(c.field!);
  const value = NO_VALUE_OPS.includes(op) ? "" : ` ${labelOf(FIELD_VALUES[c.field!], c.value)}`;
  return `${lowerField ? lower(name) : name} ${labelOf(OP_OPTIONS, op)}${value}`;
}

interface Step { node: Block; port: string | null }

// Read the graph as sentences: one for each way from Invoices to a Model, then what happens to its flags.
export function summarize(g: Graph): { lines: string[]; problems: string[] } {
  const type = recordOf(g.record);
  const lines: string[] = [];
  const skipped: string[] = [];
  const problems: string[] = [];
  const note = (list: string[], s: string) => { if (!list.includes(s)) list.push(s); };
  const next = (node: Block, port: string) => {
    const link = g.links.find((l) => l.from === node.id && l.port === port);
    return link ? g.nodes.find((n) => n.id === link.to)! : null;
  };
  const reached = new Set<string>();

  const atModel = (model: ModelBlock, path: Step[]) => {
    const invoices = path[0].node as InvoicesBlock;
    const adjectives: string[] = [];
    const wheres: string[] = [];
    const per = new Set<string>();
    const values = new Set<string>();
    for (const { node, port } of path) {
      if (node.kind === "condition" && !conditionUnfinished(node)) {
        const yes = port === "yes";
        const positive = (node.op === "is") === yes;
        // "Billing cycle is Monthly" reads best as "monthly invoices"; everything else stays a where.
        if (node.field === "cycle" && node.op !== "empty" && node.op !== "notEmpty" && positive) adjectives.push(lower(labelOf(FIELD_VALUES.cycle, node.value)));
        else wheres.push(conditionWords(node, yes, true));
      }
      if (node.kind === "comparePer") node.per.forEach((p) => per.add(lower(labelOf(ALL_COMPARE, p))));
      if (node.kind === "values") watching(node).forEach((v) => values.add(v));
    }
    const which = `${lower(type.filter)} ${adjectives.map((a) => `${a} `).join("")}${type.many}${wheres.length ? ` where ${listWords(wheres)}` : ""}`;
    note(lines, `Check ${which} from the last ${labelOf(LOOKBACK_OPTIONS, invoices.lookback)}${per.size ? `, per ${listWords([...per])}` : ""}${values.size ? `, watching ${listWords([...values])}` : ""}.`);
    if (!per.size) note(problems, "Add a Compare per block before the Model, so it knows what to compare against.");
    if (!values.size) note(problems, "Add a Values to watch block before the Model, so it knows what to look at.");
    const then = outputs(model).map((p) => {
      const action = next(model, p.id);
      const word = p.id === "otherwise" ? (model.branches.length ? "Anything else" : "Any flag") : p.label;
      return `${word}: ${action?.kind === "action" ? lower(labelOf(actionOptions(type), action.act)) : "no action"}.`;
    });
    note(lines, then.join(" "));
  };

  const walk = (node: Block, path: Step[]) => {
    reached.add(node.id);
    if (node.kind === "model") { atModel(node, path); outputs(node).forEach((p) => { const a = next(node, p.id); if (a) reached.add(a.id); }); return; }
    if (node.kind === "condition" && conditionUnfinished(node)) note(problems, "A Condition still needs its field and value.");
    const ports = outputs(node).filter((p) => next(node, p.id));
    if (!ports.length) { note(problems, `The path stops at ${blockLabel(node.kind)} before it reaches a Model.`); return; }
    if (node.kind === "condition" && !conditionUnfinished(node)) {
      const open = outputs(node).find((p) => !next(node, p.id));
      if (open) note(skipped, `${type.label} where ${conditionWords(node, open.id === "yes", true)} aren't checked.`);
    }
    for (const p of ports) {
      const after = next(node, p.id)!;
      walk(after, [...path.slice(0, -1), { node, port: p.id }, { node: after, port: null }]);
    }
  };

  const starts = g.nodes.filter((n) => n.kind === "invoices");
  if (!starts.length) problems.push("Add an Invoices block. Every rule starts there.");
  starts.forEach((s) => walk(s, [{ node: s, port: null }]));
  const loose = g.nodes.filter((n) => !reached.has(n.id));
  if (starts.length && loose.length) problems.push(`${listWords([...new Set(loose.map((n) => blockLabel(n.kind)))])} ${loose.length > 1 ? "aren't" : "isn't"} connected yet.`);
  return { lines: [...lines, ...skipped], problems };
}
