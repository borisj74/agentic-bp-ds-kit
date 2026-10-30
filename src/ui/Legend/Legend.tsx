"use client";
import { useState } from "react";
import styles from "./Legend.module.css";

export type LegendIntent = "green" | "olive" | "cyan" | "orange" | "pink" | "gray" | "purple" | "yellow" | "red" | "mint";
export type LegendOrientation = "horizontal" | "vertical";
export type LegendAlignment = "start" | "center" | "end";
export type LegendShape = "square" | "line" | "dot" | "outline";
export type LegendSize = "sm" | "md";

export interface LegendKey {
  id?: string;
  label: string;
  intent?: LegendIntent;
  value?: string;
  // This key's own shape, over the legend's: a chart's dashed reference lines key as lines beside its square
  // bars, or an outline for what is empty rather than coloured, like the part of a bar still to be used.
  shape?: LegendShape;
  // The strong step of the key's colour, for a darker part drawn in the same colour as the one it belongs to,
  // like the slice of a usage bar used in the last hour sitting beside the whole it came out of.
  strong?: boolean;
}

export interface LegendProps {
  items: LegendKey[];
  orientation?: LegendOrientation;
  alignment?: LegendAlignment;
  shape?: LegendShape;
  size?: LegendSize;
  hidden?: string[];
  defaultHidden?: string[];
  onHiddenChange?: (hidden: string[]) => void;
  label?: string;
  decorative?: boolean;
}

const INTENTS: LegendIntent[] = ["green", "olive", "cyan", "orange", "pink", "gray", "purple", "yellow", "red", "mint"];
export const legendIntent = (i: number, intent?: LegendIntent) => intent ?? INTENTS[i % INTENTS.length];
export const legendColor = (intent: LegendIntent, strong = false) => `var(--bg-${intent}${strong ? "-strong" : ""})`;

const keyOf = (item: LegendKey) => item.id ?? item.label;

// Figma data visualization 5410:112240: the colour keys under or beside a chart. Also the key for anything
// else drawn in the chart colours, like a map or a status bar.
export function Legend({
  items, orientation = "horizontal", alignment = "center", shape = "square", size = "md",
  hidden, defaultHidden = [], onHiddenChange, label = "Legend", decorative = false,
}: LegendProps) {
  const [inner, setInner] = useState(defaultHidden);
  const off = hidden ?? inner;
  // Keys turn into buttons only when someone is listening for the change.
  const toggles = Boolean(onHiddenChange || hidden !== undefined);

  const flip = (id: string) => {
    const next = off.includes(id) ? off.filter((x) => x !== id) : [...off, id];
    if (hidden === undefined) setInner(next);
    onHiddenChange?.(next);
  };

  const cls = [styles.legend, styles[orientation], styles[alignment], styles[size]].join(" ");
  const body = (item: LegendKey, i: number, isOff: boolean) => {
    // outline keys what is empty rather than coloured, so it takes the stylesheet's empty box and no intent.
    const mark = item.shape ?? shape;
    const filled = !isOff && mark !== "outline";
    return (
      <>
        {/* An off key drops its colour and takes the grey from the stylesheet. */}
        <span className={[styles.mark, styles[mark]].join(" ")} style={filled ? { background: legendColor(legendIntent(i, item.intent), item.strong) } : undefined} />
        <span className={styles.text}>{item.label}</span>
        {item.value && <span className={styles.value}>{item.value}</span>}
      </>
    );
  };

  // Decorative: the chart it belongs to already reads its numbers out, so the keys are skipped.
  return (
    <ul className={cls} aria-label={decorative ? undefined : label} aria-hidden={decorative ? true : undefined}>
      {items.map((item, i) => {
        const id = keyOf(item);
        const isOff = off.includes(id);
        return (
          <li key={id} className={[styles.item, isOff ? styles.off : ""].join(" ")}>
            {toggles ? (
              <button type="button" className={styles.button} aria-pressed={!isOff} onClick={() => flip(id)}>{body(item, i, isOff)}</button>
            ) : (
              body(item, i, isOff)
            )}
          </li>
        );
      })}
    </ul>
  );
}
