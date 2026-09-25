"use client";
import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../Button/Button";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./Carousel.module.css";

export type CarouselOrientation = "horizontal" | "vertical";
export type CarouselAlignment = "start" | "center";
export type CarouselSlidesPerView = 1 | 2 | 3 | 4;

export interface CarouselProps {
  items: ReactNode[];
  orientation?: CarouselOrientation;
  slidesPerView?: CarouselSlidesPerView;
  alignment?: CarouselAlignment;
  loop?: boolean;
  showControls?: boolean;
  showIndex?: boolean;
  onIndexChange?: (index: number) => void;
  label?: string;
}

const PER = { 1: "", 2: styles.per2, 3: styles.per3, 4: styles.per4 };

// Reference kit carousel. The track is a native scroll-snap scroller, so swipe, trackpad and focus scrolling all work;
// the buttons and arrow keys scroll it to the next page. A page is a scroll position where a slide lines up
// (start or center), trimmed at the ends so the track never shows empty space.
export function Carousel({
  items, orientation = "horizontal", slidesPerView = 1, alignment = "start", loop = false,
  showControls = true, showIndex = false, onIndexChange, label = "Carousel",
}: CarouselProps) {
  const vertical = orientation === "vertical";
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[]>([0]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  // While a button or key scrolls to a page, the scroll passes other pages; only the target counts.
  const aim = useRef<number | null>(null);
  const onIndexChangeRef = useRef(onIndexChange);
  useLayoutEffect(() => { onIndexChangeRef.current = onIndexChange; });

  const pick = useCallback((next: number) => {
    if (next === indexRef.current) return;
    indexRef.current = next;
    setIndex(next);
    onIndexChangeRef.current?.(next);
  }, []);

  const nearest = useCallback((list: number[]) => {
    const v = viewportRef.current;
    if (!v) return 0;
    const at = vertical ? v.scrollTop : v.scrollLeft;
    let best = 0;
    list.forEach((p, i) => { if (Math.abs(p - at) < Math.abs(list[best] - at)) best = i; });
    return best;
  }, [vertical]);

  // Pages come from where each slide sits, so they follow slidesPerView, alignment and the carousel's width.
  const measure = useCallback(() => {
    const v = viewportRef.current;
    const track = v?.firstElementChild;
    if (!v || !track) return;
    const size = vertical ? v.clientHeight : v.clientWidth;
    const max = vertical ? v.scrollHeight - v.clientHeight : v.scrollWidth - v.clientWidth;
    const list: number[] = [];
    for (const el of Array.from(track.children) as HTMLElement[]) {
      const start = vertical ? el.offsetTop : el.offsetLeft;
      const length = vertical ? el.offsetHeight : el.offsetWidth;
      const target = Math.round(Math.min(Math.max(alignment === "center" ? start - (size - length) / 2 : start, 0), max));
      if (!list.length || target - list[list.length - 1] > 1) list.push(target);
    }
    const next = list.length ? list : [0];
    setPages(next);
    pick(Math.min(nearest(next), next.length - 1));
  }, [vertical, alignment, nearest, pick]);

  useLayoutEffect(() => {
    measure();
    const v = viewportRef.current;
    if (!v || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    return () => ro.disconnect();
  }, [measure, items.length, slidesPerView]);

  const onScroll = () => {
    const n = nearest(pages);
    if (aim.current !== null) {
      if (n === aim.current) aim.current = null;
      return;
    }
    pick(n);
  };

  const go = (to: number) => {
    const v = viewportRef.current;
    const last = pages.length - 1;
    if (!v || last < 1) return;
    const target = loop ? (to + pages.length) % pages.length : Math.min(Math.max(to, 0), last);
    if (target === indexRef.current) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    aim.current = target;
    pick(target);
    v.scrollTo({ [vertical ? "top" : "left"]: pages[target], behavior: smooth ? "smooth" : "auto" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    const forward = vertical ? "ArrowDown" : "ArrowRight";
    if (e.key !== back && e.key !== forward) return;
    e.preventDefault();
    go(index + (e.key === forward ? 1 : -1));
  };

  const last = pages.length - 1;
  const canPrev = last > 0 && (loop || index > 0);
  const canNext = last > 0 && (loop || index < last);
  const control = (dir: "prev" | "next") => {
    const name = dir === "prev" ? "Previous slide" : "Next slide";
    const icon = vertical ? (dir === "prev" ? "expand_less" : "expand_more") : dir === "prev" ? "chevron_left" : "chevron_right";
    return (
      <span className={styles.control}>
        <Tooltip content={name} position={vertical ? (dir === "prev" ? "above" : "below") : dir === "prev" ? "left" : "right"}>
          <Button variant="secondary" size="sm" iconOnly iconStart={icon} disabled={dir === "prev" ? !canPrev : !canNext} onClick={() => go(index + (dir === "prev" ? -1 : 1))}>
            {name}
          </Button>
        </Tooltip>
      </span>
    );
  };

  return (
    <div
      className={[styles.carousel, styles[orientation], PER[slidesPerView], alignment === "center" ? styles.center : ""].join(" ")}
      role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0} onKeyDown={onKeyDown}
    >
      <div className={styles.stage}>
        {showControls && control("prev")}
        <div
          ref={viewportRef} className={styles.viewport} onScroll={onScroll}
          onWheel={() => { aim.current = null; }} onTouchStart={() => { aim.current = null; }}
        >
          <div className={styles.track}>
            {items.map((item, i) => (
              <div key={i} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`Slide ${i + 1} of ${items.length}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
        {showControls && control("next")}
      </div>
      {showIndex && <p className={styles.index} aria-live="polite">{`Slide ${index + 1} of ${pages.length}`}</p>}
    </div>
  );
}
