"use client";
import { useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import { Checkbox } from "../Checkbox/Checkbox";
import { useDensitySize } from "../Density/Density";
import { Icon } from "../Icon/Icon";
import styles from "./TreeView.module.css";

export type TreeViewSelection = "none" | "single" | "multiple";
export type TreeViewSize = "sm" | "md" | "lg";

export interface TreeItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  children?: TreeItem[];
}

export interface TreeViewProps {
  label: string;
  items?: TreeItem[];
  defaultItems?: TreeItem[];
  onItemsChange?: (items: TreeItem[]) => void;
  selection?: TreeViewSelection;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  showIcons?: boolean;
  showLines?: boolean;
  reorderable?: boolean;
  size?: TreeViewSize;
}

type Where = "before" | "after" | "inside";
type Check = "on" | "off" | "mixed";
interface Row { item: TreeItem; level: number; parent: TreeItem | null; pos: number; count: number }

/* ---------- Tree helpers ---------- */

const isFolder = (item: TreeItem) => Array.isArray(item.children);

// Every item in order, with its parent.
function walk(items: TreeItem[], fn: (item: TreeItem, parent: TreeItem | null) => void, parent: TreeItem | null = null) {
  for (const item of items) {
    fn(item, parent);
    if (item.children) walk(item.children, fn, item);
  }
}

// The ends of a branch: its leaves and empty folders. Checking a folder checks these.
const tips = (item: TreeItem): TreeItem[] => (item.children?.length ? item.children.flatMap(tips) : [item]);

// Check state for every item: a folder is on when all its children are, mixed when some are.
function checkStates(items: TreeItem[], on: Set<string>) {
  const out = new Map<string, Check>();
  const visit = (item: TreeItem): Check => {
    let state: Check;
    if (item.children?.length) {
      const kids = item.children.map(visit);
      state = kids.every((k) => k === "on") ? "on" : kids.every((k) => k === "off") ? "off" : "mixed";
    } else state = on.has(item.id) ? "on" : "off";
    out.set(item.id, state);
    return state;
  };
  items.forEach(visit);
  return out;
}

// Moves one item, returning a new tree. Dropping an item into itself or its own branch does nothing.
function move(items: TreeItem[], id: string, target: string, where: Where): TreeItem[] {
  let moving: TreeItem | null = null;
  const take = (list: TreeItem[]): TreeItem[] =>
    list.flatMap((it) => (it.id === id ? ((moving = it), []) : [it.children ? { ...it, children: take(it.children) } : it]));
  const rest = take(items);
  if (!moving) return items;
  const node: TreeItem = moving;
  let inBranch = false;
  walk([node], (it) => { if (it.id === target) inBranch = true; });
  if (inBranch) return items;
  const put = (list: TreeItem[]): TreeItem[] =>
    list.flatMap((it) => {
      if (it.id !== target) return [it.children ? { ...it, children: put(it.children) } : it];
      if (where === "inside") return [{ ...it, children: [...(it.children ?? []), node] }];
      return where === "before" ? [node, it] : [it, node];
    });
  return put(rest);
}

/* ---------- TreeView ---------- */

// Dunav DS tree 1448:76955. Simple: chevrons and guide lines. Advanced: checkboxes, folder icons and drag handles.
export function TreeView({
  label, items: itemsProp, defaultItems, onItemsChange, selection = "single", selected: selectedProp, defaultSelected,
  onSelectedChange, expanded: expandedProp, defaultExpanded, onExpandedChange, showIcons = false, showLines = true,
  reorderable = false, size: ownSize,
}: TreeViewProps) {
  const size = useDensitySize(ownSize);
  const [itemsState, setItemsState] = useState<TreeItem[]>(defaultItems ?? []);
  const [expandedState, setExpandedState] = useState<string[]>(defaultExpanded ?? []);
  const [selectedState, setSelectedState] = useState<string[]>(defaultSelected ?? []);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ id: string; where: Where } | null>(null);
  const [message, setMessage] = useState("");
  const dragId = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const moveFocus = useRef(false);
  const typed = useRef({ text: "", at: 0 });

  const items = itemsProp ?? itemsState;
  const open = new Set(expandedProp ?? expandedState);
  const selectedIds = selectedProp ?? selectedState;

  const setItems = (next: TreeItem[]) => { if (itemsProp === undefined) setItemsState(next); onItemsChange?.(next); };
  const setOpen = (next: Set<string>) => { const ids = [...next]; if (expandedProp === undefined) setExpandedState(ids); onExpandedChange?.(ids); };
  const setSelected = (ids: string[]) => { if (selectedProp === undefined) setSelectedState(ids); onSelectedChange?.(ids); };

  // Multiple: the selected ids name branches; their tips are what is checked.
  const byId = new Map<string, TreeItem>();
  walk(items, (it) => byId.set(it.id, it));
  const checkedTips = new Set(selectedIds.flatMap((id) => (byId.get(id) ? tips(byId.get(id)!).map((t) => t.id) : [])));
  const checks = selection === "multiple" ? checkStates(items, checkedTips) : null;

  // The rows on screen: every item whose folders are all open.
  const rows: Row[] = [];
  const addRows = (list: TreeItem[], level: number, parent: TreeItem | null) =>
    list.forEach((item, i) => {
      rows.push({ item, level, parent, pos: i + 1, count: list.length });
      if (item.children && open.has(item.id)) addRows(item.children, level + 1, item);
    });
  addRows(items, 1, null);
  const current = rows.find((r) => r.item.id === focusId) ?? rows.find((r) => selectedIds.includes(r.item.id)) ?? rows[0];

  // Keyboard moves put focus on the row they land on, once it renders.
  useLayoutEffect(() => {
    if (!moveFocus.current || !focusId) return;
    moveFocus.current = false;
    rowRefs.current.get(focusId)?.focus();
  });
  const focusRow = (id: string) => { moveFocus.current = true; setFocusId(id); };

  const toggleOpen = (item: TreeItem, force?: boolean) => {
    if (!isFolder(item)) return;
    const next = new Set(open);
    if (force ?? !next.has(item.id)) next.add(item.id); else next.delete(item.id);
    setOpen(next);
  };

  const activate = (item: TreeItem) => {
    if (selection === "none") { toggleOpen(item); return; }
    if (item.disabled) return;
    if (selection === "single") { setSelected([item.id]); return; }
    // Multiple: check or clear the whole branch, leaving disabled items as they are.
    const branch = tips(item).filter((t) => !t.disabled).map((t) => t.id);
    const on = new Set(checkedTips);
    const turnOn = checks?.get(item.id) !== "on";
    branch.forEach((id) => (turnOn ? on.add(id) : on.delete(id)));
    const states = checkStates(items, on);
    const ids: string[] = [];
    walk(items, (it) => { if (states.get(it.id) === "on") ids.push(it.id); });
    setSelected(ids);
  };

  const reorder = (id: string, target: string, where: Where) => {
    const next = move(items, id, target, where);
    if (next === items) return false;
    setItems(next);
    if (where === "inside") toggleOpen(byId.get(target)!, true);
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    // The row that has focus, even if its focus has not rendered yet.
    const focused = (e.target as HTMLElement).closest<HTMLElement>("[role=treeitem]")?.dataset.id;
    const at = rows.find((r) => r.item.id === focused) ?? current;
    if (!at) return;
    const i = rows.indexOf(at);
    const { item, parent } = at;
    const go = (r?: Row) => { if (r) { e.preventDefault(); focusRow(r.item.id); } };

    // Alt with up and down moves the row among its siblings.
    if (reorderable && e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      if (item.disabled) return;
      const siblings = parent?.children ?? items;
      const idx = siblings.indexOf(item);
      const other = siblings[idx + (e.key === "ArrowUp" ? -1 : 1)];
      if (!other) return;
      reorder(item.id, other.id, e.key === "ArrowUp" ? "before" : "after");
      setMessage(`Moved ${item.label}, ${idx + (e.key === "ArrowUp" ? 0 : 2)} of ${siblings.length}`);
      focusRow(item.id);
      return;
    }
    switch (e.key) {
      case "ArrowDown": return go(rows[i + 1]);
      case "ArrowUp": return go(rows[i - 1]);
      case "Home": return go(rows[0]);
      case "End": return go(rows[rows.length - 1]);
      case "ArrowRight":
        e.preventDefault();
        if (!isFolder(item)) return;
        if (!open.has(item.id)) toggleOpen(item, true);
        else if (item.children?.length) focusRow(item.children[0].id);
        return;
      case "ArrowLeft":
        e.preventDefault();
        if (isFolder(item) && open.has(item.id)) toggleOpen(item, false);
        else if (parent) focusRow(parent.id);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        activate(item);
        return;
      case "*": {
        e.preventDefault();
        const next = new Set(open);
        (parent?.children ?? items).filter(isFolder).forEach((s) => next.add(s.id));
        setOpen(next);
        return;
      }
    }
    // Typing jumps to the next row that starts with the typed letters.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = e.timeStamp;
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const q = typed.current.text;
      const order = [...rows.slice(i + (q.length > 1 ? 0 : 1)), ...rows.slice(0, i + (q.length > 1 ? 0 : 1))];
      go(order.find((r) => r.item.label.toLowerCase().startsWith(q)));
    }
  };

  /* ----- Drag and drop ----- */

  // Over a folder, the middle half drops inside; otherwise the top half drops before and the bottom half after.
  const whereOver = (e: DragEvent<HTMLLIElement>, item: TreeItem): Where => {
    const r = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    if (isFolder(item)) return y < 0.25 ? "before" : y > 0.75 ? "after" : "inside";
    return y < 0.5 ? "before" : "after";
  };
  const dragProps = (item: TreeItem) => (reorderable && !item.disabled ? {
    draggable: true,
    onDragStart: (e: DragEvent<HTMLLIElement>) => {
      dragId.current = item.id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.label);
    },
    onDragOver: (e: DragEvent<HTMLLIElement>) => {
      const id = dragId.current;
      if (!id || id === item.id) return;
      let inBranch = false;
      walk([byId.get(id)!], (it) => { if (it.id === item.id) inBranch = true; });
      if (inBranch) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const where = whereOver(e, item);
      if (drop?.id !== item.id || drop.where !== where) setDrop({ id: item.id, where });
    },
    onDrop: (e: DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      const id = dragId.current;
      const moved = id ? byId.get(id) : null;
      if (id && moved && reorder(id, item.id, whereOver(e, item))) {
        setMessage(`Moved ${moved.label} ${whereOver(e, item) === "inside" ? "into" : whereOver(e, item)} ${item.label}`);
      }
      dragId.current = null;
      setDrop(null);
    },
    onDragEnd: () => { dragId.current = null; setDrop(null); },
  } : {});

  return (
    <div className={[styles.tree, styles[size], showLines ? styles.lines : ""].join(" ")}>
      <ul role="tree" aria-label={label} aria-multiselectable={selection === "multiple" || undefined} className={styles.list} onKeyDown={onKeyDown}>
        {rows.map((row) => {
          const { item, level } = row;
          const folder = isFolder(item);
          const expanded = folder && open.has(item.id);
          const check = checks?.get(item.id);
          const isSelected = selection === "single" && selectedIds.includes(item.id);
          const onRow = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest(`.${styles.toggle}`)) return;
            setFocusId(item.id);
            activate(item);
            if (selection === "single" && folder) toggleOpen(item);
          };
          const dropHere = drop?.id === item.id ? drop.where : null;
          return (
            <li
              key={item.id}
              ref={(el) => { if (el) rowRefs.current.set(item.id, el); else rowRefs.current.delete(item.id); }}
              data-id={item.id} role="treeitem" tabIndex={current?.item.id === item.id ? 0 : -1}
              aria-level={level} aria-posinset={row.pos} aria-setsize={row.count}
              aria-expanded={folder ? expanded : undefined}
              aria-selected={selection === "single" ? isSelected : undefined}
              aria-checked={check ? (check === "mixed" ? "mixed" : check === "on") : undefined}
              aria-disabled={item.disabled || undefined}
              className={[
                styles.row, isSelected ? styles.selected : "", check === "on" ? styles.checked : "", item.disabled ? styles.disabled : "",
                dropHere ? styles[`drop-${dropHere}`] : "",
              ].join(" ")}
              onClick={onRow}
              onFocus={(e) => { if (e.target === e.currentTarget) setFocusId(item.id); }}
              {...dragProps(item)}
            >
              {Array.from({ length: level - 1 }, (_, k) => <span key={k} className={styles.guide} aria-hidden="true" />)}
              {/* The highlight covers only the row's content, so it stops short of the guide lines. */}
              <span className={styles.body}>
              {/* Only folders have a chevron cell; items without children line up with their parent's label, as in Figma. */}
              {folder ? (
                <span className={styles.toggle} aria-hidden="true" onClick={() => toggleOpen(item)}>
                  <Icon name="chevron_right" size="sm" className={[styles.chevron, expanded ? styles.open : ""].join(" ")} />
                </span>
              ) : level === 1 && <span className={styles.toggle} aria-hidden="true" />}
              {check && (
                // The row is the checked item; the kit Checkbox only shows it.
                <span className={styles.check} inert>
                  <Checkbox label={item.label} hideLabel size="sm" checked={check === "on"} indeterminate={check === "mixed"} disabled={item.disabled} />
                </span>
              )}
              {showIcons && <Icon name={item.icon ?? (folder ? (expanded ? "folder_open" : "folder") : "description")} size="sm" className={styles.icon} />}
              <span className={styles.label}>{item.label}</span>
              {reorderable && <Icon name="drag_indicator" size="sm" className={styles.handle} />}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.srOnly} aria-live="polite">{message}</p>
    </div>
  );
}
