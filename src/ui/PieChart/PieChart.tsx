"use client";
import { useState, type KeyboardEvent } from "react";
import { ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as c, formatter, toneAt, toneVar, type ChartFormat, type ChartTone } from "../Chart/chart";
import styles from "./PieChart.module.css";

export type { ChartFormat, ChartTone };
export type PieChartSize = "sm" | "md" | "lg";
export type PieChartLegend = "end" | "bottom";

export interface PieChartSlice {
  label: string;
  value: number;
  tone?: ChartTone;
}

export interface PieChartProps {
  label: string;
  data: PieChartSlice[];
  donut?: boolean;
  size?: PieChartSize;
  showTotal?: boolean;
  totalLabel?: string;
  showLegend?: boolean;
  legend?: PieChartLegend;
  maxSlices?: number;
  otherLabel?: string;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  emptyLabel?: string;
}

// The ring draws in a 100 box, lengths out of 100 from the top, clockwise. A donut is a 16-wide ring;
// a solid pie is one circle whose stroke fills it to the centre.
const C = 50;
// Each slice runs a hair under the next one, so the edges meet over colour and no hairline of background shows.
const OVERLAP = 0.4;

// Reference kit pie chart, in the colors of the Persona Homepages charts.
export function PieChart({
  label, data, donut = true, size = "md", showTotal = true, totalLabel = "Total", showLegend = true, legend = "end",
  maxSlices = 6, otherLabel = "Other", animate = true, format = "number", currency = "USD", emptyLabel = "No data for this range.",
}: PieChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const short = formatter(format, currency, true);
  const full = formatter(format, currency, false);

  // Largest first; past maxSlices the rest merge into one grey Other slice.
  const sorted = data.filter((d) => d.value > 0).map((d, i) => ({ ...d, tone: toneAt(i, d.tone) })).sort((a, b) => b.value - a.value);
  const kept = sorted.length > maxSlices ? sorted.slice(0, maxSlices - 1) : sorted;
  const rest = sorted.slice(kept.length);
  const slices = rest.length ? [...kept, { label: otherLabel, value: rest.reduce((s, d) => s + d.value, 0), tone: "gray" as ChartTone }] : kept;
  const total = slices.reduce((s, d) => s + d.value, 0);

  if (!slices.length || !(total > 0)) {
    return <ChartFrame label={label} animate={false} active={false}><ChartEmpty label={emptyLabel} height={160} /></ChartFrame>;
  }

  const r = donut ? 40 : 24;
  const width = donut ? 16 : 48;
  // Each slice starts where the ones before it end.
  const arcs = slices.map((d, i) => ({
    ...d,
    start: slices.slice(0, i).reduce((sum, e) => sum + (e.value / total) * 100, 0),
    len: (d.value / total) * 100,
    pct: Math.round((d.value / total) * 100),
  }));
  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (e.key === "Escape") { setActive(null); return; }
    if (!step) return;
    e.preventDefault();
    setActive((a) => (a === null ? 0 : (a + step + arcs.length) % arcs.length));
  };

  const cur = active !== null ? arcs[active] : null;

  return (
    <ChartFrame label={label} animate={animate} active={active !== null} onKeyDown={onKeyDown} onBlur={() => setActive(null)}>
      <div className={[styles.layout, styles[legend]].join(" ")}>
        <div className={[styles.pie, styles[size]].join(" ")} onPointerLeave={() => setActive(null)}>
          <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden="true">
            <g transform={`rotate(-90 ${C} ${C})`} fill="none" strokeWidth={width}>
              {arcs.map((a, i) => (
                <circle
                  key={a.label} className={c.sweep} cx={C} cy={C} r={r} pathLength={100}
                  strokeDasharray={`${Math.max(a.len + (arcs.length > 1 ? OVERLAP : 0), 0.01)} 100`} strokeDashoffset={-a.start}
                  style={{ stroke: toneVar(a.tone), opacity: active !== null && active !== i ? "var(--opacity-muted)" : 1 }}
                  onPointerEnter={() => setActive(i)}
                />
              ))}
            </g>
          </svg>
          {donut && showTotal && (
            <span className={styles.total} aria-hidden="true">
              <span className={styles.totalValue}>{short(total)}</span>
              <span className={styles.totalLabel}>{totalLabel}</span>
            </span>
          )}
          {cur && (
            // Above the pie, so it never covers the total or the legend.
            <div className={styles.tipAnchor}>
              <ChartTooltip x={0} y={0} title={cur.label} rows={[{ label: `${cur.pct}%`, value: full(cur.value), tone: cur.tone }]} />
            </div>
          )}
        </div>
        {showLegend && <Legend items={arcs.map((a) => ({ label: a.label, tone: a.tone, note: `${a.pct}%` }))} />}
      </div>
      <SrTable caption={label} columns={["Value", "Share"]} rows={arcs.map((a) => ({ head: a.label, cells: [full(a.value), `${a.pct}%`] }))} />
    </ChartFrame>
  );
}
