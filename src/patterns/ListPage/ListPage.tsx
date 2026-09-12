"use client";
import type { ReactNode } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import styles from "./ListPage.module.css";

export type ListPageState = "ready" | "loading" | "empty" | "error";

export interface ListPageProps {
  children: ReactNode;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  bulk?: ReactNode;
  state?: ListPageState;
  empty?: ReactNode;
  error?: string;
  onRetry?: () => void;
  loadingRows?: number;
  label?: string;
}

// The list screen: the kit Toolbar over the rows, the kit Pagination under them, and the kit Empty,
// Skeleton or Alert standing in for the rows while there are none. A blueprint only: it composes kit
// pieces and keeps no state of its own. It sits in the AppShell page, which owns the page padding.
export function ListPage({
  children, toolbar, pagination, bulk, state = "ready", empty, error, onRetry, loadingRows = 6, label,
}: ListPageProps) {
  const rows = state === "ready";
  return (
    <section className={styles.list} aria-label={label ?? "List"} aria-busy={state === "loading" || undefined}>
      {/* While rows are ticked, what can be done to them takes the bar's place. */}
      {bulk ? <div className={styles.bulk}>{bulk}</div> : toolbar}
      {/* The rows and their pages are one block: the page bar is the table's footer, flush under it. */}
      <div className={styles.body}>
        {rows && children}
        {state === "loading" && (
          // Lines in the shape of the rows, so the page keeps its height until they arrive.
          <div className={styles.loading}>
            <Skeleton shape="text" lines={Math.max(1, loadingRows)} label={`Loading ${label ?? "list"}`} />
          </div>
        )}
        {state === "empty" && empty && <div className={styles.blank}>{empty}</div>}
        {state === "error" && error && (
          <div className={styles.blank}>
            <Alert tone="danger" actionLabel={onRetry ? "Try again" : undefined} onAction={onRetry}>{error}</Alert>
          </div>
        )}
        {/* The pages go while something else is standing in for the rows. */}
        {rows && pagination}
      </div>
    </section>
  );
}
