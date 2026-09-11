import type { CSSProperties } from "react";
import styles from "./Progress.module.css";

export type ProgressShape = "bar" | "circle" | "semicircle";
export type ProgressSize = "sm" | "md" | "lg";
export type ProgressThresholds = "none" | "bar" | "track" | "all";

export interface ProgressProps {
  value: number;
  label?: string;
  shape?: ProgressShape;
  size?: ProgressSize;
  thresholds?: ProgressThresholds;
  referenceLines?: boolean;
  showValue?: boolean;
  datatip?: string;
}

type Zone = "danger" | "warning" | "success";
const ZONES: Zone[] = ["danger", "warning", "success"];
// Zones are thirds; the reference lines mark their edges.
const EDGES = [100 / 3, 200 / 3];
const zoneOf = (pct: number): Zone => (pct < EDGES[0] ? "danger" : pct < EDGES[1] ? "warning" : "success");

// Rings draw in a 96 box: radius 44 with an 8 stroke, so the hole is 5/6 of the ring (Figma innerRadius 0.833).
const C = 48;
const R = 44;
const STROKE = 8;

// Figma Meter Bar - Horizontal 6578:325 and Meter - Circle 6605:193.
export function Progress({
  value, label = "Progress", shape = "bar", size = "md", thresholds = "none", referenceLines = false, showValue = false, datatip,
}: ProgressProps) {
  const pct = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
  const rounded = Math.round(pct);
  const zone = zoneOf(pct);
  // The value is blue unless its own color shows the zone; the track shows the zone in track mode, the three bands in all.
  const fillTone = thresholds === "bar" ? zone : "info";
  const trackTone = thresholds === "track" ? zone : "neutral";
  const a11y = {
    role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": rounded,
    "aria-valuetext": datatip ? `${rounded}%, ${datatip}` : `${rounded}%`,
  } as const;

  if (shape === "bar") {
    return (
      <div className={[styles.progress, styles.bar, styles[size]].join(" ")} {...a11y}>
        {datatip && (
          // Anchored at the value's end and shifted by the same share of its own width, so it never runs past either edge.
          <div className={styles.tipRow} aria-hidden="true">
            <span className={styles.tip} style={{ left: `${pct}%`, transform: `translateX(-${pct}%)` }}>{datatip}</span>
          </div>
        )}
        <div className={styles.barRow}>
          <div className={styles.trackWrap}>
            <div className={[styles.track, styles[trackTone]].join(" ")}>
              {thresholds === "all" && ZONES.map((z) => <span key={z} className={[styles.band, styles[z]].join(" ")} />)}
              <span className={[styles.fill, styles[fillTone]].join(" ")} style={{ width: `${pct}%` }} />
            </div>
            {referenceLines && EDGES.map((e) => <span key={e} className={styles.marker} style={{ left: `${e}%` }} aria-hidden="true" />)}
          </div>
          {showValue && <span className={styles.value} aria-hidden="true">{rounded}%</span>}
        </div>
      </div>
    );
  }

  // Circle: a ring from the top, clockwise, lengths out of 100. Semicircle: the lower half of a ring centred on the top
  // edge, mirrored so it runs from the left tip under to the right tip; lengths out of 200, so 100 is the half.
  const semi = shape === "semicircle";
  const total = semi ? 200 : 100;
  const arc = (from: number, to: number, cls: string) => (
    <circle
      key={cls + from} className={cls} cx={C} cy={semi ? 0 : C} r={R} pathLength={total}
      strokeDasharray={`${Math.max(to - from, 0)} ${total}`} strokeDashoffset={-from}
    />
  );
  // Where a share of the range sits on the ring, as an angle on screen (y down).
  const angle = (share: number) => (semi ? Math.PI - (share / 100) * Math.PI : -Math.PI / 2 + (share / 100) * 2 * Math.PI);
  const point = (share: number, radius: number) => {
    const a = angle(share);
    return { x: C + radius * Math.cos(a), y: (semi ? 0 : C) + radius * Math.sin(a) };
  };
  const height = semi ? C : C * 2;
  const tipAt = point(pct, R + STROKE / 2);
  const ringStyle = { transform: semi ? `scale(-1, 1)` : `rotate(-90deg)`, transformOrigin: semi ? `${C}px 0` : `${C}px ${C}px` } as CSSProperties;

  return (
    <div className={[styles.progress, styles.ring, semi ? styles.semi : "", styles[size]].join(" ")} {...a11y}>
      <svg className={styles.svg} viewBox={`0 0 ${C * 2} ${height}`} aria-hidden="true">
        <g style={ringStyle} strokeWidth={STROKE} fill="none">
          {arc(0, total, [styles.arc, styles[trackTone]].join(" "))}
          {thresholds === "all" && ZONES.map((z, i) => arc((i * total) / 3 / (semi ? 2 : 1), ((i + 1) * total) / 3 / (semi ? 2 : 1), [styles.arc, styles[z]].join(" ")))}
          {arc(0, (pct / 100) * (semi ? 100 : total), [styles.arc, styles[fillTone]].join(" "))}
        </g>
        {referenceLines && EDGES.map((e) => {
          const a = point(e, R - STROKE / 2 - 2);
          const b = point(e, R + STROKE / 2 + 2);
          return <line key={e} className={styles.tick} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </svg>
      {showValue && <span className={styles.value} aria-hidden="true">{rounded}%</span>}
      {datatip && (
        <span className={styles.tip} aria-hidden="true" style={{ left: `${(tipAt.x / (C * 2)) * 100}%`, top: `${(tipAt.y / height) * 100}%` }}>
          {datatip}
        </span>
      )}
    </div>
  );
}
