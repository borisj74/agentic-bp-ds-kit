"use client";
import { useEffect, useRef } from "react";

// Plumbing shared by the patterns that hold a page header, not a kit piece: it draws nothing and has no
// contract. Put the ref on a hair of a marker above the header; the marker leaving the top of the scroll box
// is what says the top of the page has scrolled away, so the screen can swap the kit PageHeader to its own
// compact bar. Measuring is not state: the boolean goes straight to the screen, which decides what to do
// with it, so the pattern around it still keeps none.
export function useStickMark(onChange?: (stuck: boolean) => void) {
  const mark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = mark.current;
    if (!line || !onChange) return;
    // The scroll box is the page around us, not the window.
    let box: HTMLElement | null = line.parentElement;
    while (box) {
      const flow = getComputedStyle(box).overflowY;
      if (flow === "auto" || flow === "scroll") break;
      box = box.parentElement;
    }
    const eye = new IntersectionObserver(([seen]) => onChange(!seen.isIntersecting), { root: box });
    eye.observe(line);
    return () => eye.disconnect();
  }, [onChange]);

  return mark;
}
