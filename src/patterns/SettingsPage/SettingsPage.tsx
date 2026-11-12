"use client";
import type { ReactNode } from "react";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { useBootSkeleton } from "@/ui/LoadingLine/boot";
import styles from "./SettingsPage.module.css";

export interface SettingsPageProps {
  children: ReactNode;
  intro?: ReactNode;
  loading?: boolean;
  loadingTiles?: number;
  label?: string;
}

// The settings home: a grid of kit Tiles, one per place people can go, each with its own color. A blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell
// page, under the PageHeader, which owns the page padding.
export function SettingsPage({ children, intro, loading = false, loadingTiles = 6, label }: SettingsPageProps) {
  // The skeleton follows the frame's boot sequence; on its own, outside a booting frame, it draws at once.
  const { skeleton: booting } = useBootSkeleton(loading);
  return (
    <section className={styles.settings} aria-label={label ?? "Settings"}>
      {intro && !booting && <div className={styles.intro}>{intro}</div>}
      {/* The tiles sit in the layout metrics grid, widened so a tile has room for its line of text. */}
      <div className={["layout-metrics", styles.grid].join(" ")}>
        {/* Booting: a plain block the size of a tile, in the same grid, so the page keeps its shape and nothing
            moves when the ways in arrive. A tile is a box with a name and a line in it, and a skeleton draws
            none of that — the block is the tile. */}
        {booting
          ? Array.from({ length: Math.max(1, loadingTiles) }, (_, i) => (
            <Skeleton
              key={i} shape="rect" animation="pulse" height="var(--skeleton-tile)"
              label={i === 0 ? `Loading ${label ?? "settings"}` : ""}
            />
          ))
          : children}
      </div>
    </section>
  );
}
