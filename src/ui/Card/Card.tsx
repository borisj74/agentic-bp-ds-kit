"use client";
import { useId, useState, type MouseEvent } from "react";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { Dropdown, type DropdownEntry } from "../Dropdown/Dropdown";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import styles from "./Card.module.css";
import { inspect } from "../inspect";

export type CardMessageIntent = "success" | "warning" | "danger" | "info";

export interface CardAction {
  id: string;
  label: string;
  icon: string;
}

export interface CardProps {
  title?: string;
  overline?: string;
  badge?: string;
  badgeIntent?: BadgeIntent;
  description?: string;
  amount?: string;
  message?: string;
  messageIntent?: CardMessageIntent;
  image?: string;
  imageAlt?: string;
  icon?: string;
  selectable?: boolean;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  actions?: CardAction[];
  menu?: DropdownEntry[];
  onAction?: (id: string) => void;
}

const MESSAGE_ICON: Record<CardMessageIntent, string> = { success: "check_circle", warning: "warning", danger: "error", info: "info" };

// Figma card 6290:315: header row (badge + overline), title, body, amount and an item message beside a 72 tile,
// then a footer checkbox when selectable. States: default, hover, selected, disabled. With href or onClick the card
// opens what it shows instead: its title is the one link, stretched over the whole card.
export function Card({
  title, overline, badge, badgeIntent = "neutral", description, amount, message, messageIntent = "success", image, imageAlt, icon,
  selectable = false, selected: selectedProp, defaultSelected = false, onSelectedChange, disabled = false, href, onClick: onOpen,
  actions, menu, onAction,
}: CardProps) {
  const titleId = useId();
  // A card in a booting page draws its own shape: a bar for each line it carries, its tile as a block, and its
  // footer kept, so the grid of cards is the grid the records land in.
  const booting = useFieldSkeleton();
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const selected = selectable && (selectedProp ?? innerSelected);

  const setSelected = (next: boolean) => {
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectedChange?.(next);
  };
  // Clicking the card is a pointer shortcut for its checkbox; clicks on the checkbox itself are left to it.
  const onClick = (e: MouseEvent<HTMLElement>) => {
    // Clicks from the More menu reach here through its portal; they are not on the card.
    if (!selectable || disabled || !e.currentTarget.contains(e.target as Node) || (e.target as HTMLElement).closest("label, input, button, a")) return;
    setSelected(!selected);
  };

  // Without a title, the overline (or else the description) names the card and its checkbox.
  const name = title || overline || description || "item";
  const hasActions = (actions?.length ?? 0) > 0 || (menu?.length ?? 0) > 0;
  // A card that opens something is not also a choice: selectable wins, and a disabled card goes nowhere.
  const opens = !selectable && !disabled && Boolean(href || onOpen);
  // The one control: a real link with href, a button without. Its hit area stretches over the card.
  const open = (text: string) => (href
    ? <a className={styles.open} href={href} onClick={onOpen}>{text}</a>
    : <button type="button" className={styles.open} onClick={onOpen}>{text}</button>);
  const cls = [styles.card, selectable && !disabled ? styles.selectable : "", opens ? styles.opens : "", selected ? styles.selected : "", disabled ? styles.disabled : ""].join(" ");
  if (booting) {
    const bar = (text: string, height: string) => (
      <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(text)} height={height} label="" />
    );
    return (
      <article className={[styles.card, styles.booting].join(" ")} aria-hidden="true">
        <div className={styles.body}>
          <div className={styles.top}>
            <div className={styles.text}>
              {(badge || overline) && (
                <div className={styles.header}>
                  {badge && <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(badge)} height="var(--control-small)" label="" />}
                  {overline && bar(overline, "var(--skeleton-cell)")}
                </div>
              )}
              {title && <h3 className={styles.title}>{bar(title, "var(--font-size-regular)")}</h3>}
              {description && <p className={styles.description}>{bar(description, "var(--skeleton-cell)")}</p>}
              {amount && <p className={styles.amount}>{bar(amount, "var(--skeleton-row-bar)")}</p>}
            </div>
            {(image || icon) && <Skeleton shape="rect" animation="pulse" width="var(--card-tile)" height="var(--card-tile)" label="" />}
          </div>
          {message && <p className={styles.message}>{bar(message, "var(--skeleton-cell)")}</p>}
        </div>
        {(selectable || hasActions) && (
          <div className={styles.footer}>
            {selectable && <Skeleton shape="rect" animation="pulse" width="var(--control-small)" height="var(--control-small)" label="" />}
            {hasActions && (
              <span className={styles.actions}>
                {actions?.map((a) => (
                  <Skeleton key={a.id} shape="rect" animation="pulse" width="var(--control-small)" height="var(--control-small)" label="" />
                ))}
                {menu && menu.length > 0 && (
                  <Skeleton shape="rect" animation="pulse" width="var(--control-small)" height="var(--control-small)" label="" />
                )}
              </span>
            )}
          </div>
        )}
      </article>
    );
  }
  return (
    <article {...inspect("Card")} className={cls} aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : name} onClick={onClick}>
      <div className={styles.body}>
        <div className={styles.top}>
          <div className={styles.text}>
            {(badge || overline) && (
              <div className={styles.header}>
                {badge && <Badge intent={badgeIntent} disabled={disabled}>{badge}</Badge>}
                {overline && <span className={styles.overline}>{opens && !title ? open(overline) : overline}</span>}
              </div>
            )}
            {title && <h3 id={titleId} className={styles.title}>{opens ? open(title) : title}</h3>}
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
          <p className={[styles.message, styles[messageIntent]].join(" ")}>
            <Icon name={MESSAGE_ICON[messageIntent]} size="sm" filled />
            {message}
          </p>
        )}
      </div>
      {(selectable || hasActions) && (
        <div className={styles.footer}>
          {selectable && <Checkbox size="sm" hideLabel label={`Select ${name}`} checked={selected} disabled={disabled} onChange={setSelected} />}
          {hasActions && (
            // The record's actions at the end of the footer: the ones it is used for as icon buttons, the rest behind More.
            <span className={styles.actions}>
              {actions?.map((a) => (
                <Button key={a.id} size="sm" emphasis="minimal" iconOnly iconStart={a.icon} disabled={disabled} aria-label={`${a.label} ${name}`} onClick={() => onAction?.(a.id)}>
                  {a.label}
                </Button>
              ))}
              {menu && menu.length > 0 && (
                <Dropdown label={`More actions for ${name}`} iconOnly icon="more_vert" emphasis="minimal" size="sm" alignment="right" items={menu} disabled={disabled} onSelect={(id) => onAction?.(id)} />
              )}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
