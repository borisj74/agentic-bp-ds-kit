"use client";
// Steps that narrow, as one solid stack: how many of the ones who started a flow reached each step. Every step is a
// band of the same height in its own colour, and the stack tapers evenly from the first step to the last.
// Figma BP | Components 9122:8394 (Accumulation Chart): plot 688x240, bands of equal height, keys under the chart.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as s, formatter, intentAt, intentVar, useWidth,
  type ChartFormat, type ChartIntent,
} from "../Chart/chart";
import f from "./funnel.module.css";

export type { ChartFormat, ChartIntent };
// funnel narrows from the first step down; pyramid widens from it, for a stack that builds up to its base.
export type FunnelDirection = "funnel" | "pyramid";
// Where each step is named: in the keys, as in the Figma, or beside its own band with its count.
export type FunnelLabels = "legend" | "beside";
export type FunnelLegendPosition = "top" | "bottom" | "end";
export type FunnelRate = "none" | "ofFirst" | "ofPrevious";

export interface FunnelStep {
  label: string;
  value: number;
  intent?: ChartIntent;
}

export interface FunnelChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  // The steps in the order people go through them, widest first. A step bigger than the one before it is drawn as it
  // is: the numbers are the truth, not the shape.
  steps: FunnelStep[];
  direction?: FunnelDirection;
  labels?: FunnelLabels;
  // beside only: writes each step's count after its name.
  showValues?: boolean;
  // The share, in the tooltip, the table and the words beside a band: of the first step, or of the step before it.
  rate?: FunnelRate;
  showLegend?: boolean;
  legendPosition?: FunnelLegendPosition;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

// Figma 9122:8394: in a 688x240 plot the stack runs from y 16 to y 208, so it sits 16px under the top and 32px over
// the bottom, and its widest band is 320 across, a little under half the width. Its edges fall 320, 270, 220, 170,
// 120, 70: an even taper, closing to 70/320 of the width it started at.
const PAD = 16;
const FOOT = 32;
const SHARE = 320 / 688;
const CLOSE = 70 / 320;
const CHAR = 7;

export function FunnelChart({
  label, title, subtitle, showHeader = true, steps, direction = "funnel", labels = "legend",
  showValues = true, rate = "ofFirst", showLegend = true, legendPosition = "bottom",
  animate = true, format = "number", currency = "USD", height = 240, emptyLabel = "No data for this range.",
}: FunnelChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  const [active, setActive] = useState<number | null>(null);

  const n = steps.length;
  const full = formatter(format, currency, false);
  const h = height;
  const beside = labels === "beside";

  if (!n) {
    return <ChartFrame label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={false}><ChartEmpty label={emptyLabel} height={h} /></ChartFrame>;
  }

  const first = steps[0]?.value ?? 0;
  const share = (v: number, of: number) => (of > 0 ? `${Math.round((v / of) * 1000) / 10}%` : "—");
  const rateOf = (i: number) => (rate === "none" ? null : rate === "ofFirst" ? share(steps[i].value, first) : share(steps[i].value, steps[Math.max(i - 1, 0)].value));
  const rateWord = rate === "ofPrevious" ? "of the step before" : "of the first step";
  const colorOf = (i: number) => intentVar(steps[i].intent ?? intentAt(i));

  // Words beside the bands take their own column; without them the stack sits in the middle of the plot, as in the Figma.
  const words = beside ? Math.min(Math.max(...steps.map((st) => `${st.label} ${full(st.value)}`.length)) * CHAR + 16, Math.round(width * 0.45)) : 0;
  const area = Math.max(width - words - PAD * 2, 40);
  // Named in the keys, the stack keeps the Figma's share of the whole plot; named beside, it takes the room the
  // words leave it.
  const span = beside ? area : Math.min(width * SHARE, area);
  const mid = beside ? PAD + area / 2 : width / 2;

  // The edges of the stack, one per band boundary: the same taper the whole way down, so the sides are one straight
  // line and each band is a slice of it, as the Figma draws it. The width says nothing about the count; the counts
  // are in the keys, the words beside the bands, the tooltip and the table.
  const even = Array.from({ length: n + 1 }, (_, i) => span * (1 - (i * (1 - CLOSE)) / n));
  // A pyramid is that taper the other way up: narrow at the top, its base the full width.
  const edges = direction === "pyramid" ? [...even].reverse() : even;

  // Bands share the height evenly: the width carries the count, never the height.
  const band = (h - PAD - FOOT) / n;
  const top = (i: number) => PAD + i * band;
  const edgeAt = (i: number) => edges[i];

  const pickAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setActive(Math.min(Math.max(Math.floor((e.clientY - box.top - PAD) / band), 0), n - 1));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (e.key === "Escape") { setActive(null); return; }
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setActive(e.key === "Home" ? 0 : n - 1); return; }
    if (!(e.key in keys)) return;
    e.preventDefault();
    setActive((a) => (a === null ? 0 : Math.min(Math.max(a + keys[e.key], 0), n - 1)));
  };

  const tip = active !== null && (() => {
    const st = steps[active];
    const r = rateOf(active);
    return (
      <ChartTooltip
        x={mid} y={top(active)} title={st.label}
        rows={[
          { label: "Reached", value: full(st.value), intent: st.intent ?? intentAt(active) },
          ...(r ? [{ label: rateWord, value: r, intent: "gray" as ChartIntent }] : []),
        ]}
      />
    );
  })();

  const keys = showLegend
    ? <Legend items={steps.map((st, i) => ({ label: st.label, intent: st.intent ?? intentAt(i) }))} orientation={legendPosition === "end" ? "vertical" : "horizontal"} alignment={legendPosition === "end" ? "start" : "center"} />
    : null;

  const plot = (
    <div ref={plotRef} className={s.plot} style={{ height: h }} onPointerMove={pickAt} onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg className={s.svg} width={width} height={h} aria-hidden="true">
          {active !== null && <rect className={s.hoverBand} x={0} y={top(active)} width={width} height={band} />}
          {steps.map((st, i) => {
            // Each band is the trapezoid between the width at its top and the width at its bottom, so the stack is
            // one solid shape with no gaps between the steps.
            const a = edgeAt(i) / 2;
            const b = edgeAt(i + 1) / 2;
            const y = top(i);
            const z = y + band;
            return (
              <path
                key={`${st.label}${i}`} className={s.fade} style={{ fill: colorOf(i), animationDelay: `${i * 40}ms` }}
                d={`M${(mid - a).toFixed(1)},${y.toFixed(1)}H${(mid + a).toFixed(1)}L${(mid + b).toFixed(1)},${z.toFixed(1)}H${(mid - b).toFixed(1)}Z`}
              />
            );
          })}
          {beside && steps.map((st, i) => {
            const r = rateOf(i);
            const y = top(i) + band / 2;
            return (
              <g key={`${st.label}w${i}`}>
                <text className={f.stepLabel} x={PAD + area + 16} y={r ? y - 3 : y} dy="0.35em">{st.label}</text>
                {showValues && <text className={f.stepValue} x={width} y={r ? y - 3 : y} dy="0.35em" textAnchor="end">{full(st.value)}</text>}
                {r && <text className={f.stepRate} x={PAD + area + 16} y={y + 11} dy="0.35em">{`${r} ${rateWord}`}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {tip}
    </div>
  );

  return (
    <ChartFrame
      label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={animate} active={active !== null}
      onKeyDown={onKeyDown} onBlur={() => setActive(null)}
    >
      {legendPosition === "end" ? <div className={s.beside}>{plot}{keys}</div> : legendPosition === "top" ? <>{keys}{plot}</> : <>{plot}{keys}</>}
      <SrTable
        caption={label} columns={rate === "none" ? ["Reached"] : ["Reached", rateWord]}
        rows={steps.map((st, i) => ({ head: st.label, cells: rate === "none" ? [full(st.value)] : [full(st.value), rateOf(i) ?? "—"] }))}
      />
    </ChartFrame>
  );
}
