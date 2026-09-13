"use client";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import { Sidebar } from "./Sidebar";
import { ThemeControls } from "./ThemeControls";
import styles from "./shell.module.css";

// The catalog frame: top bar, the catalog menu and the page. Under 768px there is no room for the menu beside the
// page, so it hides behind a menu button in the top bar and slides in over the page as a drawer. Picking a page,
// tapping the page behind it or Escape closes it; at 768px and wider it is always beside the page.
const WIDE = "(min-width: 768px)";

export function CatalogShell({ children }: { children: ReactNode }) {
  const menuId = useId();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // The kit Button takes no ref, so the span around it is how focus finds its way back.
  const buttonRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  // A new page closes the drawer (adjusting state during render, no effect).
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    // Focus goes into the menu, so the keyboard lands where the eye does.
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.querySelector("button")?.focus();
    };
    // Widening the window puts the menu back beside the page, so the drawer state has nothing left to do.
    const wide = window.matchMedia(WIDE);
    const onWide = () => { if (wide.matches) setOpen(false); };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span ref={buttonRef} className={styles.menuButton}>
            <Button
              variant="tertiary" size="sm" iconOnly iconStart={open ? "close" : "menu"}
              aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((o) => !o)}
            >
              {open ? "Close menu" : "Open menu"}
            </Button>
          </span>
          <span className={styles.brandName}>Agentic BP DS</span>
          <span className={styles.brandTag}>code-only design system</span>
        </div>
        <div className={styles.topbarRight}><ThemeControls /></div>
      </header>
      <Sidebar id={menuId} ref={menuRef} drawerOpen={open} />
      {open && <button type="button" className={styles.scrim} aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />}
      {/* While the drawer is open the page behind it is out of reach, so Tab stays in the menu. */}
      <main className={styles.main} inert={open || undefined}>{children}</main>
    </div>
  );
}
