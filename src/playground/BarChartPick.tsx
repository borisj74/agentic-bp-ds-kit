"use client";
import { useState } from "react";
import { BarChart, type BarChartProps } from "@/ui/BarChart/BarChart";
import { Button } from "@/ui/Button/Button";

// The catalog's BarChart demo. The chart itself is controlled, so the page around it owns the pick — which is the
// point of the prop: a screen picks a day and lists who used it. Here the line under the chart stands in for that.
export function BarChartPick({ selected: start = null, ...p }: BarChartProps) {
  // The catalog keys this on its props, so switching an example or a control mounts it again at that chart's own pick.
  const [selected, setSelected] = useState<number | null>(start);

  const total = selected === null ? 0 : p.series.reduce((sum, sr) => sum + (sr.values[selected] ?? 0), 0);
  const money = new Intl.NumberFormat("en-US", {
    style: p.format === "currency" ? "currency" : p.format === "percent" ? "percent" : "decimal",
    currency: p.format === "currency" ? p.currency ?? "USD" : undefined,
    // The chart's own tooltip rounds the same way, so the line under it reads as the same number.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
      <BarChart {...p} selected={selected} onSelectedChange={setSelected} />
      {selected !== null && (
        // Only while something is picked: an example that is not about picking reads as it always did until clicked.
        <p
          style={{
            display: "flex", alignItems: "center", gap: "var(--space-xsmall)", margin: 0,
            fontSize: "var(--font-size-small)", color: "var(--text-neutral-strong)",
          }}
        >
          {`Picked: ${p.categories[selected]} · ${money.format(p.format === "percent" ? total / 100 : total)}`}
          <Button emphasis="minimal" size="sm" onClick={() => setSelected(null)}>Clear</Button>
        </p>
      )}
    </div>
  );
}
