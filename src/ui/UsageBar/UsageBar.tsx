import type { CSSProperties } from "react";
import { Legend, type LegendIntent } from "../Legend/Legend";
import styles from "./UsageBar.module.css";

export type UsageBarKind = "used" | "left" | "outside";
export type UsageBarFigureIntent = "warning" | "danger";
export type UsageBarFigurePlace = "start" | "left" | "end";

export interface UsageBarSegment {
  id: string;
  value: number;
  kind?: UsageBarKind;
  intent?: LegendIntent;
  label?: string;
  note?: string;
  recent?: boolean;
  legend?: string;
}

export interface UsageBarFigure {
  value: string;
  label: string;
  at: UsageBarFigurePlace;
  intent?: UsageBarFigureIntent;
}

export interface UsageBarProps {
  segments: UsageBarSegment[];
  figures?: UsageBarFigure[];
  showLegend?: boolean;
  label?: string;
}

// The chart order, so a UsageBar and a chart beside it name the same thing the same colour.
const INTENTS: LegendIntent[] = ["green", "olive", "cyan", "orange", "pink", "gray", "purple", "yellow", "red", "mint"];

// A part under this share of the bar has no room for its own caption, so it goes without one. The recent sliver
// is the usual case: eleven credits out of sixteen hundred is a few pixels wide.
const CAPTION_MIN = 0.06;

// The same semantic tokens the charts paint their bars and legend keys with. A recent sliver takes the strong
// step of its own colour, so it reads as the same source, used just now.
const intentVar = (intent: LegendIntent, recent?: boolean) => `var(--bg-${intent}${recent ? "-strong" : ""})`;

// Amounts read to a screen reader are written as people write them, like 1,650.
const num = (n: number) => n.toLocaleString("en-US");

const kindOf = (s: UsageBarSegment): UsageBarKind => s.kind ?? "used";
const places: UsageBarFigurePlace[] = ["start", "left", "end"];
// The place classes are prefixed, since left is also a kind of part and a CSS Module holds one of each name.
const placeClass = { start: "atStart", left: "atLeft", end: "atEnd" } as const;

// Figma AI usage Utilization 789:53222: one bar for everything available this period, the parts it came from
// side by side, each with its own caption under it.
export function UsageBar({ segments, figures, showLegend = true, label = "Usage" }: UsageBarProps) {
  // outside is what was spent past the allowance, so it is drawn after the end and left out of the allowance the
  // other parts share. aria-valuenow still measures the allowance, not the allowance plus the overspend.
  const inside = segments.filter((s) => kindOf(s) !== "outside");
  const outside = segments.filter((s) => kindOf(s) === "outside");
  const amount = (s: UsageBarSegment) => Math.max(s.value, 0);
  const total = inside.reduce((sum, s) => sum + amount(s), 0);
  const over = outside.reduce((sum, s) => sum + amount(s), 0);
  const used = inside.filter((s) => kindOf(s) === "used").reduce((sum, s) => sum + amount(s), 0);
  // The bar is as wide as the allowance and anything spent past it, so an overspend reads as what it cost without
  // the bar spilling out of the box it sits in. Its red, its caption and its legend key say it is past the end.
  const span = total + over;
  const share = (s: UsageBarSegment) => (span > 0 ? amount(s) / span : 0);

  // Used parts take the chart order where they set no intent of their own. A recent sliver belongs to the part
  // before it, so it does not take a colour of its own from the order.
  let next = 0;
  const drawn = segments.map((s) => {
    const kind = kindOf(s);
    const intent = kind === "used" && !s.recent ? (s.intent ?? INTENTS[next++ % INTENTS.length]) : s.intent;
    return { ...s, kind, intent, width: share(s) };
  });

  // The figure at "left" sits over the first part still to spend, so it lines up with what it is about.
  const leftAt = drawn.findIndex((s) => s.kind === "left");
  const offset = leftAt < 0 ? 0 : drawn.slice(0, leftAt).reduce((sum, s) => sum + s.width, 0);
  const figureAt = (place: UsageBarFigurePlace) => figures?.find((f) => f.at === place);

  // A part is its share of the track less its share of the gaps between the parts, so however many there are they
  // add up to the track rather than spilling past its end. The caption row takes the same widths.
  const gaps = Math.max(drawn.length - 1, 0);
  const widthOf = (width: number) => `calc(${width * 100}% - ${width} * var(--usage-bar-gap) * ${gaps})`;

  // One key per used intent, then the empty track and, where there is one, the overspend. Parts of one intent
  // share a key, so an AI plan used and its last hour are one entry, not two.
  const keys: { id: string; label: string; intent?: LegendIntent; shape?: "outline" }[] = [];
  for (const s of drawn) {
    if (s.kind !== "used" || !s.intent) continue;
    if (keys.some((k) => k.intent === s.intent)) continue;
    keys.push({ id: s.id, label: s.legend ?? s.label ?? s.intent, intent: s.intent });
  }
  // What is left is keyed as the empty box rather than one more colour, the same grey the track itself takes.
  // A left part can name the key itself, for a bar whose period says it better, like Left today.
  const left = drawn.find((s) => s.kind === "left");
  if (left) keys.push({ id: "left", label: left.legend ?? "Left to use", shape: "outline" });
  if (outside.length) keys.push({ id: "outside", label: "Over the allowance", intent: "red" });

  // Screen readers hear the split in order: how much of the allowance is used, then every part worth naming.
  const spoken = drawn
    .filter((s) => s.label)
    .map((s) => [s.label, s.note].filter(Boolean).join(", "))
    .join(". ");

  return (
    <div className={styles.usageBar} role="group" aria-label={label}>
      {figures?.length ? (
        <div className={styles.figures}>
          {places.map((place) => {
            const figure = figureAt(place);
            // Every place keeps its box whether or not it holds a figure. The one at "start" is held to the share
            // of the bar before the first part still to spend, so the one at "left" begins exactly over it — and
            // gives that width up, rather than squeezing its neighbour, once the three would not fit on the line.
            // With nothing left to spend there is no part to line up with, so it takes its own width instead;
            // held to a share of 0 it would collapse to a word a row.
            const style = place === "start" && offset > 0 ? ({ flex: `0 1 ${offset * 100}%` } as CSSProperties) : undefined;
            return (
              <div key={place} className={[styles.figure, styles[placeClass[place]]].join(" ")} style={style}>
                {figure && (
                  <>
                    <span className={[styles.figureValue, figure.intent ? styles[figure.intent] : ""].join(" ")}>{figure.value}</span>
                    <span className={styles.figureLabel}>{figure.label}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={used}
        aria-valuetext={`${num(used)} used of ${num(total)}${over ? `, ${num(over)} over the allowance` : ""}`}
      >
        {drawn.map((s) => (
          <span
            key={s.id}
            className={[
              styles.part,
              styles[s.kind],
              s.recent ? styles.recent : "",
            ].join(" ")}
            style={{ width: widthOf(s.width), background: s.intent ? intentVar(s.intent, s.recent) : undefined }}
          />
        ))}
      </div>

      <div className={styles.captions} aria-hidden="true">
        {drawn.map((s) => (
          <div key={s.id} className={styles.caption} style={{ width: widthOf(s.width) }}>
            {s.width >= CAPTION_MIN && s.label && (
              <>
                <span className={[styles.captionLabel, s.kind === "outside" ? styles.danger : ""].join(" ")}>{s.label}</span>
                {s.note && <span className={styles.captionNote}>{s.note}</span>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* The captions are hidden from screen readers above, since they are laid out by width rather than read in
          order; this says the same thing as one sentence. */}
      <p className={styles.srOnly}>{spoken}</p>

      {showLegend && keys.length > 0 && (
        <div className={styles.legend}>
          <Legend items={keys} alignment="center" size="sm" decorative />
        </div>
      )}
    </div>
  );
}
