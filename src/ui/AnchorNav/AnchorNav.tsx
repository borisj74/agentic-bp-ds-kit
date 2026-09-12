"use client";
import { useEffect, useState, type MouseEvent } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./AnchorNav.module.css";

export type AnchorNavVariant = "rail" | "menu";

export interface AnchorNavItem {
  id: string;
  label: string;
}

export interface AnchorNavProps {
  items: AnchorNavItem[];
  active?: string;
  defaultActive?: string;
  onActiveChange?: (id: string) => void;
  variant?: AnchorNavVariant;
  spy?: boolean;
  offset?: number;
  label?: string;
}

// Figma anchor 5410:109926 and anchor popup 5410:109935: one line down the side, a caret on the section
// the page is at, and the text stepped in past it.
export function AnchorNav({
  items, active, defaultActive, onActiveChange, variant = "rail", spy = true, offset = 0, label = "On this page",
}: AnchorNavProps) {
  const [inner, setInner] = useState(defaultActive ?? items[0]?.id ?? "");
  const current = active === undefined ? inner : active;

  const move = (id: string) => {
    if (active === undefined) setInner(id);
    onActiveChange?.(id);
  };

  // Following the page: the section nearest the top of the screen, under any sticky header, wins.
  useEffect(() => {
    if (!spy || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<string, boolean>();
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const at = items.find((it) => seen.get(it.id));
        if (at) {
          if (active === undefined) setInner(at.id);
          onActiveChange?.(at.id);
        }
      },
      { rootMargin: `-${offset}px 0px -60% 0px` },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) watch.observe(el);
    }
    return () => watch.disconnect();
    // onActiveChange is left out on purpose: an inline handler would restart the watch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, spy, offset, active]);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // scroll-margin carries the offset, so this works whether the page or a panel does the scrolling.
    if (offset) el.style.scrollMarginBlockStart = `${offset}px`;
    el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    // The section itself takes focus, so the keyboard carries on from there.
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    move(id);
  };

  return (
    <nav className={[styles.nav, styles[variant]].join(" ")} aria-label={label}>
      <ol className={styles.list}>
        {items.map((item) => {
          const at = current === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`} className={[styles.item, at ? styles.current : ""].join(" ")}
                aria-current={at ? "location" : undefined} onClick={(e) => go(e, item.id)}
              >
                {/* The caret keeps its space on every row, so the text stays in one line down the nav. */}
                <span className={styles.caret} aria-hidden="true"><Icon name="arrow_right" size="sm" filled /></span>
                <span className={styles.text}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
