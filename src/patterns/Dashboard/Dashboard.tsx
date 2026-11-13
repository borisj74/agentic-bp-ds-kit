"use client";
import type { ReactNode } from "react";
import { useStickyBand } from "../band";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton, useFieldSkeleton } from "@/ui/LoadingLine/boot";
import styles from "./Dashboard.module.css";

// The widths and heights a booting Home takes in the rows fallback: the lines of a message row, and the bars of
// one chart as a share of its box (BP COBALT node 2046:30349).
const BOOT_LINE = ["45%", "60%", "35%", "55%", "40%"];
const BOOT_DETAIL = ["84%", "68%"];
const BOOT_BARS = [0.31, 0.5, 0.39, 0.62, 0.47, 0.7];

export type DashboardState = "ready" | "loading" | "empty";
export type DashboardLoadingShape = "content" | "rows";

export interface DashboardProps {
  children: ReactNode;
  toolbar?: ReactNode;
  // When the numbers were read, like Updated 09:45 UTC: one quiet line under the bar.
  meta?: string;
  name?: string;
  stickyToolbar?: boolean;
  state?: DashboardState;
  empty?: ReactNode;
  loadingShape?: DashboardLoadingShape;
  loadingRows?: number;
  label?: string;
}

// A home screen that reports: the kit Toolbar over it, which dashboard is showing, and the groups of numbers
// underneath, each a kit Section holding a Scoreboard and the charts, tables and lists that explain it. A
// blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell page, under
// the PageHeader, which owns the page padding.
export function Dashboard({
  children, toolbar, meta, name, stickyToolbar = true, state = "ready", empty,
  loadingShape = "content", loadingRows = 5, label,
}: DashboardProps) {
  // The skeleton follows the frame's boot sequence; on its own it still draws at once.
  const { skeleton: own } = useBootSkeleton(state === "loading");
  // Inside a booting AppShell the page boots with the frame, so a screen says loading once, at the top, and the
  // pattern follows the frame's sequence instead of standing live under the line.
  const inFrame = useFieldSkeleton();
  const booting = own || inFrame;
  const groups = state === "ready";
  // content: the dashboard's own groups draw themselves — each Section its header, each Scoreboard its cards,
  // each chart its frame, each Table its rows — so the numbers land in the shape their bars held.
  const content = booting && loadingShape === "content";
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
      {/* Which dashboard this is: a heading, not a control. Switching between saved ones is the bar's job.
          Booting, the name keeps its line with a bar in it, so the groups do not slide up. */}
      {name && (
        booting ? (
          <h2 className={["text-heading-xl", styles.name].join(" ")}>
            <span className={styles.srOnly}>{name}</span>
            <Skeleton shape="rect" animation="pulse" width="var(--skeleton-bar-lg)" height="var(--font-size-xlarge)" label="" />
          </h2>
        ) : <h2 className={["text-heading-xl", styles.name].join(" ")}>{name}</h2>
      )}
      {booting && <span className={styles.srOnly} role="status">Loading {label ?? "dashboard"}</span>}
      {groups && children}
      {content && (
        // Booting, the groups are in the tree as bars, out of reach of the keyboard and out of the reading
        // order; the one status above says what is loading.
        <FormLayoutContext.Provider value={{ loading: true }}>
          <div className={styles.booting} inert aria-hidden="true">{children}</div>
        </FormLayoutContext.Provider>
      )}
      {booting && loadingShape === "rows" && (
        // rows: the fixed Home shape, for a dashboard that has no groups to follow yet (BP COBALT node
        // 2046:30349): the search band, then the two bordered cards Home lands on — a message list with its own
        // head row, and a dashboard card holding a framed chart — side by side in the kit's split, which stacks
        // them when there is no room for two.
        <div className={styles.rowsBoot}>
          <div className={styles.searchBand}>
            <Skeleton shape="rect" tone="band" animation="pulse" width="var(--skeleton-home-scope)" height="var(--control-small)" label="" />
            <Skeleton shape="rect" tone="band" animation="pulse" width="var(--skeleton-home-search)" height="var(--control-small)" label="" />
            <Skeleton shape="rect" tone="band" animation="pulse" width="var(--skeleton-home-search-button)" height="var(--control-small)" label="" />
            <span className={styles.bandEnd}>
              <Skeleton shape="rect" tone="band" animation="pulse" width="var(--skeleton-bar-sm)" height="var(--skeleton-cell)" label="" />
              <Skeleton shape="rect" tone="band" animation="pulse" width="var(--toolbar-more-skeleton)" height="var(--skeleton-cell)" label="" />
            </span>
          </div>
          <div className={[styles.cards, "layout-cards"].join(" ")}>
            <div className="layout-split">
              <div className={styles.card}>
                {/* A card's head: its name, how many there are, and the refresh that reads them again. */}
                <div className={styles.cardHead}>
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-record-label-lg)" height="var(--font-size-small)" label="" />
                  <Skeleton shape="rect" animation="pulse" width="var(--control-small)" height="var(--icon-size-small)" label="" />
                  <span className={styles.cardHeadEnd}>
                    <Skeleton shape="rect" animation="pulse" width="var(--icon-size-small)" height="var(--icon-size-small)" label="" />
                  </span>
                </div>
                {/* The head row of the list inside it, shaded the way a table's names are. */}
                <div className={styles.messageHead}>
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-column-name)" height="var(--skeleton-cell)" label="" />
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-column-name)" height="var(--skeleton-cell)" label="" />
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-column-name)" height="var(--skeleton-cell)" label="" />
                  <span />
                </div>
                {Array.from({ length: Math.max(1, loadingRows) }, (_, r) => (
                  <div key={r} className={styles.messageRow}>
                    <Skeleton shape="rect" animation="pulse" width="var(--skeleton-row-icon)" height="var(--skeleton-row-icon)" label="" />
                    <span className={styles.messageLines}>
                      <Skeleton shape="rect" animation="pulse" height="var(--skeleton-row-bar)" width={BOOT_LINE[r % BOOT_LINE.length]} label="" />
                      <Skeleton shape="rect" animation="pulse" height="var(--skeleton-cell)" width={BOOT_DETAIL[r % BOOT_DETAIL.length]} label="" />
                    </span>
                    <Skeleton shape="rect" animation="pulse" width="var(--skeleton-column-name)" height="var(--skeleton-cell)" label="" />
                    <Skeleton shape="rect" animation="pulse" width="var(--icon-size-large)" height="var(--icon-size-small)" label="" />
                  </div>
                ))}
              </div>
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-bar-sm)" height="var(--font-size-small)" label="" />
                </div>
                <div className={styles.chartBox}>
                  <Skeleton shape="rect" animation="pulse" width="var(--skeleton-chart-title)" height="var(--skeleton-row-bar)" label="" />
                  <div className={styles.chartBars}>
                    {BOOT_BARS.map((share, i) => (
                      // A share of the plot token, not a percentage of the box: a bar is the only thing in its
                      // own box, and a percentage there measures the box the bar itself sizes.
                      <Skeleton key={i} shape="rect" animation="pulse" height={`calc(${share} * var(--skeleton-chart-plot))`} label="" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {state === "empty" && empty && <div className={styles.blank}>{empty}</div>}
    </section>
  );
}
