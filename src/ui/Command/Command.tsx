"use client";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import styles from "./Command.module.css";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
}
export interface CommandGroup {
  heading?: string;
  items: CommandItem[];
}
export interface CommandProps {
  groups: CommandGroup[];
  label?: string;
  placeholder?: string;
  empty?: string;
  defaultQuery?: string;
  hints?: boolean;
  onSelect?: (id: string) => void;
}

export function Command({
  groups, label = "Search", placeholder = "Search by name, type, and more...", empty = "No matches found for this search.",
  defaultQuery = "", hints = true, onSelect,
}: CommandProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (id: string) => `${uid}-opt-${id}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [active, setActive] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, items: q ? g.items.filter((i) => `${i.label} ${i.description ?? ""}`.toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);
  const enabled = useMemo(() => visible.flatMap((g) => g.items.filter((i) => !i.disabled).map((i) => i.id)), [visible]);
  const activeId = active && enabled.includes(active) ? active : enabled[0] ?? null;
  const count = visible.reduce((n, g) => n + g.items.length, 0);

  // Keep the highlighted option in view inside the list, without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const el = activeId ? document.getElementById(`${uid}-opt-${activeId}`) : null;
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [activeId, uid]);

  const move = (step: number) => {
    if (!enabled.length) return;
    const i = activeId ? enabled.indexOf(activeId) : -1;
    setActive(enabled[(i + step + enabled.length) % enabled.length]);
  };
  const choose = (item: CommandItem) => {
    if (!item.disabled) onSelect?.(item.id);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const item = visible.flatMap((g) => g.items).find((i) => i.id === activeId);
      if (item) choose(item);
    }
    // Escape clears the query first. With an empty query it bubbles, so an overlay can close.
    else if (e.key === "Escape" && query) { e.preventDefault(); e.stopPropagation(); setQuery(""); }
  };

  return (
    <div className={styles.command}>
      <div className={styles.search}>
        <Icon name="search" size="md" className={styles.searchIcon} />
        <input
          ref={inputRef} type="text" role="combobox" className={styles.input} value={query} placeholder={placeholder}
          autoComplete="off" spellCheck={false} aria-label={label} aria-expanded="true" aria-controls={listId}
          aria-autocomplete="list" aria-activedescendant={activeId ? optionId(activeId) : undefined}
          onChange={(e) => { setQuery(e.target.value); setActive(null); }} onKeyDown={onKey}
        />
        {query && (
          <Button variant="tertiary" size="sm" iconOnly iconStart="close" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
            Clear search
          </Button>
        )}
      </div>
      <div ref={listRef} id={listId} role="listbox" aria-label={label} className={styles.list}>
        {visible.map((g, gi) => (
          <div key={g.heading ?? gi} role="group" aria-labelledby={g.heading ? `${uid}-g${gi}` : undefined} className={styles.group}>
            {g.heading && <div id={`${uid}-g${gi}`} className={styles.heading}>{g.heading}</div>}
            {g.items.map((item) => (
              <div
                key={item.id} id={optionId(item.id)} role="option" aria-selected={item.id === activeId} aria-disabled={item.disabled || undefined}
                className={[styles.item, item.id === activeId ? styles.active : ""].join(" ")}
                onMouseMove={() => !item.disabled && setActive(item.id)}
                // Keep focus in the search field while clicking.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
              >
                {item.icon && <Icon name={item.icon} size="md" className={styles.icon} />}
                <span className={styles.text}>
                  <span className={styles.label}>{item.label}</span>
                  {item.description && <span className={styles.description}>{item.description}</span>}
                </span>
                {item.shortcut && <kbd className={styles.key}>{item.shortcut}</kbd>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {visible.length === 0 && <div className={styles.empty}>{empty}</div>}
      <div className={styles.srOnly} role="status" aria-live="polite">{query ? `${count} result${count === 1 ? "" : "s"}` : ""}</div>
      {hints && (
        <div className={styles.footer} aria-hidden="true">
          <span className={styles.hint}>
            <kbd className={styles.key}><Icon name="arrow_upward" size="sm" /></kbd>
            <kbd className={styles.key}><Icon name="arrow_downward" size="sm" /></kbd>
            to browse
          </span>
          <span className={styles.hint}><kbd className={styles.key}>Enter</kbd>to select</span>
        </div>
      )}
    </div>
  );
}
