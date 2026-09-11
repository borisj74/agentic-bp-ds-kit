"use client";
import { registry } from "./registry";

// Gallery card previews render on the client, so cards can pass handlers (onToggle, onCalculate) to kit pieces.
export function CardPreview({ name }: { name: string }) {
  return <>{registry[name]?.card}</>;
}
