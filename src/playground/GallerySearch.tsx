"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { Input } from "@/ui/Input/Input";
import styles from "./master.module.css";
import shell from "./shell.module.css";

export interface GalleryItem {
  name: string;
  href: string;
  intent?: string;
  category?: string;
  tags?: string[];
  preview: ReactNode;
}

// The component gallery with a search over it. Every word typed has to appear in the card's name, what it is for,
// its category or its index tags, so "date" finds DatePicker and Calendar and "chart" finds the charts and Legend.
export function GallerySearch({ title, lead, items, noun = "components" }: { title: string; lead: string; items: GalleryItem[]; noun?: string }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = words.length === 0 ? items : items.filter((item) => {
    const text = [item.name, item.intent, item.category, ...(item.tags ?? [])].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  });

  return (
    <>
      {/* The page title on the start, the search on the end, their tops level. */}
      <div className={styles.galleryHead}>
        <div className={styles.galleryIntro}>
          <h1 className={shell.pageTitle}>{title}</h1>
          <p className={shell.pageLead}>{lead}</p>
        </div>
        <div className={styles.gallerySearch}>
          <Input
            type="search" label={`Search ${noun}`} hideLabel iconStart="search"
            placeholder={`Search ${items.length} ${noun}`} value={query} onChange={setQuery}
          />
          {/* Read out as the list narrows, so a screen reader hears what the search found. */}
          <span className={styles.galleryCount} role="status">
            {words.length === 0 ? `${items.length} ${noun}` : `${shown.length} of ${items.length} ${noun}`}
          </span>
        </div>
      </div>
      {shown.length === 0 ? (
        <EmptyState
          icon="search_off" iconStyle="plain" headingLevel={2}
          title={`No ${noun} match "${query.trim()}"`}
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
