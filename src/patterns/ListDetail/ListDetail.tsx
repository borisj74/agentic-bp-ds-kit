"use client";
import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import type { ListViewProps } from "@/ui/ListView/ListView";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton } from "@/ui/LoadingLine/boot";
import styles from "./ListDetail.module.css";

// The widths a booting split's bars take, so each side reads as rows rather than one block of grey.
const BOOT_PRIMARY = ["60%", "45%", "70%", "52%"];
const BOOT_SECONDARY = ["85%", "70%", "90%", "78%"];
const BOOT_LABEL = ["70%", "55%", "80%", "60%"];
const BOOT_VALUE = ["85%", "60%", "70%", "50%"];

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
  loading?: boolean;
  loadingRows?: number;
  label?: string;
}

// A list with the picked record beside it: the kit ListView on one side, the record in a pane on the other.
// Wide, both show at once and picking a row swaps the pane. Narrow, the pane covers the list and Back returns to
// it. Stacked puts the record under the whole list; inline hands it to the ListView to show under its row.
// A blueprint only: the screen keeps which record is open and passes it in.
export function ListDetail({
  list, detail, open = false, title, actions, empty, onBack, backLabel = "Back to list", layout = "side",
  loading = false, loadingRows = 8, label,
}: ListDetailProps) {
  // The skeleton follows the frame's boot sequence; on its own, outside a booting frame, it draws at once.
  const { skeleton: booting } = useBootSkeleton(loading);
  const shown = !booting && open && detail != null;
  const headId = useId();
  // The record's header and body. Beside or under the list it is its own region; under a row the ListView names it.
  const record = (
    <>
      {(title || actions || (onBack && layout === "side")) && (
        <header className={styles.head}>
          {/* Only the narrow side layout needs a way back; otherwise the list is right there. */}
          {onBack && layout === "side" && (
            <span className={styles.back}>
              <Button emphasis="minimal" size="md" iconOnly iconStart="arrow_back" onClick={onBack}>{backLabel}</Button>
            </span>
          )}
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.body}>{detail}</div>
    </>
  );

  // Booting: the split keeps its two columns, with the rows the list will have on one side and the record's
  // label and value rows on the other. Both sides are the same shapes the real pieces land in, so the frame
  // does not move when they arrive. No artboard covers this screen; it is the list and the record skeletons
  // from screens 03 and 56, side by side in this pattern's own split.
  const bootRows = (
    <ul className={styles.bootList}>
      {Array.from({ length: Math.max(1, loadingRows) }, (_, i) => (
        <li key={i} className={styles.bootRow}>
          <Skeleton shape="circle" size="sm" animation="pulse" label={i === 0 ? `Loading ${label ?? "list"}` : ""} />
          <div className={styles.bootLines}>
            <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_PRIMARY[i % BOOT_PRIMARY.length]} label="" />
            <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_SECONDARY[i % BOOT_SECONDARY.length]} label="" />
          </div>
        </li>
      ))}
    </ul>
  );
  const bootRecord = (
    <div className={styles.bootRecord}>
      <div className={styles.bootHead}>
        <Skeleton shape="rect" animation="pulse" height="var(--font-size-large)" width="var(--skeleton-title)" label="" />
      </div>
      <div className={styles.bootBody}>
        {Array.from({ length: Math.max(1, loadingRows) }, (_, i) => (
          <div key={i} className={styles.bootField}>
            <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_LABEL[i % BOOT_LABEL.length]} label="" />
            <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_VALUE[i % BOOT_VALUE.length]} label="" />
          </div>
        ))}
      </div>
    </div>
  );

  if (layout === "inline") {
    const inRow = isValidElement<ListViewProps>(list) ? cloneElement(list, { detail: shown ? <div className={styles.inline}>{record}</div> : undefined }) : list;
    return (
      <div className={styles.frame}>
        <section className={[styles.split, styles.single].join(" ")} aria-labelledby={label ? headId : undefined}>
          {label && <h2 id={headId} className={styles.srOnly}>{label}</h2>}
          <div className={styles.list}>{booting ? bootRows : inRow}</div>
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
        <div className={styles.list}>{booting ? bootRows : list}</div>
        <div className={styles.pane}>
          {booting ? bootRecord : shown ? (
            <section className={styles.record} aria-label={title}>{record}</section>
          ) : (
            empty && <div className={styles.empty}>{empty}</div>
          )}
        </div>
      </section>
    </div>
  );
}
