"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { Input } from "@/ui/Input/Input";
import { Segmented } from "@/ui/Segmented/Segmented";
import styles from "./master.module.css";
import shell from "./shell.module.css";

export interface GalleryItem {
  name: string;
  href: string;
  intent?: string;
  category?: string;
  level?: string;
  tags?: string[];
  preview: ReactNode;
}

// The levels a component can have. Patterns are the templates and have their own gallery, so they are not here.
const LEVEL_OPTIONS = [
  { value: "all", label: "All" },
  { value: "atom", label: "Atom" },
  { value: "molecule", label: "Molecule" },
  { value: "organism", label: "Organism" },
];

// The component gallery with a search over it. Every word typed has to appear in the card's name, what it is for,
// its category or its index tags, so "date" finds DatePicker and Calendar and "chart" finds the charts and Legend.
// The level filter works with the search, not instead of it, and lives in the URL (?level=atom) so a filtered
// gallery can be linked and reloaded.
export function GallerySearch({ title, lead, items, noun = "components" }: { title: string; lead: string; items: GalleryItem[]; noun?: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const hasLevels = items.some((item) => item.level);
  const asked = (params.get("level") ?? "all").toLowerCase();
  const level = LEVEL_OPTIONS.some((option) => option.value === asked) ? asked : "all";

  const setLevel = (value: string) => {
    router.replace(value === "all" ? pathname : `${pathname}?level=${value}`, { scroll: false });
  };

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items.filter((item) => {
    if (level !== "all" && item.level !== level) return false;
    if (words.length === 0) return true;
    const text = [item.name, item.intent, item.category, ...(item.tags ?? [])].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  });
  const narrowed = words.length > 0 || level !== "all";

  return (
    <>
      {/* The page title on the start, the search on the end, their tops level. */}
      <div className={styles.galleryHead}>
        <div className={styles.galleryIntro}>
          <h1 className={shell.pageTitle}>{title}</h1>
          <p className={shell.pageLead}>{lead}</p>
        </div>
        <div className={`${styles.gallerySearch} ${hasLevels ? styles.gallerySearchWide : ""}`}>
          <div className={styles.galleryFilters}>
            <div className={styles.galleryInput}>
              <Input
                type="search" label={`Search ${noun}`} hideLabel iconStart="search"
                placeholder={`Search ${items.length} ${noun}`} value={query} onChange={setQuery}
              />
            </div>
            {hasLevels ? (
              <Segmented
                label="Level" hideLabel size="sm" options={LEVEL_OPTIONS} value={level} onChange={setLevel}
              />
            ) : null}
          </div>
          {/* Read out as the list narrows, so a screen reader hears what the search and the filter found. */}
          <span className={styles.galleryCount} role="status">
            {narrowed ? `${shown.length} of ${items.length} ${noun}` : `${items.length} ${noun}`}
          </span>
        </div>
      </div>
      {shown.length === 0 ? (
        <EmptyState
          icon="search_off" iconStyle="plain" headingLevel={2}
          title={query.trim() ? `No ${noun} match "${query.trim()}"` : `No ${noun} at this level`}
          description="Try a shorter word, or what the piece does, like table, date or chart."
        />
      ) : (
        <div className={styles.grid}>
          {shown.map((item) => (
            // The title link stretches over the whole card. The preview is inert, so its own links and buttons never nest inside the card link.
            <div key={item.name} className={styles.card}>
              <div className={styles.cardPreview} inert aria-hidden="true">{item.preview}</div>
              <div className={styles.cardBody}>
                <Link href={item.href} className={styles.cardTitle}>{item.name}</Link>
                <div className={styles.cardDesc}>{item.intent}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
