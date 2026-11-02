import { Accordion } from "@/ui/Accordion/Accordion";
import { Callout } from "@/ui/Callout/Callout";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { Table } from "@/ui/Table/Table";
import { FIELD_VALUES, INVOICES_FOUND, INVOICES_TOTAL, PERIOD_START, SAMPLE_INVOICES } from "../anomaly-detection/data";
import { VALUE_OPTIONS } from "../anomaly-detection-nodes/graph";
import { cycleOf, watchedValues, type Rule } from "./tree";

// What the rule will train on, before training starts. The wording follows the wizard's Check data step.

const PROFILES_FOUND = 1206;
const SAMPLE_KEYS = ["rate", "qty", "cost"];

export function CheckData({ rule, lead, matching }: { rule: Rule; lead: string; matching: number }) {
  const { lookback } = rule.start;
  const cycle = cycleOf(rule);
  const cycleLabel = FIELD_VALUES.cycle.find((o) => o.value === cycle)?.label;
  const rows = SAMPLE_INVOICES.filter((i) => !cycleLabel || i.profile.endsWith(cycleLabel));
  const watched = watchedValues(rule);
  return (
    <div className="layout-stack">
      <Callout closeButton intent="success" title="Ready to train">{lead} Nothing happens to invoices until you turn it on.</Callout>
      <Section title="Invoices that will be used">
        <Scoreboard
          label="Invoices that will be used"
          items={[
            { id: "match", title: "Invoices that match", metric: matching.toLocaleString("en-US"), metadata: `of ${INVOICES_TOTAL.toLocaleString("en-US")} invoices` },
            { id: "profiles", title: "Billing profiles", metric: Math.round((PROFILES_FOUND * matching) / INVOICES_FOUND).toLocaleString("en-US") },
            { id: "period", title: "Look back", metric: `${lookback} months`, metadata: `${PERIOD_START[lookback]} to 31 Oct 2026` },
          ]}
        />
      </Section>
      <Section title="Sample">
        <Table
          caption="Sample invoices"
          columns={[
            { key: "invoice", header: "Invoice", emphasis: true },
            { key: "profile", header: "Billing profile" },
            { key: "closed", header: "Close date" },
            ...watched.map((v) => ({ key: v.field, header: `${VALUE_OPTIONS.find((o) => o.value === v.field)?.label} (${v.agg === "avg" ? "avg" : "sum"})`, numeric: true })),
          ]}
          rows={rows.map((i) => ({
            id: i.id, invoice: i.invoice, profile: i.profile, closed: i.closed,
            ...Object.fromEntries(watched.map((v) => [v.field, SAMPLE_KEYS.includes(v.field) ? i[v.field as "rate" | "qty" | "cost"] : "—"])),
          }))}
        />
        <Accordion
          items={[{ id: "training", title: "What happens when you train", content: "The model learns from a 5% sample of these invoices. It usually takes 10 minutes to an hour and keeps running if you leave the page." }]}
        />
      </Section>
    </div>
  );
}
