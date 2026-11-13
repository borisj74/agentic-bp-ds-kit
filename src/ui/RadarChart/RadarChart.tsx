"use client";
// Several measures on one shape: each point is a measure, each series a filled outline across all of them, so two
// things can be compared on every measure at once. Figma BP | Components 9131:7152.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as s, formatter, intentAt, intentVar, niceTicks, useWidth,
  type ChartFormat, type ChartIntent,
} from "../Chart/chart";
import r from "./radar.module.css";

export type { ChartFormat, ChartIntent };
export type RadarLegendPosition = "top" | "bottom" | "end";

export interface RadarSeries {
  name: string;
  // One value per axis, in the same order as axes.
  values: number[];
  intent?: ChartIntent;
}

export interface RadarChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  // The points of the web, clockwise from the top, like the parts of a health score. Three at least.
  axes: string[];
  series: RadarSeries[];
  // How many rings the web has. The outermost is the top of the scale.
  levels?: number;
  // The value the outer ring stands for. Without it the scale rounds up past the largest value in the chart.
  max?: number;
  // Fills each series as well as drawing its outline. Off leaves the outlines alone, for more than two series.
  fill?: boolean;
  // Writes the ring values up the first axis, so the web can be read without the tooltip.
  showScale?: boolean;
  showLegend?: boolean;
  legendPosition?: RadarLegendPosition;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

// Room for the names around the web, and the shortest side a web is worth drawing on.
const LABEL = 44;
const MIN = 80;
const POINT = 4;

export function RadarChart({
  label, title, subtitle, showHeader = true, axes, series, levels = 4, max,
  fill = true, showScale = false, showLegend = true, legendPosition = "bottom",
  animate = true, format = "number", currency = "USD", height = 280, emptyLabel = "No data for this range.",
}: RadarChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  // Which axis the pointer or the keys are on.
  const [active, setActive] = useState<number | null>(null);

  const n = axes.length;
  const list = series.map((sr, k) => ({ ...sr, intent: intentAt(k, sr.intent), vals: axes.map((_, i) => Math.max(sr.values[i] ?? 0, 0)) }));
  const short = formatter(format, currency, true);
  const full = formatter(format, currency, false);
  const h = height;

  if (n < 3 || !list.length) {
    return <ChartFrame label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={false}><ChartEmpty label={emptyLabel} height={h} /></ChartFrame>;
  }

  // The outer ring is a round number past the largest value, so the rings are worth reading.
  const ticks = niceTicks(Math.max(...list.flatMap((sr) => sr.vals), 0));
  const top = max ?? ticks[ticks.length - 1];
  const rings = Math.max(Math.round(levels), 1);

  // The web: the first point is straight up, the rest run clockwise.
  const cx = width / 2;
  const cy = h / 2;
  const radius = Math.max(Math.min(width, h) / 2 - LABEL, MIN / 2);
  const angle = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const at = (i: number, dist: number): [number, number] => [cx + Math.cos(angle(i)) * dist, cy + Math.sin(angle(i)) * dist];
  const reach = (val: number) => (top > 0 ? Math.min(val / top, 1) * radius : 0);
  const shape = (dists: number[]) => `${dists.map((d, i) => at(i, d).map((q) => q.toFixed(1)).join(",")).join("L")}Z`;

  // The name of a point sits past it, turned away from the web so it never covers the shape.
  const place = (i: number) => {
    const [x, y] = at(i, radius + 18);
    const cos = Math.cos(angle(i));
    const sin = Math.sin(angle(i));
    const anchor: "start" | "middle" | "end" = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
    return { x, y: y + (Math.abs(sin) < 0.2 ? 4 : sin > 0 ? 10 : -2), anchor };
  };

  // The axis the pointer is nearest, by the angle from the middle of the web.
  const pickAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - box.left - cx;
    const dy = e.clientY - box.top - cy;
    if (Math.hypot(dx, dy) > radius + LABEL) { setActive(null); return; }
    const a = Math.atan2(dy, dx) + Math.PI / 2;
    const turn = ((a / (Math.PI * 2)) % 1 + 1) % 1;
    setActive(Math.round(turn * n) % n);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key === "Escape") { setActive(null); return; }
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setActive(e.key === "Home" ? 0 : n - 1); return; }
    if (!(e.key in keys)) return;
    e.preventDefault();
    // The web closes on itself, so walking past the last point comes back round to the first.
    setActive((p) => (p === null ? 0 : (p + keys[e.key] + n) % n));
  };

  const tip = active !== null && (() => {
    const far = Math.max(...list.map((sr) => reach(sr.vals[active])));
    const [x, y] = at(active, far);
    const side = Math.cos(angle(active));
    return (
      <ChartTooltip
        x={x} y={y} title={axes[active]} align={Math.abs(side) < 0.2 ? "center" : side > 0 ? "start" : "end"}
        rows={list.map((sr) => ({ label: sr.name, value: full(sr.vals[active]), intent: sr.intent }))}
      />
    );
  })();

  const keys = showLegend
    ? <Legend items={list.map((sr) => ({ label: sr.name, intent: sr.intent }))} orientation={legendPosition === "end" ? "vertical" : "horizontal"} alignment={legendPosition === "end" ? "start" : "center"} />
    : null;

  const plot = (
    <div ref={plotRef} className={s.plot} style={{ height: h }} onPointerMove={pickAt} onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg className={s.svg} width={width} height={h} aria-hidden="true">
          {/* The web: a ring a level, and a spoke to every point. */}
          {Array.from({ length: rings }, (_, level) => (
            <path key={level} className={r.ring} d={`M${shape(axes.map(() => (radius * (level + 1)) / rings))}`} />
          ))}
          {axes.map((t, i) => {
            const [x, y] = at(i, radius);
            return <line key={`${t}${i}`} className={i === active ? r.active : r.spoke} x1={cx} y1={cy} x2={x} y2={y} />;
          })}
          {list.map((sr) => (
            <g key={sr.name} className={s.fade}>
              <path
                d={`M${shape(sr.vals.map(reach))}`}
                style={{ fill: fill ? intentVar(sr.intent) : "none", fillOpacity: fill ? "var(--opacity-muted)" : undefined, stroke: intentVar(sr.intent) }}
                strokeWidth={2} strokeLinejoin="round"
              />
              {active !== null && (() => {
                const [x, y] = at(active, reach(sr.vals[active]));
                return <circle cx={x} cy={y} r={POINT} style={{ fill: "var(--surface-flat)", stroke: intentVar(sr.intent) }} strokeWidth={2} />;
              })()}
            </g>
          ))}
          {showScale && Array.from({ length: rings }, (_, level) => {
            const value = (top * (level + 1)) / rings;
            const [x, y] = at(0, (radius * (level + 1)) / rings);
            return <text key={`v${level}`} className={r.scaleLabel} x={x + 6} y={y} dy="0.35em">{short(value)}</text>;
          })}
          {axes.map((t, i) => {
            const p = place(i);
            return <text key={`l${t}${i}`} className={r.axisLabel} x={p.x} y={p.y} textAnchor={p.anchor}>{t}</text>;
          })}
        </svg>
      )}
      {tip}
    </div>
  );

  return (
    <ChartFrame
      label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={animate} active={active !== null} plotHeight={h}
      legendKeys={showLegend ? list.length : 0} legendPosition={legendPosition}
      onKeyDown={onKeyDown} onBlur={() => setActive(null)}
    >
      {legendPosition === "end" ? <div className={s.beside}>{plot}{keys}</div> : legendPosition === "top" ? <>{keys}{plot}</> : <>{plot}{keys}</>}
      <SrTable
        caption={label} columns={list.map((sr) => sr.name)}
        rows={axes.map((t, i) => ({ head: t, cells: list.map((sr) => full(sr.vals[i])) }))}
      />
    </ChartFrame>
  );
}
