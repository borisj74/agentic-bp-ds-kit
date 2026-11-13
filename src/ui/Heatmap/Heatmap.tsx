"use client";
// A grid where the weight of each cell is its value: use by day and hour, errors by endpoint and day.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChartEmpty, ChartFrame, ChartTooltip, SrTable, chartStyles as s, formatter, intentAt, intentVar, useWidth,
  type ChartFormat, type ChartIntent,
} from "../Chart/chart";
import h from "./heatmap.module.css";

export type { ChartFormat, ChartIntent };
export type HeatmapSize = "sm" | "md" | "lg";

export interface HeatmapProps {
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  // The rows down the start, like the days of a week.
  rows: string[];
  // The columns along the bottom, like the hours of a day.
  columns: string[];
  // One row of values per row label, one value per column. A missing value draws as an empty cell.
  values: (number | null)[][];
  intent?: ChartIntent;
  size?: HeatmapSize;
  // Writes the value in each cell. Only lg cells have the room for it.
  showValues?: boolean;
  // The key under the grid: five steps from light to full, with a word at each end.
  showLegend?: boolean;
  lowLabel?: string;
  highLabel?: string;
  format?: ChartFormat;
  currency?: string;
  emptyLabel?: string;
}

const CELLS: Record<HeatmapSize, number> = { sm: 14, md: 20, lg: 28 };
const CHAR = 7;
const GAP = 2;
const STEPS = ["var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)", "var(--heat-5)"];

export function Heatmap({
  label, title, subtitle, showHeader = true, rows, columns, values, intent, size = "md",
  showValues = false, showLegend = true, lowLabel = "Less", highLabel = "More",
  format = "number", currency = "USD", emptyLabel = "No data for this range.",
}: HeatmapProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(plotRef);
  // The cell under the pointer or the keys, as [row, column].
  const [at, setAt] = useState<[number, number] | null>(null);

  const cell = CELLS[size];
  const rowW = Math.max(...rows.map((r) => r.length), 1) * CHAR + 8;
  const colH = 18;
  const gridH = rows.length * (cell + GAP);
  const full = formatter(format, currency, false);
  const short = formatter(format, currency, true);

  if (!rows.length || !columns.length) {
    return <ChartFrame label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={false}><ChartEmpty label={emptyLabel} height={gridH || 120} /></ChartFrame>;
  }

  const valueAt = (r: number, c: number) => values[r]?.[c] ?? null;
  const numbers = values.flat().filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const hi = numbers.length ? Math.max(...numbers) : 0;
  // Five even bands up to the highest value, so the weight of a cell says how big it is.
  const stepOf = (v: number) => (hi <= 0 ? 0 : Math.min(Math.floor((v / hi) * STEPS.length), STEPS.length - 1));
  const color = intentVar(intentAt(0, intent));

  const cellW = Math.max((width - rowW - GAP * (columns.length - 1)) / columns.length, 1);
  const x = (c: number) => rowW + c * (cellW + GAP);
  const y = (r: number) => colH + r * (cell + GAP);
  const height = colH + gridH;
  // Thin the column labels out so they never overlap.
  const labelW = Math.max(...columns.map((c) => c.length)) * CHAR + 8;
  const every = Math.max(1, Math.ceil(labelW / (cellW + GAP)));

  const pickAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const c = Math.floor((e.clientX - box.left - rowW) / (cellW + GAP));
    const r = Math.floor((e.clientY - box.top - colH) / (cell + GAP));
    setAt(c >= 0 && c < columns.length && r >= 0 && r < rows.length ? [r, c] : null);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, [number, number]> = {
      ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0],
    };
    if (e.key === "Escape") { setAt(null); return; }
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); setAt(e.key === "Home" ? [0, 0] : [rows.length - 1, columns.length - 1]); return; }
    if (!(e.key in moves)) return;
    e.preventDefault();
    const [dr, dc] = moves[e.key];
    setAt((p) => (p === null ? [0, 0] : [Math.min(Math.max(p[0] + dr, 0), rows.length - 1), Math.min(Math.max(p[1] + dc, 0), columns.length - 1)]));
  };

  const tip = at && (() => {
    const [r, c] = at;
    const v = valueAt(r, c);
    return (
      <ChartTooltip
        x={x(c) + cellW / 2} y={y(r)} title={`${rows[r]} · ${columns[c]}`}
        align={c === 0 ? "start" : c === columns.length - 1 ? "end" : "center"}
        rows={[{ label: label, value: v === null ? "—" : full(v), intent: intentAt(0, intent) }]}
      />
    );
  })();

  return (
    <ChartFrame
      label={label} title={title} subtitle={subtitle} showHeader={showHeader} animate={false} active={at !== null} plotHeight={height}
      onKeyDown={onKeyDown} onBlur={() => setAt(null)} className={h.heatmap}
    >
      <div ref={plotRef} className={s.plot} style={{ height }} onPointerMove={pickAt} onPointerLeave={() => setAt(null)}>
        {width > 0 && (
          <svg className={s.svg} width={width} height={height} aria-hidden="true">
            {columns.map((t, c) => (c % every === 0 || (at !== null && at[1] === c)) && (
              <text key={`${t}${c}`} className={h.colLabel} x={x(c) + cellW / 2} y={colH - 6} textAnchor="middle">{t}</text>
            ))}
            {rows.map((t, r) => (
              <text key={`${t}${r}`} className={h.rowLabel} x={rowW - 8} y={y(r) + cell / 2} dy="0.35em" textAnchor="end">{t}</text>
            ))}
            {rows.map((_, r) => columns.map((__, c) => {
              const v = valueAt(r, c);
              const picked = at !== null && at[0] === r && at[1] === c;
              return (
                <rect
                  key={`${r}-${c}`} className={h.cell} x={x(c)} y={y(r)} width={cellW} height={cell} rx={2}
                  style={{
                    fill: v === null ? "var(--bg-neutral-faint)" : color,
                    fillOpacity: v === null ? undefined : STEPS[stepOf(v)],
                    stroke: picked ? "var(--outline-brand)" : undefined,
                    strokeWidth: picked ? "var(--border-width-medium)" : undefined,
                  }}
                />
              );
            }))}
            {showValues && size === "lg" && rows.map((_, r) => columns.map((__, c) => {
              const v = valueAt(r, c);
              return v === null ? null : (
                <text key={`v${r}-${c}`} className={h.cellValue} x={x(c) + cellW / 2} y={y(r) + cell / 2} dy="0.35em" textAnchor="middle">{short(v)}</text>
              );
            }))}
          </svg>
        )}
        {tip}
      </div>
      {showLegend && (
        <p className={h.scale}>
          <span>{lowLabel}</span>
          <span className={h.scaleSteps}>
            {STEPS.map((step) => <span key={step} className={h.scaleStep} style={{ background: color, opacity: step }} />)}
          </span>
          <span>{highLabel}</span>
        </p>
      )}
      <SrTable
        caption={label} columns={columns}
        rows={rows.map((t, r) => ({ head: t, cells: columns.map((__, c) => { const v = valueAt(r, c); return v === null ? "No data" : full(v); }) }))}
      />
    </ChartFrame>
  );
}
