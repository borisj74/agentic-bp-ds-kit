"use client";
import {
  useEffect, useId, useRef, useState,
  type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useDescribedBy } from "../Tooltip/Tooltip";
import { SIDE, useFloating, useInBrowser, type FloatingPosition } from "../Tooltip/useFloating";
import styles from "./HelpPopover.module.css";
import { usePortalDensity } from "../Density/Density";

export type HelpPopoverPosition = FloatingPosition;

export interface HelpPopoverProps {
  title?: string;
  content: string;
  position?: HelpPopoverPosition;
  delay?: number;
  open?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

const GAP = 14; // px between trigger and panel; the 12px arrow sits in it

export function HelpPopover({ title, content, position = "below", delay = 150, open: openProp, disabled = false, children }: HelpPopoverProps) {
  const id = useId();
  const density = usePortalDensity(); // the portalled popup keeps the surrounding Density
  const wrapRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [shown, setShown] = useState(false); // hover or keyboard focus
  const [pinned, setPinned] = useState(false); // clicked or tapped open
  const inBrowser = useInBrowser();
  const open = inBrowser && !disabled && (openProp ?? (pinned || shown));

  const clear = () => window.clearTimeout(timer.current);
  const show = (wait: number) => {
    clear();
    if (wait > 0) timer.current = window.setTimeout(() => setShown(true), wait);
    else setShown(true);
  };
  // A short hide delay lets the pointer cross the gap onto the panel, so people can hover it to read.
  const hide = (wait = 100) => {
    clear();
    timer.current = window.setTimeout(() => setShown(false), wait);
  };
  const close = () => {
    clear();
    setPinned(false);
    setShown(false);
  };
  useEffect(() => clear, []);

  useFloating(open, wrapRef, panelRef, SIDE[position], GAP, `${title ?? ""}${content}`);
  // The title and text are always in the page as the trigger's description, so screen readers get them without the panel.
  useDescribedBy(wrapRef, id, disabled);

  // A click or tap anywhere else closes a pinned panel.
  useEffect(() => {
    if (!pinned) return;
    const away = (e: PointerEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setPinned(false);
      setShown(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [pinned]);

  // Clicking the trigger pins it open (this is how touch works); clicking again closes it.
  // Clicks inside the portaled panel bubble here too, so only the trigger counts.
  const onClick = (e: MouseEvent) => {
    if (!wrapRef.current?.firstElementChild?.contains(e.target as Node)) return;
    if (pinned) close();
    else setPinned(true);
  };
  // Keyboard focus shows it at once; a mouse click pins instead.
  const onFocus = (e: FocusEvent) => {
    if ((e.target as HTMLElement).matches?.(":focus-visible")) show(0);
  };
  // Moving focus elsewhere closes it. Pressing inside the panel moves focus nowhere, so reading it keeps it open.
  const onBlur = (e: FocusEvent) => {
    if (e.relatedTarget && !panelRef.current?.contains(e.relatedTarget as Node)) close();
    else hide(0);
  };
  // Escape closes it only. preventDefault tells an enclosing Modal to stay open.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !open || openProp !== undefined) return;
    e.preventDefault();
    close();
  };

  if (disabled) return children;

  return (
    <span
      ref={wrapRef} className={styles.wrap}
      onPointerEnter={() => show(delay)} onPointerLeave={() => hide()}
      onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} onClick={onClick}
    >
      {children}
      <span id={id} className={styles.srOnly}>{title ? `${title}: ${content}` : content}</span>
      {open && createPortal(
        <div
          ref={panelRef} data-density={density} className={styles.panel} data-header={title ? "" : undefined} aria-hidden="true"
          onPointerEnter={clear} onPointerLeave={() => hide()}
        >
          <span className={styles.arrow} />
          {title && <div className={styles.header}><p className={styles.title}>{title}</p></div>}
          <p className={styles.body}>{content}</p>
        </div>,
        document.body,
      )}
    </span>
  );
}
