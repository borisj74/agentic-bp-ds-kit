import { fireEvent, render, screen, within } from "@testing-library/react";
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

  describe("against a grant", () => {
    const month = ["Sep 1", "Sep 2", "Sep 3", "Sep 4", "Sep 5", "Sep 6"];
    const used = [{ name: "Credits used", values: [300, 600, 900, 1200, 1400, 1600], projectedFrom: 4 }];

    it("draws a reference line over the bars, with its label and value, and lists it for screen readers", () => {
      const { container } = render(
        <BarChart label="Credits used" categories={month} series={used} referenceLines={[{ value: 1150, label: "Grant", intent: "red" }]} animate={false} />,
      );
      const svg = container.querySelector("svg")!;
      const ref = svg.querySelector("line[data-reference]")!;
      const lastBar = [...svg.querySelectorAll("rect:not([class*=hoverBand])")].pop()!;
      // Drawn after the bars, so it shows where they pass it.
      expect(lastBar.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(svg).toHaveTextContent("Grant 1.2K");
      expect(screen.getByRole("listitem")).toHaveTextContent("Grant: 1,150");
    });

    it("draws forecast bars see-through and says projected in the screen-reader table", () => {
      const { container } = render(<BarChart label="Credits used" categories={month} series={used} animate={false} />);
      const ahead = container.querySelectorAll("rect[data-projected]");
      expect(ahead).toHaveLength(2);
      ahead.forEach((r) => expect((r as SVGElement).style.fillOpacity).toBe("var(--opacity-muted)"));
      const table = screen.getByRole("table", { name: "Credits used" });
      expect(within(table).getByRole("row", { name: /Sep 4/ })).not.toHaveTextContent("projected");
      expect(within(table).getByRole("row", { name: /Sep 5/ })).toHaveTextContent("1,400 (projected)");
    });

    it("steps a reference line given a level per category, and reports the level it ends at", () => {
      const { container } = render(
        <BarChart
          label="Credits used" categories={month} series={used} animate={false}
          referenceLines={[{ value: 1150, label: "Grant", values: [1150, 1150, 1150, 1350, 1350, 1550] }]}
        />,
      );
      const step = container.querySelector("path[data-reference]")!;
      // Each category after the first starts with a move to its own level: three levels, rising on Sep 4 and on Sep 6.
      const levels = step.getAttribute("d")!.split("V").slice(1).map((p) => Number(p.split("H")[0]));
      expect(levels).toHaveLength(month.length - 1);
      expect(new Set(levels).size).toBe(3);
      // Both ends, so a reader hears the grant changed instead of one flat number.
      expect(screen.getByRole("listitem")).toHaveTextContent("Grant: 1,150 to 1,550");
    });

    it("draws the marker at its category", () => {
      const { container } = render(<BarChart label="Credits used" categories={month} series={used} marker={{ category: 3, label: "Today" }} animate={false} />);
      expect(container.querySelectorAll("line[data-marker]")).toHaveLength(1);
      expect(screen.getByRole("listitem")).toHaveTextContent("Today: Sep 4");
    });

    it("slides a reference label clear of the marker line", () => {
      // Low bars leave the end of the grant line free, so only the marker line, on the last category, is in the way.
      const low = [{ name: "Credits used", values: [100, 120, 140, 160, 180, 200] }];
      const { container } = render(
        <BarChart
          label="Credits used" categories={month} series={low} animate={false}
          referenceLines={[{ value: 1150, label: "Grant" }]} marker={{ category: 5, label: "Today" }}
        />,
      );
      const markX = Number(container.querySelector("line[data-marker]")!.getAttribute("x1"));
      const label = [...container.querySelectorAll("text")].find((t) => t.textContent === "Grant 1.2K")!;
      const end = Number(label.getAttribute("x"));
      // The label is end-anchored, about 7px a character wide.
      const start = end - "Grant 1.2K".length * 7;
      expect(end < markX - 3 || start > markX + 3).toBe(true);
    });

    it("ignores reference lines, the marker and forecasts on a horizontal chart", () => {
      const { container } = render(
        <BarChart
          label="Credits used" categories={month} series={used} orientation="horizontal" animate={false}
          referenceLines={[{ value: 1150, label: "Grant" }]} marker={{ category: 3, label: "Today" }}
        />,
      );
      expect(container.querySelectorAll("[data-reference], [data-marker], [data-projected]")).toHaveLength(0);
    });
  });
});
