import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LineChart } from "@/ui/LineChart/LineChart";

// jsdom has no layout, so charts never learn their width and skip the drawing. This observer reports 600px at once.
class WideObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe() { this.cb([{ contentRect: { width: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
  unobserve() {}
  disconnect() {}
}

const days = ["Sep 1", "Sep 4", "Sep 7", "Sep 10", "Sep 13", "Sep 16"];
const usage = [{ name: "API calls", values: [4200, 5100, 5600, 6300, 7000, 7600], projectedFrom: 4 }];

describe("LineChart", () => {
  beforeEach(() => vi.stubGlobal("ResizeObserver", WideObserver));
  afterEach(() => vi.unstubAllGlobals());

  it("draws actual values solid and the forecast dashed from the last actual point", () => {
    const { container } = render(<LineChart label="API calls by day" categories={days} series={usage} animate={false} />);
    const dashed = container.querySelectorAll("path[data-projected]");
    expect(dashed).toHaveLength(1);
    // Last actual point (Sep 10) to the last forecast (Sep 16): three points, two segments.
    expect(dashed[0].getAttribute("d")?.split("L")).toHaveLength(3);
    expect(dashed[0].getAttribute("stroke-dasharray")).toBeTruthy();
  });

  it("says projected in the screen-reader table for forecast values only", () => {
    render(<LineChart label="API calls by day" categories={days} series={usage} animate={false} />);
    const table = screen.getByRole("table", { name: "API calls by day" });
    expect(within(table).getByRole("row", { name: /Sep 10/ })).not.toHaveTextContent("projected");
    expect(within(table).getByRole("row", { name: /Sep 13/ })).toHaveTextContent("7,000 (projected)");
  });

  it("draws a reference line with its label and value, and lists it for screen readers", () => {
    const { container } = render(
      <LineChart label="API calls by day" categories={days} series={usage} referenceLines={[{ value: 10000, label: "Limit" }]} animate={false} />,
    );
    expect(container.querySelectorAll("line[data-reference]")).toHaveLength(1);
    expect(container.querySelector("svg")).toHaveTextContent("Limit 10K");
    expect(screen.getByRole("listitem")).toHaveTextContent("Limit: 10,000");
  });

  it("keeps a reference line above the data inside the scale", () => {
    const { container } = render(
      <LineChart label="API calls by day" categories={days} series={usage} referenceLines={[{ value: 20000, label: "Target" }]} animate={false} />,
    );
    const y = Number(container.querySelector("line[data-reference]")?.getAttribute("y1"));
    expect(y).toBeGreaterThan(0);
  });

  it("draws the marker at its category and names it for screen readers", () => {
    const { container } = render(
      <LineChart label="API calls by day" categories={days} series={usage} marker={{ category: 3, label: "Today" }} animate={false} />,
    );
    expect(container.querySelectorAll("line[data-marker]")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Today: Sep 10");
  });

  it("keeps a reference label clear of the marker's label and the last point", () => {
    const CHAR = 7;
    const values = [4000, 7000, 9500, 12000, 14500, 15800];
    const { container } = render(
      <LineChart
        label="Credits by day" categories={days} series={[{ name: "Credits", values }]}
        referenceLines={[{ value: 16000, label: "Plan credits" }]} marker={{ category: 5, label: "Today" }} animate={false}
      />,
    );
    const texts = [...container.querySelectorAll("svg text")];
    const ref = texts.find((t) => t.textContent === "Plan credits 16K")!;
    const today = texts.find((t) => t.textContent === "Today")!;
    const num = (el: Element, a: string) => Number(el.getAttribute(a));
    const boxOf = (el: Element) => {
      const x = num(el, "x");
      const w = (el.textContent ?? "").length * CHAR;
      const anchor = el.getAttribute("text-anchor");
      const l = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
      return { l, r: l + w, t: num(el, "y") - 11, b: num(el, "y") + 3 };
    };
    const hit = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
    expect(hit(boxOf(ref), boxOf(today))).toBe(false);
    // The last point sits on the marker's line, just under the reference line (15,800 against 16,000).
    const markerX = num(container.querySelector("line[data-marker]")!, "x1");
    const refY = num(container.querySelector("line[data-reference]")!, "y1");
    expect(hit(boxOf(ref), { l: markerX - 6, r: markerX + 6, t: refY - 6, b: refY + 12 })).toBe(false);
  });

  it("ignores a marker outside the categories", () => {
    const { container } = render(
      <LineChart label="API calls by day" categories={days} series={usage} marker={{ category: 9, label: "Today" }} animate={false} />,
    );
    expect(container.querySelector("line[data-marker]")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
