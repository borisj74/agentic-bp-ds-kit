import type { CascaderOption } from "@/ui/Cascader/Cascader";

// Sample data for the anomaly detection prototype, from the review canvas. Nothing is saved.

export const STEPS = ["Invoices", "Compare", "Check data", "Train", "Results", "Turn on"];
export const TODAY = "30 Oct 2026";
export const INVOICES_FOUND = 18420;
// A sample figure, so the count reads "X of Y".
export const INVOICES_TOTAL = 24310;

export type Status = "draft" | "training" | "stopped" | "results" | "needsChanges" | "applying" | "ready" | "active" | "paused";
export type Result = { kind: "good" | "fair" | "poor"; score: number };
export type Intent = "neutral" | "info" | "success" | "warning" | "danger";

export interface Condition { id: string; field: string | null; op: string; value: string }
export interface WatchedValue { id: string; field: string; from: string; agg: string }
export interface Setup {
  name: string;
  dateField: string;
  lookback: string;
  description: string;
  conditions: Condition[];
  comparePer: string[];
  values: WatchedValue[];
  whichDetail?: string;
}
export interface Config {
  id: string;
  setup: Setup;
  status: Status;
  progress: number;
  live: boolean;
  result: Result | null;
  trained: string;
  checked?: string;
}

export const DATE_OPTIONS = [
  { value: "closeDate", label: "Close date" },
  { value: "billingCycleEnd", label: "Billing cycle end date" },
  { value: "invoiceDate", label: "Invoice date" },
  { value: "dueDate", label: "Due date" },
];
export const LOOKBACK_OPTIONS = [
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
];
export const PERIOD_START: Record<string, string> = { 6: "1 May 2026", 12: "1 Nov 2025", 18: "1 May 2025", 24: "1 Nov 2024", 36: "1 Nov 2023" };
export const COMPARE_OPTIONS = [
  { value: "billingProfile", label: "Billing profile" },
  { value: "account", label: "Account" },
  { value: "product", label: "Product" },
  { value: "accountProduct", label: "Account product" },
];
export const AGG_OPTIONS = [{ value: "sum", label: "Sum" }, { value: "avg", label: "Average" }];
export const OP_OPTIONS = [
  { value: "is", label: "is" },
  { value: "isNot", label: "is not" },
  { value: "empty", label: "is empty" },
  { value: "notEmpty", label: "is not empty" },
];

export const REQUIRED_CONDITIONS = [
  { id: "r1", field: "Status", op: "is", value: "Closed", why: "Open invoices still change." },
  { id: "r2", field: "Created from another invoice", op: "is", value: "No", why: "Copies would count a charge twice." },
  { id: "r3", field: "Reopened by invoice", op: "is", value: "No", why: "Reopened invoices are replaced by a newer one." },
];
// The field picker walks from the invoice into its related records, like the product's Select Field dialog.
// Relation paths are the product's own names; only the fields this sample uses are listed.
// Suggested comes first and starts open, so a first-time admin isn't guessing. Which fields belong there is a
// placeholder until the product team says. Fields the locked conditions cover, and their look-alikes such as
// Reopened, are left out on purpose.
export const SUGGESTED = "suggested";
export const FIELD_TREE: CascaderOption[] = [
  {
    value: SUGGESTED, label: "Suggested",
    children: [
      { value: "cycle", label: "Billing cycle", path: "Billing profile", type: "Picklist" },
      { value: "currency", label: "Currency", type: "Picklist" },
    ],
  },
  {
    value: "billingProfile", label: "Billing profile", path: "BillingProfileIdObj", relation: "parent",
    children: [
      { value: "cycle", label: "Billing cycle", type: "Picklist" },
      { value: "terms", label: "Payment terms", type: "Picklist" },
    ],
  },
  {
    value: "charges", label: "Invoice charges", path: "Activity__InvoiceIdObj", relation: "children",
    children: [{ value: "rating", label: "Rating method type", type: "Picklist" }],
  },
  { value: "currency", label: "Currency", type: "Picklist" },
  { value: "entity", label: "Legal entity", type: "Lookup" },
];
export const VALUE_TREE: CascaderOption[] = [
  {
    value: SUGGESTED, label: "Suggested",
    children: [
      { value: "rate", label: "Rate", path: "Invoice charges", type: "Num" },
      { value: "qty", label: "Quantity", path: "Invoice charges", type: "Num" },
      { value: "cost", label: "Cost", path: "Invoice charges", type: "Num" },
    ],
  },
  {
    value: "charges", label: "Invoice charges", path: "Activity__InvoiceIdObj", relation: "children",
    children: [
      { value: "rate", label: "Rate", type: "Num" },
      { value: "qty", label: "Quantity", type: "Num" },
      { value: "cost", label: "Cost", type: "Num" },
      { value: "standard", label: "Standard rate", type: "Num" },
      { value: "tax", label: "Tax amount", type: "Num" },
    ],
  },
  { value: "total", label: "Grand total", type: "Num" },
];
export const FIELD_PATHS: Record<string, string> = {
  cycle: "Billing profile / Billing cycle", terms: "Billing profile / Payment terms",
  rating: "Invoice charges / Rating method type", currency: "Currency", entity: "Legal entity", reopened: "Reopened",
};
// A field already in use can't be picked twice.
export const withoutUsed = (tree: CascaderOption[], used: string[]): CascaderOption[] =>
  tree.map((o) => (o.children ? { ...o, children: withoutUsed(o.children, used) } : { ...o, disabled: used.includes(o.value) }));
export const FIELD_VALUES: Record<string, { value: string; label: string }[]> = {
  cycle: [{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "annual", label: "Annual" }],
  currency: [{ value: "usd", label: "USD" }, { value: "eur", label: "EUR" }, { value: "gbp", label: "GBP" }],
  entity: [{ value: "us", label: "CCC US" }, { value: "eu", label: "CCC EU" }],
  rating: [{ value: "flat", label: "Flat" }, { value: "tiered", label: "Tiered" }, { value: "usage", label: "Usage" }],
  terms: [{ value: "net15", label: "Net 15" }, { value: "net30", label: "Net 30" }, { value: "net60", label: "Net 60" }],
  reopened: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
};
// The bad state from the review: a yes/no field compared with a date. The prototype switch sets it; so does typing one.
export const BAD_REOPENED: Condition = { id: "bad", field: "reopened", op: "isAfter", value: "1 Jan 2026" };
export const isBadCondition = (c: Condition) => c.field === "reopened" && c.value !== "" && !/^(yes|no)$/i.test(c.value.trim());

const VALUE_ROWS = [
  { id: "rate", field: "Rate", from: "Invoice charges" },
  { id: "qty", field: "Quantity", from: "Invoice charges" },
  { id: "cost", field: "Cost", from: "Invoice charges" },
  { id: "standard", field: "Standard rate", from: "Invoice charges" },
];
const watched = (id: string, agg: string): WatchedValue => {
  const row = VALUE_ROWS.find((r) => r.id === id)!;
  return { id, field: row.field, from: row.from, agg };
};
const THREE_VALUES = [watched("rate", "avg"), watched("qty", "sum"), watched("cost", "sum")];

export const SAMPLE_INVOICES = [
  { id: "1", invoice: "INV-2026-10418", profile: "Acme Corporation · Monthly", closed: "31 Oct 2026", rate: "$125.00", qty: "40", cost: "$5,000.00" },
  { id: "2", invoice: "INV-2026-10402", profile: "Globex Industries · Monthly", closed: "31 Oct 2026", rate: "$89.50", qty: "120", cost: "$10,740.00" },
  { id: "3", invoice: "INV-2026-10377", profile: "Quantum Dynamics · Quarterly", closed: "30 Sep 2026", rate: "$210.00", qty: "15", cost: "$3,150.00" },
  { id: "4", invoice: "INV-2026-10351", profile: "BlueOcean Strategies · Monthly", closed: "30 Sep 2026", rate: "$142.50", qty: "60", cost: "$8,550.00" },
  { id: "5", invoice: "INV-2026-10322", profile: "Vertex Systems · Annual", closed: "31 Aug 2026", rate: "$64.00", qty: "300", cost: "$19,200.00" },
];

export const newSetup = (name = ""): Setup => ({
  name, dateField: "closeDate", lookback: "12", description: "",
  conditions: [{ id: "c1", field: "cycle", op: "is", value: "Monthly" }],
  comparePer: ["billingProfile"],
  values: THREE_VALUES,
});

const saved = (id: string, name: string, lookback: string, status: Status, result: Result | null, trained: string, progress = 0, more: Partial<Setup> = {}): Config => ({
  id, status, result, trained, progress, live: false,
  setup: { ...newSetup(name), lookback, ...more },
});

export const SEED_CONFIGS: Config[] = [
  saved("c1", "OOB C1 Recurring charges", "24", "active", { kind: "good", score: 7.8 }, "21 Oct 2026", 0, {
    dateField: "billingCycleEnd", comparePer: ["accountProduct"],
    values: [...THREE_VALUES, watched("standard", "avg")],
    whichDetail: "Closed, original subscription invoices with an account product",
  }),
  saved("c2", "OOB C2 Usage", "12", "draft", null, "—"),
  saved("c3", "OOB C3 One-time and other charges", "24", "ready", { kind: "good", score: 7.2 }, "21 Oct 2026"),
  saved("c3b", "OOB C3b One-time charges per client", "24", "applying", { kind: "good", score: 7.6 }, "21 Oct 2026", 40),
  saved("c4", "OOB C4 Invoice totals", "24", "active", { kind: "fair", score: 6.1 }, "21 Oct 2026"),
  saved("s1", "Invoice cost check", "12", "stopped", null, "—", 0, {
    values: [...THREE_VALUES, watched("standard", "avg"), { id: "tax", field: "Tax amount", from: "Invoice charges", agg: "sum" }],
  }),
];
SEED_CONFIGS[0].checked = "All 42,118 past invoices · new ones as they close";

export const STATUS_INTENT: Record<Status, Intent> = {
  draft: "neutral", training: "info", stopped: "warning", results: "info", needsChanges: "warning",
  applying: "info", ready: "info", active: "success", paused: "neutral",
};
export function statusLabel(c: Config) {
  switch (c.status) {
    case "draft": return "Draft";
    case "training": return `Training · ${c.progress}%`;
    case "stopped": return "Training stopped";
    case "results": return "Results ready";
    case "needsChanges": return "Needs changes";
    case "applying": return `Applying to invoices · ${c.progress}%`;
    case "ready": return "Ready to turn on";
    case "active": return "Active";
    case "paused": return "Paused";
  }
}
// The list's status filters. A stopped run is still a Training problem; Needs changes is still a Result.
export const STATUS_FILTERS: { id: string; statuses: Status[] }[] = [
  { id: "Draft", statuses: ["draft"] },
  { id: "Training", statuses: ["training", "stopped"] },
  { id: "Results", statuses: ["results", "needsChanges"] },
  { id: "Applying", statuses: ["applying"] },
  { id: "Ready", statuses: ["ready"] },
  { id: "Active", statuses: ["active"] },
  { id: "Paused", statuses: ["paused"] },
];
export const RESULT_WORD = { good: "Good", fair: "Fair", poor: "Poor" };
export const RESULT_INTENT = { good: "success", fair: "warning", poor: "danger" } as const;
export const resultLabel = (r: Result) => `${RESULT_WORD[r.kind]} · ${r.score.toFixed(1)}`;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const listWords = (w: string[]) => (w.length < 2 ? w.join("") : `${w.slice(0, -1).join(", ")} and ${w[w.length - 1]}`);
export const whichInvoices = (s: Setup) => `${s.whichDetail ?? "Closed, original invoices"} · last ${s.lookback} months`;
export const dateLabel = (s: Setup) => DATE_OPTIONS.find((o) => o.value === s.dateField)?.label ?? "";
export const compareLabel = (s: Setup) => {
  const words = s.comparePer.map((id) => COMPARE_OPTIONS.find((o) => o.value === id)?.label ?? id);
  return words.map((w, i) => (i ? lower(w) : w)).join(words.length > 2 ? ", " : " and ");
};
export const valuesLabel = (s: Setup) =>
  s.values.map((v, i) => `${i ? lower(v.field) : v.field} (${v.agg === "avg" ? "average" : "sum"})`).join(", ");
export const readySummary = (s: Setup) =>
  `Closed, original invoices from the last ${s.lookback} months, compared per ${compareLabel(s).toLowerCase()}, watching ${listWords(s.values.map((v) => v.field.toLowerCase()))}.`;
export const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five"];

// Billing user side.
export interface Invoice {
  id: string; number: string; account: string; profile: string; anomaly: string | null;
  status: string; payment: string; total: string; currency: string; to: string; closeDate: string; pills?: string[];
}
const inv = (id: string, account: string, cycle: string, anomaly: string | null, status: string, payment: string, total: string, currency: string, to: string, pills?: string[]): Invoice => ({
  id, number: `INV-2024-${id.padStart(3, "0")}`, account, profile: `${account} · ${cycle}`, anomaly, status, payment, total, currency, to, closeDate: to, pills,
});
// The seven flagged rows are the canvas's; the five clean ones are added so the Anomaly filter has something to narrow.
export const INVOICES: Invoice[] = [
  inv("1", "Acme Corporation", "Monthly", null, "Current", "Paid", "$5,000.00", "USD", "31 Jan 2024"),
  inv("2", "Globex Industries", "Monthly", "Rate", "Current", "Unpaid", "$12,800.00", "EUR", "29 Feb 2024"),
  inv("3", "Quantum Dynamics", "Quarterly", "Rate", "Current", "Partial", "$78,000.00", "USD", "31 Mar 2024"),
  inv("4", "Vertex Systems", "Annual", null, "Current", "Paid", "$19,200.00", "USD", "30 Apr 2024"),
  inv("5", "Acme Corporation", "Monthly", null, "Current", "Paid", "$5,000.00", "USD", "31 May 2024"),
  inv("6", "NexGen Enterprises", "Monthly", "Duplicate charge", "Collections", "Overdue", "$54,000.00", "USD", "30 Jun 2024"),
  inv("7", "Vertex Systems", "Annual", null, "Current", "Unpaid", "$19,200.00", "USD", "31 Jul 2024"),
  inv("8", "BlueOcean Strategies", "Monthly", "Rate", "Current", "Unpaid", "$25,600.00", "EUR", "31 Aug 2024"),
  inv("9", "Globex Industries", "Monthly", null, "Current", "Paid", "$10,740.00", "EUR", "30 Sep 2024"),
  inv("11", "RedStone Capital", "Monthly", "Missing recurring fee", "Current", "Partial", "$14,200.00", "GBP", "30 Nov 2024", ["Missing recurring fee", "Potential overbill"]),
  inv("13", "ClearPath Analytics", "Monthly", "Duplicate charge", "Collections", "Unpaid", "$29,800.00", "USD", "31 Jan 2024"),
  inv("14", "Momentum Global", "Monthly", "Rate", "Collections", "Overdue", "$88,500.00", "EUR", "29 Feb 2024"),
];
export const ANOMALY_INTENT = (a: string): Intent => (a === "Duplicate charge" ? "danger" : "warning");
export const ANOMALY_FILTER = [
  { id: "Rate", label: "Rate", short: "Rate" },
  { id: "Missing recurring fee", label: "Missing recurring fee", short: "Missing fee" },
  { id: "Duplicate charge", label: "Duplicate charge", short: "Duplicate" },
];
// The canvas's list-wide counts. The sample rows show a part of them.
export const FLAG_COUNTS: Record<string, number> = { Rate: 14, "Missing recurring fee": 4, "Duplicate charge": 4 };

export function whyFlagged(i: Invoice) {
  if (i.number === "INV-2024-008") return "This line item was billed at $142.00, but the contract on file specifies $125.00. Other invoices on this billing profile match the contract.";
  if (i.anomaly === "Rate") return "A line item on this invoice was billed above the rate in the contract on file. Other invoices on this billing profile match the contract.";
  if (i.anomaly === "Duplicate charge") return "The same charge appears twice on this invoice. Other invoices on this billing profile bill it once.";
  return "The recurring fee this billing profile pays every cycle is missing from this invoice, and another charge looks higher than usual.";
}
export function feedbackScope(i: Invoice) {
  const what = i.number === "INV-2024-008" ? "A $142.00 rate" : `This ${(i.anomaly ?? "flag").toLowerCase()}`;
  return `This applies to ${i.account} only. ${what} won't be flagged for them again; other billing profiles are still checked.`;
}

// What the review left open. Shown in the guide and next to the screen each one touches.
export const UNCONFIRMED = [
  { id: "apply", label: "Applying to all invoices", text: "Automatic or started by the admin? This version assumes a button." },
  { id: "ranges", label: "Fair and Poor score ranges", text: "Only \"above 7 is good\" is agreed. The other ranges are placeholders." },
  { id: "email", label: "Email when training is done", text: "The option was not agreed." },
  { id: "stop", label: "Couldn't stop state", text: "Shown as a design idea. Stop is meant to be immediate." },
  { id: "reopened", label: "Which Reopened field", text: "One was removed in the review to clear a query error. The exact field is still open." },
  { id: "invoice", label: "Invoice only for now", text: "A proposal from the review, not final." },
];
