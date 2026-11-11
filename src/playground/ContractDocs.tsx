import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import styles from "./contractDocs.module.css";
import type { Contract } from "./Master";
import { contractFile, defaults, importLine, notUseText, propNote, splitDoNot } from "./contractRules";

/** One labelled row of the agent panel: a code label at the start, its bullets filling the rest. */
function AgentRow({ label, tint, items }: { label: string; tint: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.agentRow}>
      <code className={[styles.agentLabel, tint].join(" ")}>{label}</code>
      <ul className={styles.agentList}>
        {items.map((item) => (
          <li key={item} className={styles.agentItem}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const PROP_COLUMNS: TableColumn[] = [
  { key: "name", header: "Name", emphasis: true, width: "180px" },
  { key: "type", header: "Type", width: "200px" },
  { key: "required", header: "Required", width: "96px" },
  { key: "default", header: "Default", width: "160px" },
  // Notes are prose. A Table cell keeps its value on one line, so the column stops at 520px and a long note ends
  // with an ellipsis; the whole note stays in the cell for screen readers and shows on hover. Only a plain string
  // value truncates that way, so notes stay strings while name, type and default are code text in their own width.
  { key: "notes", header: "Notes", maxWidth: "520px" },
];

/**
 * The documentation half of a component or pattern page: when to use it, what an agent reads out of the
 * contract, and the props. Every line here comes from the contract file; nothing is written on the page.
 */
export function ContractDocs({ contract }: { contract: Contract }) {
  const { notUse, stops } = splitDoNot(contract.doNot);
  const useWhen = contract.useWhen ?? [];
  const defaultRows = defaults(contract);
  const propRows: TableRow[] = Object.entries(contract.props ?? {}).map(([name, p]) => ({
    id: name,
    name: <code className={styles.mono}>{name}</code>,
    type: <code className={styles.mono}>{p.enum ? p.enum.map(String).join(" | ") : p.type ?? "—"}</code>,
    required: p.required ? "Yes" : "No",
    default: p.default === undefined ? "—" : <code className={styles.mono}>{defaultRows.find((d) => d.name === name)?.value ?? "—"}</code>,
    notes: propNote(p) || "—",
  }));

  return (
    <div className={styles.docs}>
      {(useWhen.length > 0 || notUse.length > 0) && (
        <div className={styles.whenPair}>
          {useWhen.length > 0 && (
            <section className={styles.when}>
              <h3 className={styles.whenTitle}>When to use</h3>
              <ul className={styles.whenList}>
                {useWhen.map((rule) => <li key={rule}>{rule.replace(/\.$/, "")}</li>)}
              </ul>
            </section>
          )}
          {notUse.length > 0 && (
            <section className={styles.when}>
              <h3 className={styles.whenTitle}>When not to use</h3>
              <ul className={styles.whenList}>
                {notUse.map((rule) => <li key={rule}>{notUseText(rule)}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* The contract as an agent reads it: the a11y it must keep, the defaults it inherits, and where it stops. */}
      <section className={styles.agent} aria-labelledby={`${contract.name}-agent`}>
        <div className={styles.agentHead}>
          <h3 id={`${contract.name}-agent`} className={styles.agentTitle}>What an agent reads</h3>
          <code className={styles.agentImport}>{importLine(contract)}</code>
        </div>
        <AgentRow label="must" tint={styles.tintMust} items={contract.a11y ?? []} />
        <AgentRow label="defaults" tint={styles.tintDefaults} items={defaultRows.map((d) => `${d.name} ${d.value}`)} />
        <AgentRow label="stops if" tint={styles.tintStops} items={stops} />
        <p className={styles.agentFoot}>
          From <code className={styles.mono}>{contractFile(contract)}</code>: must is the a11y requirements,
          defaults the prop defaults, stops if the doNot rules where the agent asks instead of inventing a cousin.
        </p>
      </section>

      {propRows.length > 0 && (
        <section className={styles.props}>
          <h3 className={styles.whenTitle}>Props</h3>
          <Table size="sm" columns={PROP_COLUMNS} rows={propRows} caption={`${contract.name} props`} />
        </section>
      )}
    </div>
  );
}
