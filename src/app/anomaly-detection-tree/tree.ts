import { FLAG_COUNTS, INVOICES_FOUND, INVOICES_TOTAL, SEED_CONFIGS, type Result, type Status } from "../anomaly-detection/data";
import { blockLabel, blockUnset, freshId, newBlock, outputs, recordOf, seedGraph, type ActionBlock, type Block, type BlockKind, type Graph, type InvoicesBlock, type Link, type WatchRow } from "../anomaly-detection-nodes/graph";

// The rule as a tree: a list of steps, where a Condition or a Model ends its list and splits into paths.
// There is nothing to arrange or wire up, so a rule can't have loose blocks or broken lines.

export interface Path { id: string; key: string; label: string; steps: Step[] }
export type Step = Block & { paths?: Path[] };
export interface Rule { name: string; start: InvoicesBlock; steps: Step[]; blank?: boolean }
export interface Spot { seq: string; index: number; inModelPath: boolean; hasAction: boolean; hasNext: boolean; end: boolean }
export interface BuildItem { id: string; kind: BlockKind; act?: string; label: string; icon: string }

export const ROOT = "root";

export function seedRule(): Rule {
  const seed = seedGraph();
  const find = (id: string) => seed.nodes.find((n) => n.id === id)!;
  return {
    name: seed.name,
    start: find("start") as InvoicesBlock,
    steps: [{
      ...find("monthly"),
      paths: [
        {
          id: "monthly-yes", key: "yes", label: "Yes",
          steps: [find("per"), find("watch"), {
            ...find("model"),
            paths: [
              { id: "model-duplicate", key: "Duplicate charge", label: "Duplicate charge", steps: [find("hold")] },
              { id: "model-otherwise", key: "otherwise", label: "Otherwise", steps: [find("flag")] },
            ],
          }],
        },
        { id: "monthly-no", key: "no", label: "No", steps: [] },
      ],
    }],
  };
}

export const blankRule = (name = ""): Rule => ({ name, start: newBlock("invoices", 0, 0) as InvoicesBlock, steps: [], blank: true });

// One rule in the list and how far its run has got. Runs live here, above the screens, so they keep going when someone leaves.
export type Stage = "build" | "training" | "results" | "applying" | "ready" | "on";
export interface RuleRecord {
  id: string; rule: Rule; stage: Stage; progress: number; paused: boolean; live: boolean;
  held: boolean; detailsFor: Stage | null; result: Result | null; trained: string;
}
const STAGE_OF: Record<Status, Stage> = {
  draft: "build", stopped: "build", training: "training", results: "results", needsChanges: "results",
  applying: "applying", ready: "ready", active: "on", paused: "on",
};
export const newRecord = (rule: Rule): RuleRecord => ({
  id: freshId("rule"), rule, stage: "build", progress: 0, paused: false, live: false, held: false, detailsFor: null, result: null, trained: "—",
});
// The same sample rules as the wizard's list, each holding the example tree under its own name.
export const seedRecords = (): RuleRecord[] => SEED_CONFIGS.map((c) => {
  const rule = { ...seedRule(), name: c.setup.name };
  return { ...newRecord(rule), id: c.id, stage: STAGE_OF[c.status], progress: c.progress, trained: c.trained, result: c.trained === "—" ? null : resultOf(rule) };
});

// What a rule still needs next and where it goes: the first required step its first unfinished path doesn't have.
export function nextNeeded(rule: Rule): { seq: string; index: number; kind: BlockKind } | null {
  const walk = (steps: Step[], seq: string, before: BlockKind[]): { seq: string; index: number; kind: BlockKind } | null => {
    const seen = [...before, ...steps.map((s) => s.kind)];
    const last = steps[steps.length - 1];
    if (last?.kind === "model") return null;
    if (last?.paths) {
      const built = last.paths.filter((p) => p.steps.length);
      for (const p of built.length ? built : last.paths.slice(0, 1)) {
        const hit = walk(p.steps, p.id, seen);
        if (hit) return hit;
      }
      return null;
    }
    const kind = (["comparePer", "values", "model"] as BlockKind[]).find((k) => !seen.includes(k));
    return kind ? { seq, index: steps.length, kind } : null;
  };
  return walk(rule.steps, ROOT, []);
}

// Why this kind of step can't go at this spot, or null when it can.
export function whyNot(kind: BlockKind, spot: Spot): string | null {
  if (spot.inModelPath) {
    if (kind !== "action") return "After the Model, only an Action can follow.";
    if (spot.hasAction) return "This path already has an Action.";
    return null;
  }
  if (kind === "action") return "An Action needs a flag to act on, so it goes after the Model.";
  if (kind === "invoices") return "Every rule already starts from Invoices.";
  if (kind === "model" && spot.hasNext) return "The Model ends a path, so it can only go at the end.";
  return null;
}

// Every place a step could go, top to bottom. A list that ends in a split has no place after the split.
export function spots(rule: Rule): Spot[] {
  const found: Spot[] = [];
  const walk = (seq: string, steps: Step[], inModelPath: boolean) => {
    const hasAction = steps.some((s) => s.kind === "action");
    if (inModelPath) {
      if (!steps.length) found.push({ seq, index: 0, inModelPath, hasAction, hasNext: false, end: true });
    } else {
      steps.forEach((_, index) => found.push({ seq, index, inModelPath, hasAction, hasNext: true, end: false }));
      if (!steps[steps.length - 1]?.paths) found.push({ seq, index: steps.length, inModelPath, hasAction, hasNext: false, end: true });
    }
    steps.forEach((s) => s.paths?.forEach((p) => walk(p.id, p.steps, s.kind === "model")));
  };
  walk(ROOT, rule.steps, false);
  return found;
}
export const spotId = (s: { seq: string; index: number }) => `${s.seq}:${s.index}`;

// Where a pressed block goes: straight after the selected step if it can, else the first open end, else anywhere it fits.
export function bestSpot(rule: Rule, kind: BlockKind, selected: string | null): Spot | null {
  const legal = spots(rule).filter((s) => !whyNot(kind, s));
  if (selected) {
    const after = findAfter(rule.steps, ROOT, selected);
    const match = after && legal.find((s) => s.seq === after.seq && s.index === after.index);
    if (match) return match;
  }
  return legal.find((s) => s.end) ?? legal[0] ?? null;
}
function findAfter(steps: Step[], seq: string, id: string): { seq: string; index: number } | null {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].id === id) return { seq, index: i + 1 };
    for (const p of steps[i].paths ?? []) {
      const hit = findAfter(p.steps, p.id, id);
      if (hit) return hit;
    }
  }
  return null;
}

const mapSteps = (steps: Step[], fn: (s: Step) => Step): Step[] =>
  steps.map((s) => fn(s.paths ? { ...s, paths: s.paths.map((p) => ({ ...p, steps: mapSteps(p.steps, fn) })) } : s));

const updateSeq = (rule: Rule, seq: string, fn: (steps: Step[]) => Step[]): Rule => {
  if (seq === ROOT) return { ...rule, steps: fn(rule.steps) };
  const inside = (steps: Step[]): Step[] =>
    steps.map((s) => (s.paths ? { ...s, paths: s.paths.map((p) => (p.id === seq ? { ...p, steps: fn(p.steps) } : { ...p, steps: inside(p.steps) })) } : s));
  return { ...rule, steps: inside(rule.steps) };
};

const newPath = (key: string, label: string, steps: Step[] = []): Path => ({ id: freshId("path"), key, label, steps });

// Add a step. A new Condition takes everything after it onto its Yes path, so nothing already built is lost.
export function insertStep(rule: Rule, seq: string, index: number, item: BuildItem): { rule: Rule; id: string } {
  const block = newBlock(item.kind, 0, 0);
  const id = block.id;
  const made: Step = item.act ? ({ ...block, act: item.act } as ActionBlock)
    : block.kind === "comparePer" ? { ...block, per: [recordOf(rule.start.record).compare[0].value] } : block;
  return {
    id,
    rule: updateSeq(rule, seq, (steps) => {
      const before = steps.slice(0, index);
      const after = steps.slice(index);
      if (item.kind === "condition") return [...before, { ...made, paths: [newPath("yes", "Yes", after), newPath("no", "No")] }];
      if (item.kind === "model") return [...before, { ...made, paths: [newPath("otherwise", "Any flag")] }];
      return [...before, made, ...after];
    }),
  };
}

// Take a step out. A Condition's Yes path closes back up in its place; its No path goes with it.
export function removeStep(rule: Rule, id: string): Rule {
  const without = (steps: Step[]): Step[] =>
    steps.flatMap((s) => {
      if (s.id === id) return s.kind === "condition" ? s.paths!.find((p) => p.key === "yes")!.steps : [];
      return [s.paths ? { ...s, paths: s.paths.map((p) => ({ ...p, steps: without(p.steps) })) } : s];
    });
  return { ...rule, steps: without(rule.steps) };
}

function locate(steps: Step[], seq: string, id: string): { seq: string; index: number; step: Step } | null {
  for (let index = 0; index < steps.length; index++) {
    if (steps[index].id === id) return { seq, index, step: steps[index] };
    for (const p of steps[index].paths ?? []) {
      const hit = locate(p.steps, p.id, id);
      if (hit) return hit;
    }
  }
  return null;
}
const seqsWithin = (paths: Path[]): string[] =>
  paths.flatMap((p) => [p.id, ...p.steps.flatMap((s) => seqsWithin(s.paths ?? []))]);

// A Condition only moves its decision: its Yes path closes up where it was, as on delete, and what follows the new spot goes onto Yes.
const yesPath = (s: Step) => (s.kind === "condition" ? s.paths?.find((p) => p.key === "yes") : undefined);

// Dropping a step just above or below itself changes nothing.
function staysPut(rule: Rule, id: string, spot: { seq: string; index: number }) {
  const from = locate(rule.steps, ROOT, id);
  if (!from) return true;
  if (from.seq === spot.seq && (spot.index === from.index || spot.index === from.index + 1)) return true;
  return yesPath(from.step)?.id === spot.seq && spot.index === 0;
}

// Why this step can't move to this spot, or null when it can.
export function moveRefusal(rule: Rule, id: string, spot: Spot): string | null {
  if (staysPut(rule, id, spot)) return null;
  const step = locate(rule.steps, ROOT, id)!.step;
  const own = (step.paths ?? []).filter((p) => p.key !== "yes" || step.kind !== "condition");
  if (seqsWithin(own).includes(spot.seq)) return "A step can't move inside its own path.";
  return whyNot(step.kind, spot);
}

export function moveStep(rule: Rule, id: string, seq: string, index: number): Rule {
  if (staysPut(rule, id, { seq, index })) return rule;
  const from = locate(rule.steps, ROOT, id)!;
  const yes = yesPath(from.step);
  let toSeq = seq;
  let toIndex = index;
  if (yes && seq === yes.id) { toSeq = from.seq; toIndex = from.index + index; }
  else if (seq === from.seq && index > from.index) toIndex = index - 1;
  const lifted = updateSeq(rule, from.seq, (steps) => [...steps.slice(0, from.index), ...(yes?.steps ?? []), ...steps.slice(from.index + 1)]);
  return updateSeq(lifted, toSeq, (steps) => {
    const before = steps.slice(0, toIndex);
    const after = steps.slice(toIndex);
    if (yes) return [...before, { ...from.step, paths: from.step.paths!.map((p) => (p.id === yes.id ? { ...p, steps: after } : p)) }];
    return [...before, from.step, ...after];
  });
}

export function patchStep(rule: Rule, id: string, patch: Partial<Block>): Rule {
  if (id === rule.start.id) return { ...rule, start: { ...rule.start, ...patch } as InvoicesBlock };
  return { ...rule, steps: mapSteps(rule.steps, (s) => (s.id === id ? ({ ...s, ...patch } as Step) : s)) };
}

// Change which anomaly types a Model splits out. Paths it keeps hold on to their Actions.
export function setModelBranches(rule: Rule, id: string, branches: string[]): Rule {
  return {
    ...rule,
    steps: mapSteps(rule.steps, (s) => {
      if (s.id !== id || s.kind !== "model") return s;
      const shaped = { ...s, branches };
      const paths = outputs(shaped).map((o) => {
        const had = s.paths?.find((p) => p.key === o.id);
        return had ? { ...had, label: o.label } : newPath(o.id, o.label);
      });
      return { ...shaped, paths };
    }),
  };
}

export function findStep(rule: Rule, id: string | null): Step | null {
  if (!id) return null;
  if (id === rule.start.id) return rule.start;
  let hit: Step | null = null;
  mapSteps(rule.steps, (s) => { if (s.id === id) hit = s; return s; });
  return hit;
}

// What stops this rule being trained, top to bottom, each with the card to go and fix.
export function missingSteps(rule: Rule): { id: string; text: string }[] {
  const found: { id: string; text: string }[] = [];
  const walk = (steps: Step[], before: BlockKind[], from: string) => {
    if (!steps.length) { found.push({ id: from, text: "Add a Model, so the rule can find anomalies." }); return; }
    const seen = [...before];
    for (const s of steps) {
      if (blockUnset(s)) found.push({ id: s.id, text: `${blockLabel(s.kind)} needs filling in.` });
      if (s.kind === "model") {
        (["comparePer", "values"] as BlockKind[]).filter((k) => !seen.includes(k)).forEach((k) => found.push({ id: s.id, text: `The Model needs ${blockLabel(k)} before it.` }));
        return;
      }
      if (s.paths) {
        const built = s.paths.filter((p) => p.steps.length);
        if (!built.length) found.push({ id: s.id, text: "Nothing follows this Condition yet. Add a Model on one of its paths." });
        built.forEach((p) => walk(p.steps, [...seen, s.kind], s.id));
        return;
      }
      seen.push(s.kind);
    }
    found.push({ id: steps[steps.length - 1].id, text: "This path stops before it reaches a Model." });
  };
  walk(rule.steps, [], rule.start.id);
  if (!rule.name.trim()) found.push({ id: rule.start.id, text: `Give this rule a name, in ${recordOf(rule.start.record).label}.` });
  return found;
}

// Every value the rule watches, once each, for the Check data sample.
export function watchedValues(rule: Rule): WatchRow[] {
  const rows = new Map<string, WatchRow>();
  mapSteps(rule.steps, (s) => { if (s.kind === "values") s.rows.filter((r) => r.field).forEach((r) => { if (!rows.has(r.field)) rows.set(r.field, r); }); return s; });
  return [...rows.values()];
}

// The billing cycle a rule narrows to, so the sample doesn't show invoices its Condition would leave out.
export function cycleOf(rule: Rule): string | null {
  let cycle: string | null = null;
  mapSteps(rule.steps, (s) => { if (s.kind === "condition" && s.field === "cycle" && s.op === "is" && s.value) cycle = s.value; return s; });
  return cycle;
}

// Sample scores. Too many values adds noise, as in the wizard's Poor result.
const TOO_MANY_VALUES = 5;
export function resultOf(rule: Rule): Result {
  let poor = false;
  mapSteps(rule.steps, (s) => { if (s.kind === "values" && s.rows.filter((r) => r.field).length >= TOO_MANY_VALUES) poor = true; return s; });
  return poor ? { kind: "poor", score: 3.1 } : { kind: "good", score: 7.8 };
}

export interface Counts { steps: Map<string, number>; paths: Map<string, number>; checked: number }
const SAMPLE_SHARE = 0.05;
const YES_SHARE = INVOICES_FOUND / INVOICES_TOTAL;
const FLAG_RATE = { good: 0.07, fair: 0.07, poor: 0.18 };
const FLAG_TOTAL = Object.values(FLAG_COUNTS).reduce((a, b) => a + b, 0);
const OTHER_FLAG_SHARE = 0.25;

// Sample counts for the tree: how many invoices reach each step and go down each path, so they always add up.
export function countRule(rule: Rule, scope: "sample" | "all", result: Result): Counts {
  const counts: Counts = { steps: new Map(), paths: new Map(), checked: 0 };
  const walk = (steps: Step[], reaching: number) => {
    for (const s of steps) {
      if (s.kind === "model") {
        const flagged = Math.round(reaching * FLAG_RATE[result.kind]);
        counts.checked += reaching;
        counts.steps.set(s.id, flagged);
        let left = flagged;
        s.paths?.filter((p) => p.key !== "otherwise").forEach((p) => {
          const n = Math.round(flagged * (p.key in FLAG_COUNTS ? FLAG_COUNTS[p.key] / FLAG_TOTAL : OTHER_FLAG_SHARE));
          counts.paths.set(p.id, n);
          left -= n;
        });
        s.paths?.filter((p) => p.key === "otherwise").forEach((p) => counts.paths.set(p.id, left));
        return;
      }
      if (s.kind === "condition" && s.paths) {
        const yes = Math.round(reaching * YES_SHARE);
        s.paths.forEach((p) => {
          const n = p.key === "yes" ? yes : reaching - yes;
          counts.paths.set(p.id, n);
          walk(p.steps, n);
        });
        return;
      }
    }
  };
  const start = Math.round(INVOICES_TOTAL * (scope === "sample" ? SAMPLE_SHARE : 1));
  counts.steps.set(rule.start.id, start);
  walk(rule.steps, start);
  return counts;
}

// The same rule as the free canvas's graph, so both prototypes say the same thing in words.
export function toGraph(rule: Rule): Graph {
  const nodes: Block[] = [rule.start];
  const links: Link[] = [];
  const link = (from: string, port: string, to: string) => links.push({ id: `${from}:${port}`, from, port, to });
  const walk = (steps: Step[], from: string, port: string) => {
    let source = from;
    let out = port;
    for (const s of steps) {
      nodes.push(s);
      link(source, out, s.id);
      source = s.id;
      out = "out";
      s.paths?.forEach((p) => walk(p.steps, s.id, p.key));
    }
  };
  walk(rule.steps, rule.start.id, "out");
  return { name: rule.name, nodes, links, record: rule.start.record };
}
