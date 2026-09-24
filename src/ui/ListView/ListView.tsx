"use client";
import { useId, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Avatar } from "../Avatar/Avatar";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { DropdownMenu, type DropdownMenuEntry, type DropdownMenuItem } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import styles from "./ListView.module.css";

export type ListViewSelection = "none" | "single" | "multiple";
export type ListViewInteraction = "none" | "drill" | "drag";
export type ListViewGroupSize = "sm" | "md" | "lg";
export type ListViewMessageIntent = "success" | "info" | "warning" | "danger";
export type ListViewBadgePosition = "start" | "end";
export type ListViewNesting = "step" | "expand";

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
  badgeIntent?: BadgeIntent;
  badgePosition?: ListViewBadgePosition;
  unread?: boolean;
  message?: string;
  messageIntent?: ListViewMessageIntent;
  actions?: ListViewAction[];
  menu?: DropdownMenuEntry[];
  disabled?: boolean;
  children?: ListViewItem[];
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
  path?: string[];
  defaultPath?: string[];
  onPathChange?: (ids: string[]) => void;
  nesting?: ListViewNesting;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  detail?: ReactNode;
}

type MoveKind = "up" | "down" | "top" | "bottom";

const MESSAGE_ICON: Record<ListViewMessageIntent, string> = {
  success: "check_circle", info: "info", warning: "warning", danger: "error",
};

// The rows at one level of a nested list: the root, or the children of the last id on the path.
function levelAt(items: ListViewItem[], path: string[]) {
  let rows = items;
  const trail: ListViewItem[] = [];
  for (const id of path) {
    const next = rows.find((it) => it.id === id);
    if (!next?.children) break;
    trail.push(next);
    rows = next.children;
  }
  return { rows, trail };
}

// A new tree with the rows at one level swapped for a new list.
function withLevel(items: ListViewItem[], path: string[], rows: ListViewItem[]): ListViewItem[] {
  if (path.length === 0) return rows;
  const [id, ...rest] = path;
  return items.map((it) => (it.id === id && it.children ? { ...it, children: withLevel(it.children, rest, rows) } : it));
}

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
// under headers that can fold away and stay pinned while the list scrolls. A row with children steps into its own
// list in place, under a header with a Back button, one level at a time, or with nesting expand opens its children
// right under it, indented, like a tree. detail shows the picked record under its row.
export function ListView({
  label, items: itemsProp, onItemsChange, groups, groupSize = "md", collapsible = false, stickyGroups = false,
  collapsed: collapsedProp, defaultCollapsed, onCollapsedChange, selection = "none", selected: selectedProp, defaultSelected,
  onSelectedChange, interaction = "none", onOpen, onAction, path: pathProp, defaultPath, onPathChange,
  nesting = "step", expanded: expandedProp, defaultExpanded, onExpandedChange, detail,
}: ListViewProps) {
  const uid = useId();
  const keysId = `${uid}-keys`;
  // The list keeps its own order after a move unless the screen takes it back through onItemsChange.
  const [ownItems, setOwnItems] = useState(itemsProp);
  const [seen, setSeen] = useState(itemsProp);
  if (itemsProp !== seen) { setSeen(itemsProp); setOwnItems(itemsProp); }
  const tree = onItemsChange ? itemsProp : ownItems;

  // Where the list is in a nested tree: the ids of the rows stepped into, top first.
  const [pathState, setPathState] = useState<string[]>(defaultPath ?? []);
  // Expanding rows open in place, so the list never steps in.
  const expand = nesting === "expand";
  const { rows: items, trail } = levelAt(tree, expand ? [] : pathProp ?? pathState);
  const path = trail.map((t) => t.id);
  const setPath = (ids: string[]) => { if (pathProp === undefined) setPathState(ids); onPathChange?.(ids); };
  const parent = trail[trail.length - 1];
  // Moves change only the level on screen; the rest of the tree comes along as it was.
  const setItems = (level: ListViewItem[]) => {
    const next = withLevel(tree, path, level);
    if (!onItemsChange) setOwnItems(next);
    onItemsChange?.(next);
  };
  // Groups split the top level only; a stepped-into list is one plain list.
  const grouped = path.length === 0 ? groups : undefined;

  const [collapsedState, setCollapsedState] = useState<string[]>(defaultCollapsed ?? []);
  const shut = new Set(collapsedProp ?? collapsedState);
  const setShut = (ids: string[]) => { if (collapsedProp === undefined) setCollapsedState(ids); onCollapsedChange?.(ids); };

  const [selectedState, setSelectedState] = useState<string[]>(defaultSelected ?? []);
  const selectedIds = selectedProp ?? selectedState;
  const setSelected = (ids: string[]) => { if (selectedProp === undefined) setSelectedState(ids); onSelectedChange?.(ids); };

  const [expandedState, setExpandedState] = useState<string[]>(defaultExpanded ?? []);
  const openRows = new Set(expandedProp ?? expandedState);
  const toggleRow = (item: ListViewItem) => {
    const next = new Set(openRows);
    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
    if (expandedProp === undefined) setExpandedState([...next]);
    onExpandedChange?.([...next]);
  };

  const [drop, setDrop] = useState<{ id: string; where: "before" | "after" } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const dragId = useRef<string | null>(null);
  const focusAfterMove = useRef<string | null>(null);
  const focusAfterStep = useRef<"back" | string | null>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  // After a keyboard move the row renders somewhere else: give focus back to its main control.
  useLayoutEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    focusAfterMove.current = null;
    rowRefs.current.get(id)?.querySelector<HTMLElement>("[data-main]")?.focus();
  });
  // Stepping in puts focus on Back; stepping back puts it on the row that was opened.
  useLayoutEffect(() => {
    const to = focusAfterStep.current;
    if (!to) return;
    focusAfterStep.current = null;
    if (to === "back") levelRef.current?.querySelector("button")?.focus();
    else rowRefs.current.get(to)?.querySelector<HTMLElement>("[data-main]")?.focus();
  });
  const stepIn = (item: ListViewItem) => {
    focusAfterStep.current = "back";
    setPath([...path, item.id]);
    setMessage(`${item.primary}, ${item.children?.length ?? 0} ${item.children?.length === 1 ? "item" : "items"}`);
  };
  const stepBack = () => {
    if (!parent) return;
    focusAfterStep.current = parent.id;
    setPath(path.slice(0, -1));
    setMessage(trail.length > 1 ? trail[trail.length - 2].primary : label);
  };

  const draggable = interaction === "drag";
  const drill = interaction === "drill";

  // Moves stay inside the item's own group: the neighbours it can swap with are the ones under the same header.
  const peers = (item: ListViewItem) => (grouped ? items.filter((it) => it.group === item.group) : items);
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
    // A row with its own rows steps into them rather than picking or opening.
    if (item.children) { if (expand) toggleRow(item); else stepIn(item); return; }
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
          const list = next.filter((it) => !grouped || it.group === moving.group);
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

  // depth is how far a row sits under the top level when rows expand in place; branch says a row at its level
  // opens, so rows without children keep a gap where the fold would be and every row's text lines up.
  const renderRow = (item: ListViewItem, depth = 0, branch = false): ReactNode[] => {
    const isSelected = selectedIds.includes(item.id);
    const badge = item.badge && <Badge intent={item.badgeIntent ?? "neutral"}>{item.badge}</Badge>;
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
    const nests = Boolean(item.children);
    const acts = selection !== "none" || drill || nests;
    const asButton = selection === "single" || drill || nests;
    const isOpen = expand && nests && openRows.has(item.id);
    // The picked record under its row: single selection only, never on a row that holds rows.
    const showsDetail = detail != null && selection === "single" && isSelected && !nests;
    const content = (
      <>
        {expand && (nests
          ? <Icon name="chevron_right" size="lg" className={[styles.fold, isOpen ? styles.open : ""].join(" ")} />
          : branch && <span className={styles.foldGap} />)}
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
    const row = (
      <li
        key={item.id}
        ref={(el) => { if (el) rowRefs.current.set(item.id, el); else rowRefs.current.delete(item.id); }}
        className={[
          styles.row, isSelected ? styles[selection === "single" ? "selected" : "checked"] : "",
          item.disabled ? styles.disabled : "", acts ? styles.acts : "",
          drop?.id === item.id ? styles[`drop-${drop.where}`] : "",
        ].join(" ")}
        style={depth > 0 ? ({ "--depth": depth } as CSSProperties) : undefined}
        onClick={onRowClick} onKeyDown={onRowKey(item)}
        aria-describedby={draggable ? keysId : undefined}
        {...(depth === 0 ? dragProps(item) : {})}
      >
        {selection === "multiple" && !nests && (
          <span className={styles.selector} data-own>
            {/* 16, as in a Table row's select cell and the Figma list item. */}
            <Checkbox size="sm" label={item.primary} hideLabel checked={isSelected} disabled={item.disabled} onChange={() => toggleChecked(item)} />
          </span>
        )}
        <span className={styles.main}>
          {asButton ? (
            <button
              type="button" data-main className={styles.hit} disabled={item.disabled}
              aria-pressed={selection === "single" && !drill && !nests ? isSelected : undefined}
              aria-current={selection === "single" && drill && !nests && isSelected ? "true" : undefined}
              aria-expanded={expand && nests ? isOpen : detail != null && selection === "single" && !nests ? showsDetail : undefined}
              onClick={() => pick(item)}
            >
              {content}
            </button>
          ) : (
            <span className={styles.hit} data-main={selection === "multiple" ? undefined : ""}>{content}</span>
          )}
          {item.message && (
            <span className={[styles.message, styles[item.messageIntent ?? "info"]].join(" ")}>
              <Icon name={MESSAGE_ICON[item.messageIntent ?? "info"]} size="sm" />
              {item.message}
            </span>
          )}
        </span>
        {(item.badgePosition ?? "end") === "end" && badge && <span className={styles.end}>{badge}</span>}
        {((item.actions?.length ?? 0) > 0 || (item.menu?.length ?? 0) > 0) && (
          <span className={styles.actions} data-own>
            {item.actions?.map((a) => (
              <Button
                key={a.id} variant="tertiary" size="lg" iconOnly iconStart={a.icon} disabled={item.disabled}
                aria-label={`${a.label} ${item.primary}`} onClick={() => onAction?.(item.id, a.id)}
              >
                {a.label}
              </Button>
            ))}
            {/* The rest of the row's actions, behind one More button at the end, as in a Table row. */}
            {item.menu && item.menu.length > 0 && (
              <DropdownMenu
                label={`More actions for ${item.primary}`} iconOnly icon="more_vert" variant="tertiary" size="lg" align="end"
                items={item.menu} disabled={item.disabled} onSelect={(id) => onAction?.(item.id, id)}
              />
            )}
          </span>
        )}
        {/* Opened rows show their chevron at the start instead; a row with its record under it points down. */}
        {(drill || nests) && !(expand && nests) && (
          <Icon name="chevron_right" size="lg" className={[styles.chevron, styles.fold, showsDetail ? styles.open : ""].join(" ")} />
        )}
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
    const out: ReactNode[] = [row];
    if (showsDetail) {
      out.push(
        <li key={`${item.id}-detail`} className={styles.detail} style={depth > 0 ? ({ "--depth": depth } as CSSProperties) : undefined}>
          <section aria-label={item.primary}>{detail}</section>
        </li>,
      );
    }
    if (isOpen && item.children) {
      const kidsBranch = item.children.some((c) => c.children);
      for (const child of item.children) out.push(...renderRow(child, depth + 1, kidsBranch));
    }
    return out;
  };

  const list = (rows: ListViewItem[], labelledBy?: string) => (
    <ul className={styles.list} aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy}>
      {rows.flatMap((it) => renderRow(it, 0, expand && rows.some((r) => r.children)))}
    </ul>
  );

  return (
    <div className={[styles.view, stickyGroups ? styles.sticky : ""].join(" ")} role={grouped ? "group" : undefined} aria-label={grouped ? label : undefined}>
      {parent && (
        // A stepped-into list: Back to the level above, then the name of the row it belongs to.
        <div ref={levelRef} className={[styles.header, styles[`head-${groupSize}`], styles.first, styles.level].join(" ")}>
          <Button variant="tertiary" size="md" iconOnly iconStart="arrow_back" onClick={stepBack}>
            {`Back to ${trail.length > 1 ? trail[trail.length - 2].primary : label}`}
          </Button>
          <h3 id={`${uid}-level`} className={styles.levelTitle}>{parent.primary}</h3>
        </div>
      )}
      {parent
        ? list(items, `${uid}-level`)
        : grouped
        ? grouped.map((g, i) => {
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
