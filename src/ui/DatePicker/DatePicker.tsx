"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useDensitySize, usePortalDensity } from "../Density/Density";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import { Dropdown } from "../Dropdown/Dropdown";
import { useLabelPosition } from "../Form/FormContext";
import { Icon } from "../Icon/Icon";
import { HelpPopover } from "../HelpPopover/HelpPopover";
// Label, help, hint, error and the field box share Input's styles so all form fields match.
import field from "../Input/Input.module.css";
import { carryTheme } from "../Tooltip/useFloating";
import styles from "./DatePicker.module.css";

export type DatePickerType = "single" | "dual";
export type DatePickerSize = "sm" | "md" | "lg";
export type DatePickerLabelPosition = "top" | "start";
export type DatePickerMonthYear = "title" | "menus";
export interface DatePickerRange { start: string; end: string }
export type DatePickerValue = string | DatePickerRange;

export interface DatePickerProps {
  label: string;
  type?: DatePickerType;
  hideLabel?: boolean;
  labelPosition?: DatePickerLabelPosition;
  size?: DatePickerSize;
  placeholder?: string;
  value?: DatePickerValue;
  defaultValue?: DatePickerValue;
  onChange?: (value: DatePickerValue) => void;
  minDate?: string;
  maxDate?: string;
  presets?: boolean;
  monthYear?: DatePickerMonthYear;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
}

const WEEKDAYS = [["Mo", "Monday"], ["Tu", "Tuesday"], ["We", "Wednesday"], ["Th", "Thursday"], ["Fr", "Friday"], ["Sa", "Saturday"], ["Su", "Sunday"]];
const GAP = 4; // px between field and panel
const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]';

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s?: string | null) => {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null;
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return toISO(d) === s ? d : null;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const shiftMonth = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const addMonths = (d: Date, n: number) => {
  const first = shiftMonth(d, n);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
};
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;
const weeksOf = (view: Date) => {
  const start = addDays(view, -mondayIndex(view));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
};
const short = (s?: string | null) => parse(s)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? "";
const longName = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const monthLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const monthName = (month: number) => new Date(2000, month, 1).toLocaleDateString("en-US", { month: "long" });
// How far the year menu reaches when no limits are given: ten years either side of the month on show.
const YEAR_SPAN = 10;
const isRange = (v?: DatePickerValue): v is DatePickerRange => typeof v === "object" && v !== null;

function presetRanges(today: Date) {
  const week = addDays(today, -mondayIndex(today));
  const month = monthStart(today);
  const lastMonth = shiftMonth(today, -1);
  const y = today.getFullYear();
  return [
    { label: "Today", start: today, end: today },
    { label: "Yesterday", start: addDays(today, -1), end: addDays(today, -1) },
    { label: "This week", start: week, end: addDays(week, 6) },
    { label: "Last week", start: addDays(week, -7), end: addDays(week, -1) },
    { label: "This month", start: month, end: new Date(y, today.getMonth() + 1, 0) },
    { label: "Last month", start: lastMonth, end: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0) },
    { label: "This year", start: new Date(y, 0, 1), end: new Date(y, 11, 31) },
    { label: "Last year", start: new Date(y - 1, 0, 1), end: new Date(y - 1, 11, 31) },
  ].map((p) => ({ label: p.label, start: toISO(p.start), end: toISO(p.end) }));
}

export function DatePicker({
  label, type = "single", hideLabel = false, labelPosition: ownLabelPosition, size: ownSize, placeholder, value, defaultValue, onChange,
  minDate, maxDate, presets = true, monthYear = "title", name, id, required = false, disabled = false, invalid = false, error, hint, help,
}: DatePickerProps) {
  const size = useDensitySize(ownSize);
  const labelPosition = useLabelPosition(ownLabelPosition);
  const uid = useId();
  const density = usePortalDensity(); // the portalled popup keeps the surrounding Density
  const triggerId = id ?? `${uid}-field`;
  const panelId = `${uid}-panel`;
  const messageId = `${uid}-message`;
  const helpId = `${uid}-help`;
  const range = type === "dual";
  const monthsShown = range ? 2 : 1;

  const [inner, setInner] = useState<DatePickerValue | undefined>(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState(() => monthStart(new Date()));
  const [focus, setFocus] = useState(() => toISO(new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const today = new Date();
  const todayISO = toISO(today);
  const bad = invalid || Boolean(error);
  const message = error || hint;
  const describedBy = [message ? messageId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;
  const display = isRange(current) ? `${short(current.start)} – ${short(current.end)}` : short(current);
  const blocked = (s: string) => Boolean((minDate && s < minDate) || (maxDate && s > maxDate));

  const close = (refocus: boolean) => {
    setOpen(false);
    setHover(null);
    if (refocus) triggerRef.current?.focus();
  };

  const openPanel = () => {
    const s = isRange(current) ? current.start : current ?? null;
    setStart(s);
    setEnd(isRange(current) ? current.end : null);
    const anchor = parse(s) ?? today;
    setView(monthStart(anchor));
    setFocus(toISO(anchor));
    moveFocus.current = true;
    setOpen(true);
  };

  // Place the fixed panel under the field (above it when there is no room), inside the window.
  useLayoutEffect(() => {
    const btn = triggerRef.current;
    if (!open || !btn) return;
    const place = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const r = btn.getBoundingClientRect();
      carryTheme(btn, panel);
      const h = panel.offsetHeight;
      const w = panel.offsetWidth;
      const below = r.bottom + GAP + h <= window.innerHeight || r.top < h + GAP;
      panel.style.top = `${Math.max(GAP, below ? r.bottom + GAP : r.top - GAP - h)}px`;
      panel.style.left = `${Math.min(Math.max(GAP, r.left), window.innerWidth - w - GAP)}px`;
      panel.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, type]);

  // Move real focus to the focused day after keyboard moves and on open.
  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    panelRef.current?.querySelector<HTMLElement>(`[data-date="${focus}"]`)?.focus();
  }, [open, focus, view]);

  // A click outside cancels without moving focus.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      // The month and year menus are portaled, so they are outside the panel: a pick in one must not shut the panel.
      if (t instanceof Element && t.closest('[role="menu"]')) return;
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  });

  const commit = (next: DatePickerValue) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const apply = () => {
    if (!start) return;
    commit(range ? { start, end: end ?? start } : start);
    close(true);
  };

  // Keep the focused day inside the visible month(s).
  const go = (d: Date) => {
    moveFocus.current = true;
    setFocus(toISO(d));
    if (d < view) setView(monthStart(d));
    else if (d >= shiftMonth(view, monthsShown)) setView(shiftMonth(monthStart(d), -(monthsShown - 1)));
  };
  const turn = (n: number) => {
    const next = shiftMonth(view, n);
    setView(next);
    setFocus(toISO(addMonths(parse(focus) ?? next, n)));
  };

  // The month and year menus jump straight to a month. index says which of the months on show was changed,
  // so the one the person picked stays where it was.
  const jump = (index: number, month: number, year: number) => {
    const first = new Date(year, month, 1);
    setView(shiftMonth(first, -index));
    setFocus(toISO(first));
  };
  // A month or a year is off when every day in it is outside the limits.
  const monthOff = (year: number, month: number) => {
    const first = toISO(new Date(year, month, 1));
    const last = toISO(new Date(year, month + 1, 0));
    return Boolean((minDate && last < minDate) || (maxDate && first > maxDate));
  };
  const years = () => {
    const shown = view.getFullYear();
    const from = minDate ? Number(minDate.slice(0, 4)) : shown - YEAR_SPAN;
    const to = maxDate ? Number(maxDate.slice(0, 4)) : shown + YEAR_SPAN;
    return Array.from({ length: Math.max(to - from + 1, 1) }, (_, i) => from + i);
  };

  const pick = (d: Date) => {
    const s = toISO(d);
    if (blocked(s)) return;
    setFocus(s);
    if (!range) { setStart(s); return; }
    if (!start || end || s < start) { setStart(s); setEnd(null); }
    else setEnd(s);
  };

  const onGridKey = (e: KeyboardEvent) => {
    const cur = parse(focus) ?? today;
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: Date | null = null;
    if (e.key in step) next = addDays(cur, step[e.key]);
    else if (e.key === "Home") next = addDays(cur, -mondayIndex(cur));
    else if (e.key === "End") next = addDays(cur, 6 - mondayIndex(cur));
    else if (e.key === "PageUp") next = addMonths(cur, -1);
    else if (e.key === "PageDown") next = addMonths(cur, 1);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(cur); return; }
    if (!next) return;
    e.preventDefault();
    go(next);
  };

  // Escape closes the panel (marked handled so a Modal around it stays open); Tab stays inside.
  const onPanelKey = (e: KeyboardEvent) => {
    // A menu open over the panel handles Escape itself; only an unhandled one closes the panel.
    if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); close(true); return; }
    if (e.key === "Escape") return;
    if (e.key !== "Tab") return;
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const previewEnd = end ?? (range && start && hover && hover > start ? hover : null);

  const renderMonth = (m: Date, index: number) => {
    const headingId = `${uid}-m${index}`;
    return (
      <div key={toISO(m)} className={styles.month}>
        <div className={styles.monthHead}>
          {index === 0 ? (
            <Button variant="tertiary" size="sm" iconOnly iconStart="chevron_left" disabled={Boolean(minDate && toISO(addDays(view, -1)) < minDate)} onClick={() => turn(-1)}>Previous month</Button>
          ) : <span className={styles.spacer} />}
          {monthYear === "menus" ? (
            /* The month and the year as dropdowns, so a far-off date takes one pick instead of many turns of the
               arrows. The hidden words name each one; its value is what shows. */
            <div className={styles.jump}>
              <h2 id={headingId} className={styles.srOnly} aria-live="polite">{monthLabel(m)}</h2>
              <span id={`${headingId}-month`} className={styles.srOnly}>Month</span>
              <span id={`${headingId}-year`} className={styles.srOnly}>Year</span>
              <span className={styles.jumpMonth}>
                <Dropdown
                  label="Month" trigger="field" size="sm" text={monthName(m.getMonth())} labelledBy={`${headingId}-month`}
                  items={Array.from({ length: 12 }, (_, month) => ({
                    id: String(month), label: monthName(month), selected: month === m.getMonth(), disabled: monthOff(m.getFullYear(), month),
                  }))}
                  onSelect={(month) => jump(index, Number(month), m.getFullYear())}
                />
              </span>
              <span className={styles.jumpYear}>
                <Dropdown
                  label="Year" trigger="field" size="sm" text={String(m.getFullYear())} labelledBy={`${headingId}-year`}
                  items={years().map((year) => ({ id: String(year), label: String(year), selected: year === m.getFullYear(), disabled: monthOff(year, m.getMonth()) }))}
                  onSelect={(year) => jump(index, m.getMonth(), Number(year))}
                />
              </span>
            </div>
          ) : (
            <h2 id={headingId} className={styles.heading} aria-live="polite">{monthLabel(m)}</h2>
          )}
          {index === monthsShown - 1 ? (
            <Button variant="tertiary" size="sm" iconOnly iconStart="chevron_right" disabled={Boolean(maxDate && toISO(shiftMonth(view, monthsShown)) > maxDate)} onClick={() => turn(1)}>Next month</Button>
          ) : <span className={styles.spacer} />}
        </div>
        <div role="grid" aria-labelledby={headingId} className={styles.grid} onKeyDown={onGridKey}>
          <div role="row" className={styles.row}>
            {WEEKDAYS.map(([abbr, full]) => <div key={abbr} role="columnheader" aria-label={full} className={styles.weekday}>{abbr}</div>)}
          </div>
          {weeksOf(m).map((week, wi) => (
            <div key={wi} role="row" className={styles.row}>
              {week.map((d) => {
                const s = toISO(d);
                // Days from the next or previous month are faded placeholders, as in Figma.
                if (d.getMonth() !== m.getMonth()) {
                  return <div key={s} role="gridcell" className={styles.cell}><span className={[styles.day, styles.outside].join(" ")} aria-hidden="true">{d.getDate()}</span></div>;
                }
                const isStart = s === start;
                const isEnd = range && s === previewEnd;
                const selected = isStart || isEnd;
                const between = range && start && previewEnd && s > start && s < previewEnd;
                const isToday = s === todayISO;
                const off = blocked(s);
                const name = [longName(d), isToday ? "today" : "", range && isStart ? "start of range" : "", isEnd && !isStart ? "end of range" : "", !range && isStart ? "selected" : ""].filter(Boolean).join(", ");
                return (
                  <div key={s} role="gridcell" className={styles.cell} aria-selected={selected || between || undefined}>
                    <button
                      type="button" data-date={s} tabIndex={s === focus ? 0 : -1} aria-label={name} aria-disabled={off || undefined}
                      className={[styles.day, isToday ? styles.today : "", between ? styles.between : "", selected ? styles.selected : ""].join(" ")}
                      onClick={() => pick(d)} onFocus={() => setFocus(s)} onMouseEnter={() => range && setHover(s)}
                    >
                      {d.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const cls = [field.input, field[size], hideLabel ? "" : field[labelPosition], bad ? field.invalid : "", disabled ? field.disabled : ""];
  const text = range ? "Select dates" : "Select date";
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
          aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} aria-describedby={describedBy}
          onClick={() => (open ? close(false) : openPanel())}
        >
          <span className={display ? styles.value : [styles.value, styles.placeholder].join(" ")}>{display || placeholder || text}</span>
          <Icon name="event" size={size === "sm" ? "sm" : "md"} className={styles.icon} />
        </button>
        {message && <p id={messageId} className={error ? field.error : field.hint}>{message}</p>}
      </div>
      {name && <input type="hidden" name={name} value={isRange(current) ? `${current.start}/${current.end}` : current ?? ""} />}
      {open && typeof document !== "undefined" && createPortal(
        <div ref={panelRef} data-density={density} id={panelId} role="dialog" aria-modal="true" aria-label={range ? "Choose dates" : "Choose date"} className={styles.panel} onKeyDown={onPanelKey}>
          <div className={styles.main}>
            {range && presets && (
              <div className={styles.presets} role="group" aria-label="Quick ranges">
                {presetRanges(today).map((p) => (
                  <button
                    key={p.label} type="button" className={styles.preset} aria-pressed={p.start === start && p.end === end}
                    onClick={() => { setStart(p.start); setEnd(p.end); setView(monthStart(parse(p.start)!)); setFocus(p.start); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.months}>
              {Array.from({ length: monthsShown }, (_, i) => renderMonth(shiftMonth(view, i), i))}
            </div>
          </div>
          <div className={styles.footer}>
            {range ? (
              <span className={styles.selection} aria-live="polite">
                {start ? `${short(start)} – ${short(end ?? previewEnd) || "Pick an end date"}` : "Pick a start date"}
              </span>
            ) : (
              <Button size="sm" variant="tertiary" disabled={blocked(todayISO)} onClick={() => { pick(today); go(today); }}>Today</Button>
            )}
            <span className={styles.actions}>
              <Button size="sm" onClick={() => close(true)}>Cancel</Button>
              <Button size="sm" variant="primary" disabled={!start} onClick={apply}>Apply</Button>
            </span>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
