"use client";
import { useId, useState, type MouseEvent } from "react";
import { Badge, type BadgeTone } from "../Badge/Badge";
import { Checkbox } from "../Checkbox/Checkbox";
import { Icon } from "../Icon/Icon";
import styles from "./Card.module.css";

export type CardMessageTone = "success" | "warning" | "danger" | "info";

export interface CardProps {
  title?: string;
  overline?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  description?: string;
  amount?: string;
  message?: string;
  messageTone?: CardMessageTone;
  image?: string;
  imageAlt?: string;
  icon?: string;
  selectable?: boolean;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
}

const MESSAGE_ICON: Record<CardMessageTone, string> = { success: "check_circle", warning: "warning", danger: "error", info: "info" };

// Figma card 6290:315: header row (badge + overline), title, body, amount and an item message beside a 72 tile,
// then a footer checkbox when selectable. States: default, hover, selected, disabled.
export function Card({
  title, overline, badge, badgeTone = "neutral", description, amount, message, messageTone = "success", image, imageAlt, icon,
  selectable = false, selected: selectedProp, defaultSelected = false, onSelectedChange, disabled = false,
}: CardProps) {
  const titleId = useId();
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectable && (selectedProp ?? innerSelected);

  const setSelected = (next: boolean) => {
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectedChange?.(next);
  };
  // Clicking the card is a pointer shortcut for its checkbox; clicks on the checkbox itself are left to it.
  const onClick = (e: MouseEvent<HTMLElement>) => {
    if (!selectable || disabled || (e.target as HTMLElement).closest("label, input, button, a")) return;
    setSelected(!selected);
  };

  // Without a title, the overline (or else the description) names the card and its checkbox.
  const name = title || overline || description || "item";
  const cls = [styles.card, selectable && !disabled ? styles.selectable : "", selected ? styles.selected : "", disabled ? styles.disabled : ""].join(" ");
  return (
    <article className={cls} aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : name} onClick={onClick}>
      <div className={styles.body}>
        <div className={styles.top}>
          <div className={styles.text}>
            {(badge || overline) && (
              <div className={styles.header}>
                {badge && <Badge tone={badgeTone} disabled={disabled}>{badge}</Badge>}
                {overline && <span className={styles.overline}>{overline}</span>}
              </div>
            )}
            {title && <h3 id={titleId} className={styles.title}>{title}</h3>}
            {description && <p className={styles.description}>{description}</p>}
            {amount && <p className={styles.amount}>{amount}</p>}
          </div>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- any URL, sized by the tile
            <img className={styles.tile} src={image} alt={imageAlt ?? ""} />
          ) : icon ? (
            <span className={[styles.tile, styles.iconTile].join(" ")} aria-hidden="true"><Icon name={icon} size="xl" /></span>
          ) : null}
        </div>
        {message && (
          <p className={[styles.message, styles[messageTone]].join(" ")}>
            <Icon name={MESSAGE_ICON[messageTone]} size="sm" filled />
            {message}
          </p>
        )}
      </div>
      {selectable && (
        <div className={styles.footer}>
          <Checkbox size="sm" hideLabel label={`Select ${name}`} checked={selected} disabled={disabled} onChange={setSelected} />
        </div>
      )}
    </article>
  );
}
