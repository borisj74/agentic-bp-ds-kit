"use client";
import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { Cell, type CellAlignment, type CellSize } from "../Cell/Cell";
import { HeaderCell, type HeaderCellLine } from "../HeaderCell/HeaderCell";
import styles from "./Table.module.css";

export interface TableColumn {
  key: string;
  header?: string;
  align?: CellAlignment;
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
  line?: HeaderCellLine;
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
  columns, rows, size: ownSize, line = "medium", caption, footer, emptyLabel = "No results.",
  selectable = false, selected: selectedProp, defaultSelected = [], onSelectionChange, rowLabel, onRowClick,
}: TableProps) {
  // A surrounding Density changes the row through the density tokens, not the size.
  const size = ownSize ?? "md";
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectedProp ?? innerSelected;
  // A table wider than its box scrolls sideways; then the box is a focus stop so the arrow keys scroll it (WCAG 2.1.1).
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  const ids = rows.map(idOf);
  const picked = ids.filter((id) => selected.includes(id));
  const all = ids.length > 0 && picked.length === ids.length;
  const span = columns.length + (selectable ? 1 : 0);
  const labelKey = rowLabel ?? columns[0]?.key;
  const alignOf = (c: TableColumn): CellAlignment => c.align ?? (c.numeric ? "end" : "start");

  const select = (next: string[]) => {
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectionChange?.(next);
  };
  const toggleRow = (id: string, on: boolean) => select(on ? [...selected, id] : selected.filter((s) => s !== id));
  // Select all adds every row on this table; clearing removes only them.
  const toggleAll = (on: boolean) => select(on ? [...new Set([...selected, ...ids])] : selected.filter((s) => !ids.includes(s)));

  const value = (v: ReactNode, c: TableColumn) =>
    isValidElement(v) ? v : <Cell size={size} alignment={alignOf(c)} label={v === null || v === undefined ? "" : String(v)} />;

  return (
    <div
      ref={wrapRef} className={styles.wrap}
      tabIndex={overflows ? 0 : undefined} role={overflows ? "region" : undefined} aria-label={overflows ? caption ?? "Table" : undefined}
    >
      <table className={[styles.table, styles[size], line === "thin" ? styles.thin : ""].join(" ")}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className={styles.select}>
                <HeaderCell
                  size={size} line={line} alignment="center" checkbox checked={all} indeterminate={picked.length > 0 && !all}
                  onCheckedChange={toggleAll}
                />
              </th>
            )}
            {columns.map((c) => c.header ? (
              <th key={c.key} scope="col" style={c.width ? { width: c.width } : undefined}>
                <HeaderCell size={size} line={line} alignment={alignOf(c)} label={c.header} />
              </th>
            ) : (
              // A column with nothing to name, like row actions: a plain cell, so screen readers meet no empty header.
              <td key={c.key} style={c.width ? { width: c.width } : undefined} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={span} className={styles.empty}><Cell size={size} alignment="center" label={emptyLabel} /></td>
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
                    <Cell size={size} type="checkbox" alignment="center" label={name || `row ${i + 1}`} checked={on} onCheckedChange={(v) => toggleRow(id, v)} />
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
