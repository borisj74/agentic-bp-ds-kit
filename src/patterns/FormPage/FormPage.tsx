"use client";
import type { ReactNode } from "react";
import { FormLayoutContext, type FieldColumns } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton, useFieldSkeleton } from "@/ui/LoadingLine/boot";
import { useStickMark } from "../stick";
import styles from "./FormPage.module.css";
import { inspect } from "../../ui/inspect";

// The widths a booting form's labels take in the rows fallback, so they read as fields rather than one grey block.
const BOOT_LABEL = ["60%", "80%", "45%", "70%"];

export type FormPageLoadingShape = "content" | "rows";

export interface FormPageProps {
  children: ReactNode;
  header?: ReactNode;
  notice?: ReactNode;
  sticky?: boolean;
  stickyNotice?: boolean;
  onStickyChange?: (stuck: boolean) => void;
  columns?: FieldColumns;
  loading?: boolean;
  loadingShape?: FormPageLoadingShape;
  loadingRows?: number;
  label?: string;
}

// One record being filled in: the kit PageHeader with what is being made and the save, a kit Callout with
// whatever has to be read first, and one kit Form underneath whose sections are the folding groups of fields.
// A blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell page, which
// owns the page padding.
export function FormPage({
  children, header, notice, sticky = true, stickyNotice = true, onStickyChange, columns = 2, loading = false,
  loadingShape = "content", loadingRows = 12, label,
}: FormPageProps) {
  // The skeleton follows the frame's boot sequence; on its own it draws at once.
  const { skeleton: own } = useBootSkeleton(loading);
  // Inside a booting AppShell the page boots with the frame, so a screen says loading once, at the top, and the
  // pattern follows the frame's sequence instead of standing live under the line.
  const inFrame = useFieldSkeleton();
  const booting = own || inFrame;
  // The marker above the header says when the top of the page has scrolled away, so the screen can swap the
  // kit PageHeader to its own compact bar.
  const mark = useStickMark(onStickyChange);

  return (
    <section {...inspect("FormPage")} className={styles.page} aria-label={label ?? "Form"}>
      {sticky && onStickyChange && <div ref={mark} className={styles.mark} aria-hidden="true" />}
      {/* The name and the save stay at the top: a child of the page, not of the fields under it. */}
      {header && <div className={[styles.head, sticky ? styles.stuck : ""].join(" ")}>{header}</div>}
      {/* How to fill the form in, so it stays under the name rather than scrolling away with the first group.
          Booting, the notice itself holds the space it will take — it is in the tree, out of sight and out of the
          reading order — and one block covers it, so the fields below do not move when the words arrive. */}
      {notice && (
        <div className={[styles.notice, stickyNotice ? styles.stuckNotice : ""].join(" ")}>
          {booting ? (
            <div className={styles.noticeBoot}>
              <div className={styles.noticeGhost} inert aria-hidden="true">{notice}</div>
              <Skeleton shape="rect" animation="pulse" height="100%" label="" />
            </div>
          ) : notice}
        </div>
      )}
      {/* The page sets the columns once and the Form follows them unless it sets its own. A related list after the
          Form, a Section of a Table, keeps the full width. */}
      {/* Booting (BP COBALT item 1, screen 56), and past what that screen draws: the real children are rendered,
          and each Section, field and row inside draws itself as bars where it will stand — the page's own
          sections, their headers, the fields in their columns — so nothing moves when the form arrives. The tree
          is inert and hidden from screen readers while it is bars; the one status below says what is loading. */}
      <FormLayoutContext.Provider value={{ columns, loading: booting && loadingShape === "content" }}>
        {booting && <span className={styles.srOnly} role="status">Loading {label ?? "form"}</span>}
        {booting && loadingShape === "rows" ? (
          // rows: the old fixed grid, for a page that has no children to follow yet.
          <div className={columns === 1 ? styles.loadingOne : ["layout-split", columns === 3 ? "layout-split--thirds" : ""].join(" ")}>
            {Array.from({ length: columns }, (_, col) => (
              <div key={col} className={styles.loadingColumn}>
                {Array.from({ length: Math.max(1, Math.ceil(loadingRows / columns)) }, (_, r) => (
                  <div key={r} className={styles.loadingRow}>
                    <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_LABEL[(r + col) % BOOT_LABEL.length]} label="" />
                    <Skeleton shape="rect" animation="pulse" height="var(--control-medium)" label="" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.fields} inert={booting || undefined} aria-hidden={booting || undefined}>{children}</div>
        )}
      </FormLayoutContext.Provider>
    </section>
  );
}
