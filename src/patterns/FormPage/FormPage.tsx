"use client";
import type { ReactNode } from "react";
import { FormLayoutContext, type FieldColumns } from "@/ui/Form/FormContext";
import { useStickMark } from "../stick";
import styles from "./FormPage.module.css";

export interface FormPageProps {
  children: ReactNode;
  header?: ReactNode;
  notice?: ReactNode;
  sticky?: boolean;
  stickyNotice?: boolean;
  onStickyChange?: (stuck: boolean) => void;
  columns?: FieldColumns;
  label?: string;
}

// One record being filled in: the kit PageHeader with what is being made and the save, a kit Callout with
// whatever has to be read first, and one kit Form underneath whose sections are the folding groups of fields.
// A blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell page, which
// owns the page padding.
export function FormPage({
  children, header, notice, sticky = true, stickyNotice = true, onStickyChange, columns = 2, label,
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
      {notice && <div className={[styles.notice, stickyNotice ? styles.stuckNotice : ""].join(" ")}>{notice}</div>}
      {/* The page sets the columns once and the Form follows them unless it sets its own. A related list after the
          Form, a Section of a Table, keeps the full width. */}
      <FormLayoutContext.Provider value={{ columns }}>
        <div className={styles.fields}>{children}</div>
      </FormLayoutContext.Provider>
    </section>
  );
}
