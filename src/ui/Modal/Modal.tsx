"use client";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import styles from "./Modal.module.css";
import { useDialog } from "./useDialog";
import { usePortalDensity } from "../Density/Density";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  icon?: string;
  size?: ModalSize;
  showClose?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, description, icon, size = "sm", showClose = true, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const density = usePortalDensity(); // the portalled popup keeps the surrounding Density
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const downOnScrim = useRef(false);

  // Focus in and back out, scroll lock, Escape and Tab: shared with Drawer.
  const onKeyDown = useDialog(open, dialogRef, bodyRef, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // Backdrop click closes, but only when the press also started on the backdrop (not a drag out of a field).
    <div
      data-density={density}
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
          {/* An optional icon before the title, like PageHeader's. */}
          {icon && <span className={styles.icon}><Icon name={icon} size="lg" intent="brand" /></span>}
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
