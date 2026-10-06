"use client";
import { Fragment, isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "../Button/Button";
import { Count } from "../Count/Count";
import { Cell, type CellAlignment, type CellSize } from "../Cell/Cell";
import { HeaderCell, type HeaderCellLine } from "../HeaderCell/HeaderCell";
import styles from "./Table.module.css";

export interface TableColumn {
  key: string;
  header?: string;
  alignment?: CellAlignment;
  numeric?: boolean;
  emphasis?: boolean;
  width?: string;
  maxWidth?: string;
  opensDetail?: boolean;
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
  detail?: (row: TableRow) => ReactNode;
  detailCount?: (row: TableRow) => number | undefined;
}

const idOf = (row: TableRow, i: number) => row.id ?? String(i);

// One table: headers are kit HeaderCells, values kit Cells. The rows carry the lines and the hover and selected
// fills, so cells of different heights in one row still line up.
export function Table({
  columns, rows, size: ownSize, line = "medium", caption, footer, emptyLabel = "No results.",
  selectable = false, selected: selectedProp, defaultSelected = [], onSelectionChange, rowLabel, onRowClick, detail, detailCount,
}: TableProps) {
  // A surrounding Density changes the row through the density tokens, not the size.
  const size = ownSize ?? "md";
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectedProp ?? innerSelected;
  // A table wider than its box scrolls sideways; then the box is a focus stop so the arrow keys scroll it (WCAG 2.1.1).
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  // Rows opened from an opensDetail column's Count button, and where that column starts in the visible box, so an
  // open detail can sit under it.
  const uid = useId();
  const [open, setOpen] = useState<string[]>([]);
  const detailColRef = useRef<HTMLTableCellElement>(null);
  const [detailStart, setDetailStart] = useState(0);
  const [viewWidth, setViewWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      setOverflows(el.scrollWidth > el.clientWidth + 1);
      setDetailStart(Math.max(0, (detailColRef.current?.offsetLeft ?? 0) - el.scrollLeft));
      setViewWidth(el.clientWidth);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => { ro.disconnect(); el.removeEventListener("scroll", measure); };
  }, []);
  const ids = rows.map(idOf);
  const picked = ids.filter((id) => selected.includes(id));
  const all = ids.length > 0 && picked.length === ids.length;
  const span = columns.length + (selectable ? 1 : 0);
  const labelKey = rowLabel ?? columns[0]?.key;
  const alignOf = (c: TableColumn): CellAlignment => c.alignment ?? (c.numeric ? "end" : "start");

  const select = (next: string[]) => {
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectionChange?.(next);
  };
  const toggleRow = (id: string, on: boolean) => select(on ? [...selected, id] : selected.filter((s) => s !== id));
  // Select all adds every row on this table; clearing removes only them.
  const toggleAll = (on: boolean) => select(on ? [...new Set([...selected, ...ids])] : selected.filter((s) => !ids.includes(s)));

  const value = (v: ReactNode, c: TableColumn) =>
    isValidElement(v) ? v : <Cell size={size} alignment={alignOf(c)} label={v === null || v === undefined ? "" : String(v)} />;
  // A maxWidth column cuts its values off with an ellipsis; the cell's title keeps the whole value on hover. The text
  // is a string value or a Cell's label, like a link Cell's.
  const fullText = (v: ReactNode) => {
    if (typeof v === "string" || typeof v === "number") return String(v);
    const label = isValidElement(v) ? (v.props as { label?: unknown }).label : undefined;
    return typeof label === "string" ? label : undefined;
  };
  // A row has a detail when detail gives it something; an opensDetail column then shows a Count of its other values
  // in a kit Button after the value, which opens and closes the detail under the row.
  const detailOf = (row: TableRow) => (detail ? detail(row) : null);
  const hasDetail = (d: ReactNode) => d !== null && d !== undefined && d !== false;
  const toggleOpen = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const withMore = (row: TableRow, id: string, n: number, c: TableColumn, shown: ReactNode, d: ReactNode) => {
    const more = c.opensDetail && hasDetail(d) ? detailCount?.(row) : undefined;
    if (!more) return shown;
    const isOpen = open.includes(id);
    return (
      <span className={styles.valueMore}>
        {shown}
        <Button
          emphasis="minimal" intent="brand" size="sm" iconEnd={isOpen ? "expand_less" : "expand_more"}
          aria-label={`${more} more, row ${n}`} aria-expanded={isOpen} aria-controls={isOpen ? `${uid}-detail-${id}` : undefined}
          onClick={() => toggleOpen(id)}
        >
          <Count count={more} size="sm" intent="neutral" label="more" />
        </Button>
      </span>
    );
  };
  const bodyCell = (c: TableColumn, v: ReactNode) => ({
    className: [c.numeric ? styles.numeric : "", c.emphasis ? styles.emphasis : "", c.maxWidth ? styles.truncate : ""].join(" "),
    style: c.maxWidth ? ({ "--table-column-max": c.maxWidth } as CSSProperties) : undefined,
    title: c.maxWidth ? fullText(v) : undefined,
  });

  return (
    <div
      ref={wrapRef} className={styles.wrap} style={detail ? ({ "--table-detail-start": `${detailStart}px`, "--table-view-width": viewWidth ? `${viewWidth}px` : "100%" } as CSSProperties) : undefined}
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
              <th key={c.key} ref={c.opensDetail ? detailColRef : undefined} scope="col" style={c.width ? { width: c.width } : undefined}>
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
            const d = detailOf(row);
            const isOpen = hasDetail(d) && open.includes(id);
            return (
              <Fragment key={id}>
              <tr
                className={[on ? styles.selected : "", onRowClick ? styles.clickable : ""].join(" ") || undefined} aria-selected={selectable ? on : undefined}
                // A pointer shortcut: clicks on the row's own controls (its link, checkbox or buttons) act on their own.
                onClick={onRowClick ? (e) => { if (!(e.target as HTMLElement).closest("a, button, input, label, select, textarea")) onRowClick(id, row); } : undefined}
              >
                {selectable && (
                  <td className={styles.select}>
                    <Cell size={size} type="checkbox" alignment="center" label={name || `row ${i + 1}`} checked={on} onCheckedChange={(v) => toggleRow(id, v)} />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} {...bodyCell(c, row[c.key])}>
                    {withMore(row, id, i + 1, c, value(row[c.key], c), d)}
                  </td>
                ))}
              </tr>
              {isOpen && (
                // The detail starts under the opensDetail column and slides back when it would run past the box.
                <tr className={styles.detailRow}>
                  <td id={`${uid}-detail-${id}`} colSpan={span}>
                    <div className={styles.detailBody}>
                      <span className={styles.detailSpacer} aria-hidden="true" />
                      <div className={styles.detailContent} role="group" aria-label={`Details, row ${i + 1}`}>{d}</div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
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
