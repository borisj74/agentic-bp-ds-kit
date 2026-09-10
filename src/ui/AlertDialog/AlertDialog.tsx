"use client";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import styles from "./AlertDialog.module.css";

export type AlertDialogActionVariant = "primary" | "danger";
export type AlertDialogSize = "sm" | "md";

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  cancelLabel?: string;
  actionLabel: string;
  actionVariant?: AlertDialogActionVariant;
  size?: AlertDialogSize;
  onCancel: () => void;
  onAction: () => void;
}

export function AlertDialog({
  open,
  title,
  description,
  cancelLabel = "Cancel",
  actionLabel,
  actionVariant = "primary",
  size = "md",
  onCancel,
  onAction,
}: AlertDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Cancel is the first button: the safe choice gets focus.
    root.querySelector<HTMLButtonElement>("button")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const buttons = [...root.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const inside = root.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // Backdrop clicks do nothing: the user must pick Cancel or the action.
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && e.preventDefault()}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={[styles.dialog, styles[size]].join(" ")}
      >
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <p id={descriptionId} className={styles.description}>{description}</p>
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={actionVariant} onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
