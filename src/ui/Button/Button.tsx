"use client";
import { useContext, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useDensitySize } from "../Density/Density";
import { Icon, type IconSize } from "../Icon/Icon";
import { ButtonGroupContext } from "../ButtonGroup/context";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonIconSize = Exclude<IconSize, "xs">;

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: string;
  iconEnd?: string;
  iconSize?: ButtonIconSize;
  iconOnly?: boolean;
  loading?: boolean;
  pressed?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size: sizeProp,
  iconStart,
  iconEnd,
  iconSize: iconSizeProp,
  iconOnly = false,
  loading = false,
  pressed,
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  // Inside a ButtonGroup the group sets size and can disable every Button. Otherwise its own size, else Density.
  const group = useContext(ButtonGroupContext);
  const own = useDensitySize(sizeProp);
  const size = group?.size ?? own;
  const off = Boolean(disabled || group?.disabled);
  // The icon follows the Button unless asked for: a bigger one suits an icon-only Button that stands alone.
  const iconSize = iconSizeProp ?? (size === "sm" ? "sm" : "md");
  const cls = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : "",
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    pressed ? styles.pressed : "",
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
      // A toggle announces its state. A disclosure (aria-expanded) already does, so pressed only changes its look.
      aria-pressed={pressed === undefined || rest["aria-expanded"] !== undefined ? undefined : pressed}
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
