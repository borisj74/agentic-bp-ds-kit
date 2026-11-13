"use client";
import { useId, useState } from "react";
import { useDensitySize } from "../Density/Density";
import { labelWidthClass, useLabelPosition, type FieldLabelPosition, type FieldLabelWidth } from "../Form/FormContext";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
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
  labelPosition?: FieldLabelPosition;
  labelWidth?: FieldLabelWidth;
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
  labelPosition: ownLabelPosition,
  labelWidth,
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
  // Own position first, then the Form around it, then top, the same order the kit fields follow.
  const labelPosition = useLabelPosition(ownLabelPosition);
  // A group in a booting page draws itself as bars, in its own place.
  const booting = useFieldSkeleton();
  // The label column the legend stands on. With the legend hidden there is no column, and md is the kit's 234.
  const width = hideLegend ? undefined : labelWidthClass(labelWidth);
  const uid = useId();
  const groupName = name ?? uid;
  const controlled = value !== undefined;
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const message = error || hint;
  const messageId = message ? `${uid}-message` : undefined;
  const card = layout === "card";

  // Booting: the legend keeps its column and every option keeps its own row, circle and words, so the group
  // arrives at the height it already had.
  if (booting) {
    return (
      <fieldset
        className={[styles.group, styles[size], card ? styles.card : "", !hideLegend && labelPosition === "start" ? styles.startLabel : "", width ? styles[width] : ""].join(" ")}
        data-label={hideLegend ? undefined : labelPosition}
      >
        <legend className={hideLegend ? styles.srOnly : styles.legend}>
          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(legend)} height="var(--skeleton-cell)" label="" />
        </legend>
        <div className={[styles.options, orientation === "horizontal" && !card ? styles.horizontal : ""].join(" ")}>
          {options.map((o) => (
            <span key={o.value} className={styles.option}>
              {!card && <Skeleton shape="circle" animation="pulse" width="var(--circle)" label="" />}
              <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(o.label)} height="var(--skeleton-cell)" label="" />
            </span>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <fieldset
      className={[styles.group, styles[size], card ? styles.card : "", error ? styles.error : "", !hideLegend && labelPosition === "start" ? styles.startLabel : "", width ? styles[width] : ""].join(" ")}
      // Tells a Form with labels at the start that this group already sits in the label column.
      data-label={hideLegend ? undefined : labelPosition}
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
                // hideLabel: a bare circle whose label only screen readers hear, for a row that already says the choice.
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
