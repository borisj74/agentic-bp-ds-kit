"use client";
import { useId, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import { Avatar } from "../Avatar/Avatar";
import { Badge, type BadgeTone } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { DropdownMenu, type DropdownMenuItem } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import styles from "./ListView.module.css";

export type ListViewSelection = "none" | "single" | "multiple";
export type ListViewInteraction = "none" | "drill" | "drag";
export type ListViewGroupSize = "sm" | "md" | "lg";
export type ListViewMessageTone = "success" | "info" | "warning" | "danger";
export type ListViewBadgePosition = "start" | "end";

export interface ListViewAction {
  id: string;
  label: string;
  icon: string;
}

export interface ListViewItem {
  id: string;
  primary: string;
  secondary?: string;
  group?: string;
  avatar?: string;
  icon?: string;
  image?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  badgePosition?: ListViewBadgePosition;
  unread?: boolean;
  message?: string;
  messageTone?: ListViewMessageTone;
  actions?: ListViewAction[];
  disabled?: boolean;
}

export interface ListViewGroup {
  id: string;
  title: string;
}

export interface ListViewProps {
  label: string;
  items: ListViewItem[];
  onItemsChange?: (items: ListViewItem[]) => void;
  groups?: ListViewGroup[];
  groupSize?: ListViewGroupSize;
  collapsible?: boolean;
  stickyGroups?: boolean;
  collapsed?: string[];
  defaultCollapsed?: string[];
  onCollapsedChange?: (ids: string[]) => void;
  selection?: ListViewSelection;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  interaction?: ListViewInteraction;
  onOpen?: (id: string) => void;
  onAction?: (itemId: string, actionId: string) => void;
}

type MoveKind = "up" | "down" | "top" | "bottom";

const MESSAGE_ICON: Record<ListViewMessageTone, string> = {
  success: "check_circle", info: "info", warning: "warning", danger: "error",
};

// Moves one item to a new index, returning a new list.
function moveTo(items: ListViewItem[], id: string, index: number) {
  const from = items.findIndex((it) => it.id === id);
  if (from < 0 || index === from) return items;
  const next = items.slice();
  const [it] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(index, next.length)), 0, it);
  return next;
}

// Figma List View: list item template 1912:18799, list item layout 6348:59887, group header 5384:55466.
// Rows of a primary and secondary line with an avatar, icon or image before them, and badges, actions, a chevron
// or a drag handle after. Picked one at a time (a blue band with brand lines) or with checkboxes, and grouped
// under headers that can fold away and stay pinned while the list scrolls.
export function ListView({
  label, items: itemsProp, onItemsChange, groups, groupSize = "md", collapsible = false, stickyGroups = false,
  collapsed: collapsedProp, defaultCollapsed, onCollapsedChange, selection = "none", selected: selectedProp, defaultSelected,
  onSelectedChange, interaction = "none", onOpen, onAction,
}: ListViewProps) {
  const uid = useId();
  const keysId = `${uid}-keys`;
  // The list keeps its own order after a move unless the screen takes it back through onItemsChange.
  const [ownItems, setOwnItems] = useState(itemsProp);
  const [seen, setSeen] = useState(itemsProp);
  if (itemsProp !== seen) { setSeen(itemsProp); setOwnItems(itemsProp); }
  const items = onItemsChange ? itemsProp : ownItems;
  const setItems = (next: ListViewItem[]) => { if (!onItemsChange) setOwnItems(next); onItemsChange?.(next); };

  const [collapsedState, setCollapsedState] = useState<string[]>(defaultCollapsed ?? []);
  const shut = new Set(collapsedProp ?? collapsedState);
  const setShut = (ids: string[]) => { if (collapsedProp === undefined) setCollapsedState(ids); onCollapsedChange?.(ids); };

  const [selectedState, setSelectedState] = useState<string[]>(defaultSelected ?? []);
  const selectedIds = selectedProp ?? selectedState;
  const setSelected = (ids: string[]) => { if (selectedProp === undefined) setSelectedState(ids); onSelectedChange?.(ids); };

  const [drop, setDrop] = useState<{ id: string; where: "before" | "after" } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const dragId = useRef<string | null>(null);
  const focusAfterMove = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  // After a keyboard move the row renders somewhere else: give focus back to its main control.
  useLayoutEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    focusAfterMove.current = null;
    rowRefs.current.get(id)?.querySelector<HTMLElement>("[data-main]")?.focus();
  });

  const draggable = interaction === "drag";
  const drill = interaction === "drill";

  // Moves stay inside the item's own group: the neighbours it can swap with are the ones under the same header.
  const peers = (item: ListViewItem) => (groups ? items.filter((it) => it.group === item.group) : items);
  const moveRow = (item: ListViewItem, kind: MoveKind) => {
    const list = peers(item);
    const at = list.indexOf(item);
    const to = kind === "up" ? at - 1 : kind === "down" ? at + 1 : kind === "top" ? 0 : list.length - 1;
    if (item.disabled || to < 0 || to >= list.length || to === at) return false;
    setItems(moveTo(items, item.id, items.indexOf(list[to])));
    setMessage(`Moved ${item.primary}, ${to + 1} of ${list.length}`);
    return true;
  };
  const moveItems = (item: ListViewItem): DropdownMenuItem[] => {
    const list = peers(item);
    const at = list.indexOf(item);
    return [
      { id: "top", label: "Move to top", icon: "vertical_align_top", disabled: at === 0 },
      { id: "up", label: "Move up", description: "Alt+Up", icon: "arrow_upward", disabled: at === 0 },
      { id: "down", label: "Move down", description: "Alt+Down", icon: "arrow_downward", disabled: at === list.length - 1 },
      { id: "bottom", label: "Move to bottom", icon: "vertical_align_bottom", disabled: at === list.length - 1 },
    ];
  };

  const toggleChecked = (item: ListViewItem) => {
    if (item.disabled) return;
    setSelected(selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id]);
  };
  const pick = (item: ListViewItem) => {
    if (item.disabled) return;
    if (selection === "single") setSelected([item.id]);
    if (selection === "multiple" && !drill) toggleChecked(item);
    if (drill) onOpen?.(item.id);
  };

  const dragProps = (item: ListViewItem) => (draggable && !item.disabled ? {
    draggable: true,
    onDragStart: (e: DragEvent<HTMLLIElement>) => {
      dragId.current = item.id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.primary);
    },
    onDragOver: (e: DragEvent<HTMLLIElement>) => {
      const id = dragId.current;
      const moving = items.find((it) => it.id === id);
      if (!moving || id === item.id || moving.group !== item.group) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const r = e.currentTarget.getBoundingClientRect();
      const where = e.clientY - r.top < r.height / 2 ? "before" : "after";
      if (drop?.id !== item.id || drop.where !== where) setDrop({ id: item.id, where });
    },
    onDrop: (e: DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      const moving = items.find((it) => it.id === dragId.current);
      if (moving && drop) {
        const rest = items.filter((it) => it.id !== moving.id);
        const at = rest.findIndex((it) => it.id === item.id) + (drop.where === "after" ? 1 : 0);
        const next = moveTo(items, moving.id, at);
        if (next !== items) {
          setItems(next);
          const list = next.filter((it) => !groups || it.group === moving.group);
          setMessage(`Moved ${moving.primary}, ${list.indexOf(moving) + 1} of ${list.length}`);
        }
      }
      dragId.current = null;
      setDrop(null);
    },
    onDragEnd: () => { dragId.current = null; setDrop(null); },
  } : {});

  // Alt with the arrows moves the row; Shift+F10 opens its Move menu.
  const onRowKey = (item: ListViewItem) => (e: KeyboardEvent<HTMLLIElement>) => {
    if (!draggable || (e.target as HTMLElement).closest("[data-move]")) return;
    const kinds: Record<string, MoveKind> = { ArrowUp: "up", ArrowDown: "down", Home: "top", End: "bottom" };
    if (e.altKey && kinds[e.key]) {
      e.preventDefault();
      if (moveRow(item, kinds[e.key])) focusAfterMove.current = item.id;
    } else if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
      e.preventDefault();
      if (!item.disabled) setMenuFor(item.id);
    }
  };

  const renderRow = (item: ListViewItem) => {
    const isSelected = selectedIds.includes(item.id);
    const badge = item.badge && <Badge tone={item.badgeTone ?? "neutral"}>{item.badge}</Badge>;
    const media = item.avatar
      ? <Avatar name={item.avatar} size="md" shape="square" decorative />
      : item.image
        // eslint-disable-next-line @next/next/no-img-element -- any image URL, sized by the row
        ? <img className={styles.image} src={item.image} alt="" />
        : item.icon && <span className={styles.iconBox}><Icon name={item.icon} size="md" /></span>;
    const text = (
      <span className={styles.text}>
        <span className={styles.primary}>{item.primary}</span>
        {item.secondary && <span className={styles.secondary}>{item.secondary}</span>}
      </span>
    );
    // The whole row picks or opens. Its main control is a button when a click picks one row or opens it;
    // with checkboxes and nothing to open, the checkbox is the control and the rest of the row toggles it.
    const acts = selection !== "none" || drill;
    const asButton = selection === "single" || drill;
    const content = (
      <>
        {item.unread && <span className={styles.dot}><span className={styles.srOnly}>Unread</span></span>}
        {media && <span className={styles.media}>{media}</span>}
        {item.badgePosition === "start" && badge}
        {text}
      </>
    );
    const onRowClick = (e: MouseEvent<HTMLLIElement>) => {
      // Clicks on the checkbox, actions and handle do their own thing; the rest of the row counts as the main control.
      const t = e.target as HTMLElement;
      if (!e.currentTarget.contains(t) || t.closest("[data-main], [data-own], [data-move]")) return;
      if (acts) pick(item);
    };
    return (
      <li
        key={item.id}
        ref={(el) => { if (el) rowRefs.current.set(item.id, el); else rowRefs.current.delete(item.id); }}
        className={[
          styles.row, isSelected ? styles[selection === "single" ? "selected" : "checked"] : "",
          item.disabled ? styles.disabled : "", acts ? styles.acts : "",
          drop?.id === item.id ? styles[`drop-${drop.where}`] : "",
        ].join(" ")}
        onClick={onRowClick} onKeyDown={onRowKey(item)}
        aria-describedby={draggable ? keysId : undefined}
        {...dragProps(item)}
      >
        {selection === "multiple" && (
          <span className={styles.selector} data-own>
            <Checkbox label={item.primary} hideLabel checked={isSelected} disabled={item.disabled} onChange={() => toggleChecked(item)} />
          </span>
        )}
        <span className={styles.main}>
          {asButton ? (
            <button
              type="button" data-main className={styles.hit} disabled={item.disabled}
              aria-pressed={selection === "single" && !drill ? isSelected : undefined}
              aria-current={selection === "single" && drill && isSelected ? "true" : undefined}
              onClick={() => pick(item)}
            >
              {content}
            </button>
          ) : (
            <span className={styles.hit} data-main={selection === "multiple" ? undefined : ""}>{content}</span>
          )}
          {item.message && (
            <span className={[styles.message, styles[item.messageTone ?? "info"]].join(" ")}>
              <Icon name={MESSAGE_ICON[item.messageTone ?? "info"]} size="sm" />
              {item.message}
            </span>
          )}
        </span>
        {(item.badgePosition ?? "end") === "end" && badge && <span className={styles.end}>{badge}</span>}
        {item.actions && item.actions.length > 0 && (
          <span className={styles.actions} data-own>
            {item.actions.map((a) => (
              <Button
                key={a.id} variant="tertiary" size="lg" iconOnly iconStart={a.icon} disabled={item.disabled}
                aria-label={`${a.label} ${item.primary}`} onClick={() => onAction?.(item.id, a.id)}
              >
                {a.label}
              </Button>
            ))}
          </span>
        )}
        {drill && <Icon name="chevron_right" size="lg" className={styles.chevron} />}
        {draggable && (
          // The drag handle is also a button: its Move menu moves the row without dragging.
          <span className={styles.move} data-move>
            <DropdownMenu
              label={`Move ${item.primary}`} items={moveItems(item)} iconOnly icon="drag_handle" variant="tertiary" size="md"
              align="end" disabled={item.disabled} open={menuFor === item.id}
              onOpenChange={(o) => setMenuFor(o ? item.id : null)} onSelect={(kind) => moveRow(item, kind as MoveKind)}
            />
          </span>
        )}
      </li>
    );
  };

  const list = (rows: ListViewItem[], labelledBy?: string) => (
    <ul className={styles.list} aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy}>
      {rows.map(renderRow)}
    </ul>
  );

  return (
    <div className={[styles.view, stickyGroups ? styles.sticky : ""].join(" ")} role={groups ? "group" : undefined} aria-label={groups ? label : undefined}>
      {groups
        ? groups.map((g, i) => {
          const rows = items.filter((it) => it.group === g.id);
          const headId = `${uid}-${g.id}`;
          const bodyId = `${uid}-${g.id}-body`;
          const open = !collapsible || !shut.has(g.id);
          const toggle = () => { const next = new Set(shut); if (open) next.add(g.id); else next.delete(g.id); setShut([...next]); };
          return (
            <div key={g.id} className={styles.group}>
              <h3 className={[styles.header, styles[`head-${groupSize}`], i === 0 ? styles.first : ""].join(" ")}>
                {collapsible ? (
                  <button type="button" id={headId} className={styles.headButton} aria-expanded={open} aria-controls={bodyId} onClick={toggle}>
                    <Icon name="chevron_right" size="lg" className={[styles.fold, open ? styles.open : ""].join(" ")} />
                    <span>{g.title}</span>
                  </button>
                ) : <span id={headId}>{g.title}</span>}
              </h3>
              <div id={bodyId} hidden={!open}>{list(rows, headId)}</div>
            </div>
          );
        })
        : list(items)}
      {draggable && (
        <p id={keysId} className={styles.srOnly}>Alt with Up or Down moves the row, Alt with Home or End moves it to the top or bottom. Shift F10 opens the Move menu.</p>
      )}
      <p className={styles.srOnly} aria-live="polite">{message}</p>
    </div>
  );
}
