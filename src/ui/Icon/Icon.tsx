import type { CSSProperties } from "react";
import styles from "./Icon.module.css";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconIntent = "inherit" | "neutral" | "subtle" | "brand" | "info" | "success" | "warning" | "danger";

export interface IconProps {
  name: string;
  size?: IconSize;
  intent?: IconIntent;
  filled?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = "md", intent = "inherit", filled = false, label, className, style }: IconProps) {
  const cls = [styles.icon, styles[size], styles[intent], filled ? styles.filled : "", className ?? ""].join(" ").trim();
  return (
    <span
      className={`material-symbols-outlined ${cls}`}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {name}
    </span>
  );
}
