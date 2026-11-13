"use client";
import { cloneElement, isValidElement, useCallback, useState, type ReactElement, type ReactNode } from "react";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { LoadingLine } from "@/ui/LoadingLine/LoadingLine";
import { BootContext, useBootPhase, type BootTiming } from "@/ui/LoadingLine/boot";
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
  bootTiming?: BootTiming;
}

// The frame a product screen sits in: the kit AppHeader across the top, the kit AppNav under it down the side,
// the kit ChatWindow beside it. A blueprint only: it composes kit pieces and keeps no state of its own.
// Structure follows contracts/layout.json: the scrolling page is a .layout-content, so its edge padding
// and the gap between Sections come from the layout tokens, not from the screen.
export function AppShell({
  children, header, nav, navOpen = false, onNavClose, pageHeader, stickyPageHeader = true, onPageHeaderStick,
  assistant, assistantOpen = false, assistantSize = "panel", width = "full", loading = false, loadingLabel = "Loading page", bootTiming,
}: AppShellProps) {
  // A reading column is the same container the layout classes use elsewhere.
  const column = width === "full" ? children : <div className={`layout-container-${width}`}>{children}</div>;
  // The marker above the page header says when the top of the page has scrolled away. The frame keeps that
  // boolean itself and hands it to the PageHeader, so every screen shrinks its name to the compact bar the same
  // way without wiring anything; onPageHeaderStick still reports it to screens that want it for their own use.
  const [stuck, setStuck] = useState(false);
  const onStick = useCallback((value: boolean) => {
    setStuck(value);
    onPageHeaderStick?.(value);
  }, [onPageHeaderStick]);
  const mark = useStickMark(onStick);

  // The frame keeps the boot sequence (contracts/loadingline.json, DSL-199): the line alone for 200ms, then the
  // skeleton for at least 400ms, then the content fading in over 150ms. A page that lands inside the first
  // 200ms never shows a skeleton at all.
  const boot = useBootPhase(loading, bootTiming);

  // The page inside the frame is still arriving too, so it goes to its own boot skeleton rather than standing
  // there live under a line. The frame says so once, on FormLayoutContext: the page pattern inside it
  // (ListPage, RecordPage, Dashboard, FormPage) boots with the frame, and so does every Section, Toolbar, field
  // and Table a screen lays out itself. The frame draws no page skeleton of its own — each piece draws its own,
  // in its own place, so nothing moves when the content lands. The real page is kept in the tree, inert and
  // hidden from screen readers, so it holds no focus and is read by nobody while it boots; the one status
  // message above it is what says the page is coming.
  const page = boot.showSkeleton ? (
    <FormLayoutContext.Provider value={{ loading: true }}>
      <span className={styles.srOnly} role="status">{loadingLabel}</span>
      {/* display: contents, so wrapping the page changes none of the content column's own spacing. */}
      <div className={styles.booting} inert aria-hidden="true">{column}</div>
    </FormLayoutContext.Provider>
  ) : column;

  // Booting, the whole frame is still arriving, so the bar and the rail show their own boot state too: the frame
  // hands the sequence's skeleton step down to the kit AppHeader, AppNav and PageHeader it was given, and a
  // screen wires nothing.
  type LoadProps = { loading?: boolean };
  const booting = (slot: ReactNode) =>
    boot.showSkeleton && isValidElement(slot) ? cloneElement(slot as ReactElement<LoadProps>, { loading: true }) : slot;

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
    // The sequence is published to everything inside the frame, so the chrome's skeletons and the page
    // pattern's appear and leave together instead of each keeping its own clock.
    <BootContext.Provider value={boot}>
      {/* data-frame says this is the frame: panels that float out of the bar or the rail (menus, tooltips, the
          search dropdown) keep inside it, so nothing hangs over what is beside a frame docked in a preview or a
          split view. */}
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
          {/* The page is still arriving: the 2px line sits level with the top of the rail, just under the bar's
              border, with its faint track across the column as the Cobalt boot frames draw it. It is laid over
              the page, so it adds no height. */}
          {boot.showLine && (
            <div className={styles.loadingLine}>
              <LoadingLine track="line" label={loadingLabel} />
            </div>
          )}
        {/* Only the page scrolls, so a sticky page header sticks and the bar and the rail stay put. */}
        <main
          className={["layout-content", styles.page, pageHeader && stickyPageHeader ? styles.pinnedHead : "", boot.settling ? styles.settling : ""].join(" ")}
          aria-busy={boot.phase !== "idle" || undefined}
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
    </BootContext.Provider>
  );
}
