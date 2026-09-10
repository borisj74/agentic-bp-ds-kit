"use client";
import { useState } from "react";
import master from "./master.module.css";
import styles from "./scale.module.css";
import { useCopy } from "./useCopy";

export type ScaleRow = { token: string; value: string };
export type ScaleSection = { title: string; prefix: string; rows: ScaleRow[]; note?: string };
export type ScaleTab = { key: string; label: string; sections: ScaleSection[] };

export function ScaleFoundation({ tabs, visual }: { tabs: ScaleTab[]; visual: "bar" | "box" | "border" | "shadow" | "opacity" }) {
  const [tab, setTab] = useState(tabs[0].key);
  const c = useCopy();
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  return (
    <>
      <div className={master.tabs} role="tablist">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={[master.tab, tab === t.key ? master.tabActive : ""].join(" ")} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      <p className={master.hint}>Click any row to copy its token.</p>
      {active.sections.map((s) => (
        <section key={s.title}>
          <div className={styles.head}>
            <h2 className={styles.title}>{s.title}</h2>
            <span className={styles.prefix}>{s.prefix}</span>
          </div>
          {s.note && <p className={styles.note}>{s.note}</p>}
          {s.rows.map((r) => {
            const v = `var(--${r.token})`;
            const done = c.copied === r.token;
            return (
              <button key={r.token} type="button" className={styles.row} onClick={() => c.copy(r.token, v)} aria-label={`Copy ${v}`}>
                <span className={`${styles.key} ${done ? styles.copied : ""}`} aria-live="polite">{done ? "Copied" : `--${r.token}`}</span>
                <span className={styles.value}>{r.value}</span>
                <span>
                  {visual === "bar" && <span className={styles.bar} style={{ width: v, display: "block" }} />}
                  {visual === "box" && <span className={styles.box} style={{ borderRadius: v, display: "block" }} />}
                  {visual === "border" && <span className={styles.stroke} style={{ borderWidth: v, display: "block" }} />}
                  {visual === "opacity" && <span className={styles.checker}><span className={styles.fill} style={{ opacity: v }} /></span>}
                  {visual === "shadow" && <span className={styles.lift} style={{ boxShadow: v, display: "block" }} />}
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </>
  );
}
