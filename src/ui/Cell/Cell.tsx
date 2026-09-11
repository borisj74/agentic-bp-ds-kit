"use client";
import type { ReactNode } from "react";
import { useDensity } from "../Density/Density";
import { Avatar } from "../Avatar/Avatar";
import { AvatarGroup } from "../AvatarGroup/AvatarGroup";
import { Badge, type BadgeTone } from "../Badge/Badge";
import { Button, type ButtonVariant } from "../Button/Button";
import { ButtonGroup } from "../ButtonGroup/ButtonGroup";
import { Checkbox } from "../Checkbox/Checkbox";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { Select, type SelectOption } from "../Select/Select";
import { Icon } from "../Icon/Icon";
import styles from "./Cell.module.css";

export type CellType =
  | "text" | "link" | "avatar" | "avatarGroup" | "file" | "payment" | "badge" | "badges"
  | "trendPositive" | "trendNegative" | "rating" | "select" | "actions" | "actionIcons" | "actionMenu" | "checkbox";
export type CellSize = "sm" | "md";
export interface CellPerson { name: string; src?: string }
export interface CellBadge { label: string; tone?: BadgeTone }
export interface CellAction { label: string; icon?: string; variant?: ButtonVariant; onClick?: () => void }

export interface CellProps {
  type?: CellType;
  size?: CellSize;
  text?: boolean;
  checkbox?: boolean;
  label?: string;
  href?: string;
  name?: string;
  src?: string;
  people?: CellPerson[];
  icon?: string;
  tone?: BadgeTone;
  badges?: CellBadge[];
  value?: string | number;
  actions?: CellAction[];
  options?: SelectOption[];
  onValueChange?: (value: string) => void;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const STARS = 5;
const score = (v?: string | number) => Math.max(0, Math.min(STARS, Math.round(Number(v) || 0)));

export function Cell({
  type = "text", size: ownSize, text = true, checkbox = false, label, href, name, src, people, icon,
  tone = "neutral", badges, value, actions, options, onValueChange, checked, defaultChecked, onCheckedChange,
}: CellProps) {
  const density = useDensity();
  const size = ownSize ?? (density === "compact" ? "sm" : "md");
  const who = name || label || "";
  let visual: ReactNode = null;
  let side = ""; // text shown after the visual
  let aria: string | undefined; // name for visual-only cells

  switch (type) {
    // checkbox: only the row Checkbox, for a select column. label names the row, hidden.
    case "checkbox":
      break;
    case "text":
    case "link":
      side = label ?? "";
      break;
    case "avatar":
      // Avatars stay 32px (sm) so rows keep their 48 / 56 px height.
      visual = <Avatar name={who} src={src} size="sm" />;
      break;
    case "avatarGroup":
      visual = <AvatarGroup items={people ?? []} size="sm" max={3} label={label} />;
      side = label ?? "";
      break;
    case "file":
    case "payment":
      visual = <span className={styles.icon}><Icon name={icon ?? (type === "file" ? "description" : "credit_card")} size="md" /></span>;
      side = label ?? "";
      if (!text) aria = label;
      break;
    case "badge":
      visual = <Badge tone={tone}>{label ?? ""}</Badge>;
      break;
    case "badges":
      visual = <span className={styles.row}>{(badges ?? []).slice(0, 3).map((b, i) => <Badge key={i} tone={b.tone ?? "neutral"}>{b.label}</Badge>)}</span>;
      break;
    case "trendPositive":
    case "trendNegative": {
      const up = type === "trendPositive";
      visual = <span className={[styles.trend, up ? styles.up : styles.down].join(" ")}><Icon name={up ? "arrow_upward" : "arrow_downward"} size="sm" />{text && value !== undefined && <span>{value}</span>}</span>;
      if (!text) aria = `${up ? "Up" : "Down"} ${value ?? ""}`.trim();
      break;
    }
    case "rating": {
      const n = score(value);
      visual = (
        <span className={styles.row} role="img" aria-label={`${n} of ${STARS}`}>
          {Array.from({ length: STARS }, (_, i) => <Icon key={i} name="star" size="sm" filled={i < n} tone={i < n ? "warning" : "subtle"} />)}
        </span>
      );
      break;
    }
    case "select":
      // A small kit Select with a hidden label, filling the cell.
      visual = (
        <Select
          size="sm" hideLabel label={label ?? "Value"} options={options ?? []}
          defaultValue={value !== undefined ? String(value) : undefined}
          onChange={(v) => onValueChange?.(Array.isArray(v) ? v[0] ?? "" : v)}
        />
      );
      break;
    case "actions":
      visual = (
        <ButtonGroup size="sm" label={label ?? "Row actions"}>
          {(actions ?? []).slice(0, 3).map((a, i) => <Button key={i} variant={a.variant ?? "secondary"} iconStart={a.icon} onClick={a.onClick}>{a.label}</Button>)}
        </ButtonGroup>
      );
      break;
    case "actionIcons":
      visual = (
        <span className={styles.row} role="group" aria-label={label ?? "Row actions"}>
          {(actions ?? []).slice(0, 3).map((a, i) => <Button key={i} size="sm" variant={a.variant ?? "tertiary"} iconOnly iconStart={a.icon ?? "more_horiz"} onClick={a.onClick}>{a.label}</Button>)}
        </span>
      );
      break;
    case "actionMenu":
      // Aligned to the end so the menu stays inside the table.
      visual = (
        <DropdownMenu
          label={label ?? "Row actions"} iconOnly variant="tertiary" size="sm" align="end"
          items={(actions ?? []).map((a, i) => ({ id: String(i), label: a.label, icon: a.icon, danger: a.variant === "danger" }))}
          onSelect={(id) => actions?.[Number(id)]?.onClick?.()}
        />
      );
      break;
  }

  const twoLine = type === "avatar" && text && who;
  const showSide = text && side && type !== "trendPositive" && type !== "trendNegative";

  return (
    <span className={[styles.cell, styles[size]].join(" ")} aria-label={aria}>
      {(checkbox || type === "checkbox") && (
        <Checkbox size="sm" hideLabel label={`Select ${label || name || "row"}`} checked={checked} defaultChecked={defaultChecked} onChange={onCheckedChange} />
      )}
      {visual && <span className={type === "select" ? styles.fill : styles.visual}>{visual}</span>}
      {twoLine ? (
        <span className={styles.copy}>
          <span className={styles.name}>{who}</span>
          {name && label && label !== name && <span className={styles.support}>{label}</span>}
        </span>
      ) : showSide && type === "link" ? (
        <a className={styles.link} href={href}>{side}</a>
      ) : showSide ? (
        <span className={styles.label}>{side}</span>
      ) : null}
    </span>
  );
}
