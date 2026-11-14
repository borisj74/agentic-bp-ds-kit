"use client";
import { useContext, type ReactNode } from "react";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton, useFieldSkeleton } from "@/ui/LoadingLine/boot";
import styles from "./SettingsPage.module.css";
import { inspect } from "../../ui/inspect";

export type SettingsPageLoadingShape = "content" | "rows";

export interface SettingsPageProps {
  children: ReactNode;
  intro?: ReactNode;
  loading?: boolean;
  loadingShape?: SettingsPageLoadingShape;
  loadingTiles?: number;
  label?: string;
}

// The settings home: a grid of kit Tiles, one per place people can go, each with its own color. A blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell
// page, under the PageHeader, which owns the page padding.
export function SettingsPage({ children, intro, loading = false, loadingShape = "content", loadingTiles = 6, label }: SettingsPageProps) {
  // The skeleton follows the frame's boot sequence; on its own, outside a booting frame, it draws at once.
  const { skeleton: own } = useBootSkeleton(loading);
  // Inside a booting AppShell the pattern boots with the frame, so a screen says loading once, at the top, and
  // the home follows the frame's sequence instead of standing live under the line.
  const inFrame = useFieldSkeleton();
  const booting = own || inFrame;
  // content: the tiles the page was given draw themselves, so the grid boots with as many places as the page
  // has and each lands in the shape its bars held.
  const content = booting && loadingShape === "content";
  // What the page around the home had set, so nothing else it publishes is lost when the tiles are told to boot.
  const outer = useContext(FormLayoutContext);
  const grid = ["layout-metrics", styles.grid].join(" ");

  // The tiles as bars: they stay in the grid, each drawing itself where it will stand, out of the keyboard's
  // reach and out of the reading order. The one status below says what is loading.
  const tiles = content ? (
    <FormLayoutContext.Provider value={{ ...outer, loading: true }}>
      <div className={grid} inert aria-hidden="true">{children}</div>
    </FormLayoutContext.Provider>
  ) : (
    <div className={grid}>
      {/* The rows fallback: a plain block the size of a tile, in the same grid, for a home with no tiles to
          follow yet. */}
      {booting
        ? Array.from({ length: Math.max(1, loadingTiles) }, (_, i) => (
          <Skeleton key={i} shape="rect" animation="pulse" height="var(--skeleton-tile)" label="" />
        ))
        : children}
    </div>
  );

  return (
    <section {...inspect("SettingsPage")} className={styles.settings} aria-label={label ?? "Settings"}>
      {/* Said once for the whole home, however many bars the tiles come to. */}
      {booting && <span className={styles.srOnly} role="status">Loading {label ?? "settings"}</span>}
      {/* Booting, the intro itself holds the space it will take — it is in the tree, out of sight and out of the
          reading order — and one block covers it, so the tiles below do not move whether the notice runs to one
          line or three. */}
      {intro && (
        <div className={styles.intro}>
          {booting ? (
            <div className={styles.introBoot}>
              <div className={styles.introGhost} inert aria-hidden="true">{intro}</div>
              <Skeleton shape="rect" animation="pulse" height="100%" label="" />
            </div>
          ) : intro}
        </div>
      )}
      {tiles}
    </section>
  );
}
