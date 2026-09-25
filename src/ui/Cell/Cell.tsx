"use client";
import type { ReactNode } from "react";
import { Avatar } from "../Avatar/Avatar";
import { AvatarGroup } from "../AvatarGroup/AvatarGroup";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import { Button, type ButtonPair } from "../Button/Button";
import { ButtonGroup } from "../ButtonGroup/ButtonGroup";
import { Checkbox } from "../Checkbox/Checkbox";
import { Dropdown } from "../Dropdown/Dropdown";
import { Meter } from "../Meter/Meter";
import { Select, type SelectOption } from "../Select/Select";
import { Icon } from "../Icon/Icon";
import { Link } from "../Link/Link";
import { RadioGroup } from "../RadioGroup/RadioGroup";
import { Switch } from "../Switch/Switch";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./Cell.module.css";

export type CellType =
  | "text" | "link" | "avatar" | "avatarGroup" | "file" | "payment" | "badge" | "badges"
  | "trendPositive" | "trendNegative" | "progress" | "rating" | "select" | "actions" | "actionIcons" | "actionMenu" | "checkbox" | "tree"
  | "number" | "date" | "status" | "icon" | "switch" | "radio" | "popupTrigger" | "linkSecondary" | "textBlock";
export type CellSize = "sm" | "md";
export type CellAlignment = "start" | "center" | "end";
export type CellTreeToggle = "chevron" | "box";
export interface CellPerson { name: string; src?: string }
export interface CellBadge { label: string; intent?: BadgeIntent }
export type CellAction = ButtonPair & { label: string; icon?: string; onClick?: () => void };
// An action with no emphasis takes the cell's own look: subtle in actions, minimal in actionIcons.
const actionLook = (a: CellAction, fallback: ButtonPair): ButtonPair => (a.emphasis ? ({ emphasis: a.emphasis, intent: a.intent } as ButtonPair) : fallback);

export interface CellProps {
  type?: CellType;
  size?: CellSize;
  alignment?: CellAlignment;
  text?: boolean;
  checkbox?: boolean;
  label?: string;
  href?: string;
  external?: boolean;
  name?: string;
  src?: string;
  people?: CellPerson[];
  icon?: string;
  intent?: BadgeIntent;
  badges?: CellBadge[];
  value?: string | number;
  actions?: CellAction[];
  menu?: CellAction[];
  options?: SelectOption[];
  onValueChange?: (value: string) => void;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: () => void;
  level?: number;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  showLines?: boolean;
  treeToggle?: CellTreeToggle;
}

const STARS = 5;
const score = (v?: string | number) => Math.max(0, Math.min(STARS, Math.round(Number(v) || 0)));
// date: an ISO day like 2024-03-12, read as a local day so the time zone never moves it, written like DatePicker.
const day = (v?: string | number) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v ?? ""));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  return d && !Number.isNaN(d.getTime()) ? { iso: `${m![1]}-${m![2]}-${m![3]}`, text: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : null;
};

export function Cell({
  type = "text", size: ownSize, alignment = type === "number" ? "end" : "start", text = true, checkbox = false, label, href, external = false, name, src, people, icon,
  intent = "neutral", badges, value, actions, menu, options, onValueChange, checked, defaultChecked, onCheckedChange,
  level = 1, expanded, onExpandedChange, showLines = true, treeToggle = "chevron", onClick,
}: CellProps) {
  // A surrounding Density changes the row through the density tokens, not the size.
  const size = ownSize ?? "md";
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
    case "textBlock":
      side = label ?? "";
      break;
    case "number":
      // End-aligned with even-width digits (below), so a column of amounts lines up.
      side = typeof value === "number" ? value.toLocaleString("en-US") : String(value ?? label ?? "");
      break;
    case "date": {
      const d = day(value);
      visual = d ? <time className={styles.label} dateTime={d.iso}>{d.text}</time> : null;
      side = d ? "" : String(value ?? label ?? "");
      break;
    }
    case "status":
    case "icon":
      // status: a dot in the intent's colour; icon: a status icon. Both 20px like the reference and decorative: the label says it.
      visual = (
        <span className={[styles.mark, styles[`mark-${intent}`]].join(" ")}>
          {type === "status" ? <Icon name="fiber_manual_record" size="md" filled /> : <Icon name={icon ?? "info"} size="md" />}
        </span>
      );
      side = label ?? "";
      if (!text) aria = label;
      break;
    case "switch":
      visual = (
        <Switch size="sm" hideLabel label={label ?? "Switch"} checked={checked} defaultChecked={defaultChecked} onChange={onCheckedChange} />
      );
      break;
    case "radio":
      // One kit RadioGroup option per row. Rows share name, so the table reads as one group and the arrow keys move
      // between rows. Always controlled: only the table knows which row is picked (checked + onCheckedChange).
      visual = (
        <span className={styles.visual}>
          <RadioGroup
            size="sm" hideLegend legend={label ?? "Select row"} name={name}
            options={[{ value: "on", label: label ?? "Select row", hideLabel: true }]}
            value={checked ? "on" : ""}
            onChange={() => onCheckedChange?.(true)}
          />
        </span>
      );
      break;
    case "popupTrigger":
      // Grey underlined text that opens a popup the screen owns (a Modal, Drawer or popover): a kit Link acting in place.
      visual = <Link intent="neutral" onClick={onClick}>{label ?? ""}</Link>;
      break;
    case "linkSecondary":
      visual = <Link intent="neutral" href={href} onClick={onClick} external={external}>{label ?? ""}</Link>;
      break;
    case "tree":
      // An optional icon, then the label; the indent and chevron lead the cell (below).
      if (icon) visual = <span className={styles.icon}><Icon name={icon} size="sm" /></span>;
      side = label ?? "";
      break;
    case "avatar":
      // Avatars stay 24px (xs) so rows keep their 36 / 40 px height.
      // With text on, the name is written beside the picture, so the picture itself stays quiet for screen readers.
      visual = <Avatar name={who} src={src} size="xs" decorative={Boolean(text && who)} />;
      break;
    case "avatarGroup":
      visual = <AvatarGroup items={people ?? []} size="xs" max={3} label={label} />;
      side = label ?? "";
      break;
    case "file":
    case "payment":
      visual = <span className={styles.icon}><Icon name={icon ?? (type === "file" ? "description" : "credit_card")} size="md" /></span>;
      side = label ?? "";
      if (!text) aria = label;
      break;
    case "badge":
      visual = <Badge intent={intent}>{label ?? ""}</Badge>;
      break;
    case "badges":
      visual = <span className={styles.row}>{(badges ?? []).slice(0, 3).map((b, i) => <Badge key={i} intent={b.intent ?? "neutral"}>{b.label}</Badge>)}</span>;
      break;
    case "trendPositive":
    case "trendNegative": {
      const up = type === "trendPositive";
      visual = <span className={[styles.trend, up ? styles.up : styles.down].join(" ")}><Icon name={up ? "arrow_upward" : "arrow_downward"} size="sm" />{text && value !== undefined && <span>{value}</span>}</span>;
      if (!text) aria = `${up ? "Up" : "Down"} ${value ?? ""}`.trim();
      break;
    }
    case "progress":
      // A kit Meter bar that fills the cell, sm or md like the row. label names it; text shows the percent after it.
      visual = <Meter value={Number(value) || 0} size={size} label={label ?? "Progress"} showValue={text} />;
      break;
    case "rating": {
      const n = score(value);
      visual = (
        <span className={styles.row} role="img" aria-label={`${n} of ${STARS}`}>
          {Array.from({ length: STARS }, (_, i) => <Icon key={i} name="star" size="sm" filled={i < n} intent={i < n ? "warning" : "subtle"} />)}
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
          {(actions ?? []).slice(0, 3).map((a, i) => <Button key={i} {...actionLook(a, { emphasis: "subtle" })} iconStart={a.icon} onClick={a.onClick}>{a.label}</Button>)}
        </ButtonGroup>
      );
      break;
    case "actionIcons": {
      // On a phone-width box a row of icons costs more than the values beside it, so the buttons fold into the
      // More menu and the row keeps one button. Both are built; only one is in the layout, so neither is a
      // second stop for the keyboard.
      const shownActions = (actions ?? []).slice(0, 3);
      const folded = [...shownActions, ...(menu ?? [])];
      const item = (a: CellAction, i: number) => ({ id: String(i), label: a.label, icon: a.icon, danger: a.intent === "danger" });
      visual = (
        <>
          <span className={[styles.row, styles.nowrap, styles.actionsWide].join(" ")} role="group" aria-label={label ?? "Row actions"}>
            {/* Icon-only, so each button shows its label in a kit Tooltip, like the AppHeader and Toolbar icons. */}
            {shownActions.map((a, i) => (
              <Tooltip key={i} content={a.label} position="above">
                <Button size="sm" {...actionLook(a, { emphasis: "minimal" })} iconOnly iconStart={a.icon ?? "more_horiz"} onClick={a.onClick}>{a.label}</Button>
              </Tooltip>
            ))}
            {/* The rest of the row's actions, behind one More button at the end. */}
            {menu && menu.length > 0 && (
              <Dropdown
                label="More row actions" iconOnly icon="more_vert" emphasis="minimal" size="sm" alignment="right"
                items={menu.map(item)}
                onSelect={(id) => menu[Number(id)]?.onClick?.()}
              />
            )}
          </span>
          {folded.length > 0 && (
            <span className={styles.actionsNarrow}>
              <Dropdown
                label={label ?? "Row actions"} iconOnly icon="more_vert" emphasis="minimal" size="sm" alignment="right"
                items={folded.map(item)}
                onSelect={(id) => folded[Number(id)]?.onClick?.()}
              />
            </span>
          )}
        </>
      );
      break;
    }
    case "actionMenu":
      // Aligned to the end so the menu stays inside the table.
      visual = (
        <Dropdown
          label={label ?? "Row actions"} iconOnly emphasis="minimal" size="sm" alignment="right"
          items={(actions ?? []).map((a, i) => ({ id: String(i), label: a.label, icon: a.icon, danger: a.intent === "danger" }))}
          onSelect={(id) => actions?.[Number(id)]?.onClick?.()}
        />
      );
      break;
  }

  const twoLine = type === "avatar" && text && who;
  const showSide = text && side && type !== "trendPositive" && type !== "trendNegative";

  // Tree: one indent cell per level above this row, carrying the guide line, then the chevron when the row has children.
  // A row with no children lines up with its parent's label, like TreeView.
  const depth = Math.max(Math.floor(level), 1) - 1;
  const parent = expanded !== undefined;
  const lead = type === "tree" && (
    <span className={[styles.treeLead, showLines ? styles.lines : ""].join(" ")}>
      {Array.from({ length: depth }, (_, k) => <span key={k} className={styles.guide} aria-hidden="true" />)}
      {parent ? (
        <span
          className={[styles.toggle, treeToggle === "box" ? styles.boxToggle : ""].join(" ")}
          // Figma (+)/(-) expanded: the connector joins upward only on a nested row, and downward only while the
          // row is open, so a top row's square has no line hanging over it.
          data-above={depth > 0 || undefined} data-below={expanded || undefined}
        >
          {treeToggle === "box" ? (
            // Figma .part/td-expandable: a 12px outlined square holding add or remove, with the guide line
            // running through it, rather than a chevron.
            <button
              type="button" className={styles.box} aria-expanded={expanded} onClick={() => onExpandedChange?.(!expanded)}
            >
              <Icon name={expanded ? "remove" : "add"} size="xs" />
              <span className={styles.srOnly}>{`${expanded ? "Collapse" : "Expand"} ${label ?? "row"}`}</span>
            </button>
          ) : (
            <Button
              size="sm" emphasis="minimal" iconOnly iconStart={expanded ? "expand_more" : "chevron_right"}
              aria-expanded={expanded} onClick={() => onExpandedChange?.(!expanded)}
            >
              {`${expanded ? "Collapse" : "Expand"} ${label ?? "row"}`}
            </Button>
          )}
        </span>
      ) : depth === 0 && <span className={styles.toggle} aria-hidden="true" />}
    </span>
  );

  return (
    <span className={[styles.cell, styles[size], styles[alignment], type === "tree" ? styles.tree : "", type === "textBlock" ? styles.textBlock : "", type === "number" ? styles.number : ""].join(" ")}>
      {lead}
      {/* A plain span can't carry aria-label, so a cell drawn without text says what it shows in hidden text. */}
      {aria && <span className={styles.srOnly}>{aria}</span>}
      {(checkbox || type === "checkbox") && (
        <Checkbox size="sm" hideLabel label={`Select ${label || name || "row"}`} checked={checked} defaultChecked={defaultChecked} onChange={onCheckedChange} />
      )}
      {visual && <span className={type === "select" ? styles.fill : type === "progress" ? [styles.fill, styles.progress].join(" ") : styles.visual}>{visual}</span>}
      {twoLine ? (
        <span className={styles.copy}>
          <span className={styles.name}>{who}</span>
          {name && label && label !== name && <span className={styles.support}>{label}</span>}
        </span>
      ) : showSide && type === "link" && onClick && !href ? (
        // A link that acts in place, like picking a row in a Lookup: a button that looks like a link.
        <button type="button" className={[styles.link, styles.linkButton].join(" ")} onClick={onClick}>{side}</button>
      ) : showSide && type === "link" ? (
        <a className={styles.link} href={href} onClick={onClick}>{side}</a>
      ) : showSide ? (
        <span className={styles.label}>{side}</span>
      ) : null}
    </span>
  );
}
