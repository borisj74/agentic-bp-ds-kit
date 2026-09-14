"use client";
import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../Button/Button";
import { DatePicker } from "../DatePicker/DatePicker";
import { useDensity } from "../Density/Density";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { FormulaEditor, type FormulaField } from "../FormulaEditor/FormulaEditor";
import { HeaderCell, type HeaderCellLine } from "../HeaderCell/HeaderCell";
import { Input } from "../Input/Input";
import { Select, type SelectOption } from "../Select/Select";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./DataGrid.module.css";

export type DataGridColumnType = "text" | "number" | "select" | "formula" | "date";
export type DataGridSize = "sm" | "md";
export interface DataGridColumn {
  key: string;
  header: string;
  type?: DataGridColumnType;
  options?: SelectOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  placeholder?: string;
  readOnly?: boolean;
  hug?: boolean;
  width?: string;
  fields?: FormulaField[];
  onCalculate?: (formula: string) => string;
  setForAll?: boolean;
}
export type DataGridRow = { id: string } & Record<string, string>;

export interface DataGridProps {
  columns: DataGridColumn[];
  rows?: DataGridRow[];
  defaultRows?: DataGridRow[];
  onRowsChange?: (rows: DataGridRow[]) => void;
  size?: DataGridSize;
  line?: HeaderCellLine;
  rowNumbers?: boolean;
  canAddRows?: boolean;
  canRemoveRows?: boolean;
  emptyLabel?: string;
  label?: string;
  stickyFirstColumn?: boolean;
  detail?: (row: DataGridRow) => ReactNode;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
}

type Spot = { row: string; key: string };
const spotSelector = (s: Spot) => `[data-cell="${CSS.escape(`${s.row}:${s.key}`)}"]`;

// Figma data-grid 4350:109705. A cell shows its value as a button; clicking it (or Enter) swaps in a kit editor.
// Text and number save on Enter or when focus leaves; formula cells stay open until Done or Escape.
export function DataGrid({
  columns, rows: rowsProp, defaultRows = [], onRowsChange, size: ownSize, line = "medium", rowNumbers = true,
  canAddRows = false, canRemoveRows = false, emptyLabel = "No rows yet.", label = "Data grid", stickyFirstColumn = true,
  detail, expanded: expandedProp, defaultExpanded = [], onExpandedChange,
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
  // Rows with a detail open, by id.
  const [innerExpanded, setInnerExpanded] = useState(defaultExpanded);
  const expanded = expandedProp ?? innerExpanded;
  const toggleRow = (id: string) => {
    const next = expanded.includes(id) ? expanded.filter((x) => x !== id) : [...expanded, id];
    if (expandedProp === undefined) setInnerExpanded(next);
    onExpandedChange?.(next);
  };

  // Pinned columns sit one after another: the expand toggle, then #, then the first column, so each needs the
  // widths before it as its offset. An open detail is as wide as the visible grid, so it stays in view too.
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLTableCellElement>(null);
  const indexRef = useRef<HTMLTableCellElement>(null);
  const [offsets, setOffsets] = useState({ index: 0, first: 0, view: 0 });
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = () => {
      const toggle = toggleRef.current?.getBoundingClientRect().width ?? 0;
      const index = indexRef.current?.getBoundingClientRect().width ?? 0;
      const view = wrap?.clientWidth ?? 0;
      setOffsets((old) => (old.index === toggle && old.first === toggle + index && old.view === view ? old : { index: toggle, first: toggle + index, view }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    [wrap, toggleRef.current, indexRef.current].forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [stickyFirstColumn, rowNumbers, detail]);
  const pin = stickyFirstColumn ? styles.sticky : "";

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
    const first = columns.find((c) => !c.readOnly && c.type !== "select" && c.type !== "date");
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

  const span = columns.length + (detail ? 1 : 0) + (rowNumbers ? 1 : 0) + (canRemoveRows ? 1 : 0);
  const firstKey = columns[0]?.key;

  // Set for all: row 1's value goes to every row, or the column is cleared.
  const setForAllItems = (col: DataGridColumn) => {
    const first = rows[0]?.[col.key] ?? "";
    const shown = col.type === "select" ? col.options?.find((o) => o.value === first)?.label ?? first : first;
    return [
      { id: "copy", label: first ? `Use row 1 value: ${shown}` : "Use row 1 value", icon: "content_copy", disabled: !first || rows.length < 2 },
      { id: "clear", label: "Clear all rows", icon: "backspace", disabled: rows.every((r) => !r[col.key]) },
    ];
  };
  // When any column has Set for all, every header takes the same shape: title at the top, the menu (or empty
  // space) under it, and one header line along the bottom, so titles and lines stay level across the row.
  const hasSetForAll = columns.some((c) => c.setForAll);
  const head = (title: ReactNode, menu?: ReactNode, end = false) => (hasSetForAll ? (
    <div className={[styles.head, end ? styles.headEnd : "", line === "thin" ? styles.headThin : ""].join(" ")}>
      {title}
      {menu && <span className={styles.setAll}>{menu}</span>}
    </div>
  ) : title);
  const onSetForAll = (col: DataGridColumn) => (id: string) => {
    if (editing?.key === col.key) setEditing(null);
    const value = id === "copy" ? rows[0]?.[col.key] ?? "" : "";
    commit(rows.map((r) => ({ ...r, [col.key]: value })));
  };

  const cell = (row: DataGridRow, n: number, col: DataGridColumn) => {
    const value = row[col.key] ?? "";
    const name = `${col.header}, row ${n}`;
    const type = col.type ?? "text";
    const isEditing = editing?.row === row.id && editing.key === col.key;
    const cls = [type === "number" ? styles.numeric : "", isEditing ? styles.editing : "", col.readOnly ? styles.readOnly : "", col.hug ? styles.hugCell : "", col.key === firstKey ? pin : ""].join(" ");

    let body;
    if (col.readOnly) {
      body = <span className={[styles.value, type === "formula" ? styles.mono : ""].join(" ")}>{value}</span>;
    } else if (type === "select") {
      // Always a kit Select, like the Figma cell with its arrow button.
      body = (
        <span className={styles.control}>
          <Select size="sm" hideLabel label={name} options={col.options ?? []} searchable={col.searchable} searchPlaceholder={col.searchPlaceholder} placeholder={col.placeholder} value={value} onChange={(v) => setValue(row.id, col.key, Array.isArray(v) ? v[0] ?? "" : v)} />
        </span>
      );
    } else if (type === "date") {
      // Always a kit DatePicker, like a select cell: the value is an ISO date (YYYY-MM-DD), shown formatted.
      body = (
        <span className={styles.control}>
          <DatePicker size="sm" hideLabel label={name} placeholder={col.placeholder} value={value} onChange={(v) => setValue(row.id, col.key, typeof v === "string" ? v : v.start ?? "")} />
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
      <div ref={wrapRef} className={styles.wrap}>
        <table
          ref={tableRef} className={[styles.table, styles[size]].join(" ")} aria-label={label}
          style={{ "--data-grid-index-offset": `${offsets.index}px`, "--data-grid-sticky-offset": `${offsets.first}px`, "--data-grid-view-width": `${offsets.view}px` } as CSSProperties}
        >
          <thead>
            <tr>
              {detail && <th ref={toggleRef} scope="col" className={[styles.hug, stickyFirstColumn ? styles.stickyToggle : ""].join(" ")}>{head(<HeaderCell size={size} line={line} />)}<span className={styles.srOnly}>Details</span></th>}
              {rowNumbers && <th ref={indexRef} scope="col" className={[styles.hug, stickyFirstColumn ? styles.stickyIndex : ""].join(" ")}>{head(<HeaderCell size={size} line={line} align="center" label="#" />)}</th>}
              {columns.map((c) => (
                <th
                  key={c.key} scope="col" className={[c.hug ? styles.hug : styles.fill, c.key === firstKey ? pin : ""].join(" ")}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {head(
                    <HeaderCell size={size} line={line} align={c.type === "number" ? "end" : "start"} label={c.header} />,
                    c.setForAll ? (
                      <DropdownMenu
                        label="Set for all" variant="tertiary" size="sm" align={c.type === "number" ? "end" : "start"}
                        items={setForAllItems(c)} onSelect={onSetForAll(c)}
                      />
                    ) : undefined,
                    c.type === "number",
                  )}
                </th>
              ))}
              {canRemoveRows && <th scope="col" className={styles.hug}>{head(<HeaderCell size={size} line={line} />)}<span className={styles.srOnly}>Remove</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={span} className={styles.empty}>{emptyLabel}</td></tr>
            ) : rows.map((row, i) => {
              const isOpen = Boolean(detail) && expanded.includes(row.id);
              const detailId = `${uid}-detail-${row.id}`;
              return (
              <Fragment key={row.id}>
              <tr>
                {detail && (
                  <td className={[styles.toggle, stickyFirstColumn ? styles.stickyToggle : ""].join(" ")}>
                    <Button
                      variant="tertiary" size="sm" iconOnly iconStart={isOpen ? "expand_more" : "chevron_right"}
                      aria-expanded={isOpen} aria-controls={isOpen ? detailId : undefined} onClick={() => toggleRow(row.id)}
                    >
                      {`${isOpen ? "Hide" : "Show"} details, row ${i + 1}`}
                    </Button>
                  </td>
                )}
                {rowNumbers && <td className={[styles.index, stickyFirstColumn ? styles.stickyIndex : ""].join(" ")}>{i + 1}</td>}
                {columns.map((c) => cell(row, i + 1, c))}
                {canRemoveRows && (
                  <td className={styles.remove}>
                    <Tooltip content={`Remove row ${i + 1}`} placement="left">
                      <Button variant="tertiary" size="sm" iconOnly iconStart="delete" onClick={() => removeRow(row.id)}>{`Remove row ${i + 1}`}</Button>
                    </Tooltip>
                  </td>
                )}
              </tr>
              {isOpen && detail && (
                <tr>
                  <td id={detailId} colSpan={span} className={styles.detail}>
                    <div className={styles.detailBody} role="group" aria-label={`Details, row ${i + 1}`}>{detail(row)}</div>
                  </td>
                </tr>
              )}
              </Fragment>
              );
            })}
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
