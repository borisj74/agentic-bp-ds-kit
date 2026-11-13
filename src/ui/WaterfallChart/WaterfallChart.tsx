"use client";
// How a balance gets from one total to another: an opening total, the rises and falls that moved it, and the closing
// total, each bar starting where the one before it ended.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, Legend, SrTable, chartStyles as s, formatter, intentVar, niceTicks, useWidth,
  type ChartFormat, type ChartIntent,
} from "../Chart/chart";
import w from "./waterfall.module.css";

export type { ChartFormat, ChartIntent };
export type WaterfallItemKind = "change" | "total";

export interface WaterfallItem {
  label: string;
  // A change moves the running total by this much, up or down. A total is a bar from zero at this value, like the
  // opening or closing balance.
  value: number;
  kind?: WaterfallItemKind;
  // Overrides the colour this bar would take from its direction.
  intent?: ChartIntent;
}

export interface WaterfallChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  items: WaterfallItem[];
  riseIntent?: ChartIntent;
  fallIntent?: ChartIntent;
  totalIntent?: ChartIntent;
  showValues?: boolean;
  showConnectors?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

const TOP = 20;
const BOTTOM = 28;
const RIGHT = 8;
const CHAR = 7;

// A scale that holds negatives: the tick step comes from the whole span, then the ticks run from the floor under the
// lowest value to the first one over the highest.
function scaleTicks(lo: number, hi: number): number[] {
  if (lo >= 0) return niceTicks(hi);
  const span = niceTicks(hi - lo);
  const stepSize = span[1] - span[0];
  const from = Math.floor(lo / stepSize);
  const to = Math.ceil(hi / stepSize);
  return Array.from({ length: to - from + 1 }, (_, i) => (from + i) * stepSize);
}

export function WaterfallChart({
  label, title, subtitle, showHeader = true, items,
  riseIntent = "cyan", fallIntent = "orange", totalIntent = "gray",
  showValues = true, showConnectors = true, showGrid = true, showLegend = false,
  animate = true, format = "number", currency = "USD", height = 240, emptyLabel = "No data for this range.",
}: WaterfallChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  const [active, setActive] = useState<number | null>(null);

  const n = items.length;
  const short = formatter(format, currency, true);
  const full = formatter(format, currency, false);
  const h = height;

  if (!n) {
    return <ChartFrame label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={false}><ChartEmpty label={emptyLabel} height={h} /></ChartFrame>;
  }

  // Each bar's run: a total starts at zero, a change starts where the one before it ended.
  const bars: (WaterfallItem & { total: boolean; from: number; to: number; intent: ChartIntent })[] = [];
  for (const it of items) {
    const total = it.kind === "total";
    const run = bars.length ? bars[bars.length - 1].to : 0;
    const from = total ? 0 : run;
    const to = total ? it.value : run + it.value;
    bars.push({
      ...it, total, from, to,
      // A total takes the total colour; a change takes its direction's, unless it names one.
      intent: it.intent ?? (total ? totalIntent : it.value < 0 ? fallIntent : riseIntent),
    });
  }

  const lo = Math.min(0, ...bars.map((b) => Math.min(b.from, b.to)));
  const hi = Math.max(0, ...bars.map((b) => Math.max(b.from, b.to)));
  const ticks = scaleTicks(lo, hi);
  const floor = ticks[0];
  const top = ticks[ticks.length - 1];
  const tickW = Math.max(...ticks.map((t) => short(t).length)) * CHAR;

  const x0 = tickW + 12;
  const x1 = Math.max(width - RIGHT, x0 + 1);
  const y0 = showValues ? TOP : 8;
  const y1 = h - BOTTOM;
  const step = (x1 - x0) / n;
  const bw = step * 0.6;
  const c = (i: number) => x0 + step * (i + 0.5);
  const v = (val: number) => y1 - ((val - floor) / (top - floor || 1)) * (y1 - y0);
  const px = (p: number) => Math.round(p) + 0.5;

  // Thin the labels out so they never overlap, the way the other charts do.
  const labelW = Math.max(...items.map((it) => it.label.length)) * CHAR + 12;
  const every = Math.max(1, Math.ceil(labelW / step));

  const pickAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setActive(Math.min(Math.max(Math.floor((e.clientX - r.left - x0) / step), 0), n - 1));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key === "Escape") { setActive(null); return; }
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setActive(e.key === "Home" ? 0 : n - 1); return; }
    if (!(e.key in keys)) return;
    e.preventDefault();
    setActive((a) => (a === null ? 0 : Math.min(Math.max(a + keys[e.key], 0), n - 1)));
  };

  // A change says its sign, so a fall reads as a fall without its colour: −$340K.
  const signed = (b: { total: boolean; value: number }) => (b.total || b.value >= 0 ? short(b.value) : `−${short(Math.abs(b.value))}`);
  const signedFull = (b: { total: boolean; value: number }) => (b.total || b.value >= 0 ? full(b.value) : `−${full(Math.abs(b.value))}`);

  const tip = active !== null && (() => {
    const b = bars[active];
    const rows = [
      { label: b.total ? "Total" : "Change", value: signedFull(b), intent: b.intent },
      ...(b.total ? [] : [{ label: "Running total", value: full(b.to), intent: totalIntent }]),
    ];
    return (
      <ChartTooltip
        x={c(active)} y={Math.min(v(b.from), v(b.to))} title={b.label} rows={rows}
        align={active === 0 && n > 2 ? "start" : active === n - 1 && n > 2 ? "end" : "center"}
      />
    );
  })();

  const keys = showLegend
    ? <Legend items={[{ label: "Up", intent: riseIntent }, { label: "Down", intent: fallIntent }, { label: "Total", intent: totalIntent }]} />
    : null;

  return (
    <ChartFrame
      label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={animate} active={active !== null} plotHeight={h} legendKeys={showLegend ? 3 : 0}
      onKeyDown={onKeyDown} onBlur={() => setActive(null)}
    >
      <div ref={plotRef} className={s.plot} style={{ height: h }} onPointerMove={pickAt} onPointerLeave={() => setActive(null)}>
        {width > 0 && (
          <svg className={s.svg} width={width} height={h} aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                {showGrid && <line className={s.grid} x1={x0} x2={x1} y1={px(v(t))} y2={px(v(t))} />}
                <text className={s.tick} x={x0 - 12} y={v(t)} dy="0.35em" textAnchor="end">{short(t)}</text>
              </g>
            ))}
            {floor < 0 && <line className={w.zero} x1={x0} x2={x1} y1={px(v(0))} y2={px(v(0))} />}
            {active !== null && <rect className={s.hoverBand} x={c(active) - step / 2} y={y0} width={step} height={y1 - y0} />}
            {showConnectors && bars.slice(0, -1).map((b, i) => (
              <line
                key={`${b.label}${i}`} className={w.connector}
                x1={px(c(i) + bw / 2)} x2={px(c(i + 1) - bw / 2)} y1={px(v(b.to))} y2={px(v(b.to))}
              />
            ))}
            {bars.map((b, i) => {
              const a = v(b.from);
              const z = v(b.to);
              const len = Math.max(Math.abs(z - a), 1);
              return (
                <rect
                  key={`${b.label}${i}`} className={s.grow} style={{ fill: intentVar(b.intent), animationDelay: `${i * 40}ms` }}
                  x={c(i) - bw / 2} y={Math.min(a, z)} width={bw} height={len} rx={2}
                />
              );
            })}
            {showValues && bars.map((b, i) => (
              <text
                key={`${b.label}v${i}`} className={s.valueLabel} textAnchor="middle"
                x={c(i)} y={(b.value < 0 && !b.total ? Math.max(v(b.from), v(b.to)) + 16 : Math.min(v(b.from), v(b.to)) - 8)}
              >
                {signed(b)}
              </text>
            ))}
            {items.map((it, i) => (i % every === 0 || i === active) && (
              <text key={`${it.label}l${i}`} className={s.tick} x={c(i)} y={y1 + 18} textAnchor="middle">{it.label}</text>
            ))}
          </svg>
        )}
        {tip}
      </div>
      {keys}
      <SrTable
        caption={label} columns={["Change", "Running total"]}
        rows={bars.map((b) => ({ head: b.total ? `${b.label} (total)` : b.label, cells: [signedFull(b), full(b.to)] }))}
      />
    </ChartFrame>
  );
}
