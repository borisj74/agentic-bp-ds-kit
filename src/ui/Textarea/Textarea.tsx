"use client";
import { useId, useState, type ChangeEvent } from "react";
import { useLabelPosition } from "../Form/FormContext";
import { Icon } from "../Icon/Icon";
import { HelpPopover } from "../HelpPopover/HelpPopover";
// Label, help, hint and error share Input's styles so both fields read the same in one form.
import field from "../Input/Input.module.css";
import styles from "./Textarea.module.css";

export type TextareaSize = "sm" | "md" | "lg";
export type TextareaType = "text" | "code";
export type TextareaLabelPosition = "top" | "start";

export interface TextareaProps {
  label: string;
  hideLabel?: boolean;
  labelPosition?: TextareaLabelPosition;
  size?: TextareaSize;
  type?: TextareaType;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
  maxLength?: number;
}

export function Textarea({
  label, hideLabel = false, labelPosition: ownLabelPosition, size = "md", type = "text", placeholder, value, defaultValue,
  onChange, name, id, required = false, disabled = false, readOnly = false, invalid = false, error, hint, help, maxLength,
}: TextareaProps) {
  const labelPosition = useLabelPosition(ownLabelPosition);
  const autoId = useId();
  const areaId = id ?? autoId;
  const messageId = `${areaId}-message`;
  const countId = `${areaId}-count`;
  const helpId = `${areaId}-help`;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const bad = invalid || Boolean(error);
  const message = error || hint;
  const describedBy = [message ? messageId : "", maxLength ? countId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;

  const handle = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) setInner(e.target.value);
    onChange?.(e.target.value);
  };

  const cls = [field.input, styles.textarea, hideLabel ? "" : field[labelPosition]];
  return (
    <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition}>
      <div className={hideLabel ? field.srOnly : field.labelRow}>
        <label htmlFor={areaId} className={field.label}>
          {required && <span className={field.required} aria-hidden="true">*</span>}
          {label}
        </label>
        {help && !hideLabel && (
          // help opens a HelpPopover titled with the label: hover, keyboard focus or click.
          <HelpPopover title={label} content={help}><button type="button" className={field.help} aria-label={`About ${label}`}><Icon name="help_center" size="sm" /></button></HelpPopover>
        )}
        {help && <span id={helpId} className={field.srOnly}>{help}</span>}
      </div>
      <div className={field.body}>
        <textarea
          id={areaId} name={name} placeholder={placeholder} value={current} onChange={handle}
          required={required} disabled={disabled} readOnly={readOnly} maxLength={maxLength}
          aria-invalid={bad || undefined} aria-describedby={describedBy}
          className={[styles.area, styles[size], styles[type], bad ? styles.invalid : ""].join(" ")}
        />
        {(message || maxLength !== undefined) && (
          <div className={styles.footer}>
            {message && <p id={messageId} className={error ? field.error : field.hint}>{message}</p>}
            {maxLength !== undefined && <span id={countId} className={styles.count}>{current.length}/{maxLength}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
