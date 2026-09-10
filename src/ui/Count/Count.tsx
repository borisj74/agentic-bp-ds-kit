import styles from "./Count.module.css";

export type CountTone = "info" | "danger" | "neutral";
export type CountSize = "sm" | "md" | "lg";

export interface CountProps {
  tone?: CountTone;
  size?: CountSize;
  subtle?: boolean;
  disabled?: boolean;
  count: number;
  max?: number;
  label?: string;
}

export function Count({ tone = "info", size = "md", subtle = false, disabled = false, count, max = 99, label }: CountProps) {
  const shown = count > max ? `${max}+` : String(count);
  const cls = [styles.count, styles[tone], styles[size], subtle ? styles.subtle : "", disabled ? styles.disabled : ""].join(" ");
  return (
    <span className={cls} aria-disabled={disabled || undefined}>
      <span aria-hidden="true">{shown}</span>
      <span className={styles.srOnly}>{label ? `${count} ${label}` : String(count)}</span>
    </span>
  );
}
