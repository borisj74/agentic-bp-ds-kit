"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * The boot sequence from the Cobalt skeleton block (DSL-199), in its own words:
 * "only the loading line for 200 ms, then the skeleton for at least 400 ms, then the content fades in over
 * 150 ms."
 *
 * Two things fall out of that, and they are the point of the rule:
 * - A load that finishes inside the first 200ms never shows a skeleton at all, so a fast page does not flash
 *   a grey copy of itself on the way in.
 * - A skeleton that has appeared stays up its full 400ms even when the data lands straight after, so it never
 *   blinks out the moment it arrives.
 *
 * These mirror --motion-boot-line, --motion-boot-hold and --motion-boot-settle; tests/boot-sequence.test.tsx
 * asserts they still match what the token build writes.
 */
export const BOOT_LINE_MS = 200;
export const BOOT_HOLD_MS = 400;
export const BOOT_SETTLE_MS = 150;

/** idle: nothing loading. line: the line alone. skeleton: line and skeleton. settling: the content fading in. */
export type BootPhase = "idle" | "line" | "skeleton" | "settling";

export interface BootTiming {
  /** How long the line runs alone before a skeleton is allowed. */
  line?: number;
  /** The least time a skeleton stays up once it has appeared. */
  hold?: number;
  /** How long the content takes to fade in. */
  settle?: number;
}

export interface BootState {
  phase: BootPhase;
  /** The 2px line: up while the page is still coming, gone once the content starts fading in. */
  showLine: boolean;
  /** The skeleton: held back for the first 200ms, then kept for at least 400ms. */
  showSkeleton: boolean;
  /** The content is fading in. */
  settling: boolean;
}

const IDLE: BootState = { phase: "idle", showLine: false, showSkeleton: false, settling: false };
const stateOf = (phase: BootPhase): BootState => ({
  phase,
  showLine: phase === "line" || phase === "skeleton",
  showSkeleton: phase === "skeleton",
  settling: phase === "settling",
});

/**
 * Walks the sequence while `loading` is on. Pass it the raw signal — whether the page's data is still coming —
 * and it answers with what should be on screen.
 */
export function useBootPhase(loading: boolean, timing: BootTiming = {}): BootState {
  const { line = BOOT_LINE_MS, hold = BOOT_HOLD_MS, settle = BOOT_SETTLE_MS } = timing;
  const [phase, setPhase] = useState<BootPhase>(loading ? "line" : "idle");
  // The last signal the sequence answered to, so a change of it is handled while rendering rather than in an
  // effect: an effect would paint the old step first and only then correct it.
  const [answered, setAnswered] = useState(loading);
  // When the skeleton went up, so the hold is measured from the moment it was seen rather than from the moment
  // the load began.
  const shownAt = useRef(0);

  if (answered !== loading) {
    setAnswered(loading);
    // Loading again, from idle or from a fade that had not finished: back to the line, and the skeleton waits.
    if (loading) setPhase("line");
    // The data landed inside the line's first 200ms: no skeleton was ever shown, so there is nothing to hold
    // and nothing to fade.
    else if (phase === "line") setPhase("idle");
    // Anything else — a skeleton that is up, a fade already running — is left to finish below.
  }

  useEffect(() => {
    // The line has had the page to itself; the skeleton may go up.
    if (loading && phase === "line") {
      const wait = setTimeout(() => {
        shownAt.current = Date.now();
        setPhase("skeleton");
      }, line);
      return () => clearTimeout(wait);
    }
    // The data has landed under a skeleton: keep it up for whatever is left of its hold.
    if (!loading && phase === "skeleton") {
      const left = Math.max(0, hold - (Date.now() - shownAt.current));
      const rest = setTimeout(() => setPhase("settling"), left);
      return () => clearTimeout(rest);
    }
    // The content is fading in.
    if (phase === "settling") {
      const fade = setTimeout(() => setPhase("idle"), settle);
      return () => clearTimeout(fade);
    }
    return undefined;
  }, [loading, phase, line, hold, settle]);

  return phase === "idle" ? IDLE : stateOf(phase);
}

/**
 * The frame publishes where it is in the sequence, so the skeletons inside it — the chrome's, and the page
 * pattern's — all appear and leave together instead of each keeping its own clock.
 */
export const BootContext = createContext<BootState | null>(null);

export const useBoot = () => useContext(BootContext);

/**
 * What a piece with its own `loading` should actually draw. Outside a booting frame it answers `loading`
 * unchanged, so a list refreshing its own rows still shows its skeleton at once; inside one, it follows the
 * frame's sequence.
 */
export function useBootSkeleton(loading: boolean): { skeleton: boolean; settling: boolean } {
  const boot = useBoot();
  if (!boot || boot.phase === "idle") return { skeleton: loading, settling: false };
  return { skeleton: loading && boot.showSkeleton, settling: loading && boot.settling };
}
