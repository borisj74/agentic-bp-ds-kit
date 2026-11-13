"use client";
import { useId, useState } from "react";
import { useDensitySize } from "../Density/Density";
import { Dropdown, type DropdownEntry, type DropdownWidth } from "../Dropdown/Dropdown";
import { labelWidthClass, useLabelPosition } from "../Form/FormContext";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import { Icon } from "../Icon/Icon";
import { HelpPopover } from "../HelpPopover/HelpPopover";
// Label, help, hint and error share Input's styles so all form fields match.
import field from "../Input/Input.module.css";

export type SelectSize = "sm" | "md" | "lg";
export type SelectLabelPosition = "top" | "start";
export type SelectLabelWidth = "sm" | "md" | "lg";
export type SelectItemCheck = "check" | "checkbox";
export interface SelectOption { value: string; label: string; disabled?: boolean }

export interface SelectProps {
  label: string;
  options: SelectOption[];
  hideLabel?: boolean;
  labelPosition?: SelectLabelPosition;
  labelWidth?: SelectLabelWidth;
  size?: SelectSize;
  placeholder?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  itemCheck?: SelectItemCheck;
  maxVisible?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
  menuWidth?: DropdownWidth;
}

export function Select({
  label, options, hideLabel = false, labelPosition: ownLabelPosition, labelWidth, size: ownSize, placeholder = "Select", value, defaultValue, onChange,
  multiple = false, itemCheck = "check", maxVisible, searchable = false, searchPlaceholder, name, id, required = false, disabled = false, invalid = false, error, hint, help, menuWidth = "default",
}: SelectProps) {
  const size = useDensitySize(ownSize);
  const labelPosition = useLabelPosition(ownLabelPosition);
  // A field in a booting page draws itself as bars, in its own place.
  const booting = useFieldSkeleton();
  // The label column this field stands on. With no label there is no column, and md is the kit's 234.
  const width = hideLabel ? undefined : labelWidthClass(labelWidth);
  const uid = useId();
  const fieldId = id ?? `${uid}-field`;
  const labelId = `${uid}-label`;
  const messageId = `${uid}-message`;
  const helpId = `${uid}-help`;
  const [inner, setInner] = useState<string | string[]>(defaultValue ?? (multiple ? [] : ""));
  const current = value ?? inner;
  const values = Array.isArray(current) ? current : current ? [current] : [];
  const picked = options.filter((o) => values.includes(o.value));
  // Past maxVisible, the field lists the first labels and a +N badge.
  const over = multiple && maxVisible !== undefined && picked.length > maxVisible ? picked.length - maxVisible : 0;
  const text = (over ? picked.slice(0, maxVisible) : picked).map((o) => o.label).join(", ");
  const bad = invalid || Boolean(error);
  const message = error || hint;
  const describedBy = [message ? messageId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;

  const emit = (next: string | string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const items: DropdownEntry[] = options.map((o) => ({
    id: o.value, label: o.label, disabled: o.disabled, selected: values.includes(o.value),
    checkbox: multiple && itemCheck === "checkbox" ? true : undefined,
  }));

  const cls = [field.input, field[size], hideLabel ? "" : field[labelPosition], width ? field[width] : "", bad ? field.invalid : "", disabled ? field.disabled : ""];
  // Booting: the field keeps its own box, its label column and its control's height, so the real field arrives
  // exactly where the bars stood. The bars say nothing to a screen reader: the page says "Loading" once, at the
  // top, and the field's own name comes with the field.
  if (booting) {
    return (
      <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition}>
        {!hideLabel && (
          <div className={field.labelRow}>
            <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(label)} height="var(--skeleton-cell)" label="" />
          </div>
        )}
        <div className={field.body}>
          <Skeleton shape="rect" animation="pulse" height="var(--h)" label="" />
        </div>
      </div>
    );
  }
  return (
    <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition}>
      <div className={hideLabel ? field.srOnly : field.labelRow}>
        {/* The field is a button, which has no required state, so the label says it for screen readers. */}
        <label id={labelId} htmlFor={fieldId} className={field.label}>
          {required && <span className={field.required} aria-hidden="true">*</span>}
          {label}
          {required && <span className={field.srOnly}>, required</span>}
        </label>
        {help && !hideLabel && (
          <HelpPopover title={label} content={help}><button type="button" className={field.help} aria-label={`About ${label}`}><Icon name="help_center" size="sm" /></button></HelpPopover>
        )}
        {help && <span id={helpId} className={field.srOnly}>{help}</span>}
      </div>
      <div className={field.body}>
        <Dropdown
          trigger="field" id={fieldId} label={label} labelledBy={labelId} describedBy={describedBy}
          text={text || placeholder} muted={!text} badge={over ? `+${over}` : undefined}
          size={size} disabled={disabled} multiple={multiple} items={items} searchable={searchable} searchPlaceholder={searchPlaceholder} menuWidth={menuWidth}
          onSelect={(v) => emit(multiple ? (values.includes(v) ? values.filter((x) => x !== v) : [...values, v]) : v)}
        />
        {message && <p id={messageId} className={error ? field.error : field.hint}>{message}</p>}
      </div>
      {name && <input type="hidden" name={name} value={values.join(",")} />}
    </div>
  );
}
