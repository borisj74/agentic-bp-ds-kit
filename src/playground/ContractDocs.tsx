import { Icon } from "@/ui/Icon/Icon";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import styles from "./contractDocs.module.css";
import type { Contract } from "./Master";
import { contractFile, defaults, importLine, notUseText, propNote, splitDoNot } from "./contractRules";

/**
 * Code text in a props cell. A maxWidth column cuts its value off with an ellipsis, and the Table does that to
 * the span inside the cell's own wrapper, so code text keeps that shape: a wrapper with the text inside it.
 * The title carries the whole value on hover, the way a Cell's does.
 */
function Mono({ text }: { text: string }) {
  return (
    <span className={styles.monoWrap}>
      <span className={styles.mono} title={text}>{text}</span>
    </span>
  );
}

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

// Widths in px, not percentages: a prop's type can be a long enum union, and with percentages the table gives
// that column the room by taking it off the name beside it, so the names run into the types. Every column has a
// maxWidth as well, so a long union or note ends with an ellipsis and the table keeps to its box.
const PROP_COLUMNS: TableColumn[] = [
  { key: "name", header: "Name", emphasis: true, width: "160px", maxWidth: "160px" },
  { key: "type", header: "Type", width: "170px", maxWidth: "170px" },
  { key: "required", header: "Required", width: "96px" },
  { key: "default", header: "Default", width: "190px", maxWidth: "190px" },
  // Notes are prose. A Table cell keeps its value on one line, so the column takes about half the table and a long note ends
  // with an ellipsis; the whole note stays in the cell for screen readers and shows on hover. Only a plain string
  // value truncates that way, so notes stay strings while name, type and default are code text in their own width.
  { key: "notes", header: "Notes", maxWidth: "640px" },
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
    name: <Mono text={name} />,
    type: <Mono text={p.enum ? p.enum.map(String).join(" | ") : p.type ?? "—"} />,
    required: p.required ? "Yes" : "No",
    default: p.default === undefined ? "—" : <Mono text={defaultRows.find((d) => d.name === name)?.value ?? "—"} />,
    notes: propNote(p) || "—",
  }));

  return (
    <div className={styles.docs}>
      {(useWhen.length > 0 || notUse.length > 0) && (
        <div className={styles.whenPair}>
          {[
            { title: "When to use", icon: "check_circle", intent: "success" as const, items: useWhen.map((rule) => rule.replace(/\.$/, "")) },
            { title: "When not to use", icon: "cancel", intent: "danger" as const, items: notUse.map(notUseText) },
          ].filter((column) => column.items.length > 0).map((column) => (
            <section key={column.title} className={styles.when}>
              <h2 className={styles.whenTitle}>{column.title}</h2>
              <ul className={styles.whenList}>
                {column.items.map((item) => (
                  <li key={item} className={styles.whenItem}>
                    <Icon name={column.icon} size="sm" intent={column.intent} className={styles.whenIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* The contract as an agent reads it: the a11y it must keep, the defaults it inherits, and where it stops. */}
      <section className={styles.agent} aria-labelledby={`${contract.name}-agent`}>
        <div className={styles.agentHead}>
          <h2 id={`${contract.name}-agent`} className={styles.agentTitle}>What an agent reads</h2>
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
          <h2 className={styles.whenTitle}>Props</h2>
          <Table size="sm" columns={PROP_COLUMNS} rows={propRows} caption={`${contract.name} props`} />
        </section>
      )}
    </div>
  );
}
