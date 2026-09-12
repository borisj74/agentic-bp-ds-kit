"use client";
import { useState } from "react";
import { Badge } from "../Badge/Badge";
import { Icon } from "../Icon/Icon";
import styles from "./Scoreboard.module.css";

export type ScoreboardStatus = "success" | "danger" | "neutral";
export type ScoreboardDirection = "up" | "down" | "none";
export interface ScoreboardTrend {
  value: string;
  unit?: string;
  status?: ScoreboardStatus;
  direction?: ScoreboardDirection;
}
export interface ScoreboardChart {
  points: number[];
  status?: ScoreboardStatus;
  area?: boolean;
}
export interface ScoreboardItem {
  id: string;
  title: string;
  metric: string;
  metadata?: string;
  badge?: string;
  trend?: ScoreboardTrend;
  chart?: ScoreboardChart;
}

export interface ScoreboardProps {
  items: ScoreboardItem[];
  selectable?: boolean;
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  scroll?: boolean;
  label?: string;
}

// The chart draws in a 64 x 20 box (the scoreboard chart tokens), 1 unit in from the top and bottom so the line isn't clipped.
const W = 64;
const H = 20;
const INSET = 1;

function Spark({ points, status = "neutral", area = true }: ScoreboardChart) {
  if (points.length < 2) return null;
  // The line fills the height, but a change under a tenth of the value stays small around the middle,
  // so a steady metric reads flat instead of stretching its wiggles to full height.
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const range = Math.max(hi - lo, Math.abs(hi) * 0.1);
  const min = (hi + lo - range) / 2;
  const xy = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = range ? INSET + (1 - (v - min) / range) * (H - INSET * 2) : H / 2;
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  const line = `M ${xy.join(" L ")}`;
  const change = points[points.length - 1] - points[0];
  const name = change > 0 ? "Trend going up" : change < 0 ? "Trend going down" : "Trend flat";
  return (
    <svg className={[styles.chart, styles[status]].join(" ")} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={name}>
      {area && <path className={styles.area} d={`${line} L ${W} ${H} L 0 ${H} Z`} />}
      <path className={styles.line} d={line} />
    </svg>
  );
}

function Trend({ value, unit, status = "neutral", direction = "none" }: ScoreboardTrend) {
  return (
    <span className={[styles.trend, styles[status]].join(" ")}>
      <span className={styles.change}>
        {direction !== "none" && (
          <>
            <Icon name={direction === "up" ? "arrow_upward" : "arrow_downward"} className={styles.arrow} />
            <span className={styles.srOnly}>{direction === "up" ? "Up " : "Down "}</span>
          </>
        )}
        <span>{value}</span>
      </span>
      {unit && <span>{unit}</span>}
    </span>
  );
}

// Figma scoreboard 7295:12323 and scorecard 6175:426: cards side by side, parted by a line, with no gap.
// Hover and selected only show when the cards are buttons.
export function Scoreboard({
  items, selectable = false, selected: selectedProp, defaultSelected = null, onSelectedChange, scroll = true, label = "Key metrics",
}: ScoreboardProps) {
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectedProp !== undefined ? selectedProp : innerSelected;

  const pick = (id: string) => {
    const next = selected === id ? null : id;
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectedChange?.(next);
  };

  return (
    <div className={[styles.wrap, scroll ? styles.scrolls : ""].join(" ")}>
      <div role="group" aria-label={label} className={styles.scoreboard}>
        {items.map((item) => {
          const body = (
            <>
              <span className={styles.header}>
                <span className={styles.title}>{item.title}</span>
                {item.badge && <Badge>{item.badge}</Badge>}
              </span>
              <span className={styles.text}>
                <span className={styles.metricRow}>
                  <span className={styles.metric}>{item.metric}</span>
                  {item.trend && <Trend {...item.trend} />}
                  {item.chart && <Spark {...item.chart} status={item.chart.status ?? item.trend?.status} />}
                </span>
                {item.metadata && <span className={styles.meta}>{item.metadata}</span>}
              </span>
            </>
          );
          if (!selectable) return <div key={item.id} className={styles.card}>{body}</div>;
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id} type="button" aria-pressed={isSelected}
              className={[styles.card, styles.button, isSelected ? styles.selected : ""].join(" ")}
              onClick={() => pick(item.id)}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
