"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useDensitySize } from "../Density/Density";
import { Button } from "../Button/Button";
// The label matches the other form fields.
import field from "../Input/Input.module.css";
import styles from "./Segmented.module.css";

export type SegmentedSize = "sm" | "md" | "lg";
export interface SegmentedOption { value: string; label: string; icon?: string; disabled?: boolean }

export interface SegmentedProps {
  label: string;
  hideLabel?: boolean;
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: SegmentedSize;
  fullWidth?: boolean;
  disabled?: boolean;
  name?: string;
}

export function Segmented({
  label, hideLabel = false, options, value, defaultValue, onChange, size: ownSize, fullWidth = false, disabled = false, name,
}: SegmentedProps) {
  const size = useDensitySize(ownSize);
  const labelId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const pick = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const enabled = options.flatMap((o, i) => (o.disabled || disabled ? [] : [i]));
  const selected = options.findIndex((o) => o.value === current && !o.disabled);
  // One tab stop: the chosen option, or the first enabled one when nothing is chosen yet.
  const tabStop = selected >= 0 ? selected : enabled[0];

  // Arrow keys move and choose, like native radios. Home and End jump to the ends.
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const at = enabled.indexOf(i);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const next = step ? enabled[(at + step + enabled.length) % enabled.length] : e.key === "Home" ? enabled[0] : e.key === "End" ? enabled[enabled.length - 1] : undefined;
    if (next === undefined) return;
    e.preventDefault();
    groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
    pick(options[next].value);
  };

  return (
    <div className={[styles.root, fullWidth ? styles.full : ""].join(" ")}>
      <span id={labelId} className={hideLabel ? field.srOnly : field.label}>{label}</span>
      {/* Each option is a kit tertiary Button; the chosen one gets a brand tint and border on top. */}
      <div ref={groupRef} role="radiogroup" aria-labelledby={labelId} aria-disabled={disabled || undefined} className={styles.group}>
        {options.map((o, i) => {
          const on = o.value === current;
          return (
            <Button
              key={o.value} variant="tertiary" size={size} iconStart={o.icon}
              role="radio" aria-checked={on} tabIndex={i === tabStop ? 0 : -1} disabled={disabled || o.disabled}
              className={on ? styles.on : undefined}
              onClick={() => pick(o.value)} onKeyDown={(e) => onKeyDown(e, i)}
            >
              {o.label}
            </Button>
          );
        })}
      </div>
      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
