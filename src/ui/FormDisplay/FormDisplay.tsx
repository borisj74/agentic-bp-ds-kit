"use client";
import { useId, type ReactNode } from "react";
import { labelWidthClass, useLabelPosition } from "../Form/FormContext";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import { Icon } from "../Icon/Icon";
import { HelpPopover } from "../HelpPopover/HelpPopover";
// The help button matches the one on Input.
import field from "../Input/Input.module.css";
import styles from "./FormDisplay.module.css";

export type FormDisplayLabelPosition = "top" | "start";
export type FormDisplayLabelWidth = "sm" | "md" | "lg";

export interface FormDisplayProps {
  label: string;
  value?: ReactNode;
  labelPosition?: FormDisplayLabelPosition;
  labelWidth?: FormDisplayLabelWidth;
  help?: string;
  empty?: string;
}

export function FormDisplay({ label, value, labelPosition: ownLabelPosition, labelWidth, help, empty = "—" }: FormDisplayProps) {
  const labelPosition = useLabelPosition(ownLabelPosition);
  // A row in a booting record draws itself as bars, in its own place.
  const booting = useFieldSkeleton();
  // The label column this row stands on. md is the kit's 234.
  const width = labelWidthClass(labelWidth);
  const helpId = useId();
  const blank = value === undefined || value === null || value === "";
  // Booting: the pair keeps its own row, its label cell and the line under it, so the real row lands in place.
  // Each cell also keeps the line box its own words will take, and a row with help keeps that button's square:
  // an 8px bar is not allowed to size the row, or every row below it sits high while the record loads and drops
  // when the values arrive.
  if (booting) {
    return (
      <dl className={[styles.display, styles[labelPosition], width ? styles[width] : ""].join(" ")} data-label={labelPosition}>
        <dt className={[styles.term, styles.bootTerm].join(" ")}>
          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(label)} height="var(--skeleton-cell)" label="" />
          {help && <span className={styles.bootHelp} aria-hidden="true" />}
        </dt>
        <dd className={[styles.value, styles.bootValue].join(" ")}>
          <Skeleton shape="rect" animation="pulse" width="var(--skeleton-bar-md)" height="var(--skeleton-cell)" label="" />
        </dd>
      </dl>
    );
  }
  return (
    // A one-pair description list: screen readers read the label, then the value.
    <dl className={[styles.display, styles[labelPosition], width ? styles[width] : ""].join(" ")} data-label={labelPosition}>
      <dt className={styles.term}>
        {label}
        {help && (
          // help opens a HelpPopover titled with the label: hover, keyboard focus or click.
          <HelpPopover title={label} content={help}><button type="button" className={field.help} aria-label={`About ${label}`}><Icon name="help_center" size="sm" /></button></HelpPopover>
        )}
        {help && <span id={helpId} className={field.srOnly}>{help}</span>}
      </dt>
      <dd className={[styles.value, blank ? styles.blank : ""].join(" ")}>{blank ? empty : value}</dd>
    </dl>
  );
}
