"use client";
import type { ReactNode } from "react";
import { useStickMark } from "../stick";
import styles from "./AppShell.module.css";

export type AppShellWidth = "full" | "sm" | "md" | "lg" | "xl" | "2xl";
export type AppShellAssistantSize = "panel" | "full";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  nav?: ReactNode;
  navOpen?: boolean;
  onNavClose?: () => void;
  pageHeader?: ReactNode;
  stickyPageHeader?: boolean;
  onPageHeaderStick?: (stuck: boolean) => void;
  assistant?: ReactNode;
  assistantOpen?: boolean;
  assistantSize?: AppShellAssistantSize;
  width?: AppShellWidth;
}

// The frame a product screen sits in: the kit AppHeader across the top, the kit SideNav under it down the side,
// the kit ChatWindow beside it. A blueprint only: it composes kit pieces and keeps no state of its own.
// Structure follows contracts/layout.json: the scrolling page is a .layout-content, so its edge padding
// and the gap between Sections come from the layout tokens, not from the screen.
export function AppShell({
  children, header, nav, navOpen = false, onNavClose, pageHeader, stickyPageHeader = true, onPageHeaderStick,
  assistant, assistantOpen = false, assistantSize = "panel", width = "full",
}: AppShellProps) {
  // A reading column is the same container the layout classes use elsewhere.
  const page = width === "full" ? children : <div className={`layout-container-${width}`}>{children}</div>;
  // The marker above the page header says when the top of the page has scrolled away, so the screen can swap
  // the kit PageHeader to its own compact bar.
  const mark = useStickMark(onPageHeaderStick);
  return (
    // data-frame says this is the frame: panels that float out of the bar or the rail (menus, tooltips, the search
    // dropdown) keep inside it, so nothing hangs over what is beside a frame docked in a preview or a split view.
    <div className={styles.shell} data-frame="">
      {/* The bar runs the full width; the rail starts under it. */}
      {header}
      {/* A full assistant covers the page and its header, but the page stays mounted under it, and the assistant
          is the same element at either size, so neither loses its state or focus when the size swaps. */}
      <div className={[styles.stage, assistant && assistantOpen && assistantSize === "full" ? styles.fullAssistant : ""].join(" ")}>
        {/* The rail column takes whatever width the nav is, so collapsed, expanded and pinned all work.
            On a phone there is no room for a column, so the nav opens over the page instead, and the page
            behind it is covered by a sheet that closes it. */}
        {nav && <aside className={[styles.nav, navOpen ? styles.navOpen : ""].join(" ")}>{nav}</aside>}
        {nav && navOpen && onNavClose && (
          <button type="button" className={styles.scrim} aria-label="Close navigation" onClick={onNavClose} />
        )}
        {/* Only the page scrolls, so a sticky page header sticks and the bar and the rail stay put. */}
        <main className={["layout-content", styles.page].join(" ")}>
          {/* The page header stays at the top while the page scrolls under it. It pins flush to the top edge
              of the page rather than one inset below it, so no strip of page shows above the bar. */}
          {pageHeader && (
            <>
              {stickyPageHeader && onPageHeaderStick && <div ref={mark} className={styles.mark} aria-hidden="true" />}
              <div className={[styles.head, stickyPageHeader ? styles.stuck : ""].join(" ")}>{pageHeader}</div>
            </>
          )}
          {page}
        </main>
        {assistant && assistantOpen && <aside className={styles.assistant} aria-label="Assistant">{assistant}</aside>}
      </div>
    </div>
  );
}
