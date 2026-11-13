"use client";
import type { ReactNode } from "react";
import { Callout } from "@/ui/Callout/Callout";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton, useFieldSkeleton } from "@/ui/LoadingLine/boot";
import { useStickyBand } from "../band";
import styles from "./ListPage.module.css";

// The widths the bars take across a booting list in the rows fallback, so the rows read as data rather than a
// block of grey. They cycle by row and column, the way the Cobalt screen's do.
const BOOT_CELL = ["55%", "85%", "70%", "45%", "75%", "60%"];

export type ListPageState = "ready" | "loading" | "empty" | "error";
export type ListPageLoadingShape = "content" | "rows";

export interface ListPageProps {
  children: ReactNode;
  toolbar?: ReactNode;
  // When the rows were read, like Updated 09:45 UTC: one quiet line under the bar.
  meta?: string;
  pagination?: ReactNode;
  bulk?: ReactNode;
  state?: ListPageState;
  empty?: ReactNode;
  error?: string;
  onRetry?: () => void;
  loadingShape?: ListPageLoadingShape;
  loadingRows?: number;
  loadingColumns?: number;
  label?: string;
}

// The list screen: the kit Toolbar over the rows, the kit Pagination under them, and the kit EmptyState,
// Skeleton or Callout standing in for the rows while there are none. A blueprint only: it composes kit
// pieces and keeps no state of its own. It sits in the AppShell page, which owns the page padding.
export function ListPage({
  children, toolbar, meta, pagination, bulk, state = "ready", empty, error, onRetry,
  loadingShape = "content", loadingRows = 12, loadingColumns = 5, label,
}: ListPageProps) {
  // The skeleton follows the frame's boot sequence: held back for the first 200ms, then kept its full 400ms.
  // On its own, outside a booting frame, a loading list still draws it at once.
  const { skeleton: own } = useBootSkeleton(state === "loading");
  // Inside a booting AppShell the page boots with the frame, so a screen says loading once, at the top, and the
  // pattern follows the frame's sequence instead of standing live under the line.
  const inFrame = useFieldSkeleton();
  const booting = own || inFrame;
  const rows = state === "ready";
  // content: the list's own rows draw themselves as bars — the Table's columns, its checkbox cell and its Actions
  // column, or the ListView's rows, or the grid of Cards — so the records land in the shape their bars held.
  const content = booting && loadingShape === "content";
  // The bar over the rows is the band that holds at the top of the page: the shared plumbing measures it,
  // says where a Table's column names stop, and marks the band and its lift as the page scrolls.
  const { rootRef, barRef, shadowRef, style } = useStickyBand([bulk, toolbar, children, state]);

  return (
    <section
      ref={rootRef as React.Ref<HTMLElement>}
      className={styles.list} aria-label={label ?? "List"} aria-busy={state === "loading" || undefined}
      style={style}
    >
      {/* While rows are ticked, what can be done to them takes the bar's place. */}
      {bulk ? <div ref={barRef} className={styles.bulk}>{bulk}</div> : toolbar && <div ref={barRef} className={styles.bar}>{toolbar}</div>}
      {/* The scroll shadow under the pinned band, which the bar and the table cannot cast themselves: they keep
          the page's side padding and this reaches the page edges. */}
      <div ref={shadowRef} aria-hidden="true" data-scroll-shadow="" className={styles.scrollShadow} />
      {/* When the rows were read, once for the whole page, under the bar that refreshes them. The rows and their
          captions never repeat it, and it goes while the bulk bar is up, since nothing is being read then. */}
      {meta && !bulk && <p className={styles.meta}>{meta}</p>}
      {/* The rows and their pages are one block: the page bar is the table's footer, flush under it. */}
      <div className={styles.body}>
        {booting && <span className={styles.srOnly} role="status">Loading {label ?? "list"}</span>}
        {rows && children}
        {content && (
          // Booting, the list's own rows are in the tree as bars, out of reach of the keyboard and out of the
          // reading order; the one status above says what is loading.
          <FormLayoutContext.Provider value={{ loading: true }}>
            <div className={styles.booting} inert aria-hidden="true">{children}</div>
          </FormLayoutContext.Provider>
        )}
        {booting && loadingShape === "rows" && (
          // rows: the fixed grid, for a list that has no rows to follow yet (BP COBALT item 1, screen 03): a 40px
          // row of column names, flush under the bar with the table's own 2px line beneath it, over 44px rows,
          // each ending in the Actions column.
          <div className={styles.loading} style={{ "--boot-columns": Math.max(1, loadingColumns) } as React.CSSProperties}>
            <div className={styles.loadingHead}>
              {Array.from({ length: Math.max(1, loadingColumns) }, (_, c) => (
                <Skeleton key={c} shape="rect" animation="pulse" height="var(--skeleton-cell)" width="var(--skeleton-column-name)" label="" />
              ))}
              <span />
            </div>
            {Array.from({ length: Math.max(1, loadingRows) }, (_, r) => (
              <div key={r} className={styles.loadingRow}>
                {Array.from({ length: Math.max(1, loadingColumns) }, (_, c) => (
                  <Skeleton key={c} shape="rect" animation="pulse" height="var(--skeleton-row-bar)" width={BOOT_CELL[(r + c) % BOOT_CELL.length]} label="" />
                ))}
                <Skeleton shape="rect" animation="pulse" height="var(--skeleton-row-bar)" width="50%" label="" />
              </div>
            ))}
          </div>
        )}
        {state === "empty" && empty && <div className={styles.blank}>{empty}</div>}
        {state === "error" && error && (
          <div className={styles.blank}>
            <Callout intent="danger" actionLabel={onRetry ? "Try again" : undefined} onAction={onRetry}>{error}</Callout>
          </div>
        )}
        {/* The pages go while something else is standing in for the rows. */}
        {rows && pagination}
      </div>
    </section>
  );
}
