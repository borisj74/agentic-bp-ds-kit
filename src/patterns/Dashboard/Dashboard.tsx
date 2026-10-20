"use client";
import type { ReactNode } from "react";
import { useStickyBand } from "../band";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import styles from "./Dashboard.module.css";

export type DashboardState = "ready" | "loading" | "empty";

export interface DashboardProps {
  children: ReactNode;
  toolbar?: ReactNode;
  name?: string;
  stickyToolbar?: boolean;
  state?: DashboardState;
  empty?: ReactNode;
  loadingTiles?: number;
  label?: string;
}

// A home screen that reports: the kit Toolbar over it, which dashboard is showing, and the groups of numbers
// underneath, each a kit Section holding a Scoreboard and the charts, tables and lists that explain it. A
// blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell page, under
// the PageHeader, which owns the page padding.
export function Dashboard({
  children, toolbar, name, stickyToolbar = true, state = "ready", empty, loadingTiles = 3, label,
}: DashboardProps) {
  const groups = state === "ready";
  // The bar is the band that holds at the top: the shared plumbing measures it and says where a Table in the
  // groups stops its column names, so they come to rest under the bar instead of crossing it. The tables are
  // spread through the groups rather than sitting under the bar, so the names are not part of the band.
  const { rootRef, barRef, shadowRef, style } = useStickyBand([toolbar, children, state], { names: false });
  return (
    <section
      ref={stickyToolbar ? (rootRef as React.Ref<HTMLElement>) : undefined}
      className={styles.dash} aria-label={label ?? "Dashboard"} aria-busy={state === "loading" || undefined}
      style={stickyToolbar ? style : undefined}
    >
      {/* The bar stays under the page header, so the filters are still there once the groups are scrolled. */}
      {toolbar && <div ref={barRef} className={[styles.bar, stickyToolbar ? styles.stuck : ""].join(" ")}>{toolbar}</div>}
      {/* The lift under the pinned bar, which the bar cannot cast itself: it keeps the page's side padding and
          this reaches the page edges. */}
      {toolbar && stickyToolbar && <div ref={shadowRef} aria-hidden="true" data-scroll-shadow="" className={styles.scrollShadow} />}
      {/* Which dashboard this is: a heading, not a control. Switching between saved ones is the bar's job. */}
      {name && <h2 className={["text-heading-xl", styles.name].join(" ")}>{name}</h2>}
      {groups && children}
      {state === "loading" && (
        // Blocks in the shape of the groups, so the page keeps its height until the numbers arrive.
        <div className={styles.loading}>
          {Array.from({ length: Math.max(1, loadingTiles) }, (_, i) => (
            <Skeleton key={i} shape="rect" height={200} label={i === 0 ? `Loading ${label ?? "dashboard"}` : "Loading"} />
          ))}
        </div>
      )}
      {state === "empty" && empty && <div className={styles.blank}>{empty}</div>}
    </section>
  );
}
