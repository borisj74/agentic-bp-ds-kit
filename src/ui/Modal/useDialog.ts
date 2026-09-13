"use client";
import { useEffect, type KeyboardEvent, type RefObject } from "react";
import { carryTheme } from "../Tooltip/useFloating";

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared by Modal and Drawer. On open: remember focus, lock page scroll, focus the first field in the body (else the
// first control, else the dialog). On close: give focus back. The returned handler closes on Escape and keeps Tab inside.
export function useDialog(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  bodyRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // A portaled dialog is outside whatever set the theme around the thing that opened it, so it takes that
    // thing's theme. Focus is still on it at this point, which is what says where the dialog came from.
    if (dialogRef.current) carryTheme(back, dialogRef.current);
    const first = bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      back?.focus();
    };
  }, [open, dialogRef, bodyRef]);

  // React events bubble through portals, so a menu or search inside the dialog can handle Escape first.
  return (e: KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    // A dialog opened from this one (a Lookup in its form) is portaled outside it and keeps its own Tab.
    if (!root || e.defaultPrevented || !root.contains(e.target as Node)) return;
    const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) { e.preventDefault(); return; }
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    const inside = root.contains(document.activeElement);
    if (e.shiftKey && (!inside || document.activeElement === firstItem)) { e.preventDefault(); lastItem.focus(); }
    else if (!e.shiftKey && (!inside || document.activeElement === lastItem)) { e.preventDefault(); firstItem.focus(); }
  };
}
