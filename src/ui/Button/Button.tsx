"use client";
import { useContext, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon } from "../Icon/Icon";
import { ButtonGroupContext } from "../ButtonGroup/context";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: string;
  iconEnd?: string;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size: sizeProp,
  iconStart,
  iconEnd,
  iconOnly = false,
  loading = false,
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  // Inside a ButtonGroup the group sets size and can disable every Button.
  const group = useContext(ButtonGroupContext);
  const size = group?.size ?? sizeProp ?? "md";
  const off = Boolean(disabled || group?.disabled);
  const iconSize = size === "sm" ? "sm" : "md";
  const cls = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : "",
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    className ?? "",
  ]
    .join(" ")
    .trim();
  return (
    // Loading keeps full color and focus. It is not disabled; clicks (and form submit) are ignored until it finishes.
    <button
      {...rest}
      type={type}
      className={cls}
      disabled={off}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
    >
      {loading && <Icon name="progress_activity" size={iconSize} className={styles.spinner} label="Loading" />}
      <span className={styles.content}>
        {iconStart && <Icon name={iconStart} size={iconSize} />}
        {iconOnly ? <span className={styles.srOnly}>{children}</span> : <span className={styles.label}>{children}</span>}
        {iconEnd && !iconOnly && <Icon name={iconEnd} size={iconSize} />}
      </span>
    </button>
  );
}
