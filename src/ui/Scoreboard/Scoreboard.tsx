"use client";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../Badge/Badge";
import { Conveyor } from "../Conveyor/Conveyor";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import styles from "./Scoreboard.module.css";
import { inspect } from "../inspect";

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
const CONVEYOR_AT = 4;
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
  // A scoreboard in a booting page draws its own cards, with a bar where each line of the card will be, so the
  // numbers land in the places their blocks held.
  const booting = useFieldSkeleton();
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectedProp !== undefined ? selectedProp : innerSelected;
  // A strip that scrolls sideways becomes a focus stop, so keyboard users can scroll it with the arrow keys (WCAG 2.1.1).
  // Selectable cards are buttons, and focusing them scrolls the strip already.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);
  const scrollStop = overflows && !selectable;

  const pick = (id: string) => {
    const next = selected === id ? null : id;
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectedChange?.(next);
  };

  const row = (
      <div role="group" aria-label={label} className={styles.scoreboard}>
        {items.map((item) => {
          // Booting: the card's own rows, as bars. The name keeps the width its words will take; the number is
          // one block at its own height, so the card is as tall as it will be. Nothing is pressable, whether or
          // not the cards are buttons when they arrive.
          const body = booting ? (
            <>
              <span className={styles.header}>
                {/* Every line keeps the line box its own words will take, so the card is as tall booting as it
                    will be and the sections under the scoreboard do not sit high while the page loads. */}
                <span className={[styles.title, styles.bootLine].join(" ")}>
                  <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(item.title)} height="var(--skeleton-cell)" label="" />
                </span>
              </span>
              <span className={styles.text}>
                <span className={styles.values}>
                  {/* The number and its trend share the row the way they will, and the row wraps the way the
                      real one does, so a card whose number and trend need two lines keeps both. */}
                  <span className={styles.metricRow}>
                    <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(item.metric)} height="var(--skeleton-row-bar)" label="" />
                    {item.trend && (
                      // The trend keeps its own parts — the arrow's square, the figure, the unit — so the row
                      // takes the room it will take and wraps where the real one wraps.
                      <span className={styles.trend}>
                        <span className={styles.change}>
                          {item.trend.direction && item.trend.direction !== "none" && (
                            <Skeleton shape="rect" animation="pulse" width="var(--icon-size-medium)" height="var(--icon-size-medium)" label="" />
                          )}
                          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(item.trend.value)} height="var(--skeleton-row-bar)" label="" />
                        </span>
                        {item.trend.unit && (
                          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(item.trend.unit)} height="var(--skeleton-row-bar)" label="" />
                        )}
                      </span>
                    )}
                  </span>
                  {item.metadata && (
                    <span className={[styles.meta, styles.bootLine].join(" ")}>
                      <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(item.metadata)} height="var(--skeleton-cell)" label="" />
                    </span>
                  )}
                </span>
                {item.chart && (
                  <Skeleton shape="rect" animation="pulse" width="var(--scoreboard-chart-width)" height="var(--scoreboard-chart-height)" label="" />
                )}
              </span>
            </>
          ) : (
            <>
              <span className={styles.header}>
                <span className={styles.title}>{item.title}</span>
                {item.badge && <Badge>{item.badge}</Badge>}
              </span>
              <span className={styles.text}>
                <span className={styles.values}>
                  <span className={styles.metricRow}>
                    <span className={styles.metric}>{item.metric}</span>
                    {item.trend && <Trend {...item.trend} />}
                  </span>
                  {item.metadata && <span className={styles.meta}>{item.metadata}</span>}
                </span>
                {item.chart && <Spark {...item.chart} status={item.chart.status ?? item.trend?.status} />}
              </span>
            </>
          );
          if (!selectable || booting) return <div key={item.id} className={styles.card}>{body}</div>;
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
  );

  // Past four cards the strip no longer fits, so a Conveyor moves it along with its arrows.
  if (!scroll) return row;
  if (items.length > CONVEYOR_AT) return <Conveyor label={label}>{row}</Conveyor>;
  return (
    <div {...inspect("Scoreboard")}
      ref={wrapRef} className={[styles.wrap, styles.scrolls].join(" ")}
      tabIndex={scrollStop ? 0 : undefined} role={scrollStop ? "region" : undefined} aria-label={scrollStop ? label : undefined}
    >
      {row}
    </div>
  );
}
