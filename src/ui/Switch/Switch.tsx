"use client";
import { useId, useState } from "react";
import { useDensitySize } from "../Density/Density";
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
