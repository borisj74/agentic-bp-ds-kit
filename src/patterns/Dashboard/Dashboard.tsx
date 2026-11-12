"use client";
import type { ReactNode } from "react";
import { useStickyBand } from "../band";
import { Section } from "@/ui/Section/Section";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton } from "@/ui/LoadingLine/boot";
import styles from "./Dashboard.module.css";

// The widths and heights a booting Home takes: a few rows of a message list, and one chart's bars.
const BOOT_LINE = ["45%", "60%", "35%", "55%", "40%"];
const BOOT_BARS = [48, 84, 60, 108, 72, 128];

export type DashboardState = "ready" | "loading" | "empty";

export interface DashboardProps {
  children: ReactNode;
  toolbar?: ReactNode;
  // When the numbers were read, like Updated 09:45 UTC: one quiet line under the bar.
  meta?: string;
  name?: string;
  stickyToolbar?: boolean;
  state?: DashboardState;
  empty?: ReactNode;
  loadingRows?: number;
  label?: string;
}

// A home screen that reports: the kit Toolbar over it, which dashboard is showing, and the groups of numbers
// underneath, each a kit Section holding a Scoreboard and the charts, tables and lists that explain it. A
// blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell page, under
// the PageHeader, which owns the page padding.
export function Dashboard({
  children, toolbar, meta, name, stickyToolbar = true, state = "ready", empty, loadingRows = 5, label,
}: DashboardProps) {
  // The skeleton follows the frame's boot sequence; on its own it still draws at once.
  const { skeleton: booting } = useBootSkeleton(state === "loading");
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
      {/* When the numbers were read, once for the whole page, under the bar that refreshes them. Sections and
          tables never repeat it. */}
      {meta && <p className={styles.meta}>{meta}</p>}
      {/* Which dashboard this is: a heading, not a control. Switching between saved ones is the bar's job. */}
      {name && state !== "loading" && <h2 className={["text-heading-xl", styles.name].join(" ")}>{name}</h2>}
      {groups && children}
      {booting && (
        // Booting (BP COBALT item 1, screen 55): the two blocks Home lands on — the rows of a message list and
        // one chart — side by side in the kit's split, which stacks them when there is no room for two.
        <div className="layout-cards">
          <div className="layout-split">
          <Section title={label ?? "Dashboard"} loading>
            <div className={styles.loadingList}>
              {Array.from({ length: Math.max(1, loadingRows) }, (_, r) => (
                <div key={r} className={styles.loadingListRow}>
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-cell)" height="var(--skeleton-cell)" label={r === 0 ? `Loading ${label ?? "dashboard"}` : ""} />
                  <div className={styles.loadingLines}>
                    <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_LINE[r % BOOT_LINE.length]} label="" />
                    <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width="90%" label="" />
                  </div>
                  <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" label="" />
                </div>
              ))}
            </div>
          </Section>
          <Section title="Charts" loading>
            <div className={styles.loadingChart}>
              {BOOT_BARS.map((h, i) => (
                <Skeleton key={i} shape="rect" animation="pulse" height={h} label="" />
              ))}
            </div>
          </Section>
          </div>
        </div>
      )}
      {state === "empty" && empty && <div className={styles.blank}>{empty}</div>}
    </section>
  );
}
