"use client";
import { useState, type ReactNode } from "react";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import styles from "./Alert.module.css";

export type AlertIntent = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  intent?: AlertIntent;
  title?: string;
  actionLabel?: string;
  dismissible?: boolean;
  children: ReactNode;
  onAction?: () => void;
  onDismiss?: () => void;
}

const icons: Record<AlertIntent, string> = { info: "info", success: "check_circle", warning: "warning", danger: "error" };

export function Alert({ intent = "info", title, actionLabel, dismissible = false, children, onAction, onDismiss }: AlertProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const urgent = intent === "warning" || intent === "danger";
  return (
    <div className={[styles.alert, styles[intent], dismissible ? styles.dismissible : ""].join(" ")} role={urgent ? "alert" : "status"}>
      <span className={styles.icon}><Icon name={icons[intent]} intent={intent} /></span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.message}>
          <span>{children}</span>
          {actionLabel && <button type="button" className={styles.action} onClick={onAction}>{actionLabel}</button>}
        </p>
      </div>
      {dismissible && (
        <Button variant="tertiary" size="sm" iconOnly iconStart="close" onClick={() => { setOpen(false); onDismiss?.(); }}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
