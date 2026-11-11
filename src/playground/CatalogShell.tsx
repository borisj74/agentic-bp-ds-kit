"use client";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import { CatalogSearch } from "./CatalogSearch";
import { Sidebar } from "./Sidebar";
import { ThemeControls } from "./ThemeControls";
import styles from "./shell.module.css";

// The catalog frame: top bar, the catalog menu and the page. The menu button in the top bar does one of two jobs.
// At 768px and wider the menu sits beside the page, and the button hides it so the page takes the full width;
// the choice is kept in this browser. Under 768px there is no room beside the page, so the menu hides behind the
// button and slides in over the page as a drawer: picking a page, tapping the page behind it or Escape closes it.
const WIDE = "(min-width: 768px)";
const KEY = "catalog-menu";
const CHANGE = "catalog-menu-change";

function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getWide = () => window.matchMedia(WIDE).matches;

// Whether the desktop menu is hidden. localStorage is the source of truth; the event keeps this tab in step.
function subscribeCollapsed(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}
function getCollapsed() {
  try { return localStorage.getItem(KEY) === "hidden"; } catch { return false; }
}
function setCollapsed(hidden: boolean) {
  try { localStorage.setItem(KEY, hidden ? "hidden" : "shown"); } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

// The word for the ⌘K shortcut: a Mac says ⌘K, everything else Ctrl K. The server cannot know which, so it renders
// nothing and the browser's answer arrives on hydration. The platform never changes, so there is nothing to subscribe
// to, and the answer is worked out once so every read gives back the same string.
let shortcutWord: string | undefined;
function subscribeShortcut() {
  return () => {};
}
function getShortcut() {
  shortcutWord ??= /Mac|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";
  return shortcutWord;
}
const noShortcut = () => undefined;

export function CatalogShell({ children }: { children: ReactNode }) {
  const menuId = useId();
  const path = usePathname();
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, () => false);
  const [open, setOpen] = useState(false);
  // The ⌘K palette, and the word for the shortcut: the key only shows once the browser has told us which it is.
  const [searching, setSearching] = useState(false);
  const shortcut = useSyncExternalStore(subscribeShortcut, getShortcut, noShortcut);
  // The kit Button takes no ref, so the span around it is how focus finds its way back.
  const buttonRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const drawer = open && !wide;

  // A new page closes the drawer (adjusting state during render, no effect).
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    if (open) setOpen(false);
  }
  // Widening the window puts the menu back beside the page, so the drawer state has nothing left to do.
  if (open && wide) setOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    // Focus goes into the menu, so the keyboard lands where the eye does.
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.querySelector("button")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const shown = wide ? !collapsed : open;
  const label = wide ? (collapsed ? "Show menu" : "Hide menu") : (open ? "Close menu" : "Open menu");
  const icon = wide ? (collapsed ? "menu" : "menu_open") : (open ? "close" : "menu");

  return (
    <div className={[styles.shell, collapsed ? styles.shellCollapsed : ""].join(" ")}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span ref={buttonRef} className={styles.menuButton}>
            <Button
              emphasis="minimal" size="sm" iconOnly iconStart={icon}
              aria-expanded={shown} aria-controls={menuId}
              onClick={() => (wide ? setCollapsed(!collapsed) : setOpen((o) => !o))}
            >
              {label}
            </Button>
          </span>
          <span className={styles.brandName}>Agentic BP DS</span>
          <span className={styles.brandTag}>code-first design system</span>
        </div>
        <div className={styles.topbarRight}><ThemeControls /></div>
      </header>
      <Sidebar id={menuId} ref={menuRef} drawerOpen={drawer} shortcut={shortcut} onSearch={() => setSearching(true)} />
      {drawer && <button type="button" className={styles.scrim} aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />}
      {/* While the drawer is open the page behind it is out of reach, so Tab stays in the menu. */}
      <main className={styles.main} inert={drawer || undefined}>{children}</main>
      <CatalogSearch open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}
