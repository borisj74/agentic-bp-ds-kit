"use client";
import { cloneElement, isValidElement, useContext, useId, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import type { ListViewProps } from "@/ui/ListView/ListView";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { countSkeletonBlocks, skeletonBarWidth, useBootSkeleton, useFieldSkeleton } from "@/ui/LoadingLine/boot";
import styles from "./ListDetail.module.css";

// The widths a booting split's bars take in the rows fallback, so each side reads as rows rather than one block
// of grey.
const BOOT_PRIMARY = ["60%", "45%", "70%", "52%"];
const BOOT_SECONDARY = ["85%", "70%", "90%", "78%"];
const BOOT_LABEL = ["70%", "55%", "80%", "60%"];
const BOOT_VALUE = ["85%", "60%", "70%", "50%"];

export type ListDetailLayout = "side" | "stacked" | "inline";
export type ListDetailLoadingShape = "content" | "rows";

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
  loadingShape?: ListDetailLoadingShape;
  loadingRows?: number;
  label?: string;
}

// A list with the picked record beside it: the kit ListView on one side, the record in a pane on the other.
// Wide, both show at once and picking a row swaps the pane. Narrow, the pane covers the list and Back returns to
// it. Stacked puts the record under the whole list; inline hands it to the ListView to show under its row.
// A blueprint only: the screen keeps which record is open and passes it in.
export function ListDetail({
  list, detail, open = false, title, actions, empty, onBack, backLabel = "Back to list", layout = "side",
  loading = false, loadingShape = "content", loadingRows = 8, label,
}: ListDetailProps) {
  // The skeleton follows the frame's boot sequence; on its own, outside a booting frame, it draws at once.
  const { skeleton: own } = useBootSkeleton(loading);
  // Inside a booting AppShell the pattern boots with the frame, so a screen says loading once, at the top, and
  // the split follows the frame's sequence instead of standing live under the line.
  const inFrame = useFieldSkeleton();
  const booting = own || inFrame;
  // content: the list it was given and the record that is open draw themselves as bars, so both sides land in
  // the shape their bars held.
  const content = booting && loadingShape === "content";
  const shown = !booting && open && detail != null;
  const headId = useId();
  // What the page around the split had set — the columns, where the labels sit — so the fields draw their bars
  // on the same lines they will stand on when they arrive.
  const outer = useContext(FormLayoutContext);

  // A real piece drawn as bars: it stays in the tree, each part of it drawing itself where it will stand, out of
  // the keyboard's reach and out of the reading order. The one status below says what is loading.
  const asBars = (node: ReactNode, className?: string) => (
    <FormLayoutContext.Provider value={{ ...outer, loading: true }}>
      <div className={className} inert aria-hidden="true">{node}</div>
    </FormLayoutContext.Provider>
  );

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

  // The open record's own header while it boots: the title bar as long as the title will be, a block for each
  // action, and the narrow layout's Back where it will be. The header is the pattern's own chrome, so it draws
  // its bars itself; everything under it is the record's own content, drawn by the record.
  const bootHead = (title || actions || (onBack && layout === "side")) && (
    <header className={styles.head}>
      {onBack && layout === "side" && (
        <span className={styles.back}>
          <Skeleton shape="rect" animation="pulse" width="var(--control-small)" height="var(--control-small)" label="" />
        </span>
      )}
      {title && <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(title)} height="var(--font-size-large)" label="" />}
      {actions && (
        <div className={styles.actions}>
          {Array.from({ length: countSkeletonBlocks(actions) }, (_, i) => (
            <Skeleton key={i} shape="rect" animation="pulse" width="var(--toolbar-action-skeleton)" height="var(--control-small)" label="" />
          ))}
        </div>
      )}
    </header>
  );
  // The pane in the content shape: the record's header as bars, then the record itself drawing its Sections and
  // its rows. With nothing open there is no record to follow, so the pane holds its space and waits for the
  // EmptyState; a screen that wants bars there asks for the rows fallback.
  const bootRecordContent = (
    <div className={styles.record}>
      {bootHead}
      {detail != null && asBars(detail, styles.body)}
    </div>
  );

  // The rows fallback: the split keeps its two columns, with a fixed count of rows on one side and label and
  // value rows on the other. No artboard covers this screen; it is the list and the record skeletons from
  // screens 03 and 56, side by side in this pattern's own split.
  const bootRows = (
    <ul className={styles.bootList}>
      {Array.from({ length: Math.max(1, loadingRows) }, (_, i) => (
        <li key={i} className={styles.bootRow}>
          <Skeleton shape="circle" size="sm" animation="pulse" label="" />
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

  // What stands on the list's side while the split boots, and what stands in the pane.
  const listSide = booting ? (content ? asBars(list) : bootRows) : list;
  // Said once for the whole split, however many bars the two sides come to.
  const status = booting && <span className={styles.srOnly} role="status">Loading {label ?? "list"}</span>;

  if (layout === "inline") {
    const inRow = isValidElement<ListViewProps>(list) ? cloneElement(list, { detail: shown ? <div className={styles.inline}>{record}</div> : undefined }) : list;
    return (
      <div className={styles.frame}>
        <section className={[styles.split, styles.single].join(" ")} aria-labelledby={label ? headId : undefined}>
          {label && <h2 id={headId} className={styles.srOnly}>{label}</h2>}
          {status}
          {/* Inline, the record opens under its row, so a booting inline split is the list's own rows. */}
          <div className={styles.list}>{booting ? listSide : inRow}</div>
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
        {status}
        <div className={styles.list}>{listSide}</div>
        <div className={styles.pane}>
          {booting ? (content ? bootRecordContent : bootRecord) : shown ? (
            <section className={styles.record} aria-label={title}>{record}</section>
          ) : (
            empty && <div className={styles.empty}>{empty}</div>
          )}
        </div>
      </section>
    </div>
  );
}
