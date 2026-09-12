"use client";
import type { ReactNode } from "react";
import { useStickMark } from "../stick";
import styles from "./AppShell.module.css";

export type AppShellWidth = "full" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  nav?: ReactNode;
  pageHeader?: ReactNode;
  stickyPageHeader?: boolean;
  onPageHeaderStick?: (stuck: boolean) => void;
  assistant?: ReactNode;
  assistantOpen?: boolean;
  width?: AppShellWidth;
}

// The frame a product screen sits in: the kit AppHeader across the top, the kit SideNav under it down the side,
// the kit ChatWindow beside it. A blueprint only: it composes kit pieces and keeps no state of its own.
// Structure follows contracts/layout.json: the scrolling page is a .layout-content, so its edge padding
// and the gap between Sections come from the layout tokens, not from the screen.
export function AppShell({
  children, header, nav, pageHeader, stickyPageHeader = true, onPageHeaderStick,
  assistant, assistantOpen = false, width = "full",
}: AppShellProps) {
  // A reading column is the same container the layout classes use elsewhere.
  const page = width === "full" ? children : <div className={`layout-container-${width}`}>{children}</div>;
  // The marker above the page header says when the top of the page has scrolled away, so the screen can swap
  // the kit PageHeader to its own compact bar.
  const mark = useStickMark(onPageHeaderStick);
  return (
    <div className={styles.shell}>
      {/* The bar runs the full width; the rail starts under it. */}
      {header}
      <div className={styles.stage}>
        {/* The rail column takes whatever width the nav is, so collapsed, expanded and pinned all work. */}
        {nav && <aside className={styles.nav}>{nav}</aside>}
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
