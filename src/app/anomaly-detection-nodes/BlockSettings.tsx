"use client";
import { DataGrid } from "@/ui/DataGrid/DataGrid";
import { Form } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { Section } from "@/ui/Section/Section";
import { Select } from "@/ui/Select/Select";
import { AGG_OPTIONS, ANOMALY_FILTER, COMPARE_OPTIONS, DATE_OPTIONS, FIELD_VALUES, LOOKBACK_OPTIONS, OP_OPTIONS } from "../anomaly-detection/data";
import { ACTION_OPTIONS, CONDITION_FIELDS, NO_VALUE_OPS, VALUE_OPTIONS, type Block, type Graph } from "./graph";

// One block's settings, for the Drawer. The rule's own name lives on the Invoices block.
export function BlockSettings({ node, graph, onName, onPatch, onBranches }: {
  node: Block; graph: Graph; onName: (name: string) => void; onPatch: (patch: Partial<Block>) => void; onBranches: (branches: string[]) => void;
}) {
  switch (node.kind) {
    case "invoices":
      return (
        <>
          <Section title="Settings" heading="sm" line="thin">
            <Form labelPosition="start">
              <Input label="Configuration name" value={graph.name} onChange={onName} />
              <Select label="Date field" options={DATE_OPTIONS} value={node.dateField} onChange={(v) => onPatch({ dateField: v as string })} />
              <Select label="How far back" options={LOOKBACK_OPTIONS} value={node.lookback} onChange={(v) => onPatch({ lookback: v as string })} />
            </Form>
          </Section>
          <Section title="Always the same" heading="sm" line="thin">
            <Form labelPosition="start">
              <div>
                <FormDisplay label="Record type" value="Invoice" />
                <FormDisplay label="Which invoices" value="Closed, original invoices only" />
              </div>
            </Form>
          </Section>
        </>
      );
    case "condition": {
      const noValue = NO_VALUE_OPS.includes(node.op);
      return (
        <Section title="Settings" heading="sm" line="thin">
          <Form labelPosition="start">
            <Select label="Field" placeholder="Pick a field" options={CONDITION_FIELDS} value={node.field ?? ""} onChange={(v) => onPatch({ field: v as string, value: "" })} />
            <Select label="Condition" options={OP_OPTIONS} value={node.op} onChange={(v) => onPatch({ op: v as string })} />
            {!noValue && (
              <Select
                label="Value" placeholder={node.field ? "Pick a value" : "Pick a field first"} disabled={!node.field}
                options={node.field ? FIELD_VALUES[node.field] : []} value={node.value} onChange={(v) => onPatch({ value: v as string })}
                hint="Only values this field can have."
              />
            )}
          </Form>
        </Section>
      );
    }
    case "comparePer":
      return (
        <Section title="Settings" heading="sm" line="thin">
          <Form labelPosition="start">
            <Select label="Compare per" multiple itemCheck="checkbox" placeholder="Pick at least one" options={COMPARE_OPTIONS} value={node.per} onChange={(v) => onPatch({ per: v as string[] })} />
          </Form>
        </Section>
      );
    case "values":
      return (
        <Section title="Values" heading="sm" line="thin">
          <DataGrid
            label="Values to watch" size="sm" rowNumbers={false} canAddRows canRemoveRows emptyLabel="No values yet. Add at least one."
            columns={[
              { key: "field", header: "Value", type: "select", options: VALUE_OPTIONS },
              { key: "agg", header: "Combine", type: "select", options: AGG_OPTIONS, width: "140px" },
            ]}
            rows={node.rows.map((r) => ({ id: r.id, field: r.field, agg: r.agg }))}
            onRowsChange={(rows) => onPatch({ rows: rows.map((r) => ({ id: r.id, field: r.field, agg: r.agg || "sum" })) })}
          />
        </Section>
      );
    case "model":
      return (
        <Section title="Settings" heading="sm" line="thin">
          <Form labelPosition="start">
            <Select
              label="Split out by anomaly type" multiple itemCheck="checkbox" placeholder="All flags go one way"
              options={ANOMALY_FILTER.map((a) => ({ value: a.id, label: a.label }))} value={node.branches} onChange={(v) => onBranches(v as string[])}
              hint="Each type gets its own output. Everything else leaves by Otherwise."
            />
          </Form>
        </Section>
      );
    case "action":
      return (
        <Section title="Settings" heading="sm" line="thin">
          <Form labelPosition="start">
            <Select label="What happens" options={ACTION_OPTIONS} value={node.act} onChange={(v) => onPatch({ act: v as string })} />
          </Form>
        </Section>
      );
  }
}
