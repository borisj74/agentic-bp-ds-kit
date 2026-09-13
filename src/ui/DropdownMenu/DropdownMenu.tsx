"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useDensitySize } from "../Density/Density";
import { createPortal } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "../Button/Button";
import { ButtonFilter, type ButtonFilterToggle } from "../ButtonFilter/ButtonFilter";
import { Badge } from "../Badge/Badge";
import { Checkbox } from "../Checkbox/Checkbox";
import { Icon } from "../Icon/Icon";
import { Input } from "../Input/Input";
// The field trigger (used by Select) reuses Input's field box so form controls match.
import field from "../Input/Input.module.css";
import { carryTheme } from "../Tooltip/useFloating";
import styles from "./DropdownMenu.module.css";

export type DropdownMenuTrigger = "button" | "filter" | "field";
export type DropdownMenuAlign = "start" | "end";

export interface DropdownMenuItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  checkbox?: boolean;
  count?: number;
}
export interface DropdownMenuDivider { divider: true }
export type DropdownMenuEntry = DropdownMenuItem | DropdownMenuDivider;

export interface DropdownMenuProps {
  label: string;
  items: DropdownMenuEntry[];
  trigger?: DropdownMenuTrigger;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconOnly?: boolean;
  count?: number;
  align?: DropdownMenuAlign;
  disabled?: boolean;
  closeOnSelect?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (id: string) => void;
  multiple?: boolean;
  id?: string;
  text?: string;
  muted?: boolean;
  badge?: string;
  toggle?: ButtonFilterToggle;
  onToggle?: () => void;
  labelledBy?: string;
  describedBy?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  empty?: string;
  menuWidth?: DropdownMenuWidth;
}

export type DropdownMenuWidth = "default" | "field";

const GAP = 4; // px between trigger and panel
const isItem = (e: DropdownMenuEntry): e is DropdownMenuItem => !("divider" in e);
const enabledItems = (panel: HTMLElement | null) =>
  [...(panel?.querySelectorAll<HTMLElement>('[data-item]:not([aria-disabled="true"])') ?? [])];

export function DropdownMenu({
  label, items, trigger = "button", variant = "secondary", size: ownSize, icon, iconOnly = false, count = 0,
  align = "start", disabled = false, closeOnSelect = true, open: openProp, onOpenChange, onSelect,
  multiple = false, id, text, muted = false, badge, toggle, onToggle, labelledBy, describedBy,
  searchable = false, searchPlaceholder = "Search", empty = "No results.", menuWidth = "default",
}: DropdownMenuProps) {
  const size = useDensitySize(ownSize);
  const [query, setQuery] = useState("");
  const menuId = useId();
  const textId = `${menuId}-text`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusLast = useRef(false);
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  // The button that opens the menu. A split filter's first button is its on/off toggle, so match the popup one.
  const triggerEl = () => rootRef.current?.querySelector<HTMLButtonElement>("button[aria-haspopup]") ?? null;
  const close = (refocus: boolean) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerEl()?.focus();
  };
  // Search filters items by label; dividers drop out while filtering.
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((e) => isItem(e) && e.label.toLowerCase().includes(q)) : items;

  // Place the fixed panel under the trigger (above it when there is no room), then focus the first or last item.
  useLayoutEffect(() => {
    const btn = triggerEl();
    if (!open || !btn) return;
    btn.setAttribute("aria-controls", menuId);
    const place = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const r = btn.getBoundingClientRect();
      carryTheme(btn, panel);
      // The room the menu has: the app frame around the trigger when it marks itself as one (data-frame), else the
      // window. A frame docked in a preview, a split view or a phone-width box is narrower than the window.
      const frame = btn.closest("[data-frame]")?.getBoundingClientRect();
      const x0 = Math.max(0, frame?.left ?? 0);
      const x1 = Math.min(window.innerWidth, frame?.right ?? window.innerWidth);
      const y1 = Math.min(window.innerHeight, frame?.bottom ?? window.innerHeight);
      const h = panel.offsetHeight;
      const below = r.bottom + GAP + h <= y1 || r.top < h + GAP;
      panel.style.top = `${below ? r.bottom + GAP : r.top - GAP - h}px`;
      // field: as wide as the trigger, for a narrow Select like rows per page. default: never under the menu minimum.
      panel.style.minWidth = menuWidth === "field" ? `${r.width}px` : `max(var(--dropdown-min-width), ${r.width}px)`;
      // Narrower frame than the menu wants: the menu gives up width rather than leaving the frame.
      panel.style.maxWidth = `${Math.max(0, x1 - x0 - GAP * 2)}px`;
      // Line up with the trigger's start or end edge, then keep the whole panel inside the frame.
      const w = panel.offsetWidth;
      const want = align === "end" ? r.right - w : r.left;
      const left = Math.min(Math.max(x0 + GAP, want), x1 - w - GAP);
      panel.style.left = `${left}px`;
      panel.style.visibility = "visible";
    };
    place();
    const list = enabledItems(panelRef.current);
    const search = panelRef.current?.querySelector<HTMLInputElement>("input");
    (search ?? (focusLast.current ? list[list.length - 1] : list[0]))?.focus();
    focusLast.current = false;
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      btn.removeAttribute("aria-controls");
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, menuId, menuWidth]);

  // Outside click closes without moving focus; Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) close(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(true); }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  });

  const onTriggerKey = (e: KeyboardEvent) => {
    // Keys pressed in the open menu bubble here through the portal; only the trigger's own keys open it.
    if (panelRef.current?.contains(e.target as Node)) return;
    if (disabled || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    focusLast.current = e.key === "ArrowUp";
    setOpen(true);
  };

  const onMenuKey = (e: KeyboardEvent) => {
    const list = enabledItems(panelRef.current);
    // In the search field: Home and End move the caret, Up goes to the last item, Enter picks the first match.
    if (document.activeElement instanceof HTMLInputElement) {
      if (e.key === "Home" || e.key === "End") return;
      if (e.key === "ArrowUp") { e.preventDefault(); list[list.length - 1]?.focus(); return; }
      if (e.key === "Enter") { e.preventDefault(); list[0]?.click(); return; }
    }
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length]?.focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Tab") { e.preventDefault(); close(true); }
    // Marked handled so a Modal around the menu stays open.
    else if (e.key === "Escape") { e.preventDefault(); close(true); }
  };

  const choose = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    onSelect?.(item.id);
    // Multiple choice keeps the menu open so several items can be picked.
    if (closeOnSelect && !multiple) close(true);
  };

  const flip = () => !disabled && setOpen(!open);

  return (
    <span ref={rootRef} className={[styles.root, trigger === "field" ? `${styles.rootField} ${field[size]}` : ""].join(" ")} onKeyDown={onTriggerKey}>
      {trigger === "field" ? (
        // Named by the outside label plus the current value, so screen readers hear both.
        <button
          id={id} type="button" disabled={disabled} className={[field.field, styles.fieldTrigger].join(" ")}
          aria-haspopup="menu" aria-expanded={open} aria-labelledby={labelledBy ? `${labelledBy} ${textId}` : undefined}
          aria-describedby={describedBy} onClick={flip}
        >
          <span id={textId} className={[styles.fieldText, muted ? styles.fieldMuted : ""].join(" ")}>{text ?? label}</span>
          {badge && <Badge size="sm">{badge}</Badge>}
          <Icon name={open ? "expand_less" : "expand_more"} size={size === "sm" ? "sm" : "md"} className={styles.fieldIcon} />
        </button>
      ) : trigger === "filter" ? (
        <ButtonFilter size={size} open={open} disabled={disabled} count={count} value={text} toggle={toggle} onToggle={onToggle} onClick={flip}>{label}</ButtonFilter>
      ) : (
        <Button
          variant={variant} size={size} disabled={disabled} iconOnly={iconOnly}
          iconStart={iconOnly ? icon ?? "more_vert" : icon} iconEnd={iconOnly ? undefined : open ? "expand_less" : "expand_more"}
          aria-haspopup="menu" aria-expanded={open} onClick={flip}
        >
          {label}
        </Button>
      )}
      {open && typeof document !== "undefined" && createPortal(
        <div ref={panelRef} id={menuId} role="menu" aria-label={label} className={styles.panel} onKeyDown={onMenuKey}>
          {searchable && (
            <div className={styles.search}>
              <Input size="sm" hideLabel label={`Search ${label}`} type="search" iconStart="search" placeholder={searchPlaceholder} value={query} onChange={setQuery} />
            </div>
          )}
          <div className={styles.list}>
          {shown.length === 0 && <div className={styles.empty}>{empty}</div>}
          {shown.map((entry, i) => {
            if (!isItem(entry)) return <div key={`divider-${i}`} role="separator" className={styles.divider} />;
            const role = entry.checkbox || (multiple && entry.selected !== undefined) ? "menuitemcheckbox" : entry.selected !== undefined ? "menuitemradio" : "menuitem";
            const trailing = entry.danger && entry.icon;
            return (
              <button
                key={entry.id} type="button" role={role} tabIndex={-1} data-item
                aria-checked={role === "menuitem" ? undefined : Boolean(entry.selected)}
                aria-disabled={entry.disabled || undefined}
                className={[styles.item, entry.danger ? styles.danger : "", entry.selected && !entry.checkbox ? styles.selected : ""].join(" ")}
                onClick={() => choose(entry)}
              >
                {entry.checkbox && (
                  <span className={styles.checkbox} inert aria-hidden="true">
                    <Checkbox size="sm" hideLabel label={entry.label} checked={Boolean(entry.selected)} disabled={entry.disabled} onChange={() => {}} />
                  </span>
                )}
                {entry.icon && !trailing && <span className={styles.tile}><Icon name={entry.icon} size="md" /></span>}
                <span className={styles.text}>
                  <span className={styles.label}>{entry.label}</span>
                  {entry.description && <span className={styles.description}>{entry.description}</span>}
                </span>
                {/* How many the row leads to, like Chats 7, in a kit Badge at the end. */}
                {entry.count !== undefined && <span className={styles.end}><Badge>{String(entry.count)}</Badge></span>}
                {trailing && <Icon name={entry.icon!} size="md" className={styles.end} />}
                {entry.selected && !entry.checkbox && <Icon name="check" size="md" className={styles.end} />}
              </button>
            );
          })}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
