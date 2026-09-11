import type { CSSProperties } from "react";
import styles from "./Spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  showLabel?: boolean;
}

const TICKS = 12;

// Figma spinner 3013:3740, smaller and in the brand color: 12 ticks round a ring; each fades after it lights, so a
// bright trail runs clockwise.
export function Spinner({ size = "md", label = "Loading", showLabel = false }: SpinnerProps) {
  return (
    <span className={[styles.spinner, styles[size]].join(" ")} role={label ? "status" : undefined}>
      <svg className={styles.ring} viewBox="0 0 24 24" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => (
          <rect
            key={i} className={styles.tick} x="11" y="1.5" width="2" height="6" rx="1"
            transform={`rotate(${(360 / TICKS) * i} 12 12)`}
            // Negative delays start each tick at its own place in the turn, so the trail shows from the first frame.
            style={{ animationDelay: `calc(var(--motion-spin-duration) * ${(i - TICKS) / TICKS})` } as CSSProperties}
          />
        ))}
      </svg>
      {label && <span className={showLabel ? styles.label : styles.srOnly}>{label}</span>}
    </span>
  );
}
