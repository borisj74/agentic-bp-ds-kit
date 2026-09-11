"use client";
import { useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./SideNav.module.css";

export interface SideNavLink { id: string; label: string; href?: string }
export interface SideNavDivider { divider: true }
export type SideNavChild = SideNavLink | SideNavDivider;
export interface SideNavItem { id: string; label: string; icon: string; href?: string; children?: SideNavChild[] }
export type SideNavEntry = SideNavItem | SideNavDivider;

export interface SideNavProps {
  items: SideNavEntry[];
  endItems?: SideNavItem[];
  current?: string;
  defaultCurrent?: string;
  onNavigate?: (id: string) => void;
  expanded?: boolean;
  pinned?: boolean;
  defaultPinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  label?: string;
}

// Menus up to this many links top-align with their section; each 2 more pull the menu up one row.
const ANCHOR = 6;
const isEntry = <T extends object>(e: T | SideNavDivider): e is T => !("divider" in e);
const linksOf = (item: SideNavItem) => (item.children ?? []).filter(isEntry<SideNavLink>);
const focusables = (el: HTMLElement | null) =>
  [...(el?.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])") ?? [])];

export function SideNav({
  items, endItems = [], current: currentProp, defaultCurrent, onNavigate, expanded = false,
  pinned: pinnedProp, defaultPinned = false, onPinnedChange, label = "Main",
}: SideNavProps) {
  const panelId = useId();
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pointer = useRef("mouse");
  const focusFirst = useRef(false);
  const [innerCurrent, setInnerCurrent] = useState(defaultCurrent);
  const [innerPinned, setInnerPinned] = useState(defaultPinned);
  // openId: the section whose menu is out. shownId keeps its links on screen while the menu rolls back in.
  const [openId, setOpenId] = useState<string | null>(null);
  const [shownId, setShownId] = useState<string | null>(null);
  const current = currentProp ?? innerCurrent;
  const pinned = pinnedProp ?? innerPinned;

  const sections = [...items.filter(isEntry<SideNavItem>), ...endItems];
  const byId = (id: string | null) => sections.find((s) => s.id === id);
  const currentSection = sections.find((s) => s.id === current || linksOf(s).some((l) => l.id === current));
  // Pinned keeps a menu docked: the last one opened, else the current section's.
  const menuItem = byId(shownId) ?? (pinned && currentSection?.children?.length ? currentSection : undefined);
  const menuOpen = Boolean(menuItem) && (pinned || openId !== null);

  const open = (id: string) => { setOpenId(id); setShownId(id); };
  const close = () => setOpenId(null);
  const setPinned = (next: boolean) => {
    if (pinnedProp === undefined) setInnerPinned(next);
    onPinnedChange?.(next);
  };
  const navigate = (id: string) => {
    if (currentProp === undefined) setInnerCurrent(id);
    onNavigate?.(id);
  };
  const cascadeOf = (id: string) => navRef.current?.querySelector<HTMLElement>(`[data-cascade="${CSS.escape(id)}"]`) ?? null;

  // Flyout: line the menu up with its section, keep it inside the nav's visible band (never over the header or
  // off screen), and cap its height so long menus scroll. Pinned menus are full height and skip this.
  useLayoutEffect(() => {
    const nav = navRef.current, panel = panelRef.current, list = listRef.current;
    if (!nav || !panel || !list) return;
    const edges = () => {
      panel.dataset.up = String(list.scrollTop > 0);
      panel.dataset.down = String(list.scrollTop + list.clientHeight < list.scrollHeight - 1);
    };
    const place = () => {
      if (!pinned && menuItem) {
        const row = nav.querySelector<HTMLElement>(`[data-section="${CSS.escape(menuItem.id)}"]`);
        const n = nav.getBoundingClientRect();
        const minTop = Math.max(0, -n.top);
        const maxBottom = Math.min(n.height, window.innerHeight - n.top);
        const natural = panel.offsetHeight - list.clientHeight + list.scrollHeight;
        const rowTop = row ? row.getBoundingClientRect().top - n.top : 0;
        const shift = Math.max(0, Math.ceil((linksOf(menuItem).length - ANCHOR) / 2)) * (row?.offsetHeight ?? 0);
        let top = Math.max(minTop, rowTop - shift);
        if (top + natural > maxBottom) top = Math.max(minTop, maxBottom - natural);
        panel.style.top = `${top}px`;
        panel.style.maxHeight = `${maxBottom - top}px`;
      } else {
        panel.style.top = "";
        panel.style.maxHeight = "";
      }
      edges();
    };
    place();
    list.addEventListener("scroll", edges);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      list.removeEventListener("scroll", edges);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [menuItem, pinned, expanded]);

  // After a keyboard open, move focus to the menu's first link once it is on screen.
  useLayoutEffect(() => {
    if (!openId || !focusFirst.current) return;
    focusFirst.current = false;
    listRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [openId]);

  const scrollList = (dir: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ top: dir * list.clientHeight * 0.75, behavior: smooth ? "smooth" : "auto" });
  };

  const onSectionEnter = (item: SideNavItem) => (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (item.children?.length) open(item.id);
    else if (!pinned) close();
  };
  // Click opens the section's first page, so sections without a menu still go somewhere. A tap opens the menu.
  const onSectionClick = (item: SideNavItem) => (e: MouseEvent) => {
    const first = linksOf(item)[0];
    if (pointer.current === "touch" && item.children?.length) {
      e.preventDefault();
      if (openId === item.id) close(); else open(item.id);
      return;
    }
    navigate(first?.id ?? item.id);
  };
  // The cascade button opens the menu and, from the keyboard, moves focus to its first link.
  const onCascade = (item: SideNavItem) => (e: MouseEvent) => {
    if (openId === item.id && !pinned) { close(); return; }
    open(item.id);
    focusFirst.current = e.detail === 0;
  };
  const onLinkClick = (link: SideNavLink) => () => {
    navigate(link.id);
    if (!pinned) close();
  };

  const onRailKey = (e: KeyboardEvent) => {
    // A Tooltip marks its own Escape handled; that one only hides the tooltip.
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    if (openId !== null && !pinned) close();
    else (document.activeElement as HTMLElement | null)?.blur();
  };
  // Escape goes back to the cascade button. Tab past the ends goes back to the rail, next to the section.
  const onPanelKey = (e: KeyboardEvent) => {
    const id = menuItem?.id;
    if (!id) return;
    const cascade = cascadeOf(id);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (!pinned) close();
      cascade?.focus();
      return;
    }
    if (e.key !== "Tab") return;
    const list = focusables(panelRef.current);
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i === 0) { e.preventDefault(); cascade?.focus(); }
    else if (!e.shiftKey && i === list.length - 1) {
      const rail = focusables(navRef.current).filter((el) => !panelRef.current?.contains(el));
      const next = rail[rail.indexOf(cascade as HTMLElement) + 1];
      if (next) { e.preventDefault(); if (!pinned) close(); next.focus(); }
    }
  };
  // Focus leaving the nav closes a flyout.
  const onBlur = (e: FocusEvent) => {
    if (!pinned && !navRef.current?.contains(e.relatedTarget as Node | null)) close();
  };

  const renderSection = (item: SideNavItem) => {
    const hasMenu = Boolean(item.children?.length);
    const href = linksOf(item)[0]?.href ?? item.href;
    const cls = [styles.section, currentSection?.id === item.id ? styles.current : "", menuOpen && menuItem?.id === item.id ? styles.open : ""].join(" ");
    const content = (<><Icon name={item.icon} size="lg" /><span className={styles.label}>{item.label}</span></>);
    const link = href ? (
      <a href={href} className={cls} aria-current={current === item.id ? "page" : undefined} onClick={onSectionClick(item)}>{content}</a>
    ) : (
      <button type="button" className={cls} aria-current={current === item.id ? "page" : undefined} onClick={onSectionClick(item)}>{content}</button>
    );
    return (
      <li key={item.id} className={styles.row} data-section={item.id} onPointerEnter={onSectionEnter(item)}>
        {/* Collapsed icons without a menu name themselves in a Tooltip; sections with a menu show it instead. */}
        {hasMenu ? link : <Tooltip content={item.label} placement="right" disabled={expanded}>{link}</Tooltip>}
        {hasMenu && (
          <button
            type="button" className={styles.cascade} data-cascade={item.id} aria-label={`${item.label} menu`}
            aria-expanded={menuOpen && menuItem?.id === item.id} aria-controls={panelId} onClick={onCascade(item)}
          >
            <Icon name="chevron_right" size="sm" />
          </button>
        )}
      </li>
    );
  };

  const titleId = `${panelId}-title`;
  return (
    <nav
      ref={navRef} aria-label={label}
      className={[styles.nav, expanded ? styles.expanded : "", pinned ? styles.pinned : ""].join(" ")}
      onPointerDown={(e) => { pointer.current = e.pointerType; }}
      onPointerLeave={(e) => { if (e.pointerType !== "touch" && !pinned) close(); }}
      onBlur={onBlur}
    >
      <div className={styles.rail} onKeyDown={onRailKey}>
        <ul className={styles.list}>
          {items.map((e, i) => (isEntry<SideNavItem>(e) ? renderSection(e) : <li key={`divider-${i}`} role="separator" className={styles.divider} />))}
        </ul>
        {endItems.length > 0 && <ul className={[styles.list, styles.end].join(" ")}>{endItems.map(renderSection)}</ul>}
      </div>
      <div ref={panelRef} id={panelId} className={styles.panel} data-open={menuOpen} inert={!menuOpen} onKeyDown={onPanelKey}>
        {menuItem && (
          <>
            <div className={styles.header}>
              <span id={titleId} className={styles.title}>{menuItem.label}</span>
              <Tooltip content={pinned ? "Close navigation" : "Pin navigation open"} placement="bottom">
                <Button
                  variant="tertiary" size="sm" iconOnly iconStart={pinned ? "close" : "keep"}
                  onClick={() => { if (pinned) close(); setPinned(!pinned); }}
                >
                  {pinned ? "Close navigation" : "Pin navigation open"}
                </Button>
              </Tooltip>
            </div>
            {/* Overflow rows scroll the menu. Mouse aids only: keyboard focus scrolls links into view. */}
            <button type="button" tabIndex={-1} aria-hidden="true" className={[styles.overflow, styles.up].join(" ")} onClick={() => scrollList(-1)}>
              <Icon name="expand_less" size="md" />
            </button>
            <ul ref={listRef} className={styles.links} aria-labelledby={titleId}>
              {(menuItem.children ?? []).map((c, i) => isEntry<SideNavLink>(c) ? (
                <li key={c.id}>
                  {c.href ? (
                    <a href={c.href} className={styles.link} aria-current={current === c.id ? "page" : undefined} onClick={onLinkClick(c)}>{c.label}</a>
                  ) : (
                    <button type="button" className={styles.link} aria-current={current === c.id ? "page" : undefined} onClick={onLinkClick(c)}>{c.label}</button>
                  )}
                </li>
              ) : <li key={`divider-${i}`} role="separator" className={styles.linkDivider} />)}
            </ul>
            <button type="button" tabIndex={-1} aria-hidden="true" className={[styles.overflow, styles.down].join(" ")} onClick={() => scrollList(1)}>
              <Icon name="expand_more" size="md" />
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
