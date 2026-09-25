"use client";
import {
  useId, useLayoutEffect, useRef, useState, useSyncExternalStore,
  type CSSProperties, type KeyboardEvent, type MouseEvent,
} from "react";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { DatePicker } from "../DatePicker/DatePicker";
import { Drawer } from "../Drawer/Drawer";
import { Dropdown } from "../Dropdown/Dropdown";
import { EmptyState } from "../EmptyState/EmptyState";
import { Form } from "../Form/Form";
import { Input } from "../Input/Input";
import { Segmented } from "../Segmented/Segmented";
import { Select } from "../Select/Select";
import { Switch } from "../Switch/Switch";
import { Textarea } from "../Textarea/Textarea";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./Calendar.module.css";

export type CalendarView = "month" | "week" | "day" | "list";
export type CalendarWeekStart = "sunday" | "monday";
export type CalendarIntent = "green" | "olive" | "cyan" | "orange" | "pink" | "gray" | "purple" | "yellow" | "red" | "mint";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  calendar?: string;
  intent?: CalendarIntent;
  note?: string;
}

export interface CalendarSource {
  id: string;
  name: string;
  intent?: CalendarIntent;
  hidden?: boolean;
}

export interface CalendarProps {
  label?: string;
  events?: CalendarEvent[];
  defaultEvents?: CalendarEvent[];
  onEventsChange?: (events: CalendarEvent[]) => void;
  onEventClick?: (event: CalendarEvent) => void;
  calendars?: CalendarSource[];
  view?: CalendarView;
  defaultView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  views?: CalendarView[];
  date?: string;
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  weekStart?: CalendarWeekStart;
  startHour?: number;
  readOnly?: boolean;
}

// Calendars without an intent take these in turn, after the Figma calendar list: PTO, personal, shifts, holidays, a manager's.
const INTENTS: CalendarIntent[] = ["orange", "cyan", "green", "purple", "pink", "olive", "yellow", "mint", "red", "gray"];
const VIEW_LABELS: Record<CalendarView, string> = { month: "Month", week: "Week", day: "Day", list: "List" };
const ALL_VIEWS: CalendarView[] = ["month", "week", "day", "list"];
// Month days show this many events, then +N more.
const MONTH_LINES = 3;

/* ---------- Dates: local time, ISO strings in and out ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toStamp = (d: Date) => `${toISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parse = (s?: string) => {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s) : null;
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0)) : null;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMinutes = (d: Date, n: number) => new Date(d.getTime() + n * 60000);
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// Laid out, hidden, while today is not known yet: the same on the server and in the first browser render.
const PLACEHOLDER_DAY = new Date(2000, 0, 1);
const sameDay = (a: Date, b: Date) => toISO(a) === toISO(b);
const weekOf = (d: Date, start: CalendarWeekStart) => addDays(dayOf(d), -((d.getDay() - (start === "monday" ? 1 : 0) + 7) % 7));
const hoursOf = (d: Date) => d.getHours() + d.getMinutes() / 60;

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-US", o);
const timeText = (d: Date) => fmt(d, { hour: "numeric", minute: "2-digit" });
const hourText = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
// Month's short start time: 9am, 9:30am.
const shortTime = (d: Date) => `${d.getHours() % 12 || 12}${d.getMinutes() ? `:${pad(d.getMinutes())}` : ""}${d.getHours() < 12 ? "am" : "pm"}`;
const longDate = (d: Date) => fmt(d, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const monthTitle = (d: Date) => fmt(d, { month: "long", year: "numeric" });
function rangeTitle(a: Date, b: Date) {
  if (a.getFullYear() !== b.getFullYear()) return `${fmt(a, { month: "short", day: "numeric", year: "numeric" })} – ${fmt(b, { month: "short", day: "numeric", year: "numeric" })}`;
  if (a.getMonth() !== b.getMonth()) return `${fmt(a, { month: "short", day: "numeric" })} – ${fmt(b, { month: "short", day: "numeric" })}, ${b.getFullYear()}`;
  return `${fmt(a, { month: "short", day: "numeric" })} – ${b.getDate()}, ${b.getFullYear()}`;
}

// The current minute, ticking. null while rendering on the server, so today and the time line only draw in the browser.
const subscribe = (tick: () => void) => {
  const t = window.setInterval(tick, 30000);
  return () => window.clearInterval(t);
};
const useNow = () => {
  const minute = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 60000), () => null);
  return minute === null ? null : new Date(minute * 60000);
};

/* ---------- Events ---------- */

interface Placed { ev: CalendarEvent; s: Date; e: Date; intent: CalendarIntent; source?: string }

// All-day events run from their first day to the start of the day after their last. Timed ones last an hour when open-ended.
function place(ev: CalendarEvent, calendars: CalendarSource[]): Placed | null {
  const s = parse(ev.start);
  if (!s) return null;
  const idx = calendars.findIndex((c) => c.id === ev.calendar);
  const src = idx >= 0 ? calendars[idx] : undefined;
  const intent = ev.intent ?? src?.intent ?? (idx >= 0 ? INTENTS[idx % INTENTS.length] : "cyan");
  const end = parse(ev.end);
  if (ev.allDay) {
    const last = end && end >= s ? dayOf(end) : dayOf(s);
    return { ev, s: dayOf(s), e: addDays(last, 1), intent, source: src?.name };
  }
  return { ev, s, e: end && end > s ? end : addMinutes(s, 60), intent, source: src?.name };
}

const covers = (p: Placed, day: Date) => p.s < addDays(day, 1) && p.e > day;
const byStart = (a: Placed, b: Placed) => Number(!!b.ev.allDay) - Number(!!a.ev.allDay) || +a.s - +b.s || +b.e - +a.e;

function whenText(p: Placed) {
  if (p.ev.allDay) {
    const last = addDays(p.e, -1);
    return sameDay(p.s, last) ? `All day, ${fmt(p.s, { month: "short", day: "numeric" })}` : `All day, ${fmt(p.s, { month: "short", day: "numeric" })} to ${fmt(last, { month: "short", day: "numeric" })}`;
  }
  return `${fmt(p.s, { month: "short", day: "numeric" })}, ${timeText(p.s)} to ${sameDay(p.s, p.e) ? timeText(p.e) : `${fmt(p.e, { month: "short", day: "numeric" })}, ${timeText(p.e)}`}`;
}
const eventName = (p: Placed) => [p.ev.title, whenText(p), p.source].filter(Boolean).join(", ");

const intentStyle = (intent: CalendarIntent) => ({
  "--tone-bg": `var(--bg-${intent}-faint)`,
  "--tone-border": `var(--border-${intent})`,
  "--tone-dot": `var(--bg-${intent})`,
  "--tone-text": `var(--text-${intent}-strong)`,
}) as CSSProperties;

// Timed events on one day, side by side where they overlap: each takes a column in its cluster of overlapping events.
function layoutDay(items: Placed[], day: Date) {
  const start = dayOf(day);
  const end = addDays(start, 1);
  const out: { p: Placed; top: number; len: number; col: number; cols: number }[] = [];
  let cluster: typeof out = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const close = () => { cluster.forEach((c) => { c.cols = colEnds.length; }); cluster = []; colEnds = []; };
  for (const p of [...items].sort(byStart)) {
    const top = Math.max((+p.s - +start) / 3600000, 0);
    const bottom = Math.min((+p.e - +start) / 3600000, (+end - +start) / 3600000);
    if (top >= clusterEnd) close();
    let col = colEnds.findIndex((e) => e <= top);
    if (col < 0) { col = colEnds.length; colEnds.push(bottom); } else colEnds[col] = bottom;
    clusterEnd = Math.max(clusterEnd, bottom);
    const item = { p, top, len: Math.max(bottom - top, 0.5), col, cols: 1 };
    cluster.push(item);
    out.push(item);
  }
  close();
  return out;
}

/* ---------- The event form ---------- */

interface Draft { id?: string; title: string; calendar: string; allDay: boolean; startDate: string; startTime: string; endDate: string; endTime: string; note: string }

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const d = new Date(2000, 0, 1, Math.floor(i / 2), (i % 2) * 30);
  return { value: `${pad(d.getHours())}:${pad(d.getMinutes())}`, label: timeText(d) };
});
const timeOptions = (v: string) => (TIMES.some((t) => t.value === v) || !parse(`2000-01-01T${v}`)
  ? TIMES
  : [...TIMES, { value: v, label: timeText(parse(`2000-01-01T${v}`)!) }].sort((a, b) => a.value.localeCompare(b.value)));

function draftFrom(p: Placed): Draft {
  const last = p.ev.allDay ? addDays(p.e, -1) : p.e;
  return {
    id: p.ev.id, title: p.ev.title, calendar: p.ev.calendar ?? "", allDay: !!p.ev.allDay, note: p.ev.note ?? "",
    startDate: toISO(p.s), startTime: toStamp(p.s).slice(11), endDate: toISO(last), endTime: p.ev.allDay ? toStamp(addMinutes(p.s, 60)).slice(11) : toStamp(p.e).slice(11),
  };
}

/* ---------- Calendar ---------- */

// Figma RDS calendar 29101:500: a month picker title, a toolbar, then Month, Week, Day or List; the event form and
// the calendar list open in a Drawer.
export function Calendar({
  label = "Calendar", events: eventsProp, defaultEvents, onEventsChange, onEventClick, calendars = [],
  view: viewProp, defaultView = "month", onViewChange, views = ALL_VIEWS, date: dateProp, defaultDate, onDateChange,
  weekStart = "sunday", startHour = 7, readOnly = false,
}: CalendarProps) {
  const titleId = useId();
  const formId = useId();
  const now = useNow();
  const [viewState, setViewState] = useState<CalendarView>(defaultView);
  // No date given: the calendar opens on today, which is only known in the browser (see useNow).
  const [dateState, setDateState] = useState<string | null>(defaultDate ?? null);
  const [eventsState, setEventsState] = useState<CalendarEvent[]>(defaultEvents ?? []);
  const [hidden, setHidden] = useState(() => new Set(calendars.filter((c) => c.hidden).map((c) => c.id)));
  const [panel, setPanel] = useState<"calendars" | "event" | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ title?: string; end?: string }>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusDay = useRef(false);

  const view = viewProp ?? viewState;
  const date = dateProp ?? dateState ?? (now ? toISO(now) : "");
  const events = eventsProp ?? eventsState;
  // Until today is known, lay out a fixed day so the server and the first browser render agree; the calendar stays
  // hidden until then, so that placeholder day never shows.
  const pending = !date;
  const focus = parse(date) ?? PLACEHOLDER_DAY;
  const today = now ? dayOf(now) : null;

  const setView = (v: CalendarView) => { if (viewProp === undefined) setViewState(v); onViewChange?.(v); };
  const setDate = (d: Date) => { const iso = toISO(d); if (dateProp === undefined) setDateState(iso); onDateChange?.(iso); };
  const commit = (next: CalendarEvent[]) => { if (eventsProp === undefined) setEventsState(next); onEventsChange?.(next); };

  const placed = events
    .filter((ev) => !ev.calendar || !hidden.has(ev.calendar))
    .map((ev) => place(ev, calendars))
    .filter((p): p is Placed => !!p);
  const on = (day: Date) => placed.filter((p) => covers(p, day)).sort(byStart);

  // What the view shows and how far previous and next step.
  const week = weekOf(focus, weekStart);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const title = view === "month" ? monthTitle(focus) : view === "day" ? longDate(focus) : rangeTitle(weekDays[0], weekDays[6]);
  const unit = view === "month" ? "month" : view === "day" ? "day" : "week";
  const step = (n: number) => setDate(view === "month" ? addMonths(focus, n) : addDays(focus, n * (view === "day" ? 1 : 7)));
  const openDay = (d: Date) => { setDate(d); if (views.includes("day")) setView("day"); };

  // Week and Day open scrolled to startHour, each time the view changes.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    // A quarter hour above, so the first hour label shows.
    if (el) el.scrollTop = (el.scrollHeight / 24) * Math.max(Math.min(startHour, 23) - 0.25, 0);
  }, [view, startHour]);
  // Arrow keys in Month move the focused day; keep focus on it once it renders, even in another month.
  useLayoutEffect(() => {
    if (!focusDay.current) return;
    focusDay.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${date}"]`)?.focus();
  }, [date]);

  /* ----- Drawers ----- */

  const openCreate = (day: Date, hour?: number, allDay = false) => {
    if (readOnly) return;
    const s = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(hour ?? 9), ((hour ?? 9) % 1) * 60);
    const e = addMinutes(s, 60);
    const firstShown = calendars.find((c) => !hidden.has(c.id)) ?? calendars[0];
    setDraft({
      title: "", calendar: firstShown?.id ?? "", allDay, note: "",
      startDate: toISO(s), startTime: toStamp(s).slice(11), endDate: toISO(e), endTime: toStamp(e).slice(11),
    });
    setErrors({});
    setPanel("event");
  };
  const openEvent = (p: Placed) => {
    onEventClick?.(p.ev);
    if (readOnly) return;
    setDraft(draftFrom(p));
    setErrors({});
    setPanel("event");
  };
  const closePanel = () => setPanel(null);
  const edit = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = () => {
    if (!draft) return;
    const start = draft.allDay ? parse(draft.startDate) : parse(`${draft.startDate}T${draft.startTime}`);
    const end = draft.allDay ? parse(draft.endDate) : parse(`${draft.endDate}T${draft.endTime}`);
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = "Enter an event name.";
    if (!start || !end || (draft.allDay ? end < start : end <= start)) next.end = "End must be after the start.";
    setErrors(next);
    if (next.title || next.end || !start || !end) return;
    const ev: CalendarEvent = {
      id: draft.id ?? `event-${Date.now().toString(36)}`,
      title: draft.title.trim(),
      start: draft.allDay ? toISO(start) : toStamp(start),
      end: draft.allDay ? toISO(end) : toStamp(end),
      ...(draft.allDay ? { allDay: true } : {}),
      ...(draft.calendar ? { calendar: draft.calendar } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };
    const old = draft.id ? events.find((x) => x.id === draft.id) : undefined;
    if (old?.intent) ev.intent = old.intent;
    commit(draft.id ? events.map((x) => (x.id === draft.id ? ev : x)) : [...events, ev]);
    closePanel();
  };
  const remove = () => {
    if (!draft?.id) return;
    commit(events.filter((x) => x.id !== draft.id));
    closePanel();
  };

  // Dates move together: the end never lands before the start.
  const setStartDate = (v: string) => edit({ startDate: v, ...(draft && v > draft.endDate ? { endDate: v } : {}) });
  const setStartTime = (v: string) => {
    if (!draft) return;
    const s = parse(`${draft.startDate}T${v}`);
    const e = parse(`${draft.endDate}T${draft.endTime}`);
    edit(s && e && e <= s ? { startTime: v, endDate: toISO(addMinutes(s, 60)), endTime: toStamp(addMinutes(s, 60)).slice(11) } : { startTime: v });
  };

  /* ----- Pieces ----- */

  const chip = (p: Placed, day: Date, kind: "pill" | "item") => {
    const starts = sameDay(p.s, day);
    const ends = sameDay(addDays(p.e, p.ev.allDay ? -1 : 0), day) || (!p.ev.allDay && +p.e === +addDays(dayOf(day), 1));
    return (
      <button
        key={p.ev.id} type="button" style={intentStyle(p.intent)} aria-label={eventName(p)}
        className={[kind === "pill" ? styles.pill : styles.item, kind === "pill" && !starts ? styles.continues : "", kind === "pill" && !ends ? styles.carries : ""].join(" ")}
        onClick={() => openEvent(p)}
      >
        {kind === "item" && <span className={styles.dot} aria-hidden="true" />}
        {kind === "item" && <span className={styles.itemTime}>{starts ? shortTime(p.s) : "…"}</span>}
        <span className={styles.chipTitle}>{p.ev.title}</span>
      </button>
    );
  };

  const onMonthKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.date === undefined) return;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1), ArrowRight: () => addDays(focus, 1), ArrowUp: () => addDays(focus, -7), ArrowDown: () => addDays(focus, 7),
      Home: () => weekOf(focus, weekStart), End: () => addDays(weekOf(focus, weekStart), 6),
      PageUp: () => addMonths(focus, -1), PageDown: () => addMonths(focus, 1),
    };
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (readOnly) openDay(focus); else openCreate(focus);
      return;
    }
    if (!moves[e.key]) return;
    e.preventDefault();
    focusDay.current = true;
    setDate(moves[e.key]());
  };

  const monthView = () => {
    const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
    const start = weekOf(first, weekStart);
    const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
    return (
      <div ref={gridRef} role="grid" aria-labelledby={titleId} className={styles.month} onKeyDown={onMonthKey}>
        <div role="row" className={styles.weekdays}>
          {weeks[0].map((d) => (
            <div key={d.getDay()} role="columnheader" className={styles.weekday} aria-label={fmt(d, { weekday: "long" })}>{fmt(d, { weekday: "short" })}</div>
          ))}
        </div>
        {weeks.map((row) => (
          <div key={toISO(row[0])} role="row" className={styles.monthRow}>
            {row.map((d) => {
              const iso = toISO(d);
              const list = on(d);
              const shown = list.length > MONTH_LINES ? list.slice(0, MONTH_LINES - 1) : list;
              const more = list.length - shown.length;
              const isToday = !!today && sameDay(d, today);
              const pick = (e: MouseEvent<HTMLDivElement>) => {
                if ((e.target as HTMLElement).closest("button")) return;
                setDate(d);
                openCreate(d);
              };
              return (
                <div
                  key={iso} role="gridcell" data-date={iso} tabIndex={iso === date ? 0 : -1} aria-selected={iso === date}
                  aria-label={`${longDate(d)}${isToday ? ", today" : ""}, ${list.length ? `${list.length} event${list.length > 1 ? "s" : ""}` : "no events"}`}
                  className={[styles.day, d.getMonth() !== focus.getMonth() ? styles.outside : "", iso === date ? styles.selected : "", readOnly ? "" : styles.canAdd].join(" ")}
                  onClick={pick}
                >
                  <button type="button" tabIndex={-1} className={[styles.dayNumber, isToday ? styles.today : ""].join(" ")} aria-label={`Open ${longDate(d)}`} onClick={() => openDay(d)}>
                    {d.getDate()}
                  </button>
                  <div className={styles.dayEvents}>
                    {shown.map((p) => chip(p, d, p.ev.allDay ? "pill" : "item"))}
                    {more > 0 && (
                      <button type="button" className={styles.more} onClick={() => openDay(d)} aria-label={`${more} more on ${longDate(d)}`}>+{more} more</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const timeView = (days: Date[]) => {
    const grid = { "--days": days.length } as CSSProperties;
    const slot = (d: Date) => (e: MouseEvent<HTMLDivElement>) => {
      if (readOnly || (e.target as HTMLElement).closest("button")) return;
      const r = e.currentTarget.getBoundingClientRect();
      openCreate(d, Math.floor(((e.clientY - r.top) / r.height) * 48) / 2);
    };
    return (
      <div className={styles.time} style={grid}>
        <div className={[styles.timeRow, styles.timeHead].join(" ")}>
          <div className={styles.gutter} />
          {days.map((d) => {
            const isToday = !!today && sameDay(d, today);
            const text = days.length === 1 ? fmt(d, { weekday: "long" }) : `${fmt(d, { weekday: "short" })} ${d.getDate()}`;
            return (
              <div key={toISO(d)} className={styles.colHead}>
                {days.length > 1 && views.includes("day")
                  ? <button type="button" className={[styles.colHeadButton, isToday ? styles.today : ""].join(" ")} aria-label={`Open ${longDate(d)}`} onClick={() => openDay(d)}>{text}</button>
                  : <span className={isToday ? styles.todayText : ""}>{text}</span>}
              </div>
            );
          })}
        </div>
        <div className={[styles.timeRow, styles.allDay].join(" ")}>
          <div className={[styles.gutter, styles.allDayLabel].join(" ")}>all-day</div>
          {days.map((d) => (
            <div key={toISO(d)} className={[styles.allDayCell, readOnly ? "" : styles.canAdd].join(" ")} onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) openCreate(d, undefined, true); }}>
              {on(d).filter((p) => p.ev.allDay).map((p) => chip(p, d, "pill"))}
            </div>
          ))}
        </div>
        <div ref={scrollRef} className={styles.scroll}>
          <div className={styles.timeRow}>
            <div className={[styles.gutter, styles.hours].join(" ")} aria-hidden="true">
              {Array.from({ length: 24 }, (_, h) => <span key={h} className={styles.hour}>{h > 0 ? hourText(h) : ""}</span>)}
            </div>
            {days.map((d) => (
              <div key={toISO(d)} className={[styles.col, readOnly ? "" : styles.canAdd].join(" ")} onClick={slot(d)}>
                {layoutDay(on(d).filter((p) => !p.ev.allDay), d).map(({ p, top, len, col, cols }) => (
                  <button
                    key={p.ev.id} type="button" aria-label={eventName(p)} onClick={() => openEvent(p)}
                    className={[styles.block, len < 0.75 ? styles.blockShort : ""].join(" ")}
                    style={{
                      ...intentStyle(p.intent),
                      top: `calc(var(--calendar-hour) * ${top})`, height: `calc(var(--calendar-hour) * ${len} - var(--border-width-medium))`,
                      left: `${(col / cols) * 100}%`, width: `${100 / cols}%`,
                    }}
                  >
                    <span className={styles.blockTime}>{sameDay(p.s, d) ? shortTime(p.s) : "…"} – {sameDay(p.e, d) ? shortTime(p.e) : "…"}</span>
                    <span className={styles.blockTitle}>{p.ev.title}</span>
                  </button>
                ))}
                {now && sameDay(d, now) && <div className={styles.now} style={{ top: `calc(var(--calendar-hour) * ${hoursOf(now)})` }} aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const listView = () => {
    const groups = weekDays.map((d) => ({ d, list: on(d) })).filter((g) => g.list.length);
    if (!groups.length) {
      return (
        <div className={styles.listEmpty}>
          <EmptyState
            icon="event_available" title="No events this week" description={readOnly ? "Nothing is scheduled for these days." : "Add one with New event, or pick another week."}
            actions={readOnly ? undefined : <Button size="sm" iconStart="add" onClick={() => openCreate(focus)}>New event</Button>}
          />
        </div>
      );
    }
    return (
      <div className={styles.list}>
        {groups.map(({ d, list }) => (
          <section key={toISO(d)} aria-label={longDate(d)}>
            <h3 className={[styles.listDay, today && sameDay(d, today) ? styles.todayText : ""].join(" ")}>{fmt(d, { weekday: "long", month: "long", day: "numeric" })}</h3>
            <ul className={styles.listItems}>
              {list.map((p) => (
                <li key={p.ev.id}>
                  <button type="button" className={styles.listRow} style={intentStyle(p.intent)} aria-label={eventName(p)} onClick={() => openEvent(p)}>
                    <span className={styles.listTime}>
                      {p.ev.allDay ? "All day" : `${sameDay(p.s, d) ? timeText(p.s) : "…"} – ${sameDay(p.e, d) ? timeText(p.e) : "…"}`}
                    </span>
                    <span className={styles.dot} aria-hidden="true" />
                    <span className={styles.listTitle}>{p.ev.title}</span>
                    {p.source && <span className={styles.listSource}>{p.source}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  /* ----- Page ----- */

  const year = focus.getFullYear();
  const months = Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));
  const iconButton = (name: string, icon: string, onClick: () => void) => (
    <Tooltip content={name}>
      <Button size="sm" iconOnly iconStart={icon} onClick={onClick}>{name}</Button>
    </Tooltip>
  );

  const eventFooter = (
    <>
      {draft?.id && <Button size="sm" variant="danger" onClick={remove}>Delete</Button>}
      <Button size="sm" onClick={closePanel}>Cancel</Button>
      <Button size="sm" variant="primary" type="submit" form={formId}>Save</Button>
    </>
  );

  return (
    <section className={[styles.calendar, pending ? styles.pending : ""].join(" ")} aria-label={label} aria-busy={pending || undefined}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 id={titleId} className={styles.title} aria-live="polite">{title}</h2>
          <Dropdown
            label="Choose month" variant="tertiary" size="sm" iconOnly icon="expand_more"
            items={months.map((m) => ({ id: toISO(m), label: fmt(m, { month: "long", year: "numeric" }), selected: m.getMonth() === focus.getMonth() }))}
            onSelect={(id) => { const m = parse(id); if (m) setDate(addMonths(focus, m.getMonth() - focus.getMonth())); }}
          />
        </div>
        <div className={styles.toolbar}>
          <div className={styles.tools}>
            {!readOnly && iconButton("New event", "add", () => openCreate(focus))}
            {iconButton(`Previous ${unit}`, "chevron_left", () => step(-1))}
            {iconButton(`Next ${unit}`, "chevron_right", () => step(1))}
            <Button size="sm" onClick={() => setDate(dayOf(new Date()))}>Today</Button>
            {calendars.length > 0 && <Button size="sm" onClick={() => setPanel("calendars")}>Calendars</Button>}
          </div>
          {views.length > 1 && (
            <Segmented
              label="View" hideLabel size="sm" value={view} onChange={(v) => setView(v as CalendarView)}
              options={views.map((v) => ({ value: v, label: VIEW_LABELS[v] }))}
            />
          )}
        </div>
      </div>

      <div className={styles.body}>
        {view === "month" ? monthView() : view === "list" ? listView() : timeView(view === "day" ? [focus] : weekDays)}
      </div>

      <Drawer open={panel === "calendars"} title="Calendars" description="Show or hide each calendar's events." onClose={closePanel} footer={<Button size="sm" onClick={closePanel}>Done</Button>}>
        <ul className={styles.sources}>
          {calendars.map((c, i) => (
            <li key={c.id} className={styles.source}>
              <span className={styles.swatch} style={intentStyle(c.intent ?? INTENTS[i % INTENTS.length])} aria-hidden="true" />
              <Checkbox
                label={c.name} checked={!hidden.has(c.id)}
                onChange={(shown) => setHidden((h) => { const next = new Set(h); if (shown) next.delete(c.id); else next.add(c.id); return next; })}
              />
            </li>
          ))}
        </ul>
      </Drawer>

      <Drawer open={panel === "event" && !!draft} title={draft?.id ? "Edit event" : "New event"} size="medium" onClose={closePanel} footer={eventFooter}>
        {draft && (
          <Form id={formId} onSubmit={save}>
            {calendars.length > 0 && (
              <Select label="Calendar" options={calendars.map((c) => ({ value: c.id, label: c.name }))} value={draft.calendar} onChange={(v) => edit({ calendar: v as string })} menuWidth="field" />
            )}
            <Input label="Event name" placeholder="Team standup" value={draft.title} onChange={(v) => edit({ title: v })} invalid={!!errors.title} error={errors.title} />
            <Switch label="All day" checked={draft.allDay} onChange={(v) => edit({ allDay: v })} />
            <div className={styles.pair}>
              <DatePicker label="Start date" presets={false} value={draft.startDate} onChange={(v) => typeof v === "string" && setStartDate(v)} />
              {!draft.allDay && <Select label="Start time" searchable options={timeOptions(draft.startTime)} value={draft.startTime} onChange={(v) => setStartTime(v as string)} menuWidth="field" />}
            </div>
            <div className={styles.pair}>
              <DatePicker label="End date" presets={false} value={draft.endDate} minDate={draft.startDate} onChange={(v) => typeof v === "string" && edit({ endDate: v })} invalid={draft.allDay && !!errors.end} error={draft.allDay ? errors.end : undefined} />
              {!draft.allDay && <Select label="End time" searchable options={timeOptions(draft.endTime)} value={draft.endTime} onChange={(v) => edit({ endTime: v as string })} invalid={!!errors.end} error={errors.end} menuWidth="field" />}
            </div>
            <Textarea label="Note" size="sm" placeholder="Add details for the people invited" value={draft.note} onChange={(v) => edit({ note: v })} />
          </Form>
        )}
      </Drawer>
    </section>
  );
}
