"use client";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { Dropdown } from "../Dropdown/Dropdown";
import { Icon } from "../Icon/Icon";
import { Tabs } from "../Tabs/Tabs";
import styles from "./GlobalSearch.module.css";

export type GlobalSearchVariant = "list" | "tabs";
export type GlobalSearchIconStyle = "tile" | "plain";
export type GlobalSearchSize = "sm" | "md";

export interface GlobalSearchItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
}
export interface GlobalSearchGroup {
  heading?: string;
  items: GlobalSearchItem[];
}
export interface GlobalSearchScope {
  value: string;
  label: string;
}
export interface GlobalSearchProps {
  groups: GlobalSearchGroup[];
  variant?: GlobalSearchVariant;
  iconStyle?: GlobalSearchIconStyle;
  size?: GlobalSearchSize;
  label?: string;
  placeholder?: string;
  empty?: string;
  defaultQuery?: string;
  hints?: boolean;
  scopes?: GlobalSearchScope[];
  scope?: string;
  defaultScope?: string;
  onScopeChange?: (scope: string) => void;
  autoFocus?: boolean;
  onSelect?: (id: string) => void;
  onViewAll?: (query: string) => void;
}

// The typed text shows bold inside each matching label, like Sales in Sales Team.
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"));
  return parts.map((part, i) => (i % 2 ? <strong key={i} className={styles.match}>{part}</strong> : part));
}

export function GlobalSearch({
  groups, variant = "list", iconStyle = "tile", size = "md", label = "Search", placeholder = "Search by name, type, and more...", empty = "No matches found for this search.",
  defaultQuery = "", hints = true, scopes, scope, defaultScope, onScopeChange, autoFocus = false, onSelect, onViewAll,
}: GlobalSearchProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const scopeHintId = `${uid}-scope`;
  const optionId = (id: string) => `${uid}-opt-${id}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [active, setActive] = useState<string | null>(null);
  const [innerScope, setInnerScope] = useState(defaultScope ?? scopes?.[0]?.value ?? "");
  const currentScope = scope ?? innerScope;

  const [tab, setTab] = useState("all");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.map((g) => ({ ...g, items: q ? g.items.filter((i) => `${i.label} ${i.description ?? ""}`.toLowerCase().includes(q)) : g.items }));
  }, [groups, query]);
  // Tabs variant: All, then one tab per group heading. A heading tab shows only that group.
  const tabbed = variant === "tabs";
  const tabGroups = tabbed ? groups.map((g, i) => ({ id: `g${i}`, heading: g.heading })).filter((g) => g.heading) : [];
  const tabHeading = tabGroups.find((t) => t.id === tab)?.heading;
  const visible = matches.filter((g) => g.items.length > 0 && (!tabHeading || g.heading === tabHeading));
  // With onViewAll and a query, a last row runs the full search. It takes part in the arrow keys like any result.
  const viewAllId = `${uid}-all`;
  const viewAll = Boolean(onViewAll) && query.trim() !== "";
  const enabled = useMemo(
    () => [...visible.flatMap((g) => g.items.filter((i) => !i.disabled).map((i) => i.id)), ...(viewAll ? [viewAllId] : [])],
    [visible, viewAll, viewAllId],
  );
  // Nothing is highlighted until the pointer is over a row or the arrow keys move; Enter then falls back to the first result.
  const activeId = active && enabled.includes(active) ? active : null;
  const count = visible.reduce((n, g) => n + g.items.length, 0);

  // Opened from a trigger, like the AppHeader search: typing can start at once.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Keep the highlighted option in view inside the list, without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const el = activeId ? document.getElementById(activeId === viewAllId ? viewAllId : `${uid}-opt-${activeId}`) : null;
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [activeId, uid, viewAllId]);

  const move = (step: number) => {
    if (!enabled.length) return;
    const i = activeId ? enabled.indexOf(activeId) : -1;
    // From nothing: Down starts at the first result, Up at the last.
    setActive(i < 0 ? enabled[step > 0 ? 0 : enabled.length - 1] : enabled[(i + step + enabled.length) % enabled.length]);
  };
  const choose = (item: GlobalSearchItem) => {
    if (!item.disabled) onSelect?.(item.id);
  };
  // The scope menu hands focus back to its trigger first; move it to the search field after.
  const pickScope = (value: string) => {
    if (scope === undefined) setInnerScope(value);
    onScopeChange?.(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeId ?? enabled[0];
      if (target === viewAllId) { onViewAll?.(query.trim()); return; }
      const item = visible.flatMap((g) => g.items).find((i) => i.id === target);
      if (item) choose(item);
    }
    // Escape clears the query first. With an empty query it bubbles, so an overlay can close.
    else if (e.key === "Escape" && query) { e.preventDefault(); e.stopPropagation(); setQuery(""); }
  };

  const scopeLabel = scopes?.find((s) => s.value === currentScope)?.label ?? scopes?.[0]?.label;
  // With a query, each tab shows how many results it holds.
  const countOf = (heading?: string) => matches.filter((g) => !heading || g.heading === heading).reduce((n, g) => n + g.items.length, 0);
  const tabItems = [{ id: "all", label: "All" }, ...tabGroups.map((t) => ({ id: t.id, label: t.heading as string }))].map((t) => ({
    ...t, ...(query ? { count: countOf(t.id === "all" ? undefined : t.label), countLabel: "results" } : {}),
  }));

  return (
    <div className={[styles.command, styles[size], iconStyle === "plain" ? styles.plainIcons : ""].join(" ")}>
      <div className={styles.search}>
        <Icon name="search" size={size === "sm" ? "sm" : "md"} className={styles.searchIcon} />
        <input
          ref={inputRef} type="text" role="combobox" className={styles.input} value={query} placeholder={placeholder}
          autoComplete="off" spellCheck={false} aria-label={label} aria-expanded="true" aria-controls={listId}
          aria-autocomplete="list" aria-activedescendant={activeId ? (activeId === viewAllId ? viewAllId : optionId(activeId)) : undefined}
          onChange={(e) => { setQuery(e.target.value); setActive(null); }} onKeyDown={onKey}
        />
        {/* Small rows are too short for the clear button; Escape clears there. */}
        {query && size === "md" && (
          <Button variant="tertiary" size="sm" iconOnly iconStart="close" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
            Clear search
          </Button>
        )}
        {/* Scope narrows what the search looks through, like Products or Accounts. A kit Dropdown. */}
        {scopes && scopes.length > 0 && scopeLabel && (
          <span className={styles.scope}>
            <span id={scopeHintId} className={styles.srOnly}>Search in</span>
            <Dropdown
              label={scopeLabel} variant="tertiary" size="sm" alignment="right" describedBy={scopeHintId}
              items={scopes.map((s) => ({ id: s.value, label: s.label, selected: s.value === currentScope }))}
              onSelect={pickScope}
            />
          </span>
        )}
      </div>
      {tabbed && tabGroups.length > 0 && (
        <div className={styles.tabs}>
          <Tabs label={`${label} categories`} items={tabItems} value={tab} onChange={(id) => { setTab(id); setActive(null); }} />
        </div>
      )}
      <div ref={listRef} id={listId} role="listbox" aria-label={label} className={styles.list} onMouseLeave={() => setActive(null)}>
        {visible.map((g, gi) => (
          <div key={g.heading ?? gi} role="group" aria-labelledby={g.heading ? `${uid}-g${gi}` : undefined} className={styles.group}>
            {/* A single-category tab already names the group, so its heading is only for screen readers. */}
            {g.heading && <div id={`${uid}-g${gi}`} className={tabHeading ? styles.srOnly : styles.heading}>{g.heading}</div>}
            {g.items.map((item) => (
              <div
                key={item.id} id={optionId(item.id)} role="option" aria-selected={item.id === activeId} aria-disabled={item.disabled || undefined}
                className={[styles.item, item.id === activeId ? styles.active : ""].join(" ")}
                onMouseMove={() => !item.disabled && setActive(item.id)}
                // Keep focus in the search field while clicking.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
              >
                {item.icon && <span className={styles.tile}><Icon name={item.icon} size="md" /></span>}
                <span className={styles.text}>
                  <span className={styles.label}><Highlight text={item.label} query={query} /></span>
                  {item.description && <span className={styles.description}>{item.description}</span>}
                </span>
                {item.shortcut && <kbd className={styles.key}>{item.shortcut}</kbd>}
              </div>
            ))}
          </div>
        ))}
        {viewAll && (
          <div
            id={viewAllId} role="option" aria-selected={activeId === viewAllId}
            className={[styles.item, styles.viewAll, activeId === viewAllId ? styles.active : ""].join(" ")}
            onMouseMove={() => setActive(viewAllId)} onMouseDown={(e) => e.preventDefault()} onClick={() => onViewAll?.(query.trim())}
          >
            <span className={styles.text}><span>View all results for <strong>{query.trim()}</strong></span></span>
          </div>
        )}
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
