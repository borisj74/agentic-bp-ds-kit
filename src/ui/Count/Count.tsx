import styles from "./Count.module.css";
import { inspect } from "../inspect";

export type CountIntent = "info" | "danger" | "neutral";
export type CountSize = "sm" | "md" | "lg";

export interface CountProps {
  intent?: CountIntent;
  size?: CountSize;
  subtle?: boolean;
  disabled?: boolean;
  count: number;
  max?: number;
  label?: string;
}

export function Count({ intent = "info", size = "md", subtle = false, disabled = false, count, max = 99, label }: CountProps) {
  // Written as people write numbers, with thousands separators: 7,989, not 7989.
  const num = (n: number) => n.toLocaleString("en-US");
  const shown = count > max ? `${num(max)}+` : num(count);
  const cls = [styles.count, styles[intent], styles[size], subtle ? styles.subtle : "", disabled ? styles.disabled : ""].join(" ");
  return (
    <span {...inspect("Count")} className={cls} aria-disabled={disabled || undefined}>
      <span aria-hidden="true">{shown}</span>
      <span className={styles.srOnly}>{label ? `${num(count)} ${label}` : num(count)}</span>
    </span>
  );
}
