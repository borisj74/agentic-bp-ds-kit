"use client";
// Shared parts for BarChart, LineChart and PieChart: colors, number formats, the axis scale, the legend,
// the tooltip and the screen-reader table. Internal to the charts; screens use the chart components.
import { useLayoutEffect, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Legend as KitLegend, type LegendTone } from "../Legend/Legend";
import styles from "./chart.module.css";

// The chart tones are the kit Legend keys, so a chart and its Legend always agree.
export type ChartTone = LegendTone;
export type ChartFormat = "number" | "currency" | "percent";

// Figma Persona Homepages series order: green, olive, cyan, orange, pink, gray, then the rest of the category palette.
export const TONES: ChartTone[] = ["green", "olive", "cyan", "orange", "pink", "gray", "purple", "yellow", "red", "mint"];
export const toneAt = (i: number, tone?: ChartTone) => tone ?? TONES[i % TONES.length];
export const toneVar = (tone: ChartTone) => `var(--bg-${tone})`;

// Axis ticks and value labels are compact ($4M, 750K); tooltips and the table show the full number.
export function formatter(format: ChartFormat, currency: string, compact: boolean) {
  const f = new Intl.NumberFormat("en-US", {
    style: format === "currency" ? "currency" : format === "percent" ? "percent" : "decimal",
    currency: format === "currency" ? currency : undefined,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 2,
  });
  return (n: number) => f.format(format === "percent" ? n / 100 : n);
}

// A 0-based scale up to a round number, with 4 or 5 even ticks.
export function niceTicks(max: number): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

// Width of the element, following resizes. 0 until measured, so charts draw only in the browser.
export function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

// The kit Legend, in the chart: decorative, because the screen-reader table already carries the numbers.
export function Legend({ items, orientation = "row", align = "center" }: {
  items: { label: string; tone: ChartTone; note?: string }[];
  orientation?: "row" | "column"; align?: "start" | "center" | "end";
}) {
  return (
    <KitLegend
      decorative size="sm" orientation={orientation} align={align}
      items={items.map((it) => ({ label: it.label, tone: it.tone, value: it.note }))}
    />
  );
}

// The hover and keyboard tooltip: a title line, then one row per series with its swatch.
export function ChartTooltip({ x, y, title, rows, align = "center" }: {
  x: number; y: number; title: string; rows: { label: string; value: string; tone: ChartTone }[]; align?: "center" | "start" | "end";
}) {
  const shift = align === "start" ? "0%" : align === "end" ? "-100%" : "-50%";
  return (
    <div className={styles.tooltip} style={{ left: x, top: y, transform: `translate(${shift}, calc(-100% - var(--space-xsmall)))` }} aria-hidden="true">
      <p className={styles.tooltipTitle}>{title}</p>
      {rows.map((r) => (
        <p key={r.label} className={styles.tooltipRow}>
          <span className={styles.swatch} style={{ background: toneVar(r.tone) }} />
          <span className={styles.tooltipLabel}>{r.label}</span>
          <span className={styles.tooltipValue}>{r.value}</span>
        </p>
      ))}
    </div>
  );
}

// The numbers behind the chart, for screen readers. The drawing itself is hidden from them.
export function SrTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: { head: string; cells: string[] }[] }) {
  return (
    <table className={styles.srOnly}>
      <caption>{caption}</caption>
      <thead><tr><th scope="col" />{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.head}><th scope="row">{r.head}</th>{r.cells.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function ChartEmpty({ label, height }: { label: string; height: number }) {
  return <div className={styles.empty} style={{ height }}>{label}</div>;
}

export function ChartFrame({ label, title, subtitle, showTitle = true, animate, children, onKeyDown, onBlur, active }: {
  label: string; title?: string; subtitle?: string; showTitle?: boolean;
  animate: boolean; children: ReactNode; active: boolean;
  onKeyDown?: (e: KeyboardEvent) => void; onBlur?: () => void;
}) {
  // A focusable figure: arrow keys move through the data and show the tooltip, like pointing at it.
  const heading = showTitle && (title || subtitle);
  return (
    <figure
      className={[styles.chart, animate ? styles.animated : "", active ? styles.active : ""].join(" ")}
      aria-label={label} tabIndex={0} onKeyDown={onKeyDown} onBlur={onBlur}
    >
      {heading && (
        <figcaption className={styles.heading}>
          {title && <span className={styles.title}>{title}</span>}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </figcaption>
      )}
      {children}
    </figure>
  );
}

export { styles as chartStyles };
