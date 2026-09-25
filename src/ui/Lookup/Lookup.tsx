"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { Cell } from "../Cell/Cell";
import { useDensitySize } from "../Density/Density";
import { useLabelPosition } from "../Form/FormContext";
import { HelpPopover } from "../HelpPopover/HelpPopover";
import { Icon } from "../Icon/Icon";
import { Input } from "../Input/Input";
import { Modal } from "../Modal/Modal";
import { Pagination } from "../Pagination/Pagination";
import { Table, type TableColumn, type TableRow } from "../Table/Table";

// A Table row whose id is required: the id is what value holds and what picking a row sends.
export type LookupRow = TableRow & { id: string };
// Label, help, hint, error and the field box share Input's styles so all form fields match.
import field from "../Input/Input.module.css";
import styles from "./Lookup.module.css";

export type LookupSize = "sm" | "md" | "lg";
export type LookupLabelPosition = "top" | "start";
export type LookupTrigger = "field" | "button";

export interface LookupProps {
  label: string;
  columns: TableColumn[];
  rows: LookupRow[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string | null, row: TableRow | null) => void;
  labelKey?: string;
  title?: string;
  icon?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  clearable?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  size?: LookupSize;
  labelPosition?: LookupLabelPosition;
  hideLabel?: boolean;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
  multiple?: boolean;
  trigger?: LookupTrigger;
  buttonIcon?: string;
  confirmLabel?: string;
  onConfirm?: (ids: string[], rows: TableRow[]) => void;
}

// Text a search can match: plain values only; kit Cells and other elements are skipped.
const text = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

// Figma lookup field 1059:33521 (a field with × and a lookup button) and the lookup dialog 138:5591
// (search, table, pagination in a wide Modal). With multiple, the same dialog picks many rows with checkboxes and
// hands them over from its footer; with trigger button, a kit Button opens it, for adding records to a list.
export function Lookup({
  label, columns, rows, value, defaultValue = null, onChange, labelKey: labelKeyProp, title, icon = "folder_open",
  searchPlaceholder, pageSize: initialPageSize = 10, clearable = true, placeholder, emptyLabel = "No matches.",
  size: ownSize, labelPosition: ownLabelPosition, hideLabel = false, name, required = false, disabled = false,
  invalid = false, error, hint, help, multiple = false, trigger = "field", buttonIcon, confirmLabel = "Add selected", onConfirm,
}: LookupProps) {
  const size = useDensitySize(ownSize);
  const labelPosition = useLabelPosition(ownLabelPosition);
  const uid = useId();
  const fieldId = `${uid}-field`;
  const messageId = `${uid}-message`;
  const helpId = `${uid}-help`;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value === undefined ? inner : value;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  // The rows ticked in this visit to the dialog, across every page of it.
  const [picks, setPicks] = useState<string[]>([]);

  const labelKey = labelKeyProp ?? columns[0]?.key;
  const picked = rows.find((r) => r.id === current) ?? null;
  const shown = picked ? text(picked[labelKey]) : "";
  const bad = invalid || Boolean(error);
  const message = error || hint;
  const describedBy = [message ? messageId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;

  const emit = (row: TableRow | null) => {
    const id = row?.id ?? null;
    if (value === undefined) setInner(id);
    onChange?.(id, row);
  };
  const openLookup = () => {
    if (disabled) return;
    setQuery("");
    setApplied("");
    setPage(1);
    setPicks([]);
    setOpen(true);
  };
  // The Modal gives focus back to what opened it when it closes.
  const close = () => setOpen(false);
  const pick = (row: TableRow) => { emit(row); close(); };
  const togglePick = (id: string) => setPicks((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  const confirm = () => {
    onConfirm?.(picks, rows.filter((r) => picks.includes(r.id)));
    close();
  };

  // Search runs on the Search button or Enter, as in Figma, over every plain value of each row.
  const search = () => { setApplied(query.trim()); setPage(1); };
  const onSearchKey = (e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); search(); } };
  const q = applied.toLowerCase();
  const found = q ? rows.filter((r) => columns.some((c) => text(r[c.key]).toLowerCase().includes(q))) : rows;
  const pages = Math.max(Math.ceil(found.length / pageSize), 1);
  const at = Math.min(page, pages);
  const slice = found.slice((at - 1) * pageSize, at * pageSize);
  // Picking one: each row's name becomes the link that picks it, so rows can be picked from the keyboard too.
  // Picking many: each row's checkbox is the keyboard stop, so the name stays plain text.
  const pageRows = multiple ? slice : slice.map((r) => ({
    ...r,
    [labelKey]: <Cell type="link" size="sm" label={text(r[labelKey])} onClick={() => pick(r)} />,
  }));

  const dialog = (
    <Modal
      open={open} title={title ?? `Lookup: ${label}`} icon={icon} size="xl" onClose={close}
      footer={multiple ? (
        <>
          <Button size="sm" onClick={close}>Cancel</Button>
          <Button size="sm" emphasis="strong" intent="brand" disabled={picks.length === 0} onClick={confirm}>{`${confirmLabel} (${picks.length})`}</Button>
        </>
      ) : undefined}
    >
      <div className={styles.content}>
        <div className={styles.search} onKeyDown={onSearchKey}>
          <span className={styles.searchField}>
            <Input
              label={searchPlaceholder ?? `Search ${label.toLowerCase()}`} hideLabel size="sm" type="search"
              placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`} value={query} onChange={setQuery}
            />
          </span>
          {/* With many to pick, the footer holds the one strong brand Button, so Search steps down. */}
          <Button size="sm" {...(multiple ? { emphasis: "subtle" } as const : { emphasis: "strong", intent: "brand" } as const)} onClick={search}>Search</Button>
        </div>
        {multiple ? (
          <Table
            size="sm" columns={columns} rows={pageRows} emptyLabel={emptyLabel} rowLabel={labelKey}
            selectable selected={picks} onSelectionChange={setPicks} onRowClick={togglePick}
          />
        ) : (
          <Table
            size="sm" columns={columns} rows={pageRows} emptyLabel={emptyLabel} rowLabel={labelKey}
            selected={current ? [current] : []} onRowClick={(id) => { const r = rows.find((x) => x.id === id); if (r) pick(r); }}
          />
        )}
        {found.length > 0 && (
          <Pagination
            total={found.length} page={at} onPageChange={setPage} pageSize={pageSize}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} label={`${label} pages`}
          />
        )}
      </div>
    </Modal>
  );

  // A button that opens the dialog, for adding records to a list rather than filling in a field.
  if (trigger === "button") {
    return (
      <>
        <Button size="sm" iconStart={buttonIcon} disabled={disabled} onClick={openLookup}>{label}</Button>
        {dialog}
      </>
    );
  }

  const cls = [field.input, field[size], hideLabel ? "" : field[labelPosition], bad ? field.invalid : "", disabled ? field.disabled : ""];
  return (
    <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition}>
      <div className={hideLabel ? field.srOnly : field.labelRow}>
        {/* The field is a button, which has no required state, so the label says it for screen readers. */}
        <label htmlFor={fieldId} className={field.label}>
          {required && <span className={field.required} aria-hidden="true">*</span>}
          {label}
          {required && <span className={field.srOnly}>, required</span>}
        </label>
        {help && !hideLabel && (
          <HelpPopover title={label} content={help}><button type="button" className={field.help} aria-label={`About ${label}`}><Icon name="help_center" size="sm" /></button></HelpPopover>
        )}
        {help && <span id={helpId} className={field.srOnly}>{help}</span>}
      </div>
      <div className={field.body}>
        <div className={[field.field, styles.box].join(" ")}>
          <button
            ref={triggerRef} id={fieldId} type="button" disabled={disabled} className={styles.trigger}
            aria-haspopup="dialog" aria-expanded={open} aria-describedby={describedBy} onClick={openLookup}
          >
            <span className={shown ? styles.value : [styles.value, styles.placeholder].join(" ")}>{shown || placeholder}</span>
          </button>
          {clearable && shown && !disabled && (
            <span className={styles.clear}>
              <Button size="sm" emphasis="minimal" iconOnly iconStart="close" onClick={() => { emit(null); triggerRef.current?.focus(); }}>{`Clear ${label}`}</Button>
            </span>
          )}
          {/* The same action as the field, for the pointer; the field itself is the keyboard stop. */}
          <button type="button" tabIndex={-1} disabled={disabled} className={styles.lookup} aria-label={`Look up ${label}`} onClick={openLookup}>
            <Icon name="category_search" size={size === "sm" ? "sm" : "md"} />
          </button>
        </div>
        {message && <p id={messageId} className={error ? field.error : field.hint}>{message}</p>}
      </div>
      {name && <input type="hidden" name={name} value={current ?? ""} />}
      {dialog}
    </div>
  );
}
