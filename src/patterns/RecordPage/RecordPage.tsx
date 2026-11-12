"use client";
import type { ReactNode } from "react";
import { FormLayoutContext, type FieldColumns, type FieldLabelPosition } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useStickyBand } from "../band";
import { useStickMark } from "../stick";
import styles from "./RecordPage.module.css";

// The widths a booting record's bars take, so the rows read as labels and values rather than one grey block.
const BOOT_TABS = ["50px", "104px", "72px", "104px", "72px", "104px", "72px"];
const BOOT_LABEL = ["70%", "55%", "80%", "60%"];
const BOOT_VALUE = ["85%", "60%", "70%", "50%"];

export interface RecordPageProps {
  children: ReactNode;
  header?: ReactNode;
  tabs?: ReactNode;
  notice?: ReactNode;
  toolbar?: ReactNode;
  summary?: ReactNode;
  sticky?: boolean;
  onStickyChange?: (stuck: boolean) => void;
  columns?: FieldColumns;
  labelPosition?: FieldLabelPosition;
  loading?: boolean;
  loadingRows?: number;
  label?: string;
}

// One record: the kit PageHeader with its name and actions, the kit Tabs of what belongs to it, a kit
// Callout about it, the kit Toolbar for the tab that is showing, a kit Scoreboard of its numbers, and the
// details as kit Sections underneath. A blueprint only: it composes kit pieces and keeps no state of its
// own. It sits in the AppShell page, which owns the page padding.
export function RecordPage({
  children, header, tabs, notice, toolbar, summary, sticky = true, onStickyChange, columns = 2, labelPosition = "start",
  loading = false, loadingRows = 16, label,
}: RecordPageProps) {
  // Booting, the tab strip stands as its own row of bars: the tabs are there, their names are not yet.
  const bootTabs = loading && tabs ? (
    <div className={styles.loadingTabs}>
      {BOOT_TABS.map((w, i) => (
        <Skeleton key={i} shape="rect" animation="pulse" width={w} height="var(--skeleton-cell)" label="" />
      ))}
    </div>
  ) : null;
  const top = bootTabs || tabs || notice;
  // The marker above the header says when the top of the record has scrolled away, so the screen can swap
  // the kit PageHeader to its own compact bar.
  const mark = useStickMark(onStickyChange);

  // The bar over the tab is the band that holds at the top: the same plumbing a list uses says where a Table in
  // the tab stops its column names, and marks the band and its lift as the record scrolls.
  const { rootRef, barRef, shadowRef, style } = useStickyBand([toolbar, children], { names: false });

  return (
    <section
      ref={rootRef as React.Ref<HTMLElement>}
      className={styles.record} aria-label={label ?? "Record"} style={style}
    >
      {sticky && onStickyChange && <div ref={mark} className={styles.mark} aria-hidden="true" />}
      {/* Only the name stays at the top. It is a child of the record, not of the block under it, so it holds
          all the way down instead of leaving with the tabs. */}
      {header && <div className={[styles.head, sticky ? styles.stuck : ""].join(" ")}>{header}</div>}
      {/* The tabs and the notice: one block that scrolls away under the name. */}
      {top && (
        <div className={styles.top}>
          {(bootTabs || tabs) && <div className={styles.tabs}>{bootTabs ?? tabs}</div>}
          {notice && !loading && <div className={styles.notice}>{notice}</div>}
        </div>
      )}
      {/* The bar is a child of the record, not of the block above it: a sticky box can only hold inside its own
          parent, so in that block it would leave with the tabs instead of staying under the name. */}
      {toolbar && <div ref={barRef} className={styles.toolbar}>{toolbar}</div>}
      {/* The lift under the pinned band, which the bar and the sections cannot cast themselves: they keep the
          page's side padding and this reaches the page edges. */}
      {toolbar && <div ref={shadowRef} aria-hidden="true" data-scroll-shadow="" className={styles.scrollShadow} />}
      {summary && !loading && <div className={styles.summary}>{summary}</div>}
      {/* The record sets the columns and the labels once: every Section of FormDisplay rows (and any Form) in the
          details follows them unless it sets its own. Sections of Tables keep the full width. */}
      {/* Booting: shaded label cells and their values, 37px apart, in the record's own columns (BP COBALT item 1,
          screen 56). The kit's split is what breaks them back to one column, so a narrow record reads as one. */}
      {loading ? (
        <div className={columns === 1 ? styles.loadingOne : "layout-split"}>
          {Array.from({ length: columns === 1 ? 1 : 2 }, (_, col) => (
            <div key={col} className={styles.loadingColumn}>
              {Array.from({ length: Math.max(1, Math.ceil(loadingRows / (columns === 1 ? 1 : 2))) }, (_, r) => (
                <div key={r} className={styles.loadingRow}>
                  <span className={styles.loadingLabel}>
                    <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_LABEL[(r + col) % BOOT_LABEL.length]} label={r === 0 && col === 0 ? `Loading ${label ?? "record"}` : ""} />
                  </span>
                  <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_VALUE[(r + col) % BOOT_VALUE.length]} label="" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <FormLayoutContext.Provider value={{ columns, labelPosition }}>
          <div className={styles.details}>{children}</div>
        </FormLayoutContext.Provider>
      )}
    </section>
  );
}
