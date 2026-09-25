"use client";
import { useId, useState } from "react";
import { useDensitySize } from "../Density/Density";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import styles from "./RadioGroup.module.css";

export type RadioGroupSize = "sm" | "md" | "lg";

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeIntent?: BadgeIntent;
  disabled?: boolean;
  hideLabel?: boolean;
}

export interface RadioGroupProps {
  size?: RadioGroupSize;
  orientation?: "vertical" | "horizontal";
  layout?: "list" | "card";
  disabled?: boolean;
  hideLegend?: boolean;
  legend: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  options: RadioGroupOption[];
  onChange?: (value: string) => void;
}

export function RadioGroup({
  size: ownSize,
  orientation = "vertical",
  layout = "list",
  disabled = false,
  hideLegend = false,
  legend,
  name,
  value,
  defaultValue,
  error,
  hint,
  options,
  onChange,
}: RadioGroupProps) {
  const size = useDensitySize(ownSize);
  const uid = useId();
  const groupName = name ?? uid;
  const controlled = value !== undefined;
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const message = error || hint;
  const messageId = message ? `${uid}-message` : undefined;
  const card = layout === "card";

  return (
    <fieldset
      className={[styles.group, styles[size], card ? styles.card : "", error ? styles.error : ""].join(" ")}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={messageId}
    >
      <legend className={hideLegend ? styles.srOnly : styles.legend}>{legend}</legend>
      <div className={[styles.options, orientation === "horizontal" && !card ? styles.horizontal : ""].join(" ")}>
        {options.map((o) => {
          const id = `${uid}-${o.value}`;
          const checked = current === o.value;
          const off = disabled || o.disabled;
          const control = (
            <span className={styles.control} aria-hidden="true"><span className={styles.dot} /></span>
          );
          return (
            <label key={o.value} htmlFor={id} className={styles.option} data-checked={checked || undefined} data-disabled={off || undefined}>
              <input
                id={id}
                className={styles.input}
                type="radio"
                name={groupName}
                value={o.value}
                checked={checked}
                disabled={off}
                onChange={() => {
                  if (!controlled) setOwn(o.value);
                  onChange?.(o.value);
                }}
              />
              {!card && control}
              {card ? (
                <span className={styles.copy}>
                  <span className={styles.titleRow}>
                    <span className={styles.label}>{o.label}</span>
                    {o.badge && <Badge intent={o.badgeIntent ?? "neutral"}>{o.badge}</Badge>}
                  </span>
                  {o.description && <span className={styles.description}>{o.description}</span>}
                </span>
              ) : (
                // hideLabel: a bare circle whose label only screen readers hear, like the radio Cell in a table row.
                <span className={o.hideLabel ? styles.srOnly : styles.label}>{o.label}</span>
              )}
              {card && control}
            </label>
          );
        })}
      </div>
      {message && <p id={messageId} className={[styles.message, error ? styles.messageError : ""].join(" ")}>{message}</p>}
    </fieldset>
  );
}
