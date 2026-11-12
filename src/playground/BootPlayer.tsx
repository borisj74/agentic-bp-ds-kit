"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import { BOOT_HOLD_MS, BOOT_LINE_MS, BOOT_SETTLE_MS, useBootPhase, type BootPhase } from "@/ui/LoadingLine/boot";
import styles from "./bootPlayer.module.css";

// Playground harness: plays a screen's boot and shows the skeleton's own timing rule running. Not a kit piece.
export type BootSpeed = "off" | "fast" | "typical" | "slow";

// How long the screen's data takes to land. fast is deliberately inside the 200ms the line runs alone, so the
// skeleton never appears at all — the branch of the rule that is easiest to miss.
const DATA_MS: Record<Exclude<BootSpeed, "off">, number> = { fast: 120, typical: 900, slow: 2500 };

type Step = { phase: Exclude<BootPhase, "idle">; label: string };
const STEPS: Step[] = [
  { phase: "line", label: "Line only" },
  { phase: "skeleton", label: "Skeleton" },
  { phase: "settling", label: "Content fades in" },
];

type Span = { from: number; to: number } | null;

/**
 * What the rule says this run will do, worked out from the three timings and when the data lands. The chips
 * are lit by the kit hook as it actually runs; these are the numbers that hook is keeping to.
 */
function plan(data: number): Record<Step["phase"], Span> {
  // A load that finishes inside the line's first 200ms never shows a skeleton, so the line is the whole run.
  if (data <= BOOT_LINE_MS) return { line: { from: 0, to: data }, skeleton: null, settling: null };
  // Otherwise the skeleton goes up at 200ms and is held at least 400ms, which can outlast the data itself.
  const end = Math.max(BOOT_LINE_MS + BOOT_HOLD_MS, data);
  return {
    line: { from: 0, to: BOOT_LINE_MS },
    skeleton: { from: BOOT_LINE_MS, to: end },
    settling: { from: end, to: end + BOOT_SETTLE_MS },
  };
}

function BootRun({ speed, onReplay, children }: {
  speed: Exclude<BootSpeed, "off">;
  onReplay: () => void;
  children: (loading: boolean) => ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  // The same hook the AppShell runs, on the same signal, so the chips are the sequence itself rather than a
  // retelling of it.
  const boot = useBootPhase(loading);
  const data = DATA_MS[speed];
  const steps = plan(data);

  // The run: the clock starts, the data lands after its delay, and the sequence finishes on its own.
  useEffect(() => {
    startedAt.current = Date.now();
    const land = setTimeout(() => setLoading(false), data);
    return () => clearTimeout(land);
  }, [data]);

  // A running clock while anything is still on screen, so the number moves rather than only landing at the end.
  useEffect(() => {
    if (boot.phase === "idle") return undefined;
    const tick = setInterval(() => setElapsed(Date.now() - startedAt.current), 16);
    return () => clearInterval(tick);
  }, [boot.phase]);

  const done = boot.phase === "idle" && elapsed > 0;
  const state = (step: Step) => {
    if (boot.phase === step.phase) return "now";
    if (!steps[step.phase]) return "skipped";
    return elapsed >= steps[step.phase]!.to ? "done" : "waiting";
  };

  return (
    <div className={styles.player}>
      <div className={styles.bar}>
        <div className={styles.steps}>
          {STEPS.map((step) => {
            const span = steps[step.phase];
            return (
              <span key={step.phase} className={styles.step} data-state={state(step)}>
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>{step.label}</span>
                <span className={styles.ms}>{span ? `${span.to - span.from}ms` : "skipped"}</span>
              </span>
            );
          })}
        </div>
        <div className={styles.end}>
          <span className={styles.total} role="status">
            {done ? `${Math.round(elapsed)}ms, data in ${data}ms` : `${Math.round(elapsed)}ms`}
          </span>
          <Button size="sm" iconStart="replay" onClick={onReplay}>Play again</Button>
        </div>
      </div>
      {/* Said in words too, for anyone who cannot watch the chips move. */}
      <p className={styles.note}>
        {steps.skeleton
          ? `The data lands after ${data}ms, past the line's first ${BOOT_LINE_MS}ms, so the skeleton goes up and is held at least ${BOOT_HOLD_MS}ms before the content fades in over ${BOOT_SETTLE_MS}ms.`
          : `The data lands after ${data}ms, inside the line's first ${BOOT_LINE_MS}ms, so no skeleton is ever drawn.`}
      </p>
      {children(loading)}
    </div>
  );
}

/**
 * Drives `loading` for a pattern demo and reads out the skeleton's timing rule as it runs. Each play is its own
 * mount, so a run always starts from nothing rather than from the last one's numbers.
 */
export function BootPlayer({ speed, children }: { speed: BootSpeed; children: (loading: boolean) => ReactNode }) {
  const [run, setRun] = useState(0);
  if (speed === "off") return <>{children(false)}</>;
  return (
    <BootRun key={`${speed}:${run}`} speed={speed} onReplay={() => setRun((n) => n + 1)}>
      {children}
    </BootRun>
  );
}
