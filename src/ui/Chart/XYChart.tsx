"use client";
// Internal: the drawing behind BarChart and LineChart. Categories run along the bottom in even bands; values up from 0.
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

export interface XYChartProps {
  kind: "bar" | "line";
  label: string;
  categories: string[];
  series: ChartSeries[];
  stacked?: boolean;
  area?: boolean;
  showPoints?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

// Room around the plot: x labels below, value labels above, tick labels at the start (about 7px a character at 12px).
const BOTTOM = 28;
const RIGHT = 8;
const CHAR = 7;
const POINT = 4;

export function XYChart({
  kind, label, categories, series, stacked = false, area = false, showPoints = false, showValues = false, showGrid = true,
  showLegend = true, animate = true, format = "number", currency = "USD", height = 240, emptyLabel = "No data for this range.",
}: XYChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  const [active, setActive] = useState<number | null>(null);

  const n = categories.length;
  const list = series.map((sr, k) => ({ ...sr, tone: toneAt(k, sr.tone), vals: categories.map((_, i) => Math.max(sr.values[i] ?? 0, 0)) }));
  const short = formatter(format, currency, true);
  const full = formatter(format, currency, false);

  if (!n || !list.length) {
    return <ChartFrame label={label} animate={false} active={false}><ChartEmpty label={emptyLabel} height={height} /></ChartFrame>;
  }

  // Stacks: each series sits on the sum of the ones before it.
  const lower = list.map((_, k) => categories.map((__, i) => (stacked ? list.slice(0, k).reduce((sum, sr) => sum + sr.vals[i], 0) : 0)));
  const upper = list.map((sr, k) => sr.vals.map((v, i) => lower[k][i] + v));
  const max = Math.max(...upper.flat(), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];

  const left = Math.max(...ticks.map((t) => short(t).length)) * CHAR + 12;
  const y0 = showValues ? 20 : 8;
  const y1 = height - BOTTOM;
  const x0 = left;
  const x1 = Math.max(width - RIGHT, x0 + 1);
  const step = (x1 - x0) / n;
  const x = (i: number) => x0 + step * (i + 0.5);
  const y = (v: number) => y1 - (v / top) * (y1 - y0);
  // Thin out the x labels so they never overlap.
  const labelW = Math.max(...categories.map((c) => c.length)) * CHAR + 12;
  const every = Math.max(1, Math.ceil(labelW / step));

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    setActive(Math.min(Math.max(Math.floor((px - x0) / step), 0), n - 1));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key === "Escape") { setActive(null); return; }
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setActive(e.key === "Home" ? 0 : n - 1); return; }
    if (!(e.key in keys)) return;
    e.preventDefault();
    setActive((a) => (a === null ? 0 : Math.min(Math.max(a + keys[e.key], 0), n - 1)));
  };

  const bars = () => {
    const band = step * (stacked ? 0.6 : 0.7);
    const gap = 2;
    const bw = stacked ? band : (band - gap * (list.length - 1)) / list.length;
    return list.map((sr, k) => (
      <g key={sr.name} style={{ fill: toneVar(sr.tone) }}>
        {sr.vals.map((v, i) => {
          const bx = stacked ? x(i) - band / 2 : x(i) - band / 2 + k * (bw + gap);
          const yt = y(upper[k][i]);
          const h = Math.max(y(lower[k][i]) - yt, 0);
          return h > 0 ? <rect key={i} className={s.grow} x={bx} y={yt} width={Math.max(bw, 1)} height={h} style={{ animationDelay: `${i * 30}ms` }} /> : null;
        })}
      </g>
    ));
  };

  const lines = () => {
    const pts = (k: number, which: number[][]) => which[k].map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    return list.map((sr, k) => {
      const topPts = pts(k, upper);
      const floor = stacked ? pts(k, lower).reverse() : [`${x(n - 1).toFixed(1)},${y1}`, `${x(0).toFixed(1)},${y1}`];
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

  // Points and value labels go on top of every area and line.
  const marks = () => list.map((sr, k) => (
    <g key={sr.name} className={s.fade}>
      {(showPoints || (kind === "line" && active !== null)) && sr.vals.map((_, i) => (showPoints || i === active) && (
        <circle key={i} cx={x(i)} cy={y(upper[k][i])} r={POINT} style={{ fill: "var(--surface-flat)", stroke: toneVar(sr.tone) }} strokeWidth={2} />
      ))}
      {showValues && sr.vals.map((v, i) => (
        <text key={i} className={s.valueLabel} x={x(i)} y={(kind === "bar" && !stacked ? y(v) : y(upper[k][i])) - 8} textAnchor="middle">{short(v)}</text>
      ))}
    </g>
  ));

  const tip = active !== null && (
    <ChartTooltip
      x={x(active)} y={y(Math.max(...upper.map((u) => u[active])))} title={categories[active]}
      align={active === 0 && n > 2 ? "start" : active === n - 1 && n > 2 ? "end" : "center"}
      rows={[...list].reverse().map((sr) => ({ label: sr.name, value: full(sr.vals[active]), tone: sr.tone }))}
    />
  );

  return (
    <ChartFrame label={label} animate={animate} active={active !== null} onKeyDown={onKeyDown} onBlur={() => setActive(null)}>
      <div ref={plotRef} className={s.plot} style={{ height }} onPointerMove={pick} onPointerLeave={() => setActive(null)}>
        {width > 0 && (
          <svg className={s.svg} width={width} height={height} aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                {showGrid && <line className={s.grid} x1={x0} x2={x1} y1={Math.round(y(t)) + 0.5} y2={Math.round(y(t)) + 0.5} />}
                <text className={s.tick} x={x0 - 12} y={y(t)} dy="0.35em" textAnchor="end">{short(t)}</text>
              </g>
            ))}
            {active !== null && (kind === "bar"
              ? <rect className={s.hoverBand} x={x(active) - step / 2} y={y0} width={step} height={y1 - y0} />
              : <line className={s.crosshair} x1={x(active)} x2={x(active)} y1={y0} y2={y1} />)}
            {kind === "bar" ? bars() : lines()}
            {marks()}
            {categories.map((c, i) => i % every === 0 && (
              <text key={c + i} className={s.tick} x={x(i)} y={y1 + 18} textAnchor="middle">{c}</text>
            ))}
          </svg>
        )}
        {tip}
      </div>
      {showLegend && <Legend items={list.map((sr) => ({ label: sr.name, tone: sr.tone }))} />}
      <SrTable caption={label} columns={list.map((sr) => sr.name)} rows={categories.map((c, i) => ({ head: c, cells: list.map((sr) => full(sr.vals[i])) }))} />
    </ChartFrame>
  );
}
