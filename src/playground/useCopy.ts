"use client";
import { useEffect, useRef, useState } from "react";

// Shared "copied" indicator keyed by token name, cleared after a moment.
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1200);
  };
  return { copied, copy };
}
export type Copy = ReturnType<typeof useCopy>;
