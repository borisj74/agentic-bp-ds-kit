"use client";
import type { ReactNode } from "react";
import { useStickMark } from "../stick";
import styles from "./RecordPage.module.css";

export interface RecordPageProps {
  children: ReactNode;
  header?: ReactNode;
  tabs?: ReactNode;
  notice?: ReactNode;
  toolbar?: ReactNode;
  summary?: ReactNode;
  sticky?: boolean;
  onStickyChange?: (stuck: boolean) => void;
  label?: string;
}

// One record: the kit PageHeader with its name and actions, the kit Tabs of what belongs to it, a kit
// Alert about it, the kit Toolbar for the tab that is showing, a kit Scoreboard of its numbers, and the
// details as kit Sections underneath. A blueprint only: it composes kit pieces and keeps no state of its
// own. It sits in the AppShell page, which owns the page padding.
export function RecordPage({
  children, header, tabs, notice, toolbar, summary, sticky = true, onStickyChange, label,
}: RecordPageProps) {
  const top = tabs || notice || toolbar;
  // The marker above the header says when the top of the record has scrolled away, so the screen can swap
  // the kit PageHeader to its own compact bar.
  const mark = useStickMark(onStickyChange);

  return (
    <section className={styles.record} aria-label={label ?? "Record"}>
      {sticky && onStickyChange && <div ref={mark} className={styles.mark} aria-hidden="true" />}
      {/* Only the name stays at the top. It is a child of the record, not of the block under it, so it holds
          all the way down instead of leaving with the tabs. */}
      {header && <div className={[styles.head, sticky ? styles.stuck : ""].join(" ")}>{header}</div>}
      {/* The tabs, the notice and the bar: one block that scrolls away under the name. */}
      {top && (
        <div className={styles.top}>
          {tabs && <div className={styles.tabs}>{tabs}</div>}
          {notice && <div className={styles.notice}>{notice}</div>}
          {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        </div>
      )}
      {summary && <div className={styles.summary}>{summary}</div>}
      <div className={styles.details}>{children}</div>
    </section>
  );
}
