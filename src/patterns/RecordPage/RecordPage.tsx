"use client";
import { isValidElement, type ReactNode } from "react";
import { FormLayoutContext, type FieldColumns, type FieldLabelPosition } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { skeletonBarWidth, useBootSkeleton } from "@/ui/LoadingLine/boot";
import { Tabs } from "@/ui/Tabs/Tabs";
import { useStickyBand } from "../band";
import { useStickMark } from "../stick";
import styles from "./RecordPage.module.css";

// The widths a booting record's bars take in the rows fallback, so the rows read as labels and values rather than
// one grey block (BP COBALT node 2046:30135 draws its label bars at 90, 120 and 70).
const BOOT_TABS = ["50px", "104px", "72px", "104px", "72px", "104px"];
const BOOT_LABEL = ["var(--skeleton-record-label-md)", "var(--skeleton-record-label-lg)", "var(--skeleton-record-label-sm)"];
const BOOT_VALUE = ["85%", "60%", "70%", "50%"];

export type RecordPageLoadingShape = "content" | "rows";

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
  loadingShape?: RecordPageLoadingShape;
  loadingRows?: number;
  label?: string;
}

// The tab strip while the record boots: one bar per tab the record actually has, at the length its name will
// take, with a 2px underline under the one that is showing (BP COBALT node 2046:30135). A kit Tabs says which
// tabs there are and which is current; anything else falls back to the Cobalt screen's own six bars.
function bootTabs(tabs: ReactNode): { width: string; current: boolean }[] {
  if (isValidElement(tabs) && tabs.type === Tabs) {
    const p = tabs.props as { items?: { id: string; label: string; disabled?: boolean }[]; value?: string; defaultValue?: string };
    const items = p.items ?? [];
    if (items.length > 0) {
      const enabled = items.filter((i) => !i.disabled);
      const current = p.value ?? p.defaultValue ?? enabled[0]?.id;
      return items.map((i) => ({ width: skeletonBarWidth(i.label), current: i.id === current }));
    }
  }
  return BOOT_TABS.map((width, i) => ({ width, current: i === 0 }));
}

// One record: the kit PageHeader with its name and actions, the kit Tabs of what belongs to it, a kit
// Callout about it, the kit Toolbar for the tab that is showing, a kit Scoreboard of its numbers, and the
// details as kit Sections underneath. A blueprint only: it composes kit pieces and keeps no state of its
// own. It sits in the AppShell page, which owns the page padding.
export function RecordPage({
  children, header, tabs, notice, toolbar, summary, sticky = true, onStickyChange, columns = 2, labelPosition = "start",
  loading = false, loadingShape = "content", loadingRows = 16, label,
}: RecordPageProps) {
  // The skeleton follows the frame's boot sequence; on its own, outside a booting frame, it draws at once.
  const { skeleton: booting } = useBootSkeleton(loading);
  // The rows fallback splits its rows over two columns however many the record asks for: past two they no longer
  // read as a record, and the Cobalt screen draws two.
  const bootColumns = columns === 1 ? 1 : 2;
  // Booting, the tab strip stands as its own row of bars: the tabs are there, their names are not yet.
  const strip = booting && tabs ? (
    <div className={styles.loadingTabs}>
      {bootTabs(tabs).map((t, i) => (
        <span key={i} className={[styles.loadingTab, t.current ? styles.loadingTabCurrent : ""].join(" ")}>
          <Skeleton shape="rect" animation="pulse" width={t.width} height="var(--skeleton-row-bar)" label="" />
        </span>
      ))}
    </div>
  ) : null;
  const top = strip || tabs || notice;
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
          {(strip || tabs) && <div className={styles.tabs}>{strip ?? tabs}</div>}
          {/* Booting, the notice holds its own height: the real block is in the tree but out of sight and out of
              the reading order, with one block over it, so the details below stand where they will stand
              whether the notice runs to one line or three. */}
          {notice && (
            booting ? (
              <div className={[styles.notice, styles.noticeBoot].join(" ")}>
                <div className={styles.noticeGhost} inert aria-hidden="true">{notice}</div>
                <Skeleton shape="rect" animation="pulse" height="100%" label="" />
              </div>
            ) : <div className={styles.notice}>{notice}</div>
          )}
        </div>
      )}
      {/* The bar is a child of the record, not of the block above it: a sticky box can only hold inside its own
          parent, so in that block it would leave with the tabs instead of staying under the name. */}
      {toolbar && <div ref={barRef} className={styles.toolbar}>{toolbar}</div>}
      {/* The lift under the pinned band, which the bar and the sections cannot cast themselves: they keep the
          page's side padding and this reaches the page edges. */}
      {toolbar && <div ref={shadowRef} aria-hidden="true" data-scroll-shadow="" className={styles.scrollShadow} />}
      {/* The record sets the columns and the labels once: every Section of FormDisplay rows (and any Form) in the
          details follows them unless it sets its own. Sections of Tables keep the full width. loading travels the
          same way: each Section, row, Scoreboard, chart and Table under it draws itself as bars where it will
          stand, so the record arrives in the shape its skeleton held. */}
      <FormLayoutContext.Provider value={{ columns, labelPosition, loading: booting && loadingShape === "content" }}>
        {booting && <span className={styles.srOnly} role="status">Loading {label ?? "record"}</span>}
        {/* The numbers draw themselves as bars in the content shape; in the rows fallback there is nothing to
            follow, so they wait with the details. */}
        {summary && (!booting || loadingShape === "content") && (
          <div className={styles.summary} inert={booting || undefined} aria-hidden={booting || undefined}>{summary}</div>
        )}
        {booting && loadingShape === "rows" ? (
          // rows: the fixed grid, for a record that has no details to follow yet (BP COBALT node 2046:30135):
          // two columns filling the content width with no gap between them, each row a 210 shaded label cell with
          // its label bar ending at the cell edge, then the value.
          <div className={bootColumns === 1 ? styles.loadingOne : [styles.loadingGrid, "layout-split"].join(" ")}>
            {Array.from({ length: bootColumns }, (_, col) => (
              <div key={col} className={styles.loadingColumn}>
                {Array.from({ length: Math.max(1, Math.ceil(loadingRows / bootColumns)) }, (_, r) => (
                  <div key={r} className={styles.loadingRow}>
                    <span className={styles.loadingLabel}>
                      <Skeleton shape="rect" animation="pulse" height="var(--skeleton-row-bar)" width={BOOT_LABEL[(r + col) % BOOT_LABEL.length]} label="" />
                    </span>
                    <Skeleton shape="rect" animation="pulse" height="var(--skeleton-row-bar)" width={BOOT_VALUE[(r + col) % BOOT_VALUE.length]} label="" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          // content: the record's own details draw themselves as bars, so nothing moves when they arrive. The
          // tree is inert and hidden from screen readers while it is bars; the one status above says what is
          // loading.
          <div className={styles.details} inert={booting || undefined} aria-hidden={booting || undefined}>{children}</div>
        )}
      </FormLayoutContext.Provider>
    </section>
  );
}
