"use client";
import { useMemo, useState } from "react";
import { Button } from "../Button/Button";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import { Input } from "../Input/Input";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./ChatList.module.css";

export interface ChatListItem {
  id: string;
  label: string;
  icon?: string;
  menu?: DropdownMenuEntry[];
}

export interface ChatListGroup {
  id: string;
  label: string;
  items: ChatListItem[];
  defaultOpen?: boolean;
}

export interface ChatListMore {
  label: string;
  icon?: string;
  onClick?: () => void;
}

export interface ChatListProps {
  title: string;
  items?: ChatListItem[];
  groups?: ChatListGroup[];
  selected?: string;
  onSelect?: (id: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  createLabel?: string;
  onCreate?: () => void;
  closeLabel?: string;
  onClose?: () => void;
  more?: ChatListMore;
  onItemMenuSelect?: (itemId: string, actionId: string) => void;
  emptyLabel?: string;
}

function Row({
  item, selected, onSelect, onMenuSelect,
}: { item: ChatListItem; selected: boolean; onSelect?: (id: string) => void; onMenuSelect?: (itemId: string, actionId: string) => void }) {
  return (
    <li className={[styles.row, selected ? styles.selected : ""].join(" ")}>
      <button type="button" className={styles.open} aria-current={selected ? "true" : undefined} onClick={() => onSelect?.(item.id)}>
        <span className={styles.tile}><Icon name={item.icon ?? "forum"} size="sm" /></span>
        <span className={styles.label}>{item.label}</span>
      </button>
      {/* The row's own menu: rename, pin or delete. Quiet until the row is hovered or has focus. */}
      {item.menu && item.menu.length > 0 && (
        <span className={styles.rowMenu}>
          <DropdownMenu
            label={`Actions for ${item.label}`} items={item.menu} iconOnly icon="more_vert" variant="tertiary" size="sm"
            align="end" onSelect={(id) => onMenuSelect?.(item.id, id)}
          />
        </span>
      )}
    </li>
  );
}

// Figma BP AI chats 484:8820 and playbooks 484:8873: a titled panel with a search box, then the saved
// chats in groups, or the playbooks as one list, each row opening what it names.
export function ChatList({
  title, items, groups, selected, onSelect, searchable = true, searchPlaceholder,
  query, onQueryChange, createLabel = `Start new ${title.toLowerCase().replace(/s$/, "")}`, onCreate,
  closeLabel = `Close ${title.toLowerCase()}`, onClose, more, onItemMenuSelect, emptyLabel = "No matches.",
}: ChatListProps) {
  const [inner, setInner] = useState("");
  const q = (query === undefined ? inner : query).trim().toLowerCase();
  const [shut, setShut] = useState<string[]>([]);

  // Searching narrows the rows in place; empty groups drop out of the way.
  const shown = useMemo(() => {
    const keep = (list: ChatListItem[]) => (q ? list.filter((i) => i.label.toLowerCase().includes(q)) : list);
    if (groups) return groups.map((g) => ({ ...g, items: keep(g.items) })).filter((g) => g.items.length > 0);
    return [{ id: "all", label: "", items: keep(items ?? []), defaultOpen: true }];
  }, [groups, items, q]);
  const count = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className={styles.list} aria-label={title}>
      <header className={styles.head}>
        {onClose && (
          <Tooltip content={closeLabel}>
            <Button size="sm" variant="tertiary" iconOnly iconStart="close" onClick={onClose}>{closeLabel}</Button>
          </Tooltip>
        )}
        <h2 className={styles.title}>{title}</h2>
        {onCreate && (
          <Tooltip content={createLabel}>
            <Button size="sm" variant="tertiary" iconOnly iconStart="add_box" onClick={onCreate}>{createLabel}</Button>
          </Tooltip>
        )}
      </header>

      {searchable && (
        <div className={styles.search}>
          <Input
            label={searchPlaceholder ?? `Search in ${title.toLowerCase()}`} hideLabel size="sm" type="search"
            placeholder={searchPlaceholder ?? `Search in ${title.toLowerCase()} (Enter)`}
            value={query === undefined ? inner : query}
            onChange={(v) => { if (query === undefined) setInner(v); onQueryChange?.(v); }}
          />
        </div>
      )}

      <div className={styles.body}>
        {count === 0 && <p className={styles.empty}>{emptyLabel}</p>}
        {shown.map((group) => {
          const open = !shut.includes(group.id);
          return (
            <div key={group.id} className={styles.group}>
              {group.label && (
                <button
                  type="button" className={styles.groupHead} aria-expanded={open}
                  onClick={() => setShut(open ? [...shut, group.id] : shut.filter((g) => g !== group.id))}
                >
                  <Icon name="expand_more" size="sm" className={[styles.chevron, open ? "" : styles.shut].join(" ")} />
                  <span>{group.label}</span>
                </button>
              )}
              {open && (
                <ul className={styles.rows}>
                  {group.items.map((item) => (
                    <Row key={item.id} item={item} selected={selected === item.id} onSelect={onSelect} onMenuSelect={onItemMenuSelect} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {/* The last row reaches further back, like chats older than 30 days. */}
        {more && (
          <button type="button" className={[styles.open, styles.more].join(" ")} onClick={more.onClick}>
            <span className={styles.tile}><Icon name={more.icon ?? "calendar_month"} size="sm" /></span>
            <span className={styles.label}>{more.label}</span>
          </button>
        )}
      </div>
    </section>
  );
}
