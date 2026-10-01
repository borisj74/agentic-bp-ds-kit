"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon/Icon";
import { Meter } from "../Meter/Meter";
import { Spinner } from "../Spinner/Spinner";
import { TextLoader } from "../TextLoader/TextLoader";
import { useInBrowser } from "../Tooltip/useFloating";
import styles from "./Toast.module.css";

export type ToastIntent = "info" | "success" | "warning" | "danger";

export interface ToastProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  intent?: ToastIntent;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number | null;
  progress?: number | "indeterminate";
}

const ICONS: Record<ToastIntent, string> = { info: "info", success: "check_circle", warning: "warning", danger: "error" };

// Every Toast portals into one fixed stack, so several stack without a provider: confirmations at the bottom right,
// loading toasts at the top center. Each stack is a live region: it is in the page before any card arrives, so screen
// readers announce each card that joins it.
function stack(loading: boolean) {
  const id = loading ? "kit-toasts-loading" : "kit-toasts";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = [styles.stack, loading ? styles.top : styles.bottom].join(" ");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}

// A white card with a countdown bar on top, the intent's icon, title, description and one action. There is no close
// button: the countdown, the action or Escape closes it.
// The card mounts on each open, so the countdown and the pause always start fresh.
// progress turns on loading mode: a narrower card with a Spinner, the title wave and a thin Meter under the text. It
// never closes itself and has no close button; the action (like Cancel) is the way out.
export function Toast(props: ToastProps) {
  const inBrowser = useInBrowser();
  if (!props.open || !inBrowser) return null;
  return createPortal(<ToastCard {...props} />, stack(props.progress !== undefined));
}

function ToastCard({ onClose, title, description, intent = "info", actionLabel, onAction, duration: durationProp, progress }: ToastProps) {
  const loading = progress !== undefined;
  // A toast with an action counts down longer, so keyboard and screen reader users can reach it; focus or the pointer
  // pauses it (WCAG 2.2.1). A loading toast waits for the work, so it has no countdown at all.
  const duration = loading ? null : durationProp === undefined ? (actionLabel ? 8000 : 5000) : durationProp;
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
  // With no close button, Escape closes a confirmation while focus is in it. A loading toast closes only by its action.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !loading) { e.stopPropagation(); onClose(); }
  };

  // Loading toasts stay polite whatever the intent: the work is under way, nothing has gone wrong yet.
  const alert = intent === "danger" && !loading;
  return (
    <div
      className={[styles.toast, styles[intent], loading ? styles.inProgress : ""].join(" ")} role={alert ? "alert" : undefined} aria-labelledby={alert ? titleId : undefined}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={onBlur} onKeyDown={onKeyDown}
    >
      {duration != null && (
        <span className={styles.bar} aria-hidden="true">
          <span className={[styles.fill, paused ? styles.paused : ""].join(" ")} style={{ "--toast-duration": `${duration}ms` } as CSSProperties} />
        </span>
      )}
      <div className={styles.body}>
        <span className={styles.icon} aria-hidden="true">
          {/* The title already says what is loading, so the Spinner is decorative. */}
          {loading ? <Spinner size="sm" label="" /> : <Icon name={ICONS[intent]} intent={intent} />}
        </span>
        <div className={styles.content}>
          <p id={titleId} className={styles.title}>{loading ? <TextLoader>{title}</TextLoader> : title}</p>
          {description && <p className={styles.description}>{description}</p>}
          {loading && (
            <div className={styles.progress}>
              <Meter value={progress} label={title} size="sm" intent={intent} showValue={progress !== "indeterminate"} />
            </div>
          )}
          {actionLabel && (
            <button type="button" className={styles.action} onClick={() => { onAction?.(); onClose(); }}>{actionLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}
