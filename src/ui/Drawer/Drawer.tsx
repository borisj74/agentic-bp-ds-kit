"use client";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import { useDialog } from "../Modal/useDialog";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./Drawer.module.css";
import { usePortalDensity } from "../Density/Density";

export type DrawerSize = "narrow" | "medium" | "wide" | "extended";

export interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  size?: DrawerSize;
  showClose?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

// Figma drawer 2975:10337 and drawer-panel 2975:9762: a full-height panel at the right edge over a light backdrop.
export function Drawer({ open, title, description, size = "narrow", showClose = true, onClose, children, footer }: DrawerProps) {
  const titleId = useId();
  const density = usePortalDensity(); // the portalled popup keeps the surrounding Density
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);

  // Focus in and back out, scroll lock, Escape and Tab: shared with Modal.
  const onKeyDown = useDialog(open, panelRef, bodyRef, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // A click on the page behind closes it, but only when the press also started there (not a drag out of a field).
    <div
      data-density={density}
      className={styles.overlay}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (downOnBackdrop.current && e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined} tabIndex={-1}
        className={[styles.drawer, styles[size]].join(" ")}
      >
        <header className={styles.header}>
          <div className={styles.copy}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {description && <p id={descriptionId} className={styles.description}>{description}</p>}
          </div>
          {showClose && (
            <span className={styles.close}>
              <Tooltip content="Close" placement="left">
                <Button variant="tertiary" size="sm" iconOnly iconStart="close" onClick={onClose}>Close</Button>
              </Tooltip>
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
