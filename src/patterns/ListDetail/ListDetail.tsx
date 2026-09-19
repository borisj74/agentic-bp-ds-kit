"use client";
import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import type { ListViewProps } from "@/ui/ListView/ListView";
import styles from "./ListDetail.module.css";

export type ListDetailLayout = "side" | "stacked" | "inline";

export interface ListDetailProps {
  list: ReactNode;
  detail?: ReactNode;
  open?: boolean;
  title?: string;
  actions?: ReactNode;
  empty?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  layout?: ListDetailLayout;
  label?: string;
}

// A list with the picked record beside it: the kit ListView on one side, the record in a pane on the other.
// Wide, both show at once and picking a row swaps the pane. Narrow, the pane covers the list and Back returns to
// it. Stacked puts the record under the whole list; inline hands it to the ListView to show under its row.
// A blueprint only: the screen keeps which record is open and passes it in.
export function ListDetail({ list, detail, open = false, title, actions, empty, onBack, backLabel = "Back to list", layout = "side", label }: ListDetailProps) {
  const shown = open && detail != null;
  const headId = useId();
  // The record's header and body. Beside or under the list it is its own region; under a row the ListView names it.
  const record = (
    <>
      {(title || actions || (onBack && layout === "side")) && (
        <header className={styles.head}>
          {/* Only the narrow side layout needs a way back; otherwise the list is right there. */}
          {onBack && layout === "side" && (
            <span className={styles.back}>
              <Button variant="tertiary" size="md" iconOnly iconStart="arrow_back" onClick={onBack}>{backLabel}</Button>
            </span>
          )}
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.body}>{detail}</div>
    </>
  );

  if (layout === "inline") {
    const inRow = isValidElement<ListViewProps>(list) ? cloneElement(list, { detail: shown ? <div className={styles.inline}>{record}</div> : undefined }) : list;
    return (
      <div className={styles.frame}>
        <section className={[styles.split, styles.single].join(" ")} aria-labelledby={label ? headId : undefined}>
          {label && <h2 id={headId} className={styles.srOnly}>{label}</h2>}
          <div className={styles.list}>{inRow}</div>
        </section>
      </div>
    );
  }

  return (
    <div className={[styles.frame, shown ? styles.open : "", layout === "stacked" ? styles.stacked : ""].join(" ")}>
      <section className={styles.split} aria-labelledby={label ? headId : undefined}>
        {/* The list's own heading, read but not shown: it keeps the headings in order under the page title, so the
            record's h2 and the list's group headers (h3) sit below it. */}
        {label && <h2 id={headId} className={styles.srOnly}>{label}</h2>}
        <div className={styles.list}>{list}</div>
        <div className={styles.pane}>
          {shown ? (
            <section className={styles.record} aria-label={title}>{record}</section>
          ) : (
            empty && <div className={styles.empty}>{empty}</div>
          )}
        </div>
      </section>
    </div>
  );
}
