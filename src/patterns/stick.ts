"use client";
import { useCallback, useLayoutEffect, useRef } from "react";

// Plumbing shared by the patterns that hold a page header, not a kit piece: it draws nothing and has no
// contract. Put the ref on a hair of a marker above the header; the marker leaving the top of the scroll box
// is what says the top of the page has scrolled away, so the screen can swap the kit PageHeader to its own
// compact bar. Measuring is not state: the boolean goes straight to the screen, which decides what to do
// with it, so the pattern around it still keeps none.
// A callback ref, so watching starts whenever the marker mounts, even when sticky turns on later.
export function useStickMark(onChange?: (stuck: boolean) => void) {
  const eye = useRef<IntersectionObserver | null>(null);
  const report = useRef(onChange);
  useLayoutEffect(() => { report.current = onChange; });

  return useCallback((line: HTMLDivElement | null) => {
    eye.current?.disconnect();
    eye.current = null;
    if (!line) return;
    // The scroll box is the page around us, not the window.
    let box: HTMLElement | null = line.parentElement;
    while (box) {
      const flow = getComputedStyle(box).overflowY;
      if (flow === "auto" || flow === "scroll") break;
      box = box.parentElement;
    }
    eye.current = new IntersectionObserver(([seen]) => report.current?.(!seen.isIntersecting), { root: box });
    eye.current.observe(line);
  }, []);
}
