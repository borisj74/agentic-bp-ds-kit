"use client";
import { Checkbox } from "../Checkbox/Checkbox";
import { useDensity } from "../Density/Density";
import { Icon } from "../Icon/Icon";
import styles from "./HeaderCell.module.css";

export type HeaderCellSize = "sm" | "md";
export type HeaderCellAlign = "start" | "center" | "end";
export type HeaderCellSort = "none" | "asc" | "desc";

export interface HeaderCellProps {
  label?: string;
  size?: HeaderCellSize;
  align?: HeaderCellAlign;
  checkbox?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  sortable?: boolean;
  sort?: HeaderCellSort;
  onSort?: () => void;
}

const SORT_ICON = { none: "unfold_more", asc: "arrow_upward", desc: "arrow_downward" } as const;
const NEXT_SORT = { none: "ascending", asc: "descending", desc: "off" } as const;

export function HeaderCell({
  label, size: ownSize, align = "start", checkbox = false, checked, defaultChecked, indeterminate,
  onCheckedChange, sortable = false, sort = "none", onSort,
}: HeaderCellProps) {
  const density = useDensity();
  const size = ownSize ?? (density === "compact" ? "sm" : "md");
  const title = label ?? "column";
  return (
    <span className={[styles.cell, styles[size], styles[align]].join(" ")}>
      {checkbox && (
        <Checkbox
          size="sm" hideLabel label={label ? `Select all ${label}` : "Select all rows"}
          checked={checked} defaultChecked={defaultChecked} indeterminate={indeterminate} onChange={onCheckedChange}
        />
      )}
      {sortable && label ? (
        <button type="button" className={styles.sort} onClick={onSort} aria-label={`${label}, sort ${NEXT_SORT[sort]}`}>
          <span className={styles.label}>{label}</span>
          <Icon name={SORT_ICON[sort]} size="sm" tone={sort === "none" ? "subtle" : "brand"} />
        </button>
      ) : label ? (
        <span className={styles.label} title={title}>{label}</span>
      ) : null}
    </span>
  );
}
