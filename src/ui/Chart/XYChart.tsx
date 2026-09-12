"use client";
// Internal: the drawing behind BarChart and LineChart. Categories sit in even bands along one axis; values run out from 0
// along the other. Upright charts put the categories along the bottom; horizontal bars list them down the start.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as s, formatter, niceTicks, toneAt, toneVar, useWidth,
  type ChartFormat, type ChartTone,
} from "./chart";

export interface ChartSeries {
  name: string;
  values: number[];
  tone?: ChartTone;
}

export type ChartOrientation = "vertical" | "horizontal";
export type ChartLegendPlace = "top" | "bottom" | "end";

export interface XYChartProps {
  kind: "bar" | "line";
  label: string;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  categories: string[];
  series: ChartSeries[];
  orientation?: ChartOrientation;
  highlight?: number | number[];
  highlightTone?: ChartTone;
  stacked?: boolean;
  area?: boolean;
  showPoints?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  legend?: ChartLegendPlace;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

// Room around the plot: axis labels below, value labels past the bars, labels at the start (about 7px a character at 12px).
const TOP = 8;
const BOTTOM = 28;
const RIGHT = 8;
const CHAR = 7;
const POINT = 4;
const LINE = 16;
// Horizontal bars grow the chart by a row per category, unless a height is given.
const ROW = 36;

export function XYChart({
  kind, label, title, subtitle, showTitle = true, categories, series, orientation = "vertical", highlight, highlightTone = "orange",
  stacked = false, area = false, showPoints = false, showValues = false,
  showGrid = true, showLegend = true, legend = "bottom", animate = true, format = "number", currency = "USD", height, emptyLabel = "No data for this range.",
}: XYChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  const [active, setActive] = useState<number | null>(null);

  const n = categories.length;
  const horizontal = kind === "bar" && orientation === "horizontal";
  const h = height ?? (horizontal ? Math.max(n, 1) * ROW + TOP + BOTTOM : 240);
  const list = series.map((sr, k) => ({ ...sr, tone: toneAt(k, sr.tone), vals: categories.map((_, i) => Math.max(sr.values[i] ?? 0, 0)) }));
  const short = formatter(format, currency, true);
  const full = formatter(format, currency, false);

  if (!n || !list.length) {
    return <ChartFrame label={label} title={title} subtitle={subtitle} showTitle={showTitle} animate={false} active={false}><ChartEmpty label={emptyLabel} height={h} /></ChartFrame>;
  }

  // Stacks: each series sits on the sum of the ones before it.
  const lower = list.map((_, k) => categories.map((__, i) => (stacked ? list.slice(0, k).reduce((sum, sr) => sum + sr.vals[i], 0) : 0)));
  const upper = list.map((sr, k) => sr.vals.map((v, i) => lower[k][i] + v));
  const max = Math.max(...upper.flat(), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const tickW = Math.max(...ticks.map((t) => short(t).length)) * CHAR;
  const catW = Math.max(...categories.map((c) => c.length)) * CHAR + 12;
  // The widest value label, for the room past the longest horizontal bar.
  const valueW = Math.max(...list.flatMap((sr, k) => sr.vals.map((v, i) => short(stacked ? upper[k][i] : v).length))) * CHAR;

  // The plot box. Horizontal: category labels take up to 40% at the start; values or the last tick overhang the end.
  const x0 = horizontal ? Math.min(catW, Math.round(width * 0.4)) : tickW + 12;
  const x1 = Math.max(width - (horizontal ? (showValues ? valueW + 8 : Math.max(RIGHT, Math.ceil(tickW / 2))) : RIGHT), x0 + 1);
  const y0 = !horizontal && showValues ? 20 : TOP;
  const y1 = h - BOTTOM;

  // c: the middle of category i's band. v: where a value lands on the value axis.
  const step = ((horizontal ? y1 - y0 : x1 - x0) / n);
  const c = (i: number) => (horizontal ? y0 : x0) + step * (i + 0.5);
  const v = (val: number) => (horizontal ? x0 + (val / top) * (x1 - x0) : y1 - (val / top) * (y1 - y0));

  // Thin out the category labels so they never overlap; horizontal ones shorten to fit the start.
  const every = Math.max(1, Math.ceil((horizontal ? LINE : catW) / step));
  const fit = Math.max(Math.floor((x0 - 12) / CHAR), 1);
  const catText = (t: string) => (horizontal && t.length > fit ? `${t.slice(0, Math.max(fit - 1, 1))}…` : t);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = horizontal ? e.clientY - r.top - y0 : e.clientX - r.left - x0;
    setActive(Math.min(Math.max(Math.floor(p / step), 0), n - 1));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key === "Escape") { setActive(null); return; }
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setActive(e.key === "Home" ? 0 : n - 1); return; }
    if (!(e.key in keys)) return;
    e.preventDefault();
    setActive((a) => (a === null ? 0 : Math.min(Math.max(a + keys[e.key], 0), n - 1)));
  };

  // Bars share a band per category: one stack, or the series side by side.
  const band = step * (stacked ? 0.6 : 0.7);
  const gap = 2;
  const bw = stacked ? band : (band - gap * (list.length - 1)) / list.length;
  const mid = (k: number) => (stacked ? 0 : -band / 2 + k * (bw + gap) + bw / 2);

  // Picked-out bars: the categories named in highlight take the highlight tone, like the first and last of a ranked chart.
  const picked = new Set(highlight === undefined ? [] : Array.isArray(highlight) ? highlight : [highlight]);
  const bars = () => list.map((sr, k) => (
    <g key={sr.name} style={{ fill: toneVar(sr.tone) }}>
      {sr.vals.map((_, i) => {
        const a = v(lower[k][i]);
        const b = v(upper[k][i]);
        const len = Math.abs(b - a);
        const side = c(i) + mid(k) - bw / 2;
        const t = Math.max(bw, 1);
        return len > 0 ? (
          <rect
            key={i} className={horizontal ? s.growX : s.grow}
            style={{ animationDelay: `${i * 30}ms`, fill: picked.has(i) ? toneVar(highlightTone) : undefined }}
            {...(horizontal ? { x: a, y: side, width: len, height: t } : { x: side, y: b, width: t, height: len })}
          />
        ) : null;
      })}
    </g>
  ));

  const lines = () => {
    const pts = (k: number, which: number[][]) => which[k].map((val, i) => `${c(i).toFixed(1)},${v(val).toFixed(1)}`);
    return list.map((sr, k) => {
      const topPts = pts(k, upper);
      const floor = stacked ? pts(k, lower).reverse() : [`${c(n - 1).toFixed(1)},${y1}`, `${c(0).toFixed(1)},${y1}`];
      return (
        <g key={sr.name}>
          {area && (
            <path
              className={s.grow} d={`M${topPts.join("L")}L${floor.join("L")}Z`}
              style={{ fill: toneVar(sr.tone), fillOpacity: stacked ? 1 : "var(--opacity-muted)" }}
            />
          )}
          <path className={s.draw} d={`M${topPts.join("L")}`} pathLength={1} fill="none" style={{ stroke: toneVar(sr.tone) }} strokeWidth={stacked ? 1 : 2} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      );
    });
  };

  // Points and value labels go on top of every area and line. Stacks label their total, once, past the top series.
  const marks = () => list.map((sr, k) => (
    <g key={sr.name} className={s.fade}>
      {(showPoints || (kind === "line" && active !== null)) && sr.vals.map((_, i) => (showPoints || i === active) && (
        <circle key={i} cx={c(i)} cy={v(upper[k][i])} r={POINT} style={{ fill: "var(--surface-flat)", stroke: toneVar(sr.tone) }} strokeWidth={2} />
      ))}
      {showValues && (kind === "line" || !stacked || k === list.length - 1) && sr.vals.map((val, i) => {
        const at = kind === "bar" && !stacked ? val : upper[k][i];
        const across = kind === "bar" ? c(i) + mid(k) : c(i);
        return horizontal
          ? <text key={i} className={s.valueLabel} x={v(at) + 8} y={across} dy="0.35em">{short(at)}</text>
          : <text key={i} className={s.valueLabel} x={across} y={v(at) - 8} textAnchor="middle">{short(at)}</text>;
      })}
    </g>
  ));

  const tip = active !== null && (() => {
    const end = Math.max(...upper.map((u) => u[active]));
    const rows = [...list].reverse().map((sr) => ({ label: sr.name, value: full(sr.vals[active]), tone: sr.tone }));
    // Horizontal: over the end of the bar, turned inward near the edge. Upright: over the top, turned inward at the ends.
    return horizontal
      ? <ChartTooltip x={v(end)} y={c(active) - band / 2} title={categories[active]} align={v(end) > x0 + (x1 - x0) * 0.7 ? "end" : "center"} rows={rows} />
      : <ChartTooltip x={c(active)} y={v(end)} title={categories[active]} align={active === 0 && n > 2 ? "start" : active === n - 1 && n > 2 ? "end" : "center"} rows={rows} />;
  })();

  const px = (p: number) => Math.round(p) + 0.5;

  const keys = showLegend
    ? <Legend items={list.map((sr) => ({ label: sr.name, tone: sr.tone }))} orientation={legend === "end" ? "column" : "row"} align={legend === "end" ? "start" : "center"} />
    : null;

  const plot = (
    <div ref={plotRef} className={s.plot} style={{ height: h }} onPointerMove={pick} onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg className={s.svg} width={width} height={h} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              {showGrid && (horizontal
                ? <line className={s.grid} x1={px(v(t))} x2={px(v(t))} y1={y0} y2={y1} />
                : <line className={s.grid} x1={x0} x2={x1} y1={px(v(t))} y2={px(v(t))} />)}
              {horizontal
                ? <text className={s.tick} x={v(t)} y={y1 + 18} textAnchor="middle">{short(t)}</text>
                : <text className={s.tick} x={x0 - 12} y={v(t)} dy="0.35em" textAnchor="end">{short(t)}</text>}
            </g>
          ))}
          {active !== null && (kind === "bar"
            ? (horizontal
              ? <rect className={s.hoverBand} x={x0} y={c(active) - step / 2} width={x1 - x0} height={step} />
              : <rect className={s.hoverBand} x={c(active) - step / 2} y={y0} width={step} height={y1 - y0} />)
            : <line className={s.crosshair} x1={c(active)} x2={c(active)} y1={y0} y2={y1} />)}
          {kind === "bar" ? bars() : lines()}
          {marks()}
          {categories.map((t, i) => i % every === 0 && (horizontal
            ? <text key={t + i} className={s.tick} x={x0 - 12} y={c(i)} dy="0.35em" textAnchor="end">{catText(t)}</text>
            : <text key={t + i} className={s.tick} x={c(i)} y={y1 + 18} textAnchor="middle">{t}</text>))}
        </svg>
      )}
      {tip}
    </div>
  );

  // Where the keys sit: under the chart, over it, or in a column beside it.
  return (
    <ChartFrame
      label={label} title={title} subtitle={subtitle} showTitle={showTitle} animate={animate} active={active !== null}
      onKeyDown={onKeyDown} onBlur={() => setActive(null)}
    >
      {legend === "end" ? <div className={s.beside}>{plot}{keys}</div> : legend === "top" ? <>{keys}{plot}</> : <>{plot}{keys}</>}
      <SrTable caption={label} columns={list.map((sr) => sr.name)} rows={categories.map((t, i) => ({ head: t, cells: list.map((sr) => full(sr.vals[i])) }))} />
    </ChartFrame>
  );
}
