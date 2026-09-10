"use client";
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import styles from "./Modal.module.css";

export type ModalSize = "sm" | "md" | "lg" | "full";

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  size?: ModalSize;
  showClose?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, title, description, size = "sm", showClose = true, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const downOnScrim = useRef(false);

  // On open: remember focus, lock page scroll, focus the first field in the body (else the close button, else the dialog).
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      back?.focus();
    };
  }, [open]);

  // React events bubble through portals, so a menu or search inside the modal can handle Escape first.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) { e.preventDefault(); return; }
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    const inside = root.contains(document.activeElement);
    if (e.shiftKey && (!inside || document.activeElement === firstItem)) { e.preventDefault(); lastItem.focus(); }
    else if (!e.shiftKey && (!inside || document.activeElement === lastItem)) { e.preventDefault(); firstItem.focus(); }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // Backdrop click closes, but only when the press also started on the backdrop (not a drag out of a field).
    <div
      className={[styles.overlay, size === "full" ? styles.overlayFull : ""].join(" ")}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => { downOnScrim.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (downOnScrim.current && e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined} tabIndex={-1}
        className={[styles.modal, styles[size]].join(" ")}
      >
        <header className={styles.header}>
          <div className={styles.copy}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {description && <p id={descriptionId} className={styles.description}>{description}</p>}
          </div>
          {showClose && (
            <span className={styles.close}>
              <Button variant="tertiary" iconOnly iconStart="close" onClick={onClose}>Close</Button>
            </span>
          )}
        </header>
        <div ref={bodyRef} className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
