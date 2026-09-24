"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useFloating, useInBrowser, type FloatingSide } from "./useFloating";
import styles from "./Tooltip.module.css";
import { usePortalDensity } from "../Density/Density";

export type TooltipPlacement = FloatingSide;

export interface TooltipProps {
  content: string;
  placement?: TooltipPlacement;
  delay?: number;
  open?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

const GAP = 8; // px between trigger and bubble; the arrow sits in it

// Adds `id` to the trigger's aria-describedby after mount, keeping any ids it already has.
// Done on the DOM rather than with cloneElement, because a child passed from a server component
// can arrive as a lazy reference with no props to clone. Shared by Tooltip and HelpPopover.
export function useDescribedBy(wrapRef: RefObject<HTMLElement | null>, id: string, off: boolean) {
  useLayoutEffect(() => {
    const el = wrapRef.current?.firstElementChild;
    if (!el || off) return;
    const ids = (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
    if (!ids.includes(id)) el.setAttribute("aria-describedby", [...ids, id].join(" "));
    return () => {
      const rest = (el.getAttribute("aria-describedby") ?? "").split(" ").filter((x) => x && x !== id);
      if (rest.length) el.setAttribute("aria-describedby", rest.join(" "));
      else el.removeAttribute("aria-describedby");
    };
  }, [wrapRef, id, off]);
}

export function Tooltip({ content, placement = "top", delay = 150, open: openProp, disabled = false, children }: TooltipProps) {
  const id = useId();
  const density = usePortalDensity(); // the portalled popup keeps the surrounding Density
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

  // Fixed and portaled, so cards, tables and Forms never clip it.
  useFloating(open, wrapRef, bubbleRef, placement, GAP, content);
  // The text is always in the page as the trigger's description, so screen readers get it without the bubble.
  useDescribedBy(wrapRef, id, disabled);

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

  return (
    <span
      ref={wrapRef} className={styles.wrap}
      onPointerEnter={() => show(delay)} onPointerLeave={() => hide()}
      onFocus={onFocus} onBlur={() => hide(0)} onKeyDown={onKeyDown}
    >
      {children}
      <span id={id} role="tooltip" className={styles.srOnly}>{content}</span>
      {open && createPortal(
        <div ref={bubbleRef} data-density={density} className={styles.bubble} aria-hidden="true" onPointerEnter={clear} onPointerLeave={() => hide()}>
          {content}
          <span className={styles.arrow} />
        </div>,
        document.body,
      )}
    </span>
  );
}
