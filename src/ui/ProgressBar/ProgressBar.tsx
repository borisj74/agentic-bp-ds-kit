import styles from "./ProgressBar.module.css";

export type ProgressBarLabelPosition = "center" | "right";

export interface ProgressBarProps {
  value: number;
  label?: string;
  valueLabel?: string;
  showLabel?: boolean;
  labelPosition?: ProgressBarLabelPosition;
}

// Figma progress-bar 3013:5958 (legacy): a 20-tall neutral track, a blue fill, and the value on or after the bar.
export function ProgressBar({ value, label = "Progress", valueLabel, showLabel = true, labelPosition = "center" }: ProgressBarProps) {
  const pct = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
  const text = valueLabel ?? `${Math.round(pct)}%`;
  return (
    <div
      className={[styles.progress, styles[labelPosition]].join(" ")}
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-valuetext={text}
    >
      <span className={styles.track}>
        <span className={styles.fill} style={{ width: `${pct}%` }} />
        {showLabel && labelPosition === "center" && <span className={styles.value} aria-hidden="true">{text}</span>}
      </span>
      {showLabel && labelPosition === "right" && <span className={styles.value} aria-hidden="true">{text}</span>}
    </div>
  );
}
