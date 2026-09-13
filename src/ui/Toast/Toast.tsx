"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { useInBrowser } from "../Tooltip/useFloating";
import styles from "./Toast.module.css";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number | null;
}

const ICONS: Record<ToastTone, string> = { info: "info", success: "check_circle", warning: "warning", danger: "error" };

// Every Toast portals into one fixed stack at the bottom right, so several stack without a provider. The stack is
// the live region: it is in the page before any card arrives, so screen readers announce each card that joins it.
function stack() {
  let el = document.getElementById("kit-toasts");
  if (!el) {
    el = document.createElement("div");
    el.id = "kit-toasts";
    el.className = styles.stack;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}

// A white card with a countdown bar on top, the tone's icon, title, description, one action and a close button.
// The card mounts on each open, so the countdown and the pause always start fresh.
export function Toast(props: ToastProps) {
  const inBrowser = useInBrowser();
  if (!props.open || !inBrowser) return null;
  return createPortal(<ToastCard {...props} />, stack());
}

function ToastCard({ onClose, title, description, tone = "info", actionLabel, onAction, duration = 5000 }: ToastProps) {
  const titleId = useId();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration ?? 0);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; });

  // Counts down what is left; pausing stops the clock and keeps the rest for later.
  useEffect(() => {
    if (duration == null || paused) return;
    const started = Date.now();
    const timer = window.setTimeout(() => onCloseRef.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(remaining.current - (Date.now() - started), 0);
    };
  }, [paused, duration]);

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
  };

  return (
    <div
      className={[styles.toast, styles[tone]].join(" ")} role={tone === "danger" ? "alert" : undefined} aria-labelledby={tone === "danger" ? titleId : undefined}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={onBlur}
    >
      {duration != null && (
        <span className={styles.bar} aria-hidden="true">
          <span className={[styles.fill, paused ? styles.paused : ""].join(" ")} style={{ "--toast-duration": `${duration}ms` } as CSSProperties} />
        </span>
      )}
      <div className={styles.body}>
        <span className={styles.icon} aria-hidden="true"><Icon name={ICONS[tone]} tone={tone} /></span>
        <div className={styles.content}>
          <p id={titleId} className={styles.title}>{title}</p>
          {description && <p className={styles.description}>{description}</p>}
          {actionLabel && (
            <button type="button" className={styles.action} onClick={() => { onAction?.(); onClose(); }}>{actionLabel}</button>
          )}
        </div>
        <Button variant="tertiary" size="sm" iconOnly iconStart="close" onClick={onClose}>Dismiss</Button>
      </div>
    </div>
  );
}
