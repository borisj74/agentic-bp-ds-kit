import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarChart } from "@/ui/BarChart/BarChart";

// jsdom has no layout, so charts never learn their width and skip the drawing. This observer reports 600px at once.
class WideObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe() { this.cb([{ contentRect: { width: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
  unobserve() {}
  disconnect() {}
}

const days = ["Sep 1", "Sep 2", "Sep 3", "Sep 4"];
// Free credits run out on Sep 3, so that day is one stack of two parts; Sep 4 is the plan alone.
const balances = [
  { name: "Free credits", values: [60, 50, 30, 0] },
  { name: "AI Plan", values: [0, 0, 40, 70] },
];

// The x of every point in a path, to measure how wide a thin bar is.
const xs = (d: string) => [...d.matchAll(/[MHQ ]\s?(-?[\d.]+),/g)].map((m) => Number(m[1]));
const curves = (d: string) => (d.match(/Q/g) ?? []).length;

describe("BarChart", () => {
  beforeEach(() => vi.stubGlobal("ResizeObserver", WideObserver));
  afterEach(() => vi.unstubAllGlobals());

  it("keeps wide bars by default: square rects filling most of the band", () => {
    const { container } = render(<BarChart label="Credits by day" categories={days} series={balances} stacked animate={false} />);
    expect(container.querySelectorAll("path[data-bar]")).toHaveLength(0);
    const widths = [...container.querySelectorAll("svg rect:not([class*=hoverBand])")].map((r) => Number(r.getAttribute("width")));
    expect(widths.length).toBeGreaterThan(0);
    widths.forEach((w) => expect(w).toBeGreaterThan(8));
  });

  it("draws thin bars 8px wide", () => {
    const { container } = render(<BarChart label="Credits by day" categories={days} series={balances} stacked barWidth="thin" animate={false} />);
    const bars = [...container.querySelectorAll("path[data-bar=thin]")];
    // Sep 1, Sep 2 and Sep 4 are one part each; Sep 3 is two.
    expect(bars).toHaveLength(5);
    bars.forEach((b) => {
      const x = xs(b.getAttribute("d") ?? "");
      expect(Math.max(...x) - Math.min(...x)).toBeCloseTo(8, 0);
    });
  });

  it("rounds only the outer ends of a stack", () => {
    const { container } = render(<BarChart label="Credits by day" categories={days} series={balances} stacked barWidth="thin" animate={false} />);
    const [free, plan] = [...container.querySelectorAll("svg g")].filter((g) => g.querySelector("path[data-bar]"));
    const freeBars = [...free.querySelectorAll("path[data-bar]")].map((p) => p.getAttribute("d") ?? "");
    const planBars = [...plan.querySelectorAll("path[data-bar]")].map((p) => p.getAttribute("d") ?? "");
    // A bar on its own rounds all four corners: each corner is one curve, and a square one is a zero-length curve.
    const rounded = (d: string) => [...d.matchAll(/Q(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)/g)].filter((m) => m[1] !== m[3] || m[2] !== m[4]).length;
    expect(curves(freeBars[0])).toBe(4);
    expect(rounded(freeBars[0])).toBe(4);
    // Sep 3: the free part at the bottom rounds its bottom corners, the plan part on top its top corners.
    expect(rounded(freeBars[2])).toBe(2);
    expect(rounded(planBars[0])).toBe(2);
  });

  it("shows the tooltip when pointing anywhere in a thin bar's category", () => {
    const { container } = render(<BarChart label="Credits by day" categories={days} series={balances} stacked barWidth="thin" animate={false} />);
    const plot = container.querySelector("svg")!.parentElement!;
    // Far from the bar in the middle of the band, near the start of the third category.
    const x0 = Number(container.querySelector("svg line")?.getAttribute("x1"));
    const step = (600 - 8 - x0) / days.length;
    fireEvent.pointerMove(plot, { clientX: x0 + step * 2 + 2, clientY: 50 });
    expect(screen.getByText("Sep 3", { selector: "p" })).toBeInTheDocument();
  });
});
