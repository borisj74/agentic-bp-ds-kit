"use client";
import type { ReactNode } from "react";
import { FormLayoutContext, type FieldColumns } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useStickMark } from "../stick";
import styles from "./FormPage.module.css";

// The widths a booting form's labels take, so the rows read as fields rather than one grey block.
const BOOT_LABEL = ["60%", "80%", "45%", "70%"];

export interface FormPageProps {
  children: ReactNode;
  header?: ReactNode;
  notice?: ReactNode;
  sticky?: boolean;
  stickyNotice?: boolean;
  onStickyChange?: (stuck: boolean) => void;
  columns?: FieldColumns;
  loading?: boolean;
  loadingRows?: number;
  label?: string;
}

// One record being filled in: the kit PageHeader with what is being made and the save, a kit Callout with
// whatever has to be read first, and one kit Form underneath whose sections are the folding groups of fields.
// A blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell page, which
// owns the page padding.
export function FormPage({
  children, header, notice, sticky = true, stickyNotice = true, onStickyChange, columns = 2, loading = false, loadingRows = 12, label,
}: FormPageProps) {
  // The marker above the header says when the top of the page has scrolled away, so the screen can swap the
  // kit PageHeader to its own compact bar.
  const mark = useStickMark(onStickyChange);

  return (
    <section className={styles.page} aria-label={label ?? "Form"}>
      {sticky && onStickyChange && <div ref={mark} className={styles.mark} aria-hidden="true" />}
      {/* The name and the save stay at the top: a child of the page, not of the fields under it. */}
      {header && <div className={[styles.head, sticky ? styles.stuck : ""].join(" ")}>{header}</div>}
      {/* How to fill the form in, so it stays under the name rather than scrolling away with the first group. */}
      {notice && !loading && <div className={[styles.notice, stickyNotice ? styles.stuckNotice : ""].join(" ")}>{notice}</div>}
      {/* The page sets the columns once and the Form follows them unless it sets its own. A related list after the
          Form, a Section of a Table, keeps the full width. */}
      {/* Booting (BP COBALT item 1, screen 56): the fields in their real rhythm — inputs 39px apart with the
          label ending 16px before each one — so nothing moves when the form arrives. */}
      {loading ? (
        <div className={columns === 1 ? styles.loadingOne : "layout-split"}>
          {Array.from({ length: columns === 1 ? 1 : 2 }, (_, col) => (
            <div key={col} className={styles.loadingColumn}>
              {Array.from({ length: Math.max(1, Math.ceil(loadingRows / (columns === 1 ? 1 : 2))) }, (_, r) => (
                <div key={r} className={styles.loadingRow}>
                  <Skeleton shape="rect" height="var(--skeleton-cell)" width={BOOT_LABEL[(r + col) % BOOT_LABEL.length]} label={r === 0 && col === 0 ? `Loading ${label ?? "form"}` : ""} />
                  <Skeleton shape="rect" height="var(--control-medium)" label="" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <FormLayoutContext.Provider value={{ columns }}>
          <div className={styles.fields}>{children}</div>
        </FormLayoutContext.Provider>
      )}
    </section>
  );
}
