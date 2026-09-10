"use client";
import { useId, useState, type ChangeEvent } from "react";
import { useDensitySize } from "../Density/Density";
import { useLabelPosition } from "../Form/FormContext";
import { Icon } from "../Icon/Icon";
import { HelpPopover } from "../HelpPopover/HelpPopover";
import styles from "./Input.module.css";

export type InputSize = "sm" | "md" | "lg";
export type InputType = "text" | "email" | "password" | "search" | "number" | "tel" | "url" | "file";
export type InputLabelPosition = "top" | "start";

export interface InputProps {
  label: string;
  hideLabel?: boolean;
  labelPosition?: InputLabelPosition;
  size?: InputSize;
  type?: InputType;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  name?: string;
  id?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
  prefix?: string;
  suffix?: string;
  iconStart?: string;
  iconEnd?: string;
  maxLength?: number;
}

export function Input({
  label, hideLabel = false, labelPosition: ownLabelPosition, size: ownSize, type = "text", placeholder, value, defaultValue,
  onChange, accept, multiple = false, onFilesChange, name, id, autoComplete, required = false, disabled = false, readOnly = false,
  invalid = false, error, hint, help, prefix, suffix, iconStart, iconEnd, maxLength: maxLengthProp,
}: InputProps) {
  const size = useDensitySize(ownSize);
  // A file input cannot hold a typed value, so value, placeholder and the counter do not apply.
  const isFile = type === "file";
  const maxLength = isFile ? undefined : maxLengthProp;
  const labelPosition = useLabelPosition(ownLabelPosition);
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const countId = `${inputId}-count`;
  const helpId = `${inputId}-help`;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const bad = invalid || Boolean(error);
  // An error replaces the hint, so the field says one thing at a time.
  const message = error || hint;
  const describedBy = [message ? messageId : "", maxLength ? countId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;
  const iconSize = size === "sm" ? "sm" : "md";

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    if (isFile) onFilesChange?.(Array.from(e.target.files ?? []));
    else if (value === undefined) setInner(e.target.value);
    onChange?.(e.target.value);
  };

  const cls = [styles.input, styles[size], hideLabel ? "" : styles[labelPosition], bad ? styles.invalid : "", disabled ? styles.disabled : ""];
  return (
    // data-label lets a start-label Form line up controls that have no label column.
    <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition}>
      {/* The help button sits beside the label, not inside it, so it never becomes the labelled control. */}
      <div className={hideLabel ? styles.srOnly : styles.labelRow}>
        <label htmlFor={inputId} className={styles.label}>
          {required && <span className={styles.required} aria-hidden="true">*</span>}
          {label}
        </label>
        {help && !hideLabel && (
          // help opens a HelpPopover titled with the label: hover, keyboard focus or click.
          <HelpPopover title={label} content={help}><button type="button" className={styles.help} aria-label={`About ${label}`}><Icon name="help_center" size="sm" /></button></HelpPopover>
        )}
        {help && <span id={helpId} className={styles.srOnly}>{help}</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.field}>
          {iconStart && <Icon name={iconStart} size={iconSize} className={styles.icon} />}
          {prefix && <span className={styles.affix}>{prefix}</span>}
          <input
            id={inputId} className={styles.native} type={type} name={name} autoComplete={autoComplete}
            {...(isFile ? { accept, multiple } : { placeholder, value: current })}
            onChange={handle} required={required} disabled={disabled} readOnly={readOnly} maxLength={maxLength}
            aria-invalid={bad || undefined} aria-describedby={describedBy}
          />
          {suffix && <span className={styles.affix}>{suffix}</span>}
          {maxLength !== undefined && <span id={countId} className={styles.count}>{current.length}/{maxLength}</span>}
          {iconEnd && <Icon name={iconEnd} size={iconSize} className={styles.icon} />}
        </div>
        {message && <p id={messageId} className={error ? styles.error : styles.hint}>{message}</p>}
      </div>
    </div>
  );
}
