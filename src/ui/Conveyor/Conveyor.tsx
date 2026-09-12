"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../Button/Button";
import styles from "./Conveyor.module.css";

export type ConveyorOrientation = "horizontal" | "vertical";

export interface ConveyorProps {
  children: ReactNode;
  orientation?: ConveyorOrientation;
  step?: number;
  label?: string;
}

// Figma conveyor 21130:442 and scoreboard container 29113:10807: an arrow at each end of a row that
// scrolls, with a soft fade where the content runs under the arrow.
export function Conveyor({ children, orientation = "horizontal", step, label = "Content" }: ConveyorProps) {
  const across = orientation === "horizontal";
  const track = useRef<HTMLDivElement>(null);
  const [back, setBack] = useState(false);
  const [forward, setForward] = useState(false);

  const read = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const size = across ? el.clientWidth : el.clientHeight;
    const total = across ? el.scrollWidth : el.scrollHeight;
    // Left to right only: scrollLeft can be negative in right to left pages, so keep it at zero or more.
    const at = Math.max(across ? el.scrollLeft : el.scrollTop, 0);
    setBack(at > 1);
    setForward(at + size < total - 1);
  }, [across]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    read();
    el.addEventListener("scroll", read, { passive: true });
    // The arrows also change when the box or its content is resized.
    const watch = new ResizeObserver(read);
    watch.observe(el);
    for (const child of Array.from(el.children)) watch.observe(child);
    return () => { el.removeEventListener("scroll", read); watch.disconnect(); };
  }, [read]);

  const go = (way: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const size = across ? el.clientWidth : el.clientHeight;
    // A press moves most of a screenful, so the piece at the edge stays in view.
    const by = (step ?? size * 0.8) * way;
    el.scrollBy(across ? { left: by, behavior: "smooth" } : { top: by, behavior: "smooth" });
  };

  const shown = back || forward;
  const arrow = (way: 1 | -1) => {
    const name = across ? (way < 0 ? "chevron_left" : "chevron_right") : way < 0 ? "keyboard_arrow_up" : "keyboard_arrow_down";
    const said = across ? (way < 0 ? "left" : "right") : way < 0 ? "up" : "down";
    return (
      <Button variant="tertiary" iconOnly iconStart={name} disabled={way < 0 ? !back : !forward} onClick={() => go(way)}>
        {`Scroll ${label.toLowerCase()} ${said}`}
      </Button>
    );
  };

  return (
    <div className={[styles.conveyor, styles[orientation]].join(" ")}>
      {shown && (
        <span className={styles.end}>
          {arrow(-1)}
          <span className={[styles.fade, back ? "" : styles.clear].join(" ")} aria-hidden="true" />
        </span>
      )}
      {/* The track is a focus stop, so the row can also be scrolled with the arrow keys. */}
      <div ref={track} className={styles.track} tabIndex={0} role="group" aria-label={label}>{children}</div>
      {shown && (
        <span className={[styles.end, styles.last].join(" ")}>
          <span className={[styles.fade, forward ? "" : styles.clear].join(" ")} aria-hidden="true" />
          {arrow(1)}
        </span>
      )}
    </div>
  );
}
