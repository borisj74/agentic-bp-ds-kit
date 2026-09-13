"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./GuidedProcessPage.module.css";

export type GuidedProcessPageView = "intro" | "step";
export type GuidedProcessPageSide = "start" | "end";

export interface GuidedProcessPageProps {
  view?: GuidedProcessPageView;
  intro?: ReactNode[];
  header?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  steps?: ReactNode;
  side?: GuidedProcessPageSide;
  stepsOpen?: boolean;
  onStepsClose?: () => void;
  label?: string;
}

// Figma guided process page template 29102:2. Before the process starts, a dark column per step across the page;
// once it has, the step's header, fields and footer, with every step on a dark panel at the start or end edge.
// A blueprint only: it places kit GuidedProcess parts and keeps no state of its own. It fills the AppShell page.
export function GuidedProcessPage({
  view = "step", intro = [], header, children, footer, steps, side = "end", stepsOpen = false, onStepsClose, label,
}: GuidedProcessPageProps) {
  const drawer = useRef<HTMLDivElement>(null);
  // Where the steps are a drawer, focus moves into it as it opens, so the keyboard follows the eye.
  useEffect(() => {
    const el = drawer.current;
    if (stepsOpen && el && getComputedStyle(el).position === "absolute") el.focus();
  }, [stepsOpen]);

  if (view === "intro") {
    return (
      <div className={styles.frame}>
        <div className={styles.intro}>
          {intro.map((panel, i) => <div key={i} className={styles.column}>{panel}</div>)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <div className={[styles.page, side === "start" ? styles.start : "", stepsOpen ? styles.open : ""].join(" ")}>
        <div className={styles.main}>
          <section className={styles.content} aria-label={label ?? "Step"}>
            {header}
            {children}
          </section>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
        {/* The sheet behind the open drawer. The drawer's own close button and Escape are the keyboard's ways out. */}
        {steps && stepsOpen && onStepsClose && (
          <button type="button" className={styles.scrim} aria-label="Close steps" tabIndex={-1} onClick={onStepsClose} />
        )}
        {steps && (
          <div
            ref={drawer} className={styles.steps} tabIndex={-1}
            onKeyDown={(e) => { if (e.key === "Escape" && stepsOpen) onStepsClose?.(); }}
          >
            {steps}
          </div>
        )}
      </div>
    </div>
  );
}
