import type { Result } from "../anomaly-detection/data";
import { RECORDS, actionOptions, freshId, type RecordType } from "../anomaly-detection-nodes/graph";
import { ROOT, blankRule, insertStep, patchStep, type Rule, type Stage } from "./tree";

// What BP AI says beside the tree. Canned and rule-aware: it reads the sentence for a few words, never guesses beyond them.

export interface Starter { id: string; label: string }

// A sentence turned into a tree, and what was assumed to get there, so nothing it filled in is hidden.
export interface Draft { rule: Rule; assumed: string[]; steps: number }

const RECORD_WORDS: [RegExp, string][] = [
  [/usage/i, "usage"], [/payment/i, "payment"], [/credit/i, "credit"], [/quote/i, "quote"], [/charge/i, "charge"],
];
const VALUE_WORDS: Record<string, [RegExp, string][]> = {
  invoice: [[/total|amount|bill/i, "total"], [/rate|price/i, "rate"], [/quantit|qty/i, "qty"], [/cost/i, "cost"], [/tax/i, "tax"]],
  charge: [[/rate|price/i, "rate"], [/quantit|qty/i, "qty"], [/cost|amount|total/i, "cost"]],
  usage: [[/volume|usage|spike|drop/i, "volume"], [/amount|rated|cost/i, "ratedAmount"]],
  payment: [[/late|days|slow/i, "daysToPay"], [/amount|total/i, "paymentAmount"]],
  credit: [[/share|percent/i, "invoiceShare"], [/amount|credit|total/i, "creditAmount"]],
  quote: [[/discount/i, "discount"], [/total|amount|price/i, "quoteTotal"]],
};
// Grand total is empty on most past invoices in the sample, so the model couldn't learn from it.
const EMPTY_VALUES: Record<string, string> = { total: "cost" };

export function draftRule(text: string): Draft {
  const record = RECORD_WORDS.find(([re]) => re.test(text))?.[1] ?? "invoice";
  const type = RECORDS[record];
  const label = (field: string) => type.values.find((v) => v.value === field)?.label ?? field;
  const asked = (VALUE_WORDS[record] ?? []).find(([re]) => re.test(text))?.[1];
  const field = asked ? EMPTY_VALUES[asked] ?? asked : record === "invoice" ? "cost" : type.values[0].value;
  const compare = (/product/i.test(text) && type.compare.find((c) => c.value === "product")) || type.compare[0];
  const act = /hold|stop|block|pause/i.test(text) ? "hold" : /notify|tell|email|alert|let .* know/i.test(text) ? "notify" : "flag";
  const action = actionOptions(type).find((a) => a.value === act)!;

  let rule = blankRule(`Unusual ${label(field).toLowerCase()} per ${compare.label.toLowerCase()}`);
  rule = patchStep(rule, rule.start.id, { record });
  let made = insertStep(rule, ROOT, 0, { id: "comparePer", kind: "comparePer", label: "Compare per", icon: "workspaces" });
  rule = patchStep(made.rule, made.id, { per: [compare.value] });
  made = insertStep(rule, ROOT, 1, { id: "values", kind: "values", label: "Values to watch", icon: "monitoring" });
  rule = patchStep(made.rule, made.id, { rows: [{ id: freshId("row"), field, agg: "sum" }] });
  made = insertStep(rule, ROOT, 2, { id: "model", kind: "model", label: "Model", icon: "model_training" });
  rule = made.rule;
  const model = rule.steps[2];
  rule = insertStep(rule, model.paths![0].id, 0, { id: `action:${act}`, kind: "action", act, label: action.label, icon: "bolt" }).rule;

  return {
    rule,
    steps: 4,
    assumed: [
      `${type.label}: ${type.which.toLowerCase()}, from the last 12 months.`,
      `Compared per ${compare.label.toLowerCase()}, so each one is held to its own history.`,
      asked && EMPTY_VALUES[asked]
        ? `Watching ${label(field)}, not ${label(asked)}: ${label(asked)} is empty on most past ${type.many}, so the model can't learn from it.`
        : `Watching ${label(field)}.`,
      `${action.label} on any flag.${act === "flag" ? " Nothing is stopped." : ""}`,
    ],
  };
}

export function startersFor(stage: Stage, choosing: boolean, empty: boolean, poor: boolean): Starter[] {
  if (choosing || empty) {
    return [
      { id: "draft-hold", label: "Hold invoices when a customer's total jumps well above their usual" },
      { id: "draft-usage", label: "Let the billing team know about unusual usage per product" },
      { id: "draft-late", label: "Flag payments that come in much later than usual" },
    ];
  }
  if (stage === "build") return [{ id: "next", label: "What should I add next?" }, { id: "explain", label: "Explain this rule in plain words" }];
  if (stage === "results") {
    return poor
      ? [{ id: "results", label: "Why did it score so low?" }, { id: "fewer", label: "How do I get fewer false flags?" }]
      : [{ id: "results", label: "Explain these results" }, { id: "apply", label: "What happens if I apply it?" }];
  }
  if (stage === "training" || stage === "applying") return [{ id: "waiting", label: "What's happening right now?" }];
  return [{ id: "explain", label: "What does this rule do?" }, { id: "apply", label: "What gets checked from now on?" }];
}

// Which canned answer a typed question gets. Anything that reads like a rule is drafted.
export function intentOf(text: string, choosing: boolean, empty: boolean): string {
  if (/next|missing|need|add/i.test(text)) return "next";
  if (/result|score|low|good|explain.*result/i.test(text)) return "results";
  if (/false|fewer|noise|too many/i.test(text)) return "fewer";
  if (/apply|turn on|from now|checked/i.test(text)) return "apply";
  if (/happening|wait|long|train/i.test(text)) return "waiting";
  if (/explain|what does|plain|summar/i.test(text)) return "explain";
  if (choosing || empty || /when|flag|hold|notify|watch|spike|jump|unusual/i.test(text)) return "draft";
  return "other";
}

export function resultsAnswer(result: Result, sample: number, flagged: number, type: RecordType) {
  const n = (x: number) => x.toLocaleString("en-US");
  return result.kind === "poor"
    ? {
      text: `Poor, ${result.score.toFixed(1)} out of 10. On a 5% sample of ${n(sample)} ${type.many} it flagged ${n(flagged)}, about 1 in 5, and most of those look normal.`,
      why: "It watches 5 or more values. Several move together, like Standard rate with Rate and Tax amount with Cost, so the model sees noise instead of a pattern. Watching 2 values usually fixes it.",
    }
    : {
      text: `Good, ${result.score.toFixed(1)} out of 10. On a 5% sample of ${n(sample)} ${type.many} it flagged ${n(flagged)}, about 7 in 100.`,
      why: `In a test with planted problems it found about 6 in 10 of them, and about 6 in 10 of its flags were real. So expect a few false flags each week, which the hold queue lets a person clear.`,
    };
}
