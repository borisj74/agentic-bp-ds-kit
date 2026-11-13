"use client";
// A trend small enough to sit in a table cell or on a Scoreboard tile: no axes, no grid, no legend, no tooltip.
// For a chart people read values off, use LineChart or BarChart.
import { useRef } from "react";
import { formatter, intentAt, intentVar, useWidth, type ChartFormat, type ChartIntent } from "../Chart/chart";
import s from "./sparkline.module.css";
import { inspect } from "../inspect";

export type { ChartFormat, ChartIntent };
export type SparklineKind = "line" | "area" | "bar";
export type SparklineSize = "sm" | "md" | "lg";

export interface SparklineProps {
  // Names the trend for screen readers, like Credits used. A sparkline has no visible title.
  label: string;
  values: number[];
  kind?: SparklineKind;
  intent?: ChartIntent;
  size?: SparklineSize;
  // A dot on the last point of a line, or the last bar in the series intent while the rest step back, so the row
  // says where the trend ends.
  showLast?: boolean;
  // Lines and areas only: a flat line at the lowest value, so a flat run still reads as a trend and not as nothing.
  showBaseline?: boolean;
  format?: ChartFormat;
  currency?: string;
  emptyLabel?: string;
}

const HEIGHTS: Record<SparklineSize, number> = { sm: 16, md: 24, lg: 32 };
// Room for the stroke and the end dot, so neither is cut off by the edge of the box.
const PAD = 3;
const POINT = 3;
const GAP = 1;

export function Sparkline({
  label, values, kind = "line", intent, size = "md", showLast = false, showBaseline = false,
  format = "number", currency = "USD", emptyLabel = "No data",
}: SparklineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const h = HEIGHTS[size];
  const color = intentVar(intentAt(0, intent));
  const full = formatter(format, currency, false);
  const points = values.filter((v) => Number.isFinite(v));

  if (!points.length) {
    return <div className={s.spark} style={{ height: h }}><span className={s.empty}>{emptyLabel}</span></div>;
  }

  // The scale holds the values it has: a flat run sits on the middle line rather than on the floor.
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const flat = hi === lo;
  const y = (v: number) => (flat ? h / 2 : h - PAD - ((v - lo) / (hi - lo)) * (h - PAD * 2));
  const n = points.length;
  const last = n - 1;
  // Bars share the width evenly; a line's points sit on the first and last edge, so the trend fills the box.
  const barW = Math.max((width - GAP * (n - 1)) / Math.max(n, 1), 1);
  const x = (i: number) => (kind === "bar" ? i * (barW + GAP) + barW / 2 : PAD + (n === 1 ? 0 : (i / last) * Math.max(width - PAD * 2, 1)));
  const summary = `${label}: ${n === 1 ? full(points[0]) : `${full(points[0])} to ${full(points[last])}`}`;

  const path = points.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  // A bar's floor is the bottom of the box, so short bars still show.
  const floor = h - 1;

  return (
    <div {...inspect("Sparkline")} ref={ref} className={s.spark} style={{ height: h }} role="img" aria-label={summary}>
      {width > 0 && (
        <svg className={s.svg} width={width} height={h} aria-hidden="true">
          {showBaseline && kind !== "bar" && <line className={s.baseline} x1={0} x2={width} y1={floor + 0.5} y2={floor + 0.5} />}
          {kind === "bar"
            ? points.map((v, i) => {
              const top = flat ? h / 2 : y(v);
              return (
                <rect
                  key={i} x={i * (barW + GAP)} y={top} width={barW} height={Math.max(floor - top, 1)} rx={1}
                  style={{ fill: color, fillOpacity: showLast && i !== last ? "var(--opacity-muted)" : undefined }}
                />
              );
            })
            : (
              <>
                {kind === "area" && n > 1 && (
                  <path
                    d={`M${path.join("L")}L${x(last).toFixed(1)},${floor}L${x(0).toFixed(1)},${floor}Z`}
                    style={{ fill: color, fillOpacity: "var(--opacity-muted)" }}
                  />
                )}
                {n > 1 && <path d={`M${path.join("L")}`} fill="none" style={{ stroke: color }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                {(showLast || n === 1) && (
                  <circle className={s.point} cx={x(last)} cy={y(points[last])} r={POINT} style={{ stroke: color }} />
                )}
              </>
            )}
        </svg>
      )}
      <span className={s.srOnly}>{summary}</span>
    </div>
  );
}
