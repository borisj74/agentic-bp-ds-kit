"use client";
import { Icon } from "../Icon/Icon";
import styles from "./BadgeAlt.module.css";

export type BadgeAltIntent = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type BadgeAltSize = "sm" | "md" | "lg";

export interface BadgeAltProps {
  intent?: BadgeAltIntent;
  size?: BadgeAltSize;
  removable?: boolean;
  disabled?: boolean;
  children: string;
  onRemove?: () => void;
}

export function BadgeAlt({ intent = "neutral", size = "md", removable = false, disabled = false, children, onRemove }: BadgeAltProps) {
  return (
    <span className={[styles.badge, styles[intent], styles[size], disabled ? styles.disabled : ""].join(" ")} aria-disabled={disabled || undefined}>
      {children}
      {removable && (
        <button type="button" className={styles.remove} aria-label={`Remove ${children}`} disabled={disabled} onClick={() => onRemove?.()}>
          <Icon name="close" size="sm" />
        </button>
      )}
    </span>
  );
}
