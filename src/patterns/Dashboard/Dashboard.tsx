"use client";
import type { ReactNode } from "react";
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
  return (
    <section className={styles.dash} aria-label={label ?? "Dashboard"} aria-busy={state === "loading" || undefined}>
      {/* The bar stays under the page header, so the filters are still there once the groups are scrolled. */}
      {toolbar && <div className={[styles.bar, stickyToolbar ? styles.stuck : ""].join(" ")}>{toolbar}</div>}
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
