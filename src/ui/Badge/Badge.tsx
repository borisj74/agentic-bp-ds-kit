"use client";
import { Icon } from "../Icon/Icon";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "hollow" | "info" | "success" | "warning" | "danger" | "highlight";
export type BadgeEmphasis = "subtle" | "strong" | "faint";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  tone?: BadgeTone;
  emphasis?: BadgeEmphasis;
  size?: BadgeSize;
  icon?: string;
  iconOnly?: boolean;
  removable?: boolean;
  disabled?: boolean;
  children: string;
  onRemove?: () => void;
}

export function Badge({ tone = "neutral", emphasis = "subtle", size = "sm", icon, iconOnly = false, removable = false, disabled = false, children, onRemove }: BadgeProps) {
  const small = size === "lg" ? "sm" : "xs";
  const cls = [styles.badge, styles[tone], styles[emphasis], styles[size], iconOnly ? styles.iconOnly : "", disabled ? styles.disabled : ""].join(" ");
  if (iconOnly) {
    return (
      <span className={cls} aria-disabled={disabled || undefined}>
        <Icon name={icon ?? "label"} size={size === "lg" ? "md" : "sm"} />
        <span className={styles.srOnly}>{children}</span>
      </span>
    );
  }
  return (
    <span className={cls} aria-disabled={disabled || undefined}>
      {icon && <Icon name={icon} size={small} />}
      {children}
      {removable && (
        <button type="button" className={styles.remove} aria-label={`Remove ${children}`} disabled={disabled} onClick={() => onRemove?.()}>
          <Icon name="close" size={small} />
        </button>
      )}
    </span>
  );
}
