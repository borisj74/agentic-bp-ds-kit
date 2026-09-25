"use client";
// Internal: the drawing behind BarChart and LineChart. Categories sit in even bands along one axis; values run out from 0
// along the other. Upright charts put the categories along the bottom; horizontal bars list them down the start.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as s, formatter, niceTicks, intentAt, intentVar, useWidth,
  type ChartFormat, type ChartIntent,
} from "./chart";

export interface ChartSeries {
  name: string;
  values: number[];
  intent?: ChartIntent;
}

// LineChart only: projectedFrom is the first category that is a forecast. The line turns dashed where it starts.
export interface ChartLineSeries extends ChartSeries {
  projectedFrom?: number;
}

// LineChart only: a dashed line across the chart at a value, like a limit or a target.
export interface ChartReferenceLine {
  value: number;
  label: string;
  intent?: ChartIntent;
}

// LineChart only: a thin line down the chart at one category, like today.
export interface ChartMarker {
  category: number;
  label: string;
}

export type ChartOrientation = "vertical" | "horizontal";
export type ChartLegendPosition = "top" | "bottom" | "end";
// BarChart only: wide bars fill most of their band; thin bars are a fixed 8px with rounded ends.
export type ChartBarWidth = "wide" | "thin";

export interface XYChartProps {
  kind: "bar" | "line";
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  categories: string[];
  series: ChartLineSeries[];
  orientation?: ChartOrientation;
  highlight?: number | number[];
  highlightIntent?: ChartIntent;
  stacked?: boolean;
  barWidth?: ChartBarWidth;
  area?: boolean;
  showPoints?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: ChartLegendPosition;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
  referenceLines?: ChartReferenceLine[];
  marker?: ChartMarker;
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
// Dashes for projections and reference lines: 6 on, 4 off.
const DASH = "6 4";
// Thin bars: as thick as a medium Meter bar (--progress-bar-md), with its corners (--radius-small).
const THIN = 8;
const ROUND = 2;
// The room a label or a point takes, for keeping guide labels clear of each other.
type Box = { l: number; r: number; t: number; b: number };

export function XYChart({
  kind, label, title, subtitle, showHeader = true, categories, series, orientation = "vertical", highlight, highlightIntent = "orange",
  stacked = false, barWidth = "wide", area = false, showPoints = false, showValues = false,
  showGrid = true, showLegend = true, legendPosition = "bottom", animate = true, format = "number", currency = "USD", height, emptyLabel = "No data for this range.",
  referenceLines = [], marker,
}: XYChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  const [active, setActive] = useState<number | null>(null);

  const n = categories.length;
  const horizontal = kind === "bar" && orientation === "horizontal";
  const h = height ?? (horizontal ? Math.max(n, 1) * ROW + TOP + BOTTOM : 240);
  const list = series.map((sr, k) => ({ ...sr, intent: intentAt(k, sr.intent), vals: categories.map((_, i) => Math.max(sr.values[i] ?? 0, 0)) }));
  const short = formatter(format, currency, true);
  const full = formatter(format, currency, false);

  if (!n || !list.length) {
    return <ChartFrame label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={false}><ChartEmpty label={emptyLabel} height={h} /></ChartFrame>;
  }

  // Stacks: each series sits on the sum of the ones before it.
  const lower = list.map((_, k) => categories.map((__, i) => (stacked ? list.slice(0, k).reduce((sum, sr) => sum + sr.vals[i], 0) : 0)));
  const upper = list.map((sr, k) => sr.vals.map((v, i) => lower[k][i] + v));
  // Reference lines and projections are line-chart ideas; bars ignore them.
  const line = kind === "line";
  const refs = line ? referenceLines : [];
  const mark = line && marker && marker.category >= 0 && marker.category < n ? marker : undefined;
  // The first forecast category of a series, or n when it has none.
  const firstProjected = (sr: ChartLineSeries) => (line && sr.projectedFrom !== undefined ? Math.min(Math.max(Math.round(sr.projectedFrom), 0), n) : n);
  const projected = (sr: ChartLineSeries, i: number) => i >= firstProjected(sr);
  // A reference line above the data still sits inside the scale.
  const max = Math.max(...upper.flat(), ...refs.map((r) => r.value), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const tickW = Math.max(...ticks.map((t) => short(t).length)) * CHAR;
  const catW = Math.max(...categories.map((c) => c.length)) * CHAR + 12;
  // The widest value label, for the room past the longest horizontal bar.
  const valueW = Math.max(...list.flatMap((sr, k) => sr.vals.map((v, i) => short(stacked ? upper[k][i] : v).length))) * CHAR;

  // The plot box. Horizontal: category labels take up to 40% at the start; values or the last tick overhang the end.
  const x0 = horizontal ? Math.min(catW, Math.round(width * 0.4)) : tickW + 12;
  const x1 = Math.max(width - (horizontal ? (showValues ? valueW + 8 : Math.max(RIGHT, Math.ceil(tickW / 2))) : RIGHT), x0 + 1);
  const y0 = !horizontal && (showValues || mark) ? 20 : TOP;
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

  // Bars share a band per category: one stack, or the series side by side. Wide bars fill most of the band; thin bars
  // are 8px each (never wider than a wide one would be), centred in it, so a long run of days reads as a light rhythm.
  const gap = 2;
  const wide = step * (stacked ? 0.6 : 0.7);
  const wideBar = stacked ? wide : (wide - gap * (list.length - 1)) / list.length;
  const thin = kind === "bar" && barWidth === "thin";
  const bw = thin ? Math.min(THIN, wideBar) : wideBar;
  const band = stacked ? bw : bw * list.length + gap * (list.length - 1);
  const mid = (k: number) => (stacked ? 0 : -band / 2 + k * (bw + gap) + bw / 2);

  // Thin bars round their two ends, like a Meter bar. A stack rounds only its outer ends: the first part with a value
  // at the baseline end and the last at the far end, so the joins between parts stay flat.
  const hasValue = (k: number, i: number) => list[k].vals[i] > 0;
  const isFirst = (k: number, i: number) => !stacked || !list.slice(0, k).some((_, j) => hasValue(j, i));
  const isLast = (k: number, i: number) => !stacked || !list.slice(k + 1).some((_, j) => hasValue(k + 1 + j, i));
  // A box with its own radius at each corner: top-left, top-right, bottom-right, bottom-left.
  const roundBox = (x: number, y: number, w: number, hh: number, [tl, tr, br, bl]: number[]) => {
    const r = (q: number) => Math.min(q, w / 2, hh / 2);
    const [a, b, cc, d] = [r(tl), r(tr), r(br), r(bl)];
    const f = (p: number) => p.toFixed(1);
    return `M${f(x + a)},${f(y)}H${f(x + w - b)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + b)}V${f(y + hh - cc)}Q${f(x + w)},${f(y + hh)} ${f(x + w - cc)},${f(y + hh)}`
      + `H${f(x + d)}Q${f(x)},${f(y + hh)} ${f(x)},${f(y + hh - d)}V${f(y + a)}Q${f(x)},${f(y)} ${f(x + a)},${f(y)}Z`;
  };

  // Picked-out bars: the categories named in highlight take the highlight intent, like the first and last of a ranked chart.
  const picked = new Set(highlight === undefined ? [] : Array.isArray(highlight) ? highlight : [highlight]);
  const bars = () => list.map((sr, k) => (
    <g key={sr.name} style={{ fill: intentVar(sr.intent) }}>
      {sr.vals.map((_, i) => {
        const a = v(lower[k][i]);
        const b = v(upper[k][i]);
        const len = Math.abs(b - a);
        const side = c(i) + mid(k) - bw / 2;
        const t = Math.max(bw, 1);
        if (len <= 0) return null;
        const style = { animationDelay: `${i * 30}ms`, fill: picked.has(i) ? intentVar(highlightIntent) : undefined };
        const className = horizontal ? s.growX : s.grow;
        if (!thin) {
          return <rect key={i} className={className} style={style} {...(horizontal ? { x: a, y: side, width: len, height: t } : { x: side, y: b, width: t, height: len })} />;
        }
        const start = isFirst(k, i) ? ROUND : 0;
        const end = isLast(k, i) ? ROUND : 0;
        // Upright bars grow up: the baseline end is the bottom. Horizontal bars grow right: the baseline end is the start.
        const d = horizontal
          ? roundBox(a, side, len, t, [start, end, end, start])
          : roundBox(side, b, t, len, [end, end, start, start]);
        return <path key={i} className={className} style={style} d={d} data-bar="thin" />;
      })}
    </g>
  ));

  const lines = () => {
    const pts = (k: number, which: number[][]) => which[k].map((val, i) => `${c(i).toFixed(1)},${v(val).toFixed(1)}`);
    return list.map((sr, k) => {
      const topPts = pts(k, upper);
      const floor = stacked ? pts(k, lower).reverse() : [`${c(n - 1).toFixed(1)},${y1}`, `${c(0).toFixed(1)},${y1}`];
      // Actual values draw solid; from the last actual point on, the forecast draws dashed.
      const p = firstProjected(sr);
      const solid = topPts.slice(0, p);
      const dashed = p < n ? topPts.slice(Math.max(p - 1, 0)) : [];
      return (
        <g key={sr.name}>
          {area && (
            <path
              className={s.grow} d={`M${topPts.join("L")}L${floor.join("L")}Z`}
              style={{ fill: intentVar(sr.intent), fillOpacity: stacked ? 1 : "var(--opacity-muted)" }}
            />
          )}
          {solid.length > 1 && <path className={s.draw} d={`M${solid.join("L")}`} pathLength={1} fill="none" style={{ stroke: intentVar(sr.intent) }} strokeWidth={stacked ? 1 : 2} strokeLinejoin="round" strokeLinecap="round" />}
          {dashed.length > 1 && <path className={s.fade} data-projected="" d={`M${dashed.join("L")}`} fill="none" style={{ stroke: intentVar(sr.intent) }} strokeWidth={stacked ? 1 : 2} strokeDasharray={DASH} strokeLinejoin="round" />}
        </g>
      );
    });
  };

  // Points and value labels go on top of every area and line. Stacks label their total, once, past the top series.
  const marks = () => list.map((sr, k) => (
    <g key={sr.name} className={s.fade}>
      {(showPoints || (kind === "line" && active !== null)) && sr.vals.map((_, i) => (showPoints || i === active) && (
        <circle key={i} cx={c(i)} cy={v(upper[k][i])} r={POINT} style={{ fill: "var(--surface-flat)", stroke: intentVar(sr.intent) }} strokeWidth={2} />
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

  // Reference lines under the data, labelled at the end with their short value; the marker runs top to bottom.
  const guides = () => (
    <g className={s.fade}>
      {refs.map((r) => (
        <line
          key={`${r.label}${r.value}`} className={s.reference} data-reference=""
          x1={x0} x2={x1} y1={px(v(r.value))} y2={px(v(r.value))} strokeDasharray={DASH}
          style={{ stroke: r.intent ? intentVar(r.intent) : undefined }}
        />
      ))}
      {mark && <line className={s.marker} data-marker="" x1={px(c(mark.category))} x2={px(c(mark.category))} y1={y0} y2={y1} />}
    </g>
  );
  // Their words go over everything else. A reference label sits at the end of its line, over it, or under it when
  // the line is at the very top. When that spot is taken by the marker's word, another reference label or a point
  // near the end of a line, it tries the other side, then slides left until it is clear.
  const markX = mark ? c(mark.category) : 0;
  const markAnchor = markX - x0 < 40 ? "start" : x1 - markX < 40 ? "end" : "middle";
  const hit = (a: Box, b: Box) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  // A label's box from its end and its baseline: about 7px a character, 11px up from the baseline and 3px down.
  const textBox = (right: number, base: number, text: string): Box => ({ l: right - text.length * CHAR, r: right, t: base - 11, b: base + 3 });
  const taken: Box[] = [];
  if (mark) {
    const w = mark.label.length * CHAR;
    const l = markAnchor === "start" ? markX : markAnchor === "end" ? markX - w : markX - w / 2;
    taken.push({ l, r: l + w, t: y0 - 19, b: y0 - 5 });
  }
  const dots: Box[] = line && refs.length ? list.flatMap((_, k) => upper[k].map((val, i) => ({ l: c(i) - POINT - 2, r: c(i) + POINT + 2, t: v(val) - POINT - 2, b: v(val) + POINT + 2 }))) : [];
  const refPlaces = refs.map((r) => {
    const text = `${r.label} ${short(r.value)}`;
    const y = v(r.value);
    const sides = (y - y0 < 16 ? [y + 14, y - 6] : [y - 6, y + 14]).filter((base) => base - 11 >= 0 && base + 3 <= h);
    const fits = sides.map((base) => {
      let x = x1;
      for (let tries = 0; tries < n + 2; tries++) {
        const box = textBox(x, base, text);
        const block = [...taken, ...dots].filter((o) => hit(box, o));
        if (!block.length) break;
        x = Math.min(...block.map((o) => o.l)) - 6;
      }
      return { base, x: Math.max(x, x0 + text.length * CHAR) };
    });
    // The side that needs the least sliding; the first side wins a tie.
    const place = fits.reduce((best, f) => (f.x > best.x ? f : best), fits[0] ?? { base: y - 6, x: x1 });
    taken.push(textBox(place.x, place.base, text));
    return { key: `${r.label}${r.value}`, text, ...place };
  });
  const guideLabels = () => (
    <g className={s.fade}>
      {refPlaces.map((p) => <text key={p.key} className={s.referenceLabel} x={p.x} y={p.base} textAnchor="end">{p.text}</text>)}
      {mark && <text className={s.markerLabel} x={markX} y={y0 - 8} textAnchor={markAnchor}>{mark.label}</text>}
    </g>
  );

  const tip = active !== null && (() => {
    const end = Math.max(...upper.map((u) => u[active]));
    const rows = [...list].reverse().map((sr) => ({ label: projected(sr, active) ? `${sr.name} (projected)` : sr.name, value: full(sr.vals[active]), intent: sr.intent }));
    // Horizontal: over the end of the bar, turned inward near the edge. Upright: over the top, turned inward at the ends.
    return horizontal
      ? <ChartTooltip x={v(end)} y={c(active) - band / 2} title={categories[active]} align={v(end) > x0 + (x1 - x0) * 0.7 ? "end" : "center"} rows={rows} />
      : <ChartTooltip x={c(active)} y={v(end)} title={categories[active]} align={active === 0 && n > 2 ? "start" : active === n - 1 && n > 2 ? "end" : "center"} rows={rows} />;
  })();

  const px = (p: number) => Math.round(p) + 0.5;

  const keys = showLegend
    ? <Legend items={list.map((sr) => ({ label: sr.name, intent: sr.intent }))} orientation={legendPosition === "end" ? "vertical" : "horizontal"} alignment={legendPosition === "end" ? "start" : "center"} />
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
          {line && guides()}
          {kind === "bar" ? bars() : lines()}
          {marks()}
          {line && guideLabels()}
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
      label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={animate} active={active !== null}
      onKeyDown={onKeyDown} onBlur={() => setActive(null)}
    >
      {legendPosition === "end" ? <div className={s.beside}>{plot}{keys}</div> : legendPosition === "top" ? <>{keys}{plot}</> : <>{plot}{keys}</>}
      <SrTable caption={label} columns={list.map((sr) => sr.name)} rows={categories.map((t, i) => ({ head: t, cells: list.map((sr) => (projected(sr, i) ? `${full(sr.vals[i])} (projected)` : full(sr.vals[i]))) }))} />
      {(refs.length > 0 || mark) && (
        <ul className={s.srOnly}>
          {refs.map((r) => <li key={`${r.label}${r.value}`}>{`${r.label}: ${full(r.value)}`}</li>)}
          {mark && <li>{`${mark.label}: ${categories[mark.category]}`}</li>}
        </ul>
      )}
    </ChartFrame>
  );
}
