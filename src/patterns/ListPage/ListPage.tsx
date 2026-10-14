"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Callout } from "@/ui/Callout/Callout";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import styles from "./ListPage.module.css";

export type ListPageState = "ready" | "loading" | "empty" | "error";

export interface ListPageProps {
  children: ReactNode;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  bulk?: ReactNode;
  state?: ListPageState;
  empty?: ReactNode;
  error?: string;
  onRetry?: () => void;
  loadingRows?: number;
  label?: string;
}

// The list screen: the kit Toolbar over the rows, the kit Pagination under them, and the kit EmptyState,
// Skeleton or Callout standing in for the rows while there are none. A blueprint only: it composes kit
// pieces and keeps no state of its own. It sits in the AppShell page, which owns the page padding.
export function ListPage({
  children, toolbar, pagination, bulk, state = "ready", empty, error, onRetry, loadingRows = 6, label,
}: ListPageProps) {
  const rows = state === "ready";
  // How far down the page the column names stop: under the pinned bar, whatever height it is. Measuring is not
  // state the screen owns — it is the bar's own size — so the pattern keeps it and hands it to the table as a
  // variable. It keeps up when the filter bar opens and the bar grows.
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  const [headHeight, setHeadHeight] = useState(0);
  useEffect(() => {
    const bar = barRef.current;
    const head = listRef.current?.querySelector("thead");
    if (!bar) return;
    const measure = () => {
      setBarHeight(bar.getBoundingClientRect().height);
      setHeadHeight(head?.getBoundingClientRect().height ?? 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    if (head) ro.observe(head);
    return () => ro.disconnect();
  }, [bulk, toolbar, children]);

  // The scroll shadow draws only while the band is actually pinned: the column names have reached the underside
  // of the bar and the rows are going under them. Reading it off the boxes keeps it true whatever is pinned above,
  // without the screen having to hand anything down.
  useEffect(() => {
    const list = listRef.current;
    const shadow = shadowRef.current;
    if (!list || !shadow) return;
    let box: HTMLElement | null = list.parentElement;
    while (box) {
      const flow = getComputedStyle(box).overflowY;
      if (flow === "auto" || flow === "scroll") break;
      box = box.parentElement;
    }
    let waiting = false;
    const read = () => {
      waiting = false;
      // The lift is drawn only once the band has actually locked: until then the shadow has not reached its own
      // stick offset and would draw across the middle of the band instead of under it.
      // With a table, the test is a header cell against its table: the cells are what hold still, not the thead
      // around them, and the gap between the two is exactly how far the names have been pushed down, so the
      // first pixel of it is the first row going under.
      const cell = list.querySelector("thead th, thead td");
      const table = list.querySelector("table");
      // Without one — a list of cards, or rows that carry no header — the bar is the whole band, so the test is
      // the bar against its own stick offset: level with it means it is holding rather than still travelling.
      const bar = barRef.current;
      const stuck = cell && table
        ? cell.getBoundingClientRect().top - table.getBoundingClientRect().top > 0.5
        : !!bar && !!box && (() => {
          // A sticky box stops inside the scroller's padding box, not its border box, so where the bar comes to
          // rest is the page's own top inset plus the bar's offset.
          const boxStyle = getComputedStyle(box);
          const rest = parseFloat(boxStyle.paddingTop || "0") + parseFloat(getComputedStyle(bar).top || "0");
          return bar.getBoundingClientRect().top - box.getBoundingClientRect().top <= rest + 0.5;
        })();
      if (stuck) shadow.setAttribute("data-stuck", "");
      else shadow.removeAttribute("data-stuck");
    };
    const onScroll = () => { if (!waiting) { waiting = true; requestAnimationFrame(read); } };
    read();
    const target: HTMLElement | Window = box ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [children, state]);

  return (
    <section
      ref={listRef}
      className={styles.list} aria-label={label ?? "List"} aria-busy={state === "loading" || undefined}
      style={{
        "--table-stick-top": `calc(var(--page-header-height-sticky) - var(--layout-margin-md) + ${barHeight}px)`,
        "--table-head-height": `${headHeight}px`,
      } as CSSProperties}
    >
      {/* While rows are ticked, what can be done to them takes the bar's place. */}
      {bulk ? <div ref={barRef} className={styles.bulk}>{bulk}</div> : toolbar && <div ref={barRef} className={styles.bar}>{toolbar}</div>}
      {/* The scroll shadow under the pinned band, which the bar and the table cannot cast themselves: they keep
          the page's side padding and this reaches the page edges. */}
      <div ref={shadowRef} aria-hidden="true" className={styles.scrollShadow} />
      {/* The rows and their pages are one block: the page bar is the table's footer, flush under it. */}
      <div className={styles.body}>
        {rows && children}
        {state === "loading" && (
          // Lines in the shape of the rows, so the page keeps its height until they arrive.
          <div className={styles.loading}>
            <Skeleton shape="text" lines={Math.max(1, loadingRows)} label={`Loading ${label ?? "list"}`} />
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
