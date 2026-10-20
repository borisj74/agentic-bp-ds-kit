"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

// Plumbing shared by the patterns that pin a band at the top of the page — a list's bar over its column names,
// a record's bar over the rows in its tab. It draws nothing and has no contract of its own.
//
// It does three things, all of them measurement rather than state, so the pattern around it still keeps none:
//   - says how far down a Table's column names stop, as --table-stick-top: the bar's own offset plus however
//     tall the bar is right now, so it keeps up when a filter bar opens and makes the bar taller;
//   - marks the root with data-band as soon as the bar stops travelling, which is when a held header gives up
//     its own line;
//   - marks the shadow with data-stuck once a row has actually gone under the names, which is when the lift
//     belongs — any earlier and the shadow has not reached its own offset and would draw across the band.
// names: whether the column names of a Table belong to the band. In a list they do — the bar sits straight on
// them and the two hold as one, so the lift waits for a row to go under the names. In a record the band is the
// bar alone and a related list sits far below it, so the lift follows the bar.
export function useStickyBand(deps: unknown[] = [], { names = true }: { names?: boolean } = {}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const [barHeight, setBarHeight] = useState(0);
  const [headHeight, setHeadHeight] = useState(0);

  // The bar and the column names are measured, not assumed: either can change height on its own.
  useEffect(() => {
    const bar = barRef.current;
    const head = rootRef.current?.querySelector("thead");
    if (!bar && !head) return;
    const measure = () => {
      setBarHeight(bar?.getBoundingClientRect().height ?? 0);
      setHeadHeight(names ? head?.getBoundingClientRect().height ?? 0 : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (bar) ro.observe(bar);
    if (head) ro.observe(head);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // The scroll box is the page around us, not the window.
    let box: HTMLElement | null = root.parentElement;
    while (box) {
      const flow = getComputedStyle(box).overflowY;
      if (flow === "auto" || flow === "scroll") break;
      box = box.parentElement;
    }
    // Where the bar comes to rest: a sticky box stops inside the scroller's padding box, not its border box,
    // so it is the page's own top inset plus the bar's offset.
    const barPinned = () => {
      const bar = barRef.current;
      if (!bar || !box) return false;
      const rest = parseFloat(getComputedStyle(box).paddingTop || "0") + parseFloat(getComputedStyle(bar).top || "0");
      return bar.getBoundingClientRect().top - box.getBoundingClientRect().top <= rest + 0.5;
    };
    let waiting = false;
    const read = () => {
      waiting = false;
      const pinned = barPinned();
      if (pinned) root.setAttribute("data-band", "");
      else root.removeAttribute("data-band");

      // The cells are what hold still, not the thead around them, so the test is a header cell against its
      // table: the gap between the two is how far the names have been pushed down. With no table the bar is
      // the whole band, so the band being pinned is all there is to go on.
      const cell = names ? root.querySelector("thead th, thead td") : null;
      const table = names ? root.querySelector("table") : null;
      const stuck = cell && table
        ? cell.getBoundingClientRect().top - table.getBoundingClientRect().top > 0.5
        : pinned;
      const shadow = shadowRef.current;
      if (!shadow) return;
      if (stuck) shadow.setAttribute("data-stuck", "");
      else shadow.removeAttribute("data-stuck");
    };
    const onScroll = () => { if (!waiting) { waiting = true; requestAnimationFrame(read); } };
    read();
    const target: HTMLElement | Window = box ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Handed to the root, so the Table inside knows where to stop and the shadow knows where to sit.
  const style = useCallback((): CSSProperties => ({
    "--table-stick-top": `calc(var(--page-header-height-sticky) - var(--layout-margin-md) + ${barHeight}px)`,
    "--table-head-height": `${headHeight}px`,
  } as CSSProperties), [barHeight, headHeight]);

  return { rootRef, barRef, shadowRef, style: style() };
}
