"use client";
import { useContext, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useDensitySize } from "../Density/Density";
import { Icon, type IconSize } from "../Icon/Icon";
import { ButtonGroupContext } from "../ButtonGroup/context";
import styles from "./Button.module.css";

export type ButtonEmphasis = "strong" | "subtle" | "minimal";
export type ButtonIntent = "brand" | "neutral" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonIconSize = Exclude<IconSize, "xs">;

/** Emphasis × intent, only the allowed pairs. For components that pass a Button look through (Dropdown, Cell actions…). */
export type ButtonPair =
  | { emphasis: "strong"; intent: "brand" | "danger" }
  | { emphasis?: "subtle"; intent?: "neutral" }
  | { emphasis: "minimal"; intent?: "neutral" | "brand" | "danger" };

/**
 * Emphasis × intent, only the allowed pairs:
 * strong: brand, danger · subtle: neutral · minimal: neutral, brand, danger.
 * Leave both out for subtle neutral. `toggle` is for the neutral subtle and minimal Buttons only.
 */
export type ButtonLook =
  | { emphasis: "strong"; intent: "brand" | "danger"; toggle?: never }
  | { emphasis?: "subtle"; intent?: "neutral"; toggle?: boolean }
  | { emphasis: "minimal"; intent?: "neutral"; toggle?: boolean }
  | { emphasis: "minimal"; intent: "brand" | "danger"; toggle?: never };

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  ButtonLook & {
    size?: ButtonSize;
    iconStart?: string;
    iconEnd?: string;
    iconSize?: ButtonIconSize;
    iconOnly?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    children: ReactNode;
  };

export function Button({
  emphasis = "subtle",
  intent = emphasis === "strong" ? "brand" : "neutral",
  size: sizeProp,
  iconStart,
  iconEnd,
  iconSize: iconSizeProp,
  iconOnly = false,
  loading = false,
  toggle,
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
    styles[emphasis],
    styles[intent],
    styles[size],
    iconOnly ? styles.iconOnly : "",
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    toggle ? styles.toggle : "",
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
      // A toggle announces its state. A disclosure (aria-expanded) already does, so toggle only changes its look.
      aria-pressed={toggle === undefined || rest["aria-expanded"] !== undefined ? undefined : toggle}
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
