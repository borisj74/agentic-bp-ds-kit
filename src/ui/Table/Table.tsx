"use client";
import { isValidElement, useState, type ReactNode } from "react";
import { Cell, type CellAlign, type CellSize } from "../Cell/Cell";
import { useDensity } from "../Density/Density";
import { HeaderCell } from "../HeaderCell/HeaderCell";
import styles from "./Table.module.css";

export interface TableColumn {
  key: string;
  header?: string;
  align?: CellAlign;
  numeric?: boolean;
  emphasis?: boolean;
  width?: string;
}
export type TableRow = { id?: string } & Record<string, ReactNode>;
export interface TableFooter { label: string; value: ReactNode }

export interface TableProps {
  columns: TableColumn[];
  rows: TableRow[];
  size?: CellSize;
  caption?: string;
  footer?: TableFooter;
  emptyLabel?: string;
  selectable?: boolean;
  selected?: string[];
  defaultSelected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowLabel?: string;
  onRowClick?: (id: string, row: TableRow) => void;
}

const idOf = (row: TableRow, i: number) => row.id ?? String(i);

// One table: headers are kit HeaderCells, values kit Cells. The rows carry the lines and the hover and selected
// fills, so cells of different heights in one row still line up.
export function Table({
  columns, rows, size: ownSize, caption, footer, emptyLabel = "No results.",
  selectable = false, selected: selectedProp, defaultSelected = [], onSelectionChange, rowLabel, onRowClick,
}: TableProps) {
  const density = useDensity();
  const size = ownSize ?? (density === "compact" ? "sm" : "md");
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectedProp ?? innerSelected;
  const ids = rows.map(idOf);
  const picked = ids.filter((id) => selected.includes(id));
  const all = ids.length > 0 && picked.length === ids.length;
  const span = columns.length + (selectable ? 1 : 0);
  const labelKey = rowLabel ?? columns[0]?.key;
  const alignOf = (c: TableColumn): CellAlign => c.align ?? (c.numeric ? "end" : "start");

  const select = (next: string[]) => {
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectionChange?.(next);
  };
  const toggleRow = (id: string, on: boolean) => select(on ? [...selected, id] : selected.filter((s) => s !== id));
  // Select all adds every row on this table; clearing removes only them.
  const toggleAll = (on: boolean) => select(on ? [...new Set([...selected, ...ids])] : selected.filter((s) => !ids.includes(s)));

  const value = (v: ReactNode, c: TableColumn) =>
    isValidElement(v) ? v : <Cell size={size} align={alignOf(c)} label={v === null || v === undefined ? "" : String(v)} />;

  return (
    <div className={styles.wrap}>
      <table className={[styles.table, styles[size]].join(" ")}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className={styles.select}>
                <HeaderCell
                  size={size} align="center" checkbox checked={all} indeterminate={picked.length > 0 && !all}
                  onCheckedChange={toggleAll}
                />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} scope="col" style={c.width ? { width: c.width } : undefined}>
                <HeaderCell size={size} align={alignOf(c)} label={c.header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={span} className={styles.empty}><Cell size={size} align="center" label={emptyLabel} /></td>
            </tr>
          ) : rows.map((row, i) => {
            const id = idOf(row, i);
            const on = selected.includes(id);
            const name = labelKey && typeof row[labelKey] !== "object" ? String(row[labelKey] ?? "") : "";
            return (
              <tr
                key={id} className={[on ? styles.selected : "", onRowClick ? styles.clickable : ""].join(" ") || undefined} aria-selected={selectable ? on : undefined}
                // A pointer shortcut: clicks on the row's own controls (its link, checkbox or buttons) act on their own.
                onClick={onRowClick ? (e) => { if (!(e.target as HTMLElement).closest("a, button, input, label, select, textarea")) onRowClick(id, row); } : undefined}
              >
                {selectable && (
                  <td className={styles.select}>
                    <Cell size={size} type="checkbox" align="center" label={name || `row ${i + 1}`} checked={on} onCheckedChange={(v) => toggleRow(id, v)} />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={[c.numeric ? styles.numeric : "", c.emphasis ? styles.emphasis : ""].join(" ")}>
                    {value(row[c.key], c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {footer && rows.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={span - 1} className={styles.emphasis}><Cell size={size} label={footer.label} /></td>
              <td className={[styles.emphasis, styles.numeric].join(" ")}>
                {value(footer.value, { key: "footer", numeric: true })}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
