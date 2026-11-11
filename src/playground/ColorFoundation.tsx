"use client";
import { useState } from "react";
import { Tabs } from "@/ui/Tabs/Tabs";
import { useCopy, type Copy } from "./useCopy";
import master from "./master.module.css";
import styles from "./color.module.css";
import type { Ramp, SemanticGroup } from "./tokens";

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  // Alpha values are shown composited over a static white base.
  const over = (c: number) => c * a + 255 * (1 - a);
  const lum = (0.299 * over(r) + 0.587 * over(g) + 0.114 * over(b)) / 255;
  return lum > 0.6;
};

function Group({ g, c }: { g: SemanticGroup; c: Copy }) {
  const subs = new Map<string, SemanticGroup["items"]>();
  for (const it of g.items) {
    const [head, ...rest] = it.name.split("/");
    // Roles with one level (surface/flat, link/brand) group under the role itself; nested ones under their family.
    const nested = g.items.some((x) => x.name.startsWith(head + "/"));
    const key = nested ? head : "";
    if (!subs.has(key)) subs.set(key, []);
    subs.get(key)!.push({ ...it, name: nested ? (rest.length ? rest.join(" ") : "default") : head });
  }
  return (
    <section className={styles.group}>
      <div className={styles.rampHead}>
        <h2 className={styles.rampTitle}>{g.title}</h2>
        <span className={styles.prefix}>{g.prefix}</span>
      </div>
      {[...subs].map(([sub, items]) => (
        <div key={sub} className={styles.subgroup}>
          {sub && <h3 className={styles.subTitle}>{sub}</h3>}
          <div className={styles.items}>
            {items.map((it) => {
              const done = c.copied === it.light;
              return (
                <button key={it.light} type="button" className={styles.item} onClick={() => c.copy(it.light, `var(${it.light})`)} aria-label={`Copy var(${it.light})`}>
                  <span className={styles.swatch} style={{ background: `var(${it.light})` }} />
                  <span>
                    <span className={styles.itemName} style={{ display: "block" }}>{it.name}</span>
                    <span className={styles.itemMeta} style={{ display: "block" }}>{it.light}</span>
                    <span className={`${styles.itemMeta} ${done ? styles.copied : ""}`} style={{ display: "block" }} aria-live="polite">
                      {done ? "Copied" : `light ${it.lightHex} · dark ${it.darkHex}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export function ColorFoundation({ ramps, scheme, semantics }: { ramps: Ramp[]; scheme: SemanticGroup[]; semantics: SemanticGroup[] }) {
  const [tab, setTab] = useState<"primitives" | "semantics" | "scheme">("primitives");
  const c = useCopy();
  const tabs = [["primitives", "Primitives"], ["semantics", "Semantics"], ["scheme", "Scheme"]] as const;
  return (
    <>
      <div className={master.pageTabs}>
        <Tabs label="Color tokens" value={tab} onChange={(id) => setTab(id as typeof tab)} items={tabs.map(([k, label]) => ({ id: k, label }))} />
      </div>
      <p className={master.hint}>Click a primitive to copy its hex. Click a semantic or scheme swatch to copy its token.</p>
      {tab === "primitives" && ramps.map((r) => (
        <section key={r.name} className={styles.ramp}>
          <div className={styles.rampHead}>
            <h2 className={styles.rampTitle}>{r.name.replace("/", " ")}</h2>
            <span className={styles.prefix}>{r.prefix}</span>
          </div>
          <div className={styles.steps} style={{ gridTemplateColumns: `repeat(${r.steps.length}, minmax(0, 1fr))` }}>
            {r.steps.map((s) => {
              const done = c.copied === s.name;
              return (
                <button key={s.name} type="button" className={`${styles.step} ${isLight(s.hex) ? styles.onLight : styles.onDark}`} style={{ background: s.hex.length > 7 ? `linear-gradient(var(${s.name}), var(${s.name})), var(--bg-neutral-min-static)` : `var(${s.name})` }} onClick={() => c.copy(s.name, s.hex)} aria-label={`Copy ${s.hex} for ${s.name}`}>
                  <span className={styles.stepNum}>{s.step}</span>
                  <span className={styles.stepMeta} aria-live="polite">{s.name}<br />{done ? "Copied" : s.hex}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {tab === "semantics" && (
        <>
          <p className={master.hint}>Roles components use. Never reference primitives or scheme steps directly.</p>
          {semantics.map((g) => <Group key={g.title} g={g} c={c} />)}
        </>
      )}
      {tab === "scheme" && (
        <>
          <p className={master.hint}>Scheme layer. Each step points at a palette value and flips between light and dark.</p>
          {scheme.map((g) => <Group key={g.title} g={g} c={c} />)}
        </>
      )}
    </>
  );
}
