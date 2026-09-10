"use client";
import { useId, type ReactNode } from "react";
import { useLabelPosition } from "../Form/FormContext";
import { Icon } from "../Icon/Icon";
// The help button matches the one on Input.
import field from "../Input/Input.module.css";
import styles from "./FormDisplay.module.css";

export type FormDisplayLabelPosition = "top" | "start";

export interface FormDisplayProps {
  label: string;
  value?: ReactNode;
  labelPosition?: FormDisplayLabelPosition;
  help?: string;
  empty?: string;
}

export function FormDisplay({ label, value, labelPosition: ownLabelPosition, help, empty = "—" }: FormDisplayProps) {
  const labelPosition = useLabelPosition(ownLabelPosition);
  const helpId = useId();
  const blank = value === undefined || value === null || value === "";
  return (
    // A one-pair description list: screen readers read the label, then the value.
    <dl className={[styles.display, styles[labelPosition]].join(" ")} data-label={labelPosition}>
      <dt className={styles.term}>
        {label}
        {help && (
          // The tooltip arrives with the kit Tooltip. Until then the text reaches screen readers through aria-describedby.
          <button type="button" className={field.help} aria-label={`About ${label}`} aria-describedby={helpId}>
            <Icon name="help_center" size="sm" />
          </button>
        )}
        {help && <span id={helpId} className={field.srOnly}>{help}</span>}
      </dt>
      <dd className={[styles.value, blank ? styles.blank : ""].join(" ")}>{blank ? empty : value}</dd>
    </dl>
  );
}
