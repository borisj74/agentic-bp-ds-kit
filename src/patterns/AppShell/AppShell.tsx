"use client";
import { cloneElement, isValidElement, useCallback, useState, type ReactElement, type ReactNode } from "react";
import { LoadingLine } from "@/ui/LoadingLine/LoadingLine";
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
  loading?: boolean;
  loadingLabel?: string;
}

// The frame a product screen sits in: the kit AppHeader across the top, the kit AppNav under it down the side,
// the kit ChatWindow beside it. A blueprint only: it composes kit pieces and keeps no state of its own.
// Structure follows contracts/layout.json: the scrolling page is a .layout-content, so its edge padding
// and the gap between Sections come from the layout tokens, not from the screen.
export function AppShell({
  children, header, nav, navOpen = false, onNavClose, pageHeader, stickyPageHeader = true, onPageHeaderStick,
  assistant, assistantOpen = false, assistantSize = "panel", width = "full", loading = false, loadingLabel = "Loading page",
}: AppShellProps) {
  // A reading column is the same container the layout classes use elsewhere.
  const page = width === "full" ? children : <div className={`layout-container-${width}`}>{children}</div>;
  // The marker above the page header says when the top of the page has scrolled away. The frame keeps that
  // boolean itself and hands it to the PageHeader, so every screen shrinks its name to the compact bar the same
  // way without wiring anything; onPageHeaderStick still reports it to screens that want it for their own use.
  const [stuck, setStuck] = useState(false);
  const onStick = useCallback((value: boolean) => {
    setStuck(value);
    onPageHeaderStick?.(value);
  }, [onPageHeaderStick]);
  const mark = useStickMark(onStick);

  // Booting, the whole frame is still arriving, so the bar and the rail show their own boot state too: the frame
  // hands loading down to the kit AppHeader, AppNav and PageHeader it was given, and a screen wires nothing.
  type LoadProps = { loading?: boolean };
  const booting = (slot: ReactNode) =>
    loading && isValidElement(slot) ? cloneElement(slot as ReactElement<LoadProps>, { loading: true }) : slot;

  // A screen that sets sticky itself keeps what it set; everything else follows the frame. Whether the bar
  // draws its own edge is settled in CSS: a page with a pinned band under the bar carries the edge there.
  type HeadProps = { sticky?: boolean };
  const booted = booting(pageHeader);
  const head = stickyPageHeader && isValidElement(booted)
    ? cloneElement(booted as ReactElement<HeadProps>, {
      sticky: (booted as ReactElement<HeadProps>).props.sticky ?? stuck,
    })
    : booted;
  return (
    // data-frame says this is the frame: panels that float out of the bar or the rail (menus, tooltips, the search
    // dropdown) keep inside it, so nothing hangs over what is beside a frame docked in a preview or a split view.
    <div className={styles.shell} data-frame="">
      {/* The bar runs the full width; the rail starts under it. */}
      {booting(header)}
      {/* A full assistant covers the page and its header, but the page stays mounted under it, and the assistant
          is the same element at either size, so neither loses its state or focus when the size swaps. */}
      <div className={[styles.stage, assistant && assistantOpen && assistantSize === "full" ? styles.fullAssistant : ""].join(" ")}>
        {/* The rail column takes whatever width the nav is, so collapsed, expanded and pinned all work.
            On a phone there is no room for a column, so the nav opens over the page instead, and the page
            behind it is covered by a sheet that closes it. */}
        {nav && <aside className={[styles.nav, navOpen ? styles.navOpen : ""].join(" ")}>{booting(nav)}</aside>}
        {nav && navOpen && onNavClose && (
          <button type="button" className={styles.scrim} aria-label="Close navigation" onClick={onNavClose} />
        )}
        {/* The content column: the page, with the boot line laid over its top edge. A column of its own, so the
            line spans the content and nothing else — it starts where the rail ends and stops at the assistant. */}
        <div className={styles.column}>
          {/* The page is still arriving: the 2px line sits level with the top of the rail, riding the bar's own
              edge, so it has no track of its own and adds no height. */}
          {loading && (
            <div className={styles.loadingLine}>
              <LoadingLine track="none" label={loadingLabel} />
            </div>
          )}
        {/* Only the page scrolls, so a sticky page header sticks and the bar and the rail stay put. */}
        <main
          className={["layout-content", styles.page, pageHeader && stickyPageHeader ? styles.pinnedHead : ""].join(" ")}
          aria-busy={loading || undefined}
        >
          {/* The page header stays at the top while the page scrolls under it. It pins flush to the top edge
              of the page rather than one inset below it, so no strip of page shows above the bar. */}
          {pageHeader && (
            <>
              {stickyPageHeader && <div ref={mark} className={styles.mark} aria-hidden="true" />}
              <div className={[styles.head, stickyPageHeader ? styles.stuck : ""].join(" ")}>{head}</div>
            </>
          )}
          {page}
        </main>
        </div>
        {assistant && assistantOpen && <aside className={styles.assistant} aria-label="Assistant">{assistant}</aside>}
      </div>
    </div>
  );
}
