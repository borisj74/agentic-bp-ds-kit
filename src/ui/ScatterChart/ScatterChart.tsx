"use client";
// Two measures against each other, one dot per record: spend against usage, days late against balance. A dot can
// carry a third measure as its size.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as s, formatter, intentAt, intentVar, niceTicks, useWidth,
  type ChartFormat, type ChartIntent,
} from "../Chart/chart";
import sc from "./scatter.module.css";

export type { ChartFormat, ChartIntent };

export interface ScatterPoint {
  x: number;
  y: number;
  // A third measure, drawn as the size of the dot. Without it every dot is the same size.
  size?: number;
  // Names this record in the tooltip and the table, like Northwind Traders.
  label?: string;
}

export interface ScatterSeries {
  name: string;
  points: ScatterPoint[];
  intent?: ChartIntent;
}

export interface ScatterChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  series: ScatterSeries[];
  // The names of the two measures, written by their axes.
  xName?: string;
  yName?: string;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  currency?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  height?: number;
  emptyLabel?: string;
}

const TOP = 8;
const BOTTOM = 28;
const RIGHT = 8;
// The band the rotated axis name sits in at the start, so it never runs into the tick labels.
const NAME = 20;
const CHAR = 7;
const DOT = 5;
const DOT_MAX = 14;

export function ScatterChart({
  label, title, subtitle, showHeader = true, series, xName, yName,
  xFormat = "number", yFormat = "number", currency = "USD",
  showGrid = true, showLegend = true, animate = true, height = 280, emptyLabel = "No data for this range.",
}: ScatterChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  // The dot under the pointer or the keys, as [series, point].
  const [at, setAt] = useState<[number, number] | null>(null);

  const list = series.map((sr, k) => ({ ...sr, intent: intentAt(k, sr.intent) }));
  const all = list.flatMap((sr) => sr.points);
  const h = height;
  const xShort = formatter(xFormat, currency, true);
  const yShort = formatter(yFormat, currency, true);
  const xFull = formatter(xFormat, currency, false);
  const yFull = formatter(yFormat, currency, false);

  if (!all.length) {
    return <ChartFrame kit="ScatterChart" label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={false}><ChartEmpty label={emptyLabel} height={h} /></ChartFrame>;
  }

  const xTicks = niceTicks(Math.max(...all.map((p) => p.x), 0));
  const yTicks = niceTicks(Math.max(...all.map((p) => p.y), 0));
  const xTop = xTicks[xTicks.length - 1];
  const yTop = yTicks[yTicks.length - 1];
  const sizes = all.map((p) => p.size).filter((v): v is number => typeof v === "number" && v > 0);
  const sizeTop = sizes.length ? Math.max(...sizes) : 0;

  const tickW = Math.max(...yTicks.map((t) => yShort(t).length)) * CHAR;
  const x0 = tickW + 12 + (yName ? NAME : 0);
  const x1 = Math.max(width - RIGHT - DOT_MAX, x0 + 1);
  const y0 = TOP + DOT_MAX;
  const y1 = h - BOTTOM - (xName ? 14 : 0);
  const px = (p: number) => Math.round(p) + 0.5;
  const cx = (v: number) => x0 + (v / (xTop || 1)) * (x1 - x0);
  const cy = (v: number) => y1 - (v / (yTop || 1)) * (y1 - y0);
  // A dot with a third measure runs from a little under the plain size up to DOT_MAX, by area, so twice the value
  // looks about twice as big.
  const r = (p: ScatterPoint) => (sizeTop > 0 && p.size ? DOT + (DOT_MAX - DOT) * Math.sqrt(Math.max(p.size, 0) / sizeTop) : DOT);

  // The dot nearest the pointer, so a dot is easy to hit without one hit area each.
  const pickAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - box.left;
    const my = e.clientY - box.top;
    let best: [number, number] | null = null;
    let near = Infinity;
    list.forEach((sr, k) => sr.points.forEach((p, i) => {
      const d = (cx(p.x) - mx) ** 2 + (cy(p.y) - my) ** 2;
      if (d < near) { near = d; best = [k, i]; }
    }));
    setAt(near <= (DOT_MAX + 8) ** 2 ? best : null);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key === "Escape") { setAt(null); return; }
    // The dots are walked series by series, in the order they were given.
    const flat = list.flatMap((sr, k) => sr.points.map((__, i) => [k, i] as [number, number]));
    const where = at === null ? -1 : flat.findIndex(([k, i]) => k === at[0] && i === at[1]);
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setAt(e.key === "Home" ? flat[0] : flat[flat.length - 1]); return; }
    if (!(e.key in keys)) return;
    e.preventDefault();
    setAt(flat[Math.min(Math.max((where === -1 ? 0 : where + keys[e.key]), 0), flat.length - 1)]);
  };

  const tip = at && (() => {
    const sr = list[at[0]];
    const p = sr.points[at[1]];
    return (
      <ChartTooltip
        x={cx(p.x)} y={cy(p.y) - r(p)} title={p.label ?? sr.name}
        align={cx(p.x) - x0 < 80 ? "start" : x1 - cx(p.x) < 80 ? "end" : "center"}
        rows={[
          { label: xName ?? "x", value: xFull(p.x), intent: sr.intent },
          { label: yName ?? "y", value: yFull(p.y), intent: sr.intent },
          ...(p.size !== undefined ? [{ label: "Size", value: xFull(p.size), intent: "gray" as ChartIntent }] : []),
        ]}
      />
    );
  })();

  return (
    <ChartFrame
      kit="ScatterChart"
      label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={animate} active={at !== null} plotHeight={h} legendKeys={showLegend ? list.length : 0}
      onKeyDown={onKeyDown} onBlur={() => setAt(null)}
    >
      <div ref={plotRef} className={s.plot} style={{ height: h }} onPointerMove={pickAt} onPointerLeave={() => setAt(null)}>
        {width > 0 && (
          <svg className={s.svg} width={width} height={h} aria-hidden="true">
            {yTicks.map((t) => (
              <g key={`y${t}`}>
                {showGrid && <line className={s.grid} x1={x0} x2={x1} y1={px(cy(t))} y2={px(cy(t))} />}
                <text className={s.tick} x={x0 - 12} y={cy(t)} dy="0.35em" textAnchor="end">{yShort(t)}</text>
              </g>
            ))}
            {xTicks.map((t) => <text key={`x${t}`} className={s.tick} x={cx(t)} y={y1 + 18} textAnchor="middle">{xShort(t)}</text>)}
            {xName && <text className={sc.axisName} x={(x0 + x1) / 2} y={h - 2} textAnchor="middle">{xName}</text>}
            {yName && <text className={sc.axisName} x={0} y={0} transform={`translate(8, ${(y0 + y1) / 2}) rotate(-90)`} textAnchor="middle">{yName}</text>}
            {list.map((sr, k) => (
              <g key={sr.name} className={s.fade} style={{ animationDelay: `${k * 60}ms` }}>
                {sr.points.map((p, i) => {
                  const picked = at !== null && at[0] === k && at[1] === i;
                  return (
                    <circle
                      key={i} className={picked ? sc.dotPicked : sc.dot} cx={cx(p.x)} cy={cy(p.y)} r={r(p)}
                      style={{ fill: intentVar(sr.intent), fillOpacity: "var(--opacity-600)" }}
                    />
                  );
                })}
              </g>
            ))}
          </svg>
        )}
        {tip}
      </div>
      {showLegend && <Legend items={list.map((sr) => ({ label: sr.name, intent: sr.intent }))} />}
      <SrTable
        caption={label}
        columns={[xName ?? "x", yName ?? "y", ...(sizeTop > 0 ? ["Size"] : [])]}
        rows={list.flatMap((sr) => sr.points.map((p, i) => ({
          head: p.label ? `${sr.name}: ${p.label}` : `${sr.name} ${i + 1}`,
          cells: [xFull(p.x), yFull(p.y), ...(sizeTop > 0 ? [p.size === undefined ? "—" : xFull(p.size)] : [])],
        })))}
      />
    </ChartFrame>
  );
}
