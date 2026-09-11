"use client";
import { Count } from "../Count/Count";
import { useDensitySize } from "../Density/Density";
import { Icon } from "../Icon/Icon";
import styles from "./ButtonFilter.module.css";

export type ButtonFilterSize = "sm" | "md" | "lg";
export type ButtonFilterToggle = "on" | "off";

export interface ButtonFilterProps {
  size?: ButtonFilterSize;
  open?: boolean;
  disabled?: boolean;
  count?: number;
  value?: string;
  toggle?: ButtonFilterToggle;
  onToggle?: () => void;
  hasDropdown?: boolean;
  children: string;
  onClick?: () => void;
}

// Nothing set: one button that opens the dropdown. Set (a value or count) with onToggle: two buttons, the name
// turns the filter on or off and the chevron opens the dropdown. No dropdown: a plain on/off chip.
export function ButtonFilter({
  size: ownSize, open = false, disabled = false, count = 0, value, toggle, onToggle, hasDropdown = true, children, onClick,
}: ButtonFilterProps) {
  const size = useDensitySize(ownSize);
  const state = toggle ?? (count > 0 || value ? "on" : "none");
  const split = hasDropdown && state !== "none" && Boolean(onToggle);
  const cls = [styles.filter, styles[size], state === "on" ? styles.applied : "", state === "off" ? styles.off : "", split ? styles.split : ""].join(" ");

  const label = (
    <span className={styles.main}>
      {value ? (
        <span><span className={styles.name}>{children}: </span>{value}</span>
      ) : children}
      {count > 0 && (
        <Count count={count} size={size === "lg" ? "md" : "sm"} tone={state === "off" ? "neutral" : undefined} label="filters applied" disabled={disabled} />
      )}
    </span>
  );
  const chevron = (
    <span className={[styles.icon, open ? styles.iconOpen : ""].join(" ")}>
      <Icon name="expand_more" size={size === "sm" ? "sm" : "md"} />
    </span>
  );

  if (!hasDropdown) {
    return (
      <button type="button" className={cls} disabled={disabled} aria-pressed={state === "on"} onClick={onToggle ?? onClick}>
        {label}
      </button>
    );
  }
  if (split) {
    return (
      <span className={cls}>
        <button type="button" className={styles.part} disabled={disabled} aria-pressed={state === "on"} onClick={onToggle}>{label}</button>
        <button
          type="button" className={[styles.part, styles.chevron].join(" ")} disabled={disabled}
          aria-label={`${children} options`} aria-haspopup="menu" aria-expanded={open} onClick={onClick}
        >
          {chevron}
        </button>
      </span>
    );
  }
  return (
    <button type="button" className={cls} disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={onClick}>
      {label}
      <span className={styles.chevron} aria-hidden="true">{chevron}</span>
    </button>
  );
}
