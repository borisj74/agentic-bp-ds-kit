"use client";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { useDensity } from "../Density/Density";
import { FormulaEditor, type FormulaField } from "../FormulaEditor/FormulaEditor";
import { HeaderCell } from "../HeaderCell/HeaderCell";
import { Input } from "../Input/Input";
import { Select, type SelectOption } from "../Select/Select";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./DataGrid.module.css";

export type DataGridColumnType = "text" | "number" | "select" | "formula";
export type DataGridSize = "sm" | "md";
export interface DataGridColumn {
  key: string;
  header: string;
  type?: DataGridColumnType;
  options?: SelectOption[];
  placeholder?: string;
  readOnly?: boolean;
  hug?: boolean;
  width?: string;
  fields?: FormulaField[];
  onCalculate?: (formula: string) => string;
}
export type DataGridRow = { id: string } & Record<string, string>;

export interface DataGridProps {
  columns: DataGridColumn[];
  rows?: DataGridRow[];
  defaultRows?: DataGridRow[];
  onRowsChange?: (rows: DataGridRow[]) => void;
  size?: DataGridSize;
  rowNumbers?: boolean;
  canAddRows?: boolean;
  canRemoveRows?: boolean;
  emptyLabel?: string;
  label?: string;
}

type Spot = { row: string; key: string };
const spotSelector = (s: Spot) => `[data-cell="${CSS.escape(`${s.row}:${s.key}`)}"]`;

// Figma data-grid 4350:109705. A cell shows its value as a button; clicking it (or Enter) swaps in a kit editor.
// Text and number save on Enter or when focus leaves; formula cells stay open until Done or Escape.
export function DataGrid({
  columns, rows: rowsProp, defaultRows = [], onRowsChange, size: ownSize, rowNumbers = true,
  canAddRows = false, canRemoveRows = false, emptyLabel = "No rows yet.", label = "Data grid",
}: DataGridProps) {
  const density = useDensity();
  const size = ownSize ?? (density === "compact" ? "sm" : "md");
  const uid = useId();
  const added = useRef(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const returnTo = useRef<Spot | null>(null);
  const [innerRows, setInnerRows] = useState(defaultRows);
  const rows = rowsProp ?? innerRows;
  const [editing, setEditing] = useState<Spot | null>(null);
  const [draft, setDraft] = useState("");

  const commit = (next: DataGridRow[]) => {
    if (rowsProp === undefined) setInnerRows(next);
    onRowsChange?.(next);
  };
  const setValue = (row: string, key: string, value: string) =>
    commit(rows.map((r) => (r.id === row ? { ...r, [key]: value } : r)));

  // Opening a cell moves focus into its editor; closing it with the keyboard puts focus back on the cell.
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    if (editing) {
      // Text is selected, so typing replaces it, like a spreadsheet. A formula keeps its caret at the end.
      const field = table.querySelector(spotSelector(editing))?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
      field?.focus();
      if (field instanceof HTMLInputElement) field.select();
      else if (field) field.setSelectionRange(field.value.length, field.value.length);
    } else if (returnTo.current) {
      table.querySelector(spotSelector(returnTo.current))?.querySelector<HTMLElement>("button")?.focus();
      returnTo.current = null;
    }
  }, [editing]);

  const open = (row: DataGridRow, col: DataGridColumn) => {
    // Opening another cell saves the one that was open.
    if (editing) save(editing);
    setDraft(row[col.key] ?? "");
    setEditing({ row: row.id, key: col.key });
  };
  const save = (spot: Spot) => {
    const current = rows.find((r) => r.id === spot.row)?.[spot.key] ?? "";
    if (draft !== current) setValue(spot.row, spot.key, draft);
  };
  const close = (keep: boolean, refocus: boolean) => {
    if (!editing) return;
    if (keep) save(editing);
    if (refocus) returnTo.current = editing;
    setEditing(null);
  };

  const addRow = () => {
    added.current += 1;
    const row = { id: `${uid}-new-${added.current}`, ...Object.fromEntries(columns.map((c) => [c.key, ""])) } as DataGridRow;
    commit([...rows, row]);
    // The first cell that edits in place opens, so typing can start at once.
    const first = columns.find((c) => !c.readOnly && c.type !== "select");
    if (first) { setDraft(""); setEditing({ row: row.id, key: first.key }); }
  };
  const removeRow = (id: string) => {
    if (editing?.row === id) setEditing(null);
    commit(rows.filter((r) => r.id !== id));
  };

  const onEditorKey = (col: DataGridColumn) => (e: KeyboardEvent) => {
    // Menus inside the editor (Insert function, Select) mark their own Escape handled.
    if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); close(false, true); }
    else if (e.key === "Enter" && col.type !== "formula") { e.preventDefault(); close(true, true); }
  };
  // Text and number save when focus leaves the cell. Formula cells keep their portaled menus, so they only
  // close on Done, Escape or opening another cell.
  const onEditorBlur = (col: DataGridColumn) => (e: FocusEvent<HTMLElement>) => {
    if (col.type === "formula" || e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    close(true, false);
  };

  const span = columns.length + (rowNumbers ? 1 : 0) + (canRemoveRows ? 1 : 0);

  const cell = (row: DataGridRow, n: number, col: DataGridColumn) => {
    const value = row[col.key] ?? "";
    const name = `${col.header}, row ${n}`;
    const type = col.type ?? "text";
    const isEditing = editing?.row === row.id && editing.key === col.key;
    const cls = [type === "number" ? styles.numeric : "", isEditing ? styles.editing : "", col.readOnly ? styles.readOnly : "", col.hug ? styles.hugCell : ""].join(" ");

    let body;
    if (col.readOnly) {
      body = <span className={[styles.value, type === "formula" ? styles.mono : ""].join(" ")}>{value}</span>;
    } else if (type === "select") {
      // Always a kit Select, like the Figma cell with its arrow button.
      body = (
        <span className={styles.control}>
          <Select size="sm" hideLabel label={name} options={col.options ?? []} placeholder={col.placeholder} value={value} onChange={(v) => setValue(row.id, col.key, Array.isArray(v) ? v[0] ?? "" : v)} />
        </span>
      );
    } else if (isEditing && type === "formula") {
      body = (
        <span className={styles.formula}>
          <FormulaEditor
            size="sm" hideLabel label={name} placeholder={col.placeholder} value={draft} onChange={setDraft}
            fields={col.fields} onCalculate={col.onCalculate}
          />
          <span className={styles.done}>
            <Button variant="tertiary" size="sm" iconStart="check" onClick={() => close(true, true)}>Done</Button>
          </span>
        </span>
      );
    } else if (isEditing) {
      body = (
        <span className={styles.control}>
          <Input size="sm" hideLabel label={name} type={type === "number" ? "number" : "text"} placeholder={col.placeholder} value={draft} onChange={setDraft} />
        </span>
      );
    } else {
      body = (
        <button type="button" className={styles.cellButton} aria-label={`${name}: ${value || "empty"}`} onClick={() => open(row, col)}>
          <span className={[value ? styles.value : styles.placeholder, type === "formula" ? styles.mono : ""].join(" ")}>{value || col.placeholder}</span>
        </button>
      );
    }
    return (
      <td
        key={col.key} data-cell={`${row.id}:${col.key}`} className={cls}
        onKeyDown={isEditing ? onEditorKey(col) : undefined} onBlur={isEditing ? onEditorBlur(col) : undefined}
      >
        {body}
      </td>
    );
  };

  return (
    <div className={styles.grid}>
      <div className={styles.wrap}>
        <table ref={tableRef} className={[styles.table, styles[size]].join(" ")} aria-label={label}>
          <thead>
            <tr>
              {rowNumbers && <th scope="col" className={styles.hug}><HeaderCell size={size} align="center" label="#" /></th>}
              {columns.map((c) => (
                <th key={c.key} scope="col" className={c.hug ? styles.hug : styles.fill} style={c.width ? { width: c.width } : undefined}>
                  <HeaderCell size={size} align={c.type === "number" ? "end" : "start"} label={c.header} />
                </th>
              ))}
              {canRemoveRows && <th scope="col" className={styles.hug}><HeaderCell size={size} /><span className={styles.srOnly}>Remove</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={span} className={styles.empty}>{emptyLabel}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.id}>
                {rowNumbers && <td className={styles.index}>{i + 1}</td>}
                {columns.map((c) => cell(row, i + 1, c))}
                {canRemoveRows && (
                  <td className={styles.remove}>
                    <Tooltip content={`Remove row ${i + 1}`} placement="left">
                      <Button variant="tertiary" size="sm" iconOnly iconStart="delete" onClick={() => removeRow(row.id)}>{`Remove row ${i + 1}`}</Button>
                    </Tooltip>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canAddRows && (
        <div className={styles.add}>
          <Button variant="tertiary" size="sm" iconStart="add" onClick={addRow}>Add row</Button>
        </div>
      )}
    </div>
  );
}
