"use client";
import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react";

export type FloatingSide = "top" | "bottom" | "left" | "right";

const EDGE = 8; // px kept clear of the window edge
const OPPOSITE: Record<FloatingSide, FloatingSide> = { top: "bottom", bottom: "top", left: "right", right: "left" };

// false on the server and during hydration, true after: floating panels only portal in the browser.
const noSubscribe = () => () => {};
export const useInBrowser = () => useSyncExternalStore(noSubscribe, () => true, () => false);

/**
 * Gives a portaled panel the theme of the thing that opened it. A panel is portaled to the end of the page, so it
 * is outside whatever set the theme around its trigger: a dark app frame, or a preview of one. Saying the theme on
 * the panel itself re-declares the semantic tokens there, so the panel is dark with the app that opened it.
 */
export function carryTheme(trigger: Element | null | undefined, panel: HTMLElement) {
  const theme = trigger?.closest<HTMLElement>("[data-theme]")?.dataset.theme;
  // Only when it differs: setting the attribute to what it already says still counts as a change, and something
  // watching for theme changes would answer its own write for ever.
  if (theme === panel.dataset.theme) return;
  if (theme) panel.dataset.theme = theme;
  else delete panel.dataset.theme;
}

/**
 * Places a fixed, portaled panel next to its trigger (the first child of wrapRef). Uses the preferred side, or the
 * opposite one when it has no room, and keeps the panel inside the frame the trigger sits in — the app frame when
 * there is one (it says so with data-frame), else the window. Sets data-side and --arrow (the trigger's
 * middle along the panel edge) so the arrow points at the trigger. Follows scroll and resize while open.
 * Shared by Tooltip and HelpPopover. `watch` re-places when the panel's content changes.
 */
export function useFloating(
  open: boolean,
  wrapRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  placement: FloatingSide,
  gap: number,
  watch?: unknown,
) {
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = wrapRef.current?.firstElementChild ?? wrapRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const r = trigger.getBoundingClientRect();
      carryTheme(trigger, panel);
      // The room the panel has: the app frame around the trigger if it marks itself as one, else the window. A frame
      // docked in a preview, a split view or a phone-width box is narrower than the window, and a panel that left it
      // would hang over whatever is beside it.
      const frame = trigger.closest?.("[data-frame]")?.getBoundingClientRect();
      const x0 = Math.max(0, frame?.left ?? 0);
      const y0 = Math.max(0, frame?.top ?? 0);
      const x1 = Math.min(window.innerWidth, frame?.right ?? window.innerWidth);
      const y1 = Math.min(window.innerHeight, frame?.bottom ?? window.innerHeight);
      // Narrower than the panel wants: the panel gives up width rather than the frame. Its own CSS decides first,
      // so a panel that already fits keeps the width it asked for.
      panel.style.maxWidth = "";
      const room = Math.max(0, x1 - x0 - EDGE * 2);
      if (panel.offsetWidth > room) panel.style.maxWidth = `${room}px`;
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const fits = (p: FloatingSide) =>
        p === "top" ? r.top - gap - h >= y0 + EDGE : p === "bottom" ? r.bottom + gap + h <= y1 - EDGE : p === "left" ? r.left - gap - w >= x0 + EDGE : r.right + gap + w <= x1 - EDGE;
      const side = fits(placement) || !fits(OPPOSITE[placement]) ? placement : OPPOSITE[placement];
      const vertical = side === "top" || side === "bottom";
      const clamp = (v: number, size: number, min: number, max: number) => Math.min(Math.max(min + EDGE, v), max - size - EDGE);
      const left = vertical ? clamp(r.left + r.width / 2 - w / 2, w, x0, x1) : side === "left" ? r.left - gap - w : r.right + gap;
      const top = vertical ? (side === "top" ? r.top - gap - h : r.bottom + gap) : clamp(r.top + r.height / 2 - h / 2, h, y0, y1);
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.setProperty("--arrow", `${vertical ? r.left + r.width / 2 - left : r.top + r.height / 2 - top}px`);
      panel.dataset.side = side;
      panel.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    // The theme can be switched while the panel is open — the account menu holds that very switch — and the panel
    // is outside the frame it belongs to, so it has to be told. Watching the page for a theme attribute anywhere
    // catches both a change and the frame taking one on for the first time.
    // The panel's own theme attribute is one of the changes, so skip those and answer only the page's.
    const themes = new MutationObserver((records) => {
      if (records.every((m) => panelRef.current?.contains(m.target))) return;
      place();
    });
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"], subtree: true });
    return () => {
      themes.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, placement, gap, watch, wrapRef, panelRef]);
}
