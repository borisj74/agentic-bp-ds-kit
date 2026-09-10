"use client";
import {
  cloneElement, useEffect, useId, useRef, useState,
  type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { useFloating, useInBrowser, type FloatingSide } from "../Tooltip/useFloating";
import styles from "./HelpPopover.module.css";

export type HelpPopoverPlacement = FloatingSide;

export interface HelpPopoverProps {
  title?: string;
  content: string;
  placement?: HelpPopoverPlacement;
  delay?: number;
  open?: boolean;
  disabled?: boolean;
  children: ReactElement<{ "aria-describedby"?: string }>;
}

const GAP = 14; // px between trigger and panel; the 12px arrow sits in it

export function HelpPopover({ title, content, placement = "bottom", delay = 150, open: openProp, disabled = false, children }: HelpPopoverProps) {
  const id = useId();
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

  useFloating(open, wrapRef, panelRef, placement, GAP, `${title ?? ""}${content}`);

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

  // The text is always in the page as the trigger's description, so screen readers get it without the panel.
  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ");
  return (
    <span
      ref={wrapRef} className={styles.wrap}
      onPointerEnter={() => show(delay)} onPointerLeave={() => hide()}
      onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} onClick={onClick}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span id={id} className={styles.srOnly}>{title ? `${title}: ${content}` : content}</span>
      {open && createPortal(
        <div
          ref={panelRef} className={styles.panel} data-header={title ? "" : undefined} aria-hidden="true"
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
