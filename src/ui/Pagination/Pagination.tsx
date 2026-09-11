"use client";
import { useState } from "react";
import { Button } from "../Button/Button";
import { Select } from "../Select/Select";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  total: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizes?: number[];
  showRange?: boolean;
  showPageSize?: boolean;
  label?: string;
}

const GAP = "gap";

// Up to 7 slots: every page when they fit, else the first, the last, the current with its neighbours, and a gap for the rest.
function pageList(page: number, count: number): (number | typeof GAP)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, GAP, count];
  if (page >= count - 3) return [1, GAP, count - 4, count - 3, count - 2, count - 1, count];
  return [1, GAP, page - 1, page, page + 1, GAP, count];
}

// Figma table footer 3187:39779: arrows and page boxes at the start, the range and a rows per page Select at the end.
export function Pagination({
  total, page: pageProp, defaultPage = 1, onPageChange, pageSize: sizeProp, defaultPageSize = 10, onPageSizeChange,
  pageSizes = [10, 25, 50, 100], showRange = true, showPageSize = true, label = "Pagination",
}: PaginationProps) {
  const [innerPage, setInnerPage] = useState(defaultPage);
  const [innerSize, setInnerSize] = useState(defaultPageSize);
  const size = Math.max(sizeProp ?? innerSize, 1);
  const count = Math.max(Math.ceil(Math.max(total, 0) / size), 1);
  const page = Math.min(Math.max(pageProp ?? innerPage, 1), count);

  const goTo = (next: number) => {
    const p = Math.min(Math.max(next, 1), count);
    if (p === page) return;
    if (pageProp === undefined) setInnerPage(p);
    onPageChange?.(p);
  };
  // A new page size keeps the first row that was showing on screen.
  const resize = (next: number) => {
    const first = (page - 1) * size + 1;
    const p = Math.floor((first - 1) / next) + 1;
    if (sizeProp === undefined) setInnerSize(next);
    onPageSizeChange?.(next);
    if (pageProp === undefined) setInnerPage(p);
    if (p !== page) onPageChange?.(p);
  };

  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <div className={styles.pagination}>
      <nav className={styles.pages} aria-label={label}>
        <Button variant="tertiary" size="sm" iconOnly iconStart="chevron_left" disabled={page <= 1} onClick={() => goTo(page - 1)}>Previous page</Button>
        {pageList(page, count).map((p, i) => p === GAP ? (
          <span key={`gap-${i}`} className={styles.gap} aria-hidden="true">…</span>
        ) : (
          <button
            key={p} type="button" className={[styles.page, p === page ? styles.current : ""].join(" ")}
            aria-current={p === page ? "page" : undefined} aria-label={`Page ${p}`} onClick={() => goTo(p)}
          >
            {p}
          </button>
        ))}
        <Button variant="tertiary" size="sm" iconOnly iconStart="chevron_right" disabled={page >= count} onClick={() => goTo(page + 1)}>Next page</Button>
      </nav>
      {(showRange || showPageSize) && (
        <div className={styles.end}>
          {showRange && <span className={styles.text} aria-live="polite">{`Showing ${from} to ${to} of ${total} rows`}</span>}
          {showPageSize && (
            <>
              <span className={styles.size}>
                <Select
                  size="sm" hideLabel label="Rows per page" options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
                  menuWidth="field" value={String(size)} onChange={(v) => resize(Number(Array.isArray(v) ? v[0] : v))}
                />
              </span>
              <span className={styles.text} aria-hidden="true">rows per page</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
