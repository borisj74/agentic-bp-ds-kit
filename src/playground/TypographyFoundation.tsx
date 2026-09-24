"use client";
import { useState } from "react";
import { Tabs } from "@/ui/Tabs/Tabs";
import master from "./master.module.css";
import styles from "./typography.module.css";
import { useCopy } from "./useCopy";

const roles = [
  ["text-display", "Agentic BP DS"],
  ["text-metric", "$5,144,707.08"],
  ["text-heading-xl", "Design system foundations"],
  ["text-heading-lg", "Typography semantics"],
  ["text-heading-md", "Build with intent"],
  ["text-heading-sm", "Section title"],
  ["text-heading-xs", "Subsection title"],
  ["text-title-xl", "Modal or drawer title"],
  ["text-title-lg", "Step title"],
  ["text-title-md", "Card or section title"],
  ["text-title-sm", "Popover title"],
  ["text-title-xs", "Group header"],
  ["text-title-xxs", "Column header"],
  ["text-body-lg", "Use semantic text styles in components so hierarchy stays consistent across the product."],
  ["text-body", "Body text carries the bulk of product copy. Keep size and leading on the semantic tokens."],
  ["text-body-sm", "Supporting copy for denser UI, tables, and helper text."],
  ["text-label", "Form label"],
  ["text-label-sm", "Tooltip or small label"],
  ["text-caption", "Caption or metadata under a control"],
  ["text-caption-strong", "Weekday or value label"],
  ["text-overline", "Section meta"],
  ["text-code", "invoice.lines.reduce((s, l) => s + l.amount, 0)"],
] as const;

const sizes = [["ref-font-size-100", 10], ["ref-font-size-200", 12], ["ref-font-size-300", 14], ["ref-font-size-400", 16], ["ref-font-size-500", 18], ["ref-font-size-600", 20], ["ref-font-size-700", 22], ["ref-font-size-800", 24], ["ref-font-size-900", 26]] as const;
const named = [["font-size-xsmall", 12], ["font-size-small", 14], ["font-size-regular", 16], ["font-size-large", 18], ["font-size-xlarge", 20], ["font-size-xxlarge", 24]] as const;
const weights = [["font-weight-regular", 400], ["font-weight-medium", 500], ["font-weight-semibold", 600], ["font-weight-bold", 700]] as const;
const leading = [["line-height-tight", 1.2], ["line-height-snug", 1.35], ["line-height-normal", 1.5], ["line-height-relaxed", 1.65]] as const;
const tracking = [["letter-spacing-tight", "-0.02em"], ["letter-spacing-normal", "0"], ["letter-spacing-wide", "0.04em"]] as const;
const para = "Typography sets voice and hierarchy. Line height controls how dense or open body text feels across layouts and components.";

function Head({ title, prefix }: { title: string; prefix: string }) {
  return (
    <div className={styles.head}>
      <h2 className={styles.title}>{title}</h2>
      <span className={styles.prefix}>{prefix}</span>
    </div>
  );
}

export function TypographyFoundation() {
  const [tab, setTab] = useState<"primitives" | "semantics">("primitives");
  const c = useCopy();
  const Row = ({ k, value, children, style, className }: { k: string; value: string; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => {
    const done = c.copied === k;
    return (
      <button type="button" className={styles.row} onClick={() => c.copy(k, value)} aria-label={`Copy ${value}`}>
        <span className={`${styles.key} ${done ? styles.copied : ""}`} aria-live="polite">{done ? "Copied" : k}</span>
        <span className={`${styles.sample} ${className ?? ""}`} style={style}>{children}</span>
      </button>
    );
  };
  return (
    <>
      <div className={master.pageTabs}>
        <Tabs label="Typography tokens" value={tab} onChange={(id) => setTab(id as typeof tab)} items={[{ id: "primitives", label: "Primitives" }, { id: "semantics", label: "Semantics" }]} />
      </div>
      <p className={master.hint}>Click any row to copy its token.</p>
      {tab === "primitives" && (
        <>
          <Head title="Family" prefix="--font-sans · --font-mono" />
          <div className={styles.family}>
            <div>Inter. The quick brown fox jumps over the lazy dog</div>
            <div className={styles.mono}>Roboto Mono. The quick brown fox jumps over the lazy dog 0123456789</div>
          </div>
          <Head title="Size" prefix="--ref-font-size-100 → 900" />
          {sizes.map(([k, px]) => <Row key={k} k={k} value={`var(--${k})`} style={{ fontSize: `var(--${k})` }}>Agentic BP DS · {px}px</Row>)}
          <Head title="Named size" prefix="--font-size-*" />
          {named.map(([k, px]) => <Row key={k} k={k} value={`var(--${k})`} style={{ fontSize: `var(--${k})` }}>Agentic BP DS · {px}px</Row>)}
          <Head title="Weight" prefix="--font-weight-*" />
          {weights.map(([k, w]) => <Row key={k} k={`${k} · ${w}`} value={`var(--${k})`} style={{ fontWeight: `var(--${k})`, fontSize: "var(--font-size-large)" }}>Agentic BP DS</Row>)}
          <Head title="Line height" prefix="--line-height-*" />
          {leading.map(([k, v]) => <Row key={k} k={`${k} · ${v}`} value={`var(--${k})`} style={{ lineHeight: `var(--${k})`, maxWidth: "52ch" }}>{para}</Row>)}
          <Head title="Letter spacing" prefix="--letter-spacing-*" />
          {tracking.map(([k, v]) => <Row key={k} k={`${k} · ${v}`} value={`var(--${k})`} style={{ letterSpacing: `var(--${k})`, fontSize: "var(--font-size-large)", fontWeight: "var(--font-weight-medium)" }}>BILLING PLATFORM</Row>)}
        </>
      )}
      {tab === "semantics" && (
        <>
          <Head title="Roles" prefix="text-display → text-code" />
          {roles.map(([k, sample]) => <Row key={k} k={`.${k}`} value={k} className={k}>{sample}</Row>)}
        </>
      )}
    </>
  );
}
