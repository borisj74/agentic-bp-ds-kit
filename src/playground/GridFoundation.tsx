"use client";
import { useState } from "react";
import { Tabs } from "@/ui/Tabs/Tabs";
import { Button } from "@/ui/Button/Button";
import master from "./master.module.css";
import rowStyles from "./scale.module.css";
import styles from "./grid.module.css";
import { useCopy, type Copy } from "./useCopy";

type Visual = "var" | "fraction" | "columns";
type Row = { token: string; value: string; visual?: Visual; frac?: number };
type Section = { title: string; prefix: string; note?: string; rows: Row[] };

const frac = (px: number) => px / 1920;

const semanticRows: Section[] = [
  { title: "App shell", prefix: "--layout-sidebar · --layout-rail", rows: [
    { token: "layout-sidebar", value: "224px", visual: "var" },
    { token: "layout-rail", value: "352px", visual: "var" },
    { token: "layout-metrics-min", value: "192px", visual: "var" },
  ] },
  { title: "Gutter", prefix: "--layout-gutter-*", note: "Space between columns and cards.", rows: [
    { token: "layout-gutter-sm", value: "12px", visual: "var" }, { token: "layout-gutter-md", value: "16px", visual: "var" },
    { token: "layout-gutter-lg", value: "24px", visual: "var" }, { token: "layout-gutter-xl", value: "40px", visual: "var" },
  ] },
  { title: "Margin", prefix: "--layout-margin-*", note: "Page inset around content.", rows: [
    { token: "layout-margin-sm", value: "16px", visual: "var" }, { token: "layout-margin-md", value: "24px", visual: "var" },
    { token: "layout-margin-lg", value: "40px", visual: "var" },
  ] },
  { title: "Containers", prefix: ".layout-container-*", note: "Centered max-width shells for docs and marketing. Prefer the product patterns above for app screens.", rows: [
    { token: "layout-container-sm", value: "640px", visual: "fraction", frac: frac(640) },
    { token: "layout-container-md", value: "1024px", visual: "fraction", frac: frac(1024) },
    { token: "layout-container-lg", value: "1280px", visual: "fraction", frac: frac(1280) },
    { token: "layout-container-xl", value: "1440px", visual: "fraction", frac: frac(1440) },
    { token: "layout-container-2xl", value: "1920px", visual: "fraction", frac: frac(1920) },
  ] },
];

const primitiveRows: Section[] = [
  { title: "Columns", prefix: "--grid-columns", rows: [{ token: "grid-columns", value: "12", visual: "columns" }] },
  { title: "Gutters", prefix: "--grid-gutter-*", rows: [
    { token: "grid-gutter-sm", value: "12px", visual: "var" }, { token: "grid-gutter-md", value: "16px", visual: "var" },
    { token: "grid-gutter-lg", value: "24px", visual: "var" }, { token: "grid-gutter-xl", value: "40px", visual: "var" },
  ] },
  { title: "Margins", prefix: "--grid-margin-*", rows: [
    { token: "grid-margin-sm", value: "16px", visual: "var" }, { token: "grid-margin-md", value: "24px", visual: "var" },
    { token: "grid-margin-lg", value: "40px", visual: "var" },
  ] },
  { title: "Widths", prefix: "--grid-width-*", rows: [640, 1024, 1280, 1440, 1920].map((px, i) => ({
    token: `grid-width-${["sm", "md", "lg", "xl", "2xl"][i]}`, value: `${px}px`, visual: "fraction" as const, frac: frac(px),
  })) },
  { title: "Breakpoints", prefix: "--grid-breakpoint-*", note: "Laptop 1280, desktop 1440 and wide 1920 are the base viewport widths.", rows: [640, 1024, 1280, 1440, 1920].map((px, i) => ({
    token: `grid-breakpoint-${["sm", "md", "lg", "xl", "2xl"][i]}`, value: `${px}px`, visual: "fraction" as const, frac: frac(px),
  })) },
];

const patterns = [
  ["App shell", "layout-app", "Fixed product nav plus a fluid canvas. The first layout every product screen uses."],
  ["Canvas", "layout-canvas", "Header bar over a fill-height body. Lives in the app shell canvas column."],
  ["Workspace", "layout-workspace", "Primary content plus an optional context rail for an assistant, inspector, or detail."],
  ["Content", "layout-content", "Scrollable body with a section stack and page inset."],
  ["Metrics", "layout-metrics", "KPI and summary card strip. Use --fixed-3 or --fixed-4 when the count is known."],
  ["Header", "layout-header", "Title cluster and actions row for the canvas top bar."],
] as const;

const snippet = `<div className="layout-app">
  <aside>{/* nav */}</aside>
  <div className="layout-canvas">
    <header className="layout-header">…</header>
    <div className="layout-workspace">
      <main className="layout-content">
        <section className="layout-metrics layout-metrics--fixed-3">…</section>
        <section className="layout-split layout-split--primary">…</section>
      </main>
      <aside>{/* context rail */}</aside>
    </div>
  </div>
</div>`;

function Head({ title, prefix }: { title: string; prefix: string }) {
  return (
    <div className={rowStyles.head}>
      <h2 className={rowStyles.title}>{title}</h2>
      <span className={rowStyles.prefix}>{prefix}</span>
    </div>
  );
}

function Rows({ s, c }: { s: Section; c: Copy }) {
  return (
    <section className={styles.section}>
      <Head title={s.title} prefix={s.prefix} />
      {s.note && <p className={rowStyles.note}>{s.note}</p>}
      {s.rows.map((r) => {
        const v = `var(--${r.token})`;
        const done = c.copied === r.token;
        return (
          <button key={r.token} type="button" className={rowStyles.row} onClick={() => c.copy(r.token, v)} aria-label={`Copy ${v}`}>
            <span className={`${rowStyles.key} ${done ? rowStyles.copied : ""}`} aria-live="polite">{done ? "Copied" : `--${r.token}`}</span>
            <span className={rowStyles.value}>{r.value}</span>
            <span>
              {r.visual === "var" && <span className={rowStyles.bar} style={{ width: v, display: "block" }} />}
              {r.visual === "fraction" && <span className={styles.frac} style={{ width: `${(r.frac ?? 0) * 100}%` }} />}
              {r.visual === "columns" && <span className={styles.cols}>{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</span>}
            </span>
          </button>
        );
      })}
    </section>
  );
}

export function GridFoundation() {
  const [tab, setTab] = useState<"semantics" | "primitives">("semantics");
  const c = useCopy();
  return (
    <>
      <div className={master.pageTabs}>
        <Tabs label="Grid tokens" value={tab} onChange={(id) => setTab(id as typeof tab)} items={[{ id: "semantics", label: "Semantics" }, { id: "primitives", label: "Primitives" }]} />
      </div>
      <p className={master.hint}>Click any row or card to copy its token or class.</p>

      {tab === "semantics" ? (
        <>
          <section className={styles.section}>
            <Head title="Product composition" prefix="app → canvas → workspace → content" />
            <p className={styles.lead}>Build product screens from these patterns instead of inventing per-page grids.</p>
            <div className={styles.diagram} aria-hidden="true">
              <div className={styles.dNav}>Nav</div>
              <div className={styles.dCanvas}>
                <div className={styles.dHeader}>Header</div>
                <div className={styles.dWorkspace}>
                  <div className={styles.dMain}>
                    <div className={styles.dMetrics}><span className={styles.dCell} /><span className={styles.dCell} /><span className={styles.dCell} /></div>
                    <div className={styles.dSplit}><span className={styles.dCell}>Main</span><span className={styles.dCell}>Aside</span></div>
                  </div>
                  <div className={styles.dRail}>Rail</div>
                </div>
              </div>
            </div>
            <div className={styles.codeWrap}>
              <pre className={styles.code} tabIndex={0} role="region" aria-label="Code">{snippet}</pre>
              <span className={styles.codeCopy}>
                <Button size="sm" variant="tertiary" iconStart={c.copied === "snippet" ? "check" : "content_copy"} onClick={() => c.copy("snippet", snippet)}>
                  {c.copied === "snippet" ? "Copied" : "Copy"}
                </Button>
              </span>
            </div>
          </section>

          <section className={styles.section}>
            <Head title="Patterns" prefix=".layout-*" />
            <div className={styles.cards}>
              {patterns.map(([title, cls, desc]) => {
                const done = c.copied === cls;
                return (
                  <button key={cls} type="button" className={styles.card} onClick={() => c.copy(cls, cls)} aria-label={`Copy class ${cls}`}>
                    <span className={styles.cardHead}>
                      <span className={styles.cardTitle}>{title}</span>
                      <span className={`${styles.cardClass} ${done ? styles.copied : ""}`} aria-live="polite">{done ? "Copied" : `.${cls}`}</span>
                    </span>
                    <span className={styles.cardDesc}>{desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <Head title="Metrics" prefix=".layout-metrics" />
            <p className={styles.lead}>KPI rows. Fixed variants keep equal columns. The default auto-fits from <code>--layout-metrics-min</code>.</p>
            <div className={styles.demo}>
              <div className="layout-metrics layout-metrics--fixed-3">
                <div className={styles.cell}>Revenue</div>
                <div className={styles.cell}>Open invoices</div>
                <div className={styles.cell}>Overdue</div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <Head title="Content splits" prefix=".layout-split*" />
            <p className={styles.lead}>Panels inside <code>.layout-content</code>. Primary is the default table plus activity layout.</p>
            <p className={styles.label}>.layout-split--primary</p>
            <div className={styles.demo}>
              <div className="layout-split layout-split--primary"><div className={styles.cell}>Main · table</div><div className={styles.cell}>Aside · activity</div></div>
            </div>
            <p className={styles.label}>.layout-split</p>
            <div className={styles.demo}>
              <div className="layout-split"><div className={styles.cell}>Half</div><div className={styles.cell}>Half</div></div>
            </div>
            <p className={styles.label}>.layout-split--thirds</p>
            <div className={styles.demo}>
              <div className="layout-split layout-split--thirds"><div className={styles.cell}>1</div><div className={styles.cell}>2</div><div className={styles.cell}>3</div></div>
            </div>
          </section>

          {semanticRows.map((s) => <Rows key={s.title} s={s} c={c} />)}
        </>
      ) : (
        primitiveRows.map((s) => <Rows key={s.title} s={s} c={c} />)
      )}
    </>
  );
}
