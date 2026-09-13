"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Badge } from "../Badge/Badge";
import { useDensitySize } from "../Density/Density";
import { useLabelPosition } from "../Form/FormContext";
import { HelpPopover } from "../HelpPopover/HelpPopover";
import { Icon } from "../Icon/Icon";
import { Input } from "../Input/Input";
// Label, help, hint, error and the field box share Input's styles so all form fields match.
import field from "../Input/Input.module.css";
import { carryTheme } from "../Tooltip/useFloating";
import styles from "./Cascader.module.css";

export type CascaderVariant = "field" | "panel";
export type CascaderRelation = "parent" | "children";
export type CascaderSize = "sm" | "md" | "lg";
export type CascaderLabelPosition = "top" | "start";

export interface CascaderOption {
  value: string;
  label: string;
  path?: string;
  type?: string;
  relation?: CascaderRelation;
  disabled?: boolean;
  children?: CascaderOption[];
}

export interface CascaderProps {
  label: string;
  options: CascaderOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: CascaderOption[]) => void;
  variant?: CascaderVariant;
  changeOnSelect?: boolean;
  searchable?: boolean;
  showLegend?: boolean;
  placeholder?: string;
  size?: CascaderSize;
  labelPosition?: CascaderLabelPosition;
  hideLabel?: boolean;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
  emptyLabel?: string;
}

const GAP = 4; // px between field and dropdown
const RELATIONS: Record<CascaderRelation, { icon: string; name: string }> = {
  parent: { icon: "add_box", name: "Related parent" },
  children: { icon: "keyboard_double_arrow_right", name: "Related children" },
};

const opens = (o?: CascaderOption) => Boolean(o?.children?.length);

// The options along a path of values, stopping where a value is not found.
function walk(options: CascaderOption[], values: string[]) {
  const out: CascaderOption[] = [];
  let list: CascaderOption[] | undefined = options;
  for (const v of values) {
    const o: CascaderOption | undefined = list?.find((x) => x.value === v);
    if (!o) break;
    out.push(o);
    list = o.children;
  }
  return out;
}

// Every path that can be picked, for search: the ends, or every level with changeOnSelect.
function paths(options: CascaderOption[], anyLevel: boolean, trail: CascaderOption[] = []): CascaderOption[][] {
  return options.flatMap((o) => {
    if (o.disabled) return [];
    const here = [...trail, o];
    const deeper = opens(o) ? paths(o.children!, anyLevel, here) : [];
    return anyLevel || !opens(o) ? [here, ...deeper] : deeper;
  });
}

const relationsIn = (options: CascaderOption[]): Set<CascaderRelation> => {
  const found = new Set<CascaderRelation>();
  const visit = (list: CascaderOption[]) => list.forEach((o) => { if (o.relation) found.add(o.relation); if (o.children) visit(o.children); });
  visit(options);
  return found;
};

// Figma BP cascader 3737:20806 (columns, rows, legend) and the field selection modal 3772:6041; behavior after the
// cascader spec: pick by walking columns left to right.
export function Cascader({
  label, options, value, defaultValue, onChange, variant = "field", changeOnSelect = false, searchable = false, showLegend = true,
  placeholder = "Select", size: ownSize, labelPosition: ownLabelPosition, hideLabel = false, name, required = false,
  disabled = false, invalid = false, error, hint, help, emptyLabel = "No matches.",
}: CascaderProps) {
  const size = useDensitySize(ownSize);
  const labelPosition = useLabelPosition(ownLabelPosition);
  const uid = useId();
  const triggerId = `${uid}-field`;
  const popupId = `${uid}-popup`;
  const messageId = `${uid}-message`;
  const helpId = `${uid}-help`;

  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const committed = value ?? inner;
  const [active, setActive] = useState<string[]>(committed);
  const [focus, setFocus] = useState<{ col: number; row: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hit, setHit] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const searchFirst = useRef(false);

  const isField = variant === "field";
  const picked = walk(options, committed);
  const bad = invalid || Boolean(error);
  const message = error || hint;
  const describedBy = [message ? messageId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;

  // The columns: the first level, then the children of each open row.
  const openPath = walk(options, active);
  const cols: CascaderOption[][] = [options, ...openPath.filter(opens).map((o) => o.children!)];
  // The row that holds the tab stop: the given focus, else the deepest open row, else the first row.
  const lastCol = Math.max(Math.min(openPath.length, cols.length) - 1, 0);
  const home = focus && cols[focus.col]?.[focus.row] ? focus : { col: lastCol, row: Math.max(cols[lastCol].findIndex((o) => o.value === active[lastCol]), 0) };

  const relations = relationsIn(options);
  // The legend only explains marks that are there.
  const legend = showLegend && relations.size > 0;
  const results = searchable && query.trim()
    ? paths(options, changeOnSelect).filter((p) => p.some((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())))
    : null;

  const commit = (path: CascaderOption[]) => {
    const values = path.map((o) => o.value);
    if (value === undefined) setInner(values);
    onChange?.(values, path);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    setQuery("");
    setHover(null);
    if (refocus) triggerRef.current?.focus();
  };
  const openPopup = () => {
    setActive(committed);
    setFocus(null);
    setQuery("");
    moveFocus.current = true;
    searchFirst.current = searchable;
    setOpen(true);
  };

  // Picking or opening a row. Rows with children open their column; the rest are picked (changeOnSelect picks both).
  const choose = (col: number, row: number, viaKey = false) => {
    const o = cols[col]?.[row];
    if (!o || o.disabled) return;
    const next = [...active.slice(0, col), o.value];
    setActive(next);
    if (opens(o)) {
      if (changeOnSelect) commit(walk(options, next));
      if (viaKey) { moveFocus.current = true; setFocus({ col: col + 1, row: 0 }); } else setFocus({ col, row });
      return;
    }
    setFocus({ col, row });
    commit(walk(options, next));
    if (isField) close(true);
  };
  const pickPath = (path: CascaderOption[]) => {
    setActive(path.map((o) => o.value));
    commit(path);
    if (isField) close(true);
    else { setQuery(""); moveFocus.current = true; setFocus(null); }
  };

  const onColsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const { col, row } = home;
    const list = cols[col];
    const go = (c: number, r: number) => { e.preventDefault(); moveFocus.current = true; setFocus({ col: c, row: r }); };
    switch (e.key) {
      case "ArrowDown": return go(col, Math.min(row + 1, list.length - 1));
      case "ArrowUp": return go(col, Math.max(row - 1, 0));
      case "Home": return go(col, 0);
      case "End": return go(col, list.length - 1);
      case "ArrowRight":
        e.preventDefault();
        if (opens(list[row]) && !list[row].disabled) {
          setActive([...active.slice(0, col), list[row].value]);
          moveFocus.current = true;
          setFocus({ col: col + 1, row: 0 });
        }
        return;
      case "ArrowLeft":
        if (col === 0) return;
        setActive(active.slice(0, col));
        return go(col - 1, Math.max(cols[col - 1].findIndex((o) => o.value === active[col - 1]), 0));
      case "Enter":
      case " ":
        e.preventDefault();
        choose(col, row, true);
        return;
      case "Escape":
        if (isField) { e.preventDefault(); close(true); }
        return;
    }
  };

  // Place the fixed dropdown under the field (above it when there is no room), inside the window. Runs before the
  // focus move below, since a hidden dropdown cannot take focus.
  useLayoutEffect(() => {
    const btn = triggerRef.current;
    if (!open || !btn) return;
    const place = () => {
      const popup = popupRef.current;
      if (!popup) return;
      const r = btn.getBoundingClientRect();
      carryTheme(btn, popup);
      const h = popup.offsetHeight;
      const w = popup.offsetWidth;
      const below = r.bottom + GAP + h <= window.innerHeight || r.top < h + GAP;
      popup.style.top = `${Math.max(GAP, below ? r.bottom + GAP : r.top - GAP - h)}px`;
      popup.style.left = `${Math.min(Math.max(GAP, r.left), window.innerWidth - w - GAP)}px`;
      popup.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  });

  // Keyboard moves put real focus on the row they land on and scroll it (and its column) into view.
  useLayoutEffect(() => {
    if (!moveFocus.current) return;
    const scope = isField ? popupRef.current : colsRef.current;
    if (!scope) return;
    moveFocus.current = false;
    // Opening a searchable dropdown starts in the search box.
    const search = searchFirst.current ? scope.querySelector<HTMLElement>("input") : null;
    searchFirst.current = false;
    const el = search ?? scope.querySelector<HTMLElement>(results ? `[data-hit="${hit}"]` : `[data-col="${home.col}"][data-row="${home.row}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  // A new column scrolls into view when it opens. When not every column fits, start at the first column that
  // still lets the newest one show in full, so the column at the left edge is whole rather than cut in half.
  // Scrolling can stop there only if there is room after the last column, so a spare gap is added at the end.
  useLayoutEffect(() => {
    const el = colsRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const rects = [...el.querySelectorAll<HTMLElement>(`.${styles.column}`)].map((c) => c.getBoundingClientRect());
    if (!rects.length) return;
    const starts = rects.map((r) => r.left - box.left + el.scrollLeft);
    const content = rects[rects.length - 1].right - box.left + el.scrollLeft;
    const target = starts.find((x) => content - x <= el.clientWidth) ?? starts[starts.length - 1];
    el.style.setProperty("--cascader-spare", `${Math.max(0, Math.floor(target + el.clientWidth - content))}px`);
    el.scrollLeft = target;
  }, [cols.length, open]);

  // A click outside closes the dropdown without moving focus; so does tabbing out of it.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !popupRef.current?.contains(t)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  });
  const onPopupBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !popupRef.current?.contains(next) && !rootRef.current?.contains(next)) close(false);
  };

  /* ----- Pieces ----- */

  const row = (o: CascaderOption, col: number, r: number) => {
    const key = `${col}:${o.value}`;
    const inPath = active[col] === o.value && openPath[col]?.value === o.value;
    const isHome = home.col === col && home.row === r;
    const rel = o.relation ? RELATIONS[o.relation] : null;
    return (
      <div
        key={o.value} role="option" data-col={col} data-row={r} tabIndex={isHome ? 0 : -1}
        aria-selected={inPath} aria-disabled={o.disabled || undefined}
        className={[styles.item, inPath ? styles.selected : "", o.disabled ? styles.disabled : ""].join(" ")}
        onClick={() => choose(col, r)} onFocus={() => setFocus({ col, row: r })}
        onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover((h) => (h === key ? null : h))}
      >
        <span className={styles.text}>
          <span className={styles.name}>{o.label}</span>
          {o.path && <span className={styles.path}>{` (${o.path})`}</span>}
        </span>
        {(o.type || rel || opens(o)) && (
          <span className={styles.end}>
            {o.type && <Badge size="sm" tone={inPath || hover === key ? "hollow" : "neutral"} emphasis="faint">{o.type}</Badge>}
            {rel ? (
              <Icon name={rel.icon} size="sm" label={rel.name} className={styles[o.relation!]} />
            ) : opens(o) && !o.type && <Icon name="chevron_right" size="sm" className={styles.chevron} />}
          </span>
        )}
      </div>
    );
  };

  const columns = (
    <div ref={colsRef} className={styles.columns} onKeyDown={onColsKey}>
      {cols.map((list, c) => (
        <div key={c} role="listbox" aria-label={c === 0 ? label : openPath[c - 1]?.label} className={styles.column}>
          {list.map((o, r) => row(o, c, r))}
        </div>
      ))}
    </div>
  );

  const onSearchKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" && results?.length) {
      e.preventDefault();
      setHit(0);
      (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>('[data-hit="0"]')?.focus();
    }
    if (e.key === "Escape" && isField) { e.preventDefault(); close(true); }
  };
  const onResultsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!results) return;
    const go = (i: number) => { e.preventDefault(); moveFocus.current = true; setHit(i); };
    if (e.key === "ArrowDown") go(Math.min(hit + 1, results.length - 1));
    else if (e.key === "ArrowUp") {
      // Up from the first result goes back to the search box.
      if (hit === 0) { e.preventDefault(); e.currentTarget.parentElement?.querySelector<HTMLInputElement>("input")?.focus(); }
      else go(hit - 1);
    } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickPath(results[hit]); }
    else if (e.key === "Escape" && isField) { e.preventDefault(); close(true); }
  };

  const body = (
    <div className={[styles.frame, isField ? styles.dropdown : styles.inline].join(" ")}>
      {searchable && (
        // Down moves from the search box into the results; Escape closes the dropdown.
        <div className={styles.search} onKeyDown={onSearchKey}>
          <Input
            label={`Search ${label}`} hideLabel size="sm" type="search" iconStart="search" placeholder="Search"
            value={query} onChange={(v) => { setQuery(v); setHit(0); }}
          />
          <span className={styles.srOnly} aria-live="polite">{results ? `${results.length} result${results.length === 1 ? "" : "s"}` : ""}</span>
        </div>
      )}
      {results ? (
        <div role="listbox" aria-label={`${label} results`} className={[styles.column, styles.results].join(" ")} onKeyDown={onResultsKey}>
          {results.length === 0 && <p className={styles.empty}>{emptyLabel}</p>}
          {results.map((p, i) => (
            <div
              key={p.map((o) => o.value).join("/")} role="option" data-hit={i} tabIndex={i === hit ? 0 : -1} aria-selected={false}
              className={styles.item} onClick={() => pickPath(p)} onFocus={() => setHit(i)}
            >
              <span className={styles.text}>
                {p.slice(0, -1).map((o) => <span key={o.value} className={styles.path}>{o.label} / </span>)}
                <span className={styles.name}>{p[p.length - 1].label}</span>
              </span>
              {p[p.length - 1].type && <span className={styles.end}><Badge size="sm" tone="neutral" emphasis="faint">{p[p.length - 1].type!}</Badge></span>}
            </div>
          ))}
        </div>
      ) : columns}
      {legend && (
        <div className={styles.legend}>
          <span className={styles.legendTitle}>Legend:</span>
          {(["parent", "children"] as CascaderRelation[]).filter((r) => relations.has(r)).map((r) => (
            <span key={r} className={styles.legendItem}>
              <Icon name={RELATIONS[r].icon} size="sm" className={styles[r]} />
              {RELATIONS[r].name}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (!isField) return <div className={styles.panelWrap} role="group" aria-label={label}>{body}</div>;

  const text = picked.map((o) => o.label).join(" / ");
  const cls = [field.input, field[size], hideLabel ? "" : field[labelPosition], bad ? field.invalid : "", disabled ? field.disabled : ""];
  return (
    <div ref={rootRef} className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition}>
      <div className={hideLabel ? field.srOnly : field.labelRow}>
        {/* The field is a button, which has no required state, so the label says it for screen readers. */}
        <label htmlFor={triggerId} className={field.label}>
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
        <button
          ref={triggerRef} id={triggerId} type="button" disabled={disabled}
          className={[field.field, styles.trigger].join(" ")}
          aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? popupId : undefined} aria-describedby={describedBy}
          onClick={() => (open ? close(false) : openPopup())}
          onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); openPopup(); } }}
        >
          <span className={text ? styles.value : [styles.value, styles.placeholder].join(" ")}>{text || placeholder}</span>
          <Icon name={open ? "expand_less" : "expand_more"} size={size === "sm" ? "sm" : "md"} className={styles.icon} />
        </button>
        {message && <p id={messageId} className={error ? field.error : field.hint}>{message}</p>}
      </div>
      {name && <input type="hidden" name={name} value={committed.join(".")} />}
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} id={popupId} role="dialog" aria-label={label} className={styles.popup} onBlur={onPopupBlur}>
          {body}
        </div>,
        document.body,
      )}
    </div>
  );
}
