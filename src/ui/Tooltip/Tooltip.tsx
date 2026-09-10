"use client";
import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent, type ReactElement } from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: string;
  placement?: TooltipPlacement;
  delay?: number;
  open?: boolean;
  disabled?: boolean;
  children: ReactElement<{ "aria-describedby"?: string }>;
}

const GAP = 8; // px between trigger and bubble; the arrow sits in it
const EDGE = 8; // px kept clear of the window edge
const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = { top: "bottom", bottom: "top", left: "right", right: "left" };
// false on the server and during hydration, true after: the bubble portal only renders in the browser.
const noSubscribe = () => () => {};
const useInBrowser = () => useSyncExternalStore(noSubscribe, () => true, () => false);

export function Tooltip({ content, placement = "top", delay = 150, open: openProp, disabled = false, children }: TooltipProps) {
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [inner, setInner] = useState(false);
  const inBrowser = useInBrowser();
  const open = inBrowser && !disabled && (openProp ?? inner);

  const clear = () => window.clearTimeout(timer.current);
  const show = (wait: number) => {
    clear();
    if (wait > 0) timer.current = window.setTimeout(() => setInner(true), wait);
    else setInner(true);
  };
  // A short hide delay lets the pointer cross the gap onto the bubble, so people can hover it to read.
  const hide = (wait = 100) => {
    clear();
    timer.current = window.setTimeout(() => setInner(false), wait);
  };
  useEffect(() => clear, []);

  // Fixed and portaled, so cards, tables and Forms never clip it. Flip when the preferred side has no room,
  // keep it inside the window, and keep the arrow on the trigger's middle.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = wrapRef.current?.firstElementChild ?? wrapRef.current;
      const bubble = bubbleRef.current;
      if (!trigger || !bubble) return;
      const r = trigger.getBoundingClientRect();
      const w = bubble.offsetWidth;
      const h = bubble.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const fits = (p: TooltipPlacement) =>
        p === "top" ? r.top - GAP - h >= EDGE : p === "bottom" ? r.bottom + GAP + h <= vh - EDGE : p === "left" ? r.left - GAP - w >= EDGE : r.right + GAP + w <= vw - EDGE;
      const side = fits(placement) || !fits(OPPOSITE[placement]) ? placement : OPPOSITE[placement];
      const vertical = side === "top" || side === "bottom";
      const clamp = (v: number, size: number, max: number) => Math.min(Math.max(EDGE, v), max - size - EDGE);
      const left = vertical ? clamp(r.left + r.width / 2 - w / 2, w, vw) : side === "left" ? r.left - GAP - w : r.right + GAP;
      const top = vertical ? (side === "top" ? r.top - GAP - h : r.bottom + GAP) : clamp(r.top + r.height / 2 - h / 2, h, vh);
      bubble.style.left = `${left}px`;
      bubble.style.top = `${top}px`;
      bubble.style.setProperty("--arrow", `${vertical ? r.left + r.width / 2 - left : r.top + r.height / 2 - top}px`);
      bubble.dataset.side = side;
      bubble.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, placement, content]);

  // Keyboard focus shows it at once; a mouse click does not, so it never sticks after clicking.
  const onFocus = (e: FocusEvent) => {
    if ((e.target as HTMLElement).matches?.(":focus-visible")) show(0);
  };
  // Escape closes the tooltip only. preventDefault tells an enclosing Modal to stay open.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !open || openProp !== undefined) return;
    e.preventDefault();
    clear();
    setInner(false);
  };

  if (disabled) return children;

  // The text is always in the page as the trigger's description, so screen readers get it without the bubble.
  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ");
  return (
    <span
      ref={wrapRef} className={styles.wrap}
      onPointerEnter={() => show(delay)} onPointerLeave={() => hide()}
      onFocus={onFocus} onBlur={() => hide(0)} onKeyDown={onKeyDown}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span id={id} role="tooltip" className={styles.srOnly}>{content}</span>
      {open && createPortal(
        <div ref={bubbleRef} className={styles.bubble} aria-hidden="true" onPointerEnter={clear} onPointerLeave={() => hide()}>
          {content}
          <span className={styles.arrow} />
        </div>,
        document.body,
      )}
    </span>
  );
}
