"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useDensitySize } from "../Density/Density";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import styles from "./Checkbox.module.css";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps {
  size?: CheckboxSize;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  error?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  label: string;
  name?: string;
  id?: string;
  onChange?: (checked: boolean) => void;
}

const iconSize = { sm: "xs", md: "sm", lg: "md" } as const;

export function Checkbox({
  size: ownSize,
  checked,
  defaultChecked = false,
  indeterminate = false,
  error = false,
  disabled = false,
  hideLabel = false,
  label,
  name,
  id,
  onChange,
}: CheckboxProps) {
  const size = useDensitySize(ownSize);
  // A control in a booting page draws itself as bars, in its own place.
  const booting = useFieldSkeleton();
  const autoId = useId();
  const inputId = id ?? autoId;
  const ref = useRef<HTMLInputElement>(null);
  const controlled = typeof checked === "boolean";
  const [own, setOwn] = useState(defaultChecked);
  const isChecked = controlled ? checked : own;

  // indeterminate is a DOM property, not an attribute.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  // Booting: the box and the words beside it keep their own row, so the real control arrives in place. A label
  // with nothing to label is a plain span while the box is still a bar.
  if (booting) {
    return (
      // Still a label, with nothing to label yet: the columns grid knows a field by its tag, so a group of
      // checkboxes keeps its columns while it boots.
      <label className={[styles.checkbox, styles[size]].join(" ")}>
        <span className={styles.control}>
          <Skeleton shape="rect" animation="pulse" width="var(--box)" height="var(--box)" label="" />
        </span>
        <span className={hideLabel ? styles.srOnly : styles.text}>
          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(label)} height="var(--skeleton-cell)" label="" />
        </span>
      </label>
    );
  }
  return (
    <label className={[styles.checkbox, styles[size], error ? styles.error : "", disabled ? styles.disabled : ""].join(" ")} htmlFor={inputId}>
      <span className={styles.control}>
        <input
          ref={ref}
          className={styles.input}
          type="checkbox"
          id={inputId}
          name={name}
          disabled={disabled}
          checked={isChecked}
          aria-invalid={error || undefined}
          onChange={(e) => {
            if (!controlled) setOwn(e.target.checked);
            onChange?.(e.target.checked);
          }}
        />
        <span className={styles.box} aria-hidden="true">
          <span className={styles.mark}>
            <Icon name={indeterminate ? "remove" : "check"} size={iconSize[size]} />
          </span>
        </span>
      </span>
      <span className={hideLabel ? styles.srOnly : styles.text}>{label}</span>
    </label>
  );
}
