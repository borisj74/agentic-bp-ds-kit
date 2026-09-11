"use client";
import { useState } from "react";
import { Tabs } from "@/ui/Tabs/Tabs";
import master from "./master.module.css";
import styles from "./motion.module.css";
import { useCopy, type Copy } from "./useCopy";

export type MotionTile = { label: string; meta: string; duration: string; ease: string; copy: string; mono?: boolean };
export type MotionGroup = { title: string; note?: string; tiles: MotionTile[]; usage?: [string, string][] };
export type MotionTab = { key: string; label: string; groups: MotionGroup[] };

function Tile({ t, c }: { t: MotionTile; c: Copy }) {
  const [on, setOn] = useState(false);
  const done = c.copied === t.copy;
  return (
    <button
      type="button"
      className={styles.tile}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      onClick={() => c.copy(t.copy, t.copy)}
      aria-label={`Copy ${t.copy}`}
    >
      <span className={styles.stage} aria-hidden="true">
        <span className={`${styles.dot} ${on ? styles.on : ""}`} style={{ transitionDuration: `var(${t.duration})`, transitionTimingFunction: `var(${t.ease})` }} />
      </span>
      <span className={`${styles.label} ${t.mono ? styles.mono : ""}`}>{t.label}</span>
      <span className={`${styles.meta} ${done ? styles.copied : ""}`} aria-live="polite">{done ? "Copied" : t.meta}</span>
    </button>
  );
}

export function MotionFoundation({ tabs }: { tabs: MotionTab[] }) {
  const [tab, setTab] = useState(tabs[0].key);
  const c = useCopy();
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  return (
    <>
      <div className={master.pageTabs}>
        <Tabs label="Motion tokens" value={tab} onChange={(id) => setTab(id as typeof tab)} items={tabs.map((t) => ({ id: t.key, label: t.label }))} />
      </div>
      <p className={master.hint}>Hover or focus a tile to play it. Click to copy its tokens.</p>
      {active.groups.map((g) => (
        <section key={g.title}>
          <h2 className={styles.head}>{g.title}</h2>
          {g.note && <p className={styles.note}>{g.note}</p>}
          {g.tiles.length > 0 && (
            <div className={styles.grid}>
              {g.tiles.map((t) => <Tile key={t.label + t.copy} t={t} c={c} />)}
            </div>
          )}
          {g.usage && (
            <dl className={styles.usage}>
              {g.usage.map(([k, v]) => (
                <div key={k} className={styles.usageRow}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </>
  );
}
