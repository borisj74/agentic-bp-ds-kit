"use client";
import type { ReactNode } from "react";
import styles from "./SettingsPage.module.css";

export interface SettingsPageProps {
  children: ReactNode;
  intro?: ReactNode;
  label?: string;
}

// The settings home: a grid of kit Tiles, one per place people can go, each with its own color. A blueprint only: it composes kit pieces and keeps no state of its own. It sits in the AppShell
// page, under the PageHeader, which owns the page padding.
export function SettingsPage({ children, intro, label }: SettingsPageProps) {
  return (
    <section className={styles.settings} aria-label={label ?? "Settings"}>
      {intro && <div className={styles.intro}>{intro}</div>}
      {/* The tiles sit in the layout metrics grid, widened so a tile has room for its line of text. */}
      <div className={["layout-metrics", styles.grid].join(" ")}>{children}</div>
    </section>
  );
}
