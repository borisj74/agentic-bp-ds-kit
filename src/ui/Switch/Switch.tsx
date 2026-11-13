"use client";
import { useId, useState } from "react";
import { useDensitySize } from "../Density/Density";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import styles from "./Switch.module.css";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps {
  label: string;
  hideLabel?: boolean;
  description?: string;
  size?: SwitchSize;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export function Switch({
  label, hideLabel = false, description, size: ownSize, checked, defaultChecked = false, onChange, disabled = false, name, id,
}: SwitchProps) {
  const size = useDensitySize(ownSize);
  // A control in a booting page draws itself as bars, in its own place.
  const booting = useFieldSkeleton();
  const autoId = useId();
  const switchId = id ?? autoId;
  const descriptionId = `${switchId}-description`;
  const controlled = typeof checked === "boolean";
  const [own, setOwn] = useState(defaultChecked);
  const on = controlled ? checked : own;

  const toggle = () => {
    if (disabled) return;
    if (!controlled) setOwn(!on);
    onChange?.(!on);
  };

  // Booting: the words and the pill keep the row they share, so the real switch lands where its bars stood. The
  // track's own width and height are used, not a square, or the row would resettle when the switch arrives.
  if (booting) {
    return (
      <div className={[styles.switch, styles[size], hideLabel ? "" : styles.labeled].join(" ")}>
        <span className={hideLabel ? styles.srOnly : styles.copy}>
          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(label)} height="var(--skeleton-cell)" label="" />
        </span>
        <Skeleton shape="rect" animation="pulse" width="var(--w)" height="var(--h)" label="" />
      </div>
    );
  }
  return (
    <div className={[styles.switch, styles[size], hideLabel ? "" : styles.labeled, disabled ? styles.disabled : ""].join(" ")}>
      <span className={hideLabel ? styles.srOnly : styles.copy}>
        <label htmlFor={switchId} className={styles.label}>{label}</label>
        {description && <span id={descriptionId} className={styles.description}>{description}</span>}
      </span>
      {/* A button with role=switch: Space and Enter toggle, and the change applies right away. */}
      <button
        type="button" role="switch" id={switchId} aria-checked={on} disabled={disabled}
        aria-describedby={description ? descriptionId : undefined} className={styles.track} onClick={toggle}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
      {name && <input type="hidden" name={name} value={on ? "on" : "off"} />}
    </div>
  );
}
