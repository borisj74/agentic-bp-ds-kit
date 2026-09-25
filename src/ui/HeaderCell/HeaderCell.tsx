"use client";
import { Checkbox } from "../Checkbox/Checkbox";
import { Icon } from "../Icon/Icon";
import styles from "./HeaderCell.module.css";

export type HeaderCellSize = "sm" | "md";
export type HeaderCellAlignment = "start" | "center" | "end";
export type HeaderCellSort = "none" | "asc" | "desc";
export type HeaderCellLine = "medium" | "thin";

export interface HeaderCellProps {
  label?: string;
  size?: HeaderCellSize;
  alignment?: HeaderCellAlignment;
  line?: HeaderCellLine;
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
  label, size: ownSize, alignment = "start", line = "medium", checkbox = false, checked, defaultChecked, indeterminate,
  onCheckedChange, sortable = false, sort = "none", onSort,
}: HeaderCellProps) {
  // A surrounding Density changes the row through the density tokens, not the size.
  const size = ownSize ?? "md";
  const title = label ?? "column";
  return (
    <span className={[styles.cell, styles[size], styles[alignment], line === "thin" ? styles.thin : ""].join(" ")}>
      {checkbox && (
        <Checkbox
          size="sm" hideLabel label={label ? `Select all ${label}` : "Select all rows"}
          checked={checked} defaultChecked={defaultChecked} indeterminate={indeterminate} onChange={onCheckedChange}
        />
      )}
      {sortable && label ? (
        <button type="button" className={styles.sort} onClick={onSort} aria-label={`${label}, sort ${NEXT_SORT[sort]}`}>
          <span className={styles.label}>{label}</span>
          <Icon name={SORT_ICON[sort]} size="sm" intent={sort === "none" ? "subtle" : "brand"} />
        </button>
      ) : label ? (
        <span className={styles.label} title={title}>{label}</span>
      ) : null}
    </span>
  );
}
