import { Accordion } from "@/ui/Accordion/Accordion";
import { Callout } from "@/ui/Callout/Callout";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { Table } from "@/ui/Table/Table";
import { FIELD_VALUES, INVOICES_FOUND, INVOICES_TOTAL, PERIOD_START, SAMPLE_INVOICES } from "../anomaly-detection/data";
import type { RecordType } from "../anomaly-detection-nodes/graph";
import { cycleOf, watchedValues, type Rule } from "./tree";

// What the rule will train on, before training starts. The wording follows the wizard's Check data step.

const PROFILES_FOUND = 1206;
interface Row { id: string; record: string; group: string; closed: string; [value: string]: string }
const invoiceRows: Row[] = SAMPLE_INVOICES.map((i) => ({ id: i.id, record: i.invoice, group: i.profile, closed: i.closed, rate: i.rate, qty: i.qty, cost: i.cost }));
// Sample rows for the record types the review hasn't covered yet.
const SAMPLES: Record<string, Row[]> = {
  "usage record": [
    { id: "1", record: "USG-88213", group: "Acme Corporation", closed: "31 Oct 2026", volume: "12,400", ratedAmount: "$1,240.00" },
    { id: "2", record: "USG-88190", group: "Globex Industries", closed: "31 Oct 2026", volume: "8,050", ratedAmount: "$644.00" },
    { id: "3", record: "USG-87955", group: "Vertex Systems", closed: "30 Sep 2026", volume: "30,200", ratedAmount: "$2,718.00" },
  ],
  quote: [
    { id: "1", record: "Q-40218", group: "Acme Corporation", closed: "28 Oct 2026", quoteTotal: "$48,000.00", discount: "10%", },
    { id: "2", record: "Q-40177", group: "Quantum Dynamics", closed: "14 Oct 2026", quoteTotal: "$12,500.00", discount: "5%" },
    { id: "3", record: "Q-40102", group: "BlueOcean Strategies", closed: "30 Sep 2026", quoteTotal: "$96,300.00", discount: "22%" },
  ],
};

export function CheckData({ rule, lead, matching, type }: { rule: Rule; lead: string; matching: number; type: RecordType }) {
  const { lookback } = rule.start;
  const cycle = cycleOf(rule);
  const cycleLabel = FIELD_VALUES.cycle.find((o) => o.value === cycle)?.label;
  const rows = (SAMPLES[type.one] ?? invoiceRows).filter((i) => !cycleLabel || i.group.endsWith(cycleLabel));
  const watched = watchedValues(rule);
  const One = type.one.charAt(0).toUpperCase() + type.one.slice(1);
  return (
    <div className="layout-stack">
      <Callout closeButton intent="success" title="Ready to train">{lead} Nothing happens to {type.many} until you turn it on.</Callout>
      <Section title={`${type.label} that will be used`}>
        <Scoreboard
          label={`${type.label} that will be used`}
          items={[
            { id: "match", title: `${type.label} that match`, metric: matching.toLocaleString("en-US"), metadata: `of ${INVOICES_TOTAL.toLocaleString("en-US")} ${type.many}` },
            { id: "groups", title: type.group, metric: Math.round((PROFILES_FOUND * matching) / INVOICES_FOUND).toLocaleString("en-US") },
            { id: "period", title: "Look back", metric: `${lookback} months`, metadata: `${PERIOD_START[lookback]} to 31 Oct 2026` },
          ]}
        />
      </Section>
      <Section title="Sample">
        <Table
          caption={`Sample ${type.many}`}
          columns={[
            { key: "record", header: One, emphasis: true },
            { key: "group", header: type.groupOne },
            { key: "closed", header: "Date" },
            ...watched.map((v) => ({ key: v.field, header: `${type.values.find((o) => o.value === v.field)?.label} (${v.agg === "avg" ? "avg" : "sum"})`, numeric: true })),
          ]}
          rows={rows.map((i) => ({
            id: i.id, record: i.record, group: i.group, closed: i.closed,
            ...Object.fromEntries(watched.map((v) => [v.field, i[v.field] ?? "—"])),
          }))}
        />
        <Accordion
          items={[{ id: "training", title: "What happens when you train", content: `The model learns from a 5% sample of these ${type.many}. It usually takes 10 minutes to an hour and keeps running if you leave the page.` }]}
        />
      </Section>
    </div>
  );
}
