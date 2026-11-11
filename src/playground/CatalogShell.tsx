"use client";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import { Breadcrumb } from "@/ui/Breadcrumb/Breadcrumb";
import { CatalogSearch } from "./CatalogSearch";
import { catalogTrail } from "./nav";
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
  // Closing the drawer puts focus back on the button that opened it, which only exists once the menu is gone.
  const returning = useRef(false);

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
      returning.current = true;
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  // The drawer is gone by now, so the button that opens it is back on the page and can take focus.
  useEffect(() => {
    if (drawer || !returning.current) return;
    returning.current = false;
    buttonRef.current?.querySelector("button")?.focus();
  }, [drawer]);

  const shown = wide ? !collapsed : open;
  const label = wide ? (collapsed ? "Show menu" : "Hide menu") : (open ? "Close menu" : "Open menu");
  const icon = wide ? (collapsed ? "menu" : "menu_open") : (open ? "close" : "menu");

  const trail = catalogTrail(path);

  return (
    <div className={[styles.shell, collapsed ? styles.shellCollapsed : ""].join(" ")}>
      {/* The button that puts the menu away sits in the menu's own head, beside the mark. The one that brings it
          back is on the page, since a hidden menu would take its own way back with it. */}
      <Sidebar
        id={menuId} ref={menuRef} drawerOpen={drawer} shortcut={shortcut} onSearch={() => setSearching(true)}
        action={
          <span className={styles.menuClose}>
            <Button
              emphasis="minimal" size="sm" iconOnly iconStart={wide ? "menu_open" : "close"}
              aria-expanded={shown} aria-controls={menuId}
              onClick={() => (wide ? setCollapsed(true) : setOpen(false))}
            >
              {wide ? "Hide menu" : "Close menu"}
            </Button>
          </span>
        }
      />
      {drawer && <button type="button" className={styles.scrim} aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />}
      {/* While the drawer is open the page behind it is out of reach, so Tab stays in the menu. */}
      <main className={styles.main} inert={drawer || undefined}>
        {/* The page opens on its own row: the menu button, the trail, and light or dark at the end. The button
            lives here rather than in the menu because a hidden menu would take its own way back with it. The
            Overview at / is Home itself, so it has no trail. */}
        <div className={styles.pageBar}>
          {!shown && (
            <span ref={buttonRef} className={styles.menuButton}>
              <Button
                emphasis="minimal" size="sm" iconOnly iconStart={icon}
                aria-expanded={shown} aria-controls={menuId}
                onClick={() => (wide ? setCollapsed(false) : setOpen(true))}
              >
                {label}
              </Button>
            </span>
          )}
          {trail && <Breadcrumb separator="chevron" items={trail} />}
          <span className={styles.pageBarEnd}><ThemeControls /></span>
        </div>
        {children}
      </main>
      <CatalogSearch open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}
