"use client";
import { Count } from "../Count/Count";
import { useDensitySize } from "../Density/Density";
import { Icon } from "../Icon/Icon";
import styles from "./ButtonFilter.module.css";

export type ButtonFilterSize = "sm" | "md" | "lg";

export interface ButtonFilterProps {
  size?: ButtonFilterSize;
  open?: boolean;
  disabled?: boolean;
  count?: number;
  children: string;
  onClick?: () => void;
}

// One button: the whole control opens the dropdown. The divider and chevron part are visual only.
export function ButtonFilter({ size: ownSize, open = false, disabled = false, count = 0, children, onClick }: ButtonFilterProps) {
  const size = useDensitySize(ownSize);
  const applied = count > 0;
  return (
    <button
      type="button"
      className={[styles.filter, styles[size], applied ? styles.applied : ""].join(" ")}
      disabled={disabled}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onClick}
    >
      <span className={styles.main}>
        {children}
        {applied && <Count count={count} size={size === "lg" ? "md" : "sm"} label="filters applied" disabled={disabled} />}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        <span className={[styles.icon, open ? styles.iconOpen : ""].join(" ")}>
          <Icon name="expand_more" size={size === "sm" ? "sm" : "md"} />
        </span>
      </span>
    </button>
  );
}
