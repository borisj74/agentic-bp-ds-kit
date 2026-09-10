"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../Icon/Icon";
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
  size = "md",
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
