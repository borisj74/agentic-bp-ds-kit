import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsageBar, type UsageBarSegment } from "@/ui/UsageBar/UsageBar";

// The allowance of the AI usage Utilization bar: two sources used, two still to spend.
const SEGMENTS: UsageBarSegment[] = [
  { id: "free", value: 150, intent: "mint", label: "Free credits", note: "150 used · ran out Oct 12", legend: "Free credits" },
  { id: "plan", value: 330, intent: "purple", label: "AI plan", note: "330 used", legend: "AI plan" },
  { id: "plan-left", value: 670, kind: "left", label: "670 left in the AI plan", note: "renews Nov 9" },
  { id: "topup-left", value: 500, kind: "left", label: "500 left in the top-up", note: "no end date" },
];

const bar = () => screen.getByRole("meter", { name: "Credits this period" });
// A label can sit both under its part and in the legend, so each is read from its own row.
const caption = (text: string, root: HTMLElement) => within(root.querySelector("[class*=captions]") as HTMLElement).queryByText(text);
const key = (text: string, root: HTMLElement) => within(root.querySelector("[class*=legend]") as HTMLElement).queryByText(text);
const parts = () => [...bar().children].filter((c) => (c as HTMLElement).style.width);

describe("UsageBar", () => {
  it("measures the allowance, not the parts that are left", () => {
    render(<UsageBar label="Credits this period" segments={SEGMENTS} />);
    expect(bar()).toHaveAttribute("aria-valuemin", "0");
    expect(bar()).toHaveAttribute("aria-valuemax", "1650");
    expect(bar()).toHaveAttribute("aria-valuenow", "480");
    expect(bar()).toHaveAttribute("aria-valuetext", "480 used of 1,650");
  });

  it("gives every part its share of the bar, less its share of the gaps", () => {
    render(<UsageBar label="Credits this period" segments={SEGMENTS} />);
    const widths = parts().map((p) => (p as HTMLElement).style.width);
    // 150, 330, 670 and 500 of 1,650, each less its share of the three gaps between the four parts.
    expect(widths[0]).toContain("9.09");
    expect(widths[1]).toContain("20");
    expect(widths[2]).toContain("40.6");
    expect(widths[3]).toContain("30.3");
    for (const width of widths) expect(width).toContain("var(--usage-bar-gap) * 3");
  });

  it("writes a caption under each part and says the same thing once for screen readers", () => {
    const { container } = render(<UsageBar label="Credits this period" segments={SEGMENTS} />);
    expect(caption("Free credits", container)).not.toBeNull();
    expect(caption("670 left in the AI plan", container)).not.toBeNull();
    // The caption row is laid out by width, so it is hidden and one sentence carries the order.
    expect(screen.getByText(/Free credits, 150 used/)).toHaveTextContent(
      "Free credits, 150 used · ran out Oct 12. AI plan, 330 used. 670 left in the AI plan, renews Nov 9. 500 left in the top-up, no end date",
    );
  });

  it("leaves out the caption of a part too narrow to hold one", () => {
    const { container } = render(
      <UsageBar
        label="Credits this period"
        segments={[
          ...SEGMENTS.slice(0, 2),
          { id: "hour", value: 11, intent: "purple", recent: true, label: "In the last hour", legend: "In the last hour" },
          ...SEGMENTS.slice(2),
        ]}
      />,
    );
    expect(caption("AI plan", container)).not.toBeNull();
    expect(caption("In the last hour", container)).toBeNull();
  });

  it("draws a recent sliver one step stronger than the part it follows", () => {
    render(
      <UsageBar
        label="Credits this period"
        segments={[
          { id: "plan", value: 330, intent: "purple", label: "AI plan" },
          { id: "hour", value: 11, intent: "purple", recent: true },
          { id: "left", value: 659, kind: "left", label: "659 left" },
        ]}
      />,
    );
    const drawn = parts().map((p) => (p as HTMLElement).style.background);
    expect(drawn[0]).toBe("var(--bg-purple)");
    expect(drawn[1]).toBe("var(--bg-purple-strong)");
    expect(drawn[2]).toBe("");
  });

  it("draws an outside part past the allowance without counting it in, and marks where the allowance ran out", () => {
    const { container } = render(
      <UsageBar
        label="Credits this period"
        segments={[
          { id: "plan", value: 1000, intent: "purple", label: "AI plan" },
          { id: "topup-left", value: 650, kind: "left", label: "650 left in the top-up" },
          { id: "over", value: 104, kind: "outside", label: "104 over the allowance" },
        ]}
      />,
    );
    // The allowance is still 1,650: the overspend is drawn, not added to what was available.
    expect(bar()).toHaveAttribute("aria-valuemax", "1650");
    expect(bar()).toHaveAttribute("aria-valuetext", "1,000 used of 1,650, 104 over the allowance");
    // Every part fits inside the bar, so an overspend cannot push it out of the box it sits in.
    const total = parts().reduce((sum, p) => sum + parseFloat((p as HTMLElement).style.width.match(/([\d.]+)%/)![1]), 0);
    expect(total).toBeCloseTo(100, 1);
    expect(container.querySelector("[class*=allowanceEnd]")).not.toBeNull();
  });

  it("marks nothing when the allowance was not passed", () => {
    const { container } = render(<UsageBar label="Credits this period" segments={SEGMENTS} />);
    expect(container.querySelector("[class*=allowanceEnd]")).toBeNull();
  });

  it("keys the legend once per used colour, then what is left and what went over", () => {
    const { container } = render(
      <UsageBar
        label="Credits this period"
        segments={[
          ...SEGMENTS,
          { id: "hour", value: 11, intent: "purple", recent: true, legend: "In the last hour" },
          { id: "over", value: 104, kind: "outside", label: "104 over the allowance" },
        ]}
      />,
    );
    // The last hour shares the AI plan's purple, so it is one key, not two.
    expect(key("AI plan", container)).not.toBeNull();
    expect(key("In the last hour", container)).toBeNull();
    expect(key("Left to use", container)).not.toBeNull();
    expect(key("Over the allowance", container)).not.toBeNull();
  });

  it("gives the figure at the start a basis it can give up, and the one at left a floor", () => {
    const { container } = render(
      <UsageBar
        label="Credits this period"
        segments={[
          { id: "plan", value: 1186, intent: "purple", label: "AI plan" },
          { id: "topup-left", value: 464, kind: "left", label: "464 left in the top-up" },
        ]}
        figures={[
          { value: "1,186", label: "used so far", at: "start" },
          { value: "464", label: "left in the top-up", at: "left", intent: "warning" },
          { value: "104", label: "over the allowance · $156.00", at: "end", intent: "danger" },
        ]}
      />,
    );
    // 71.88% of the bar is spent, so without a floor the one at left would be left a sliver of the line.
    const start = container.querySelector("[class*=atStart]") as HTMLElement;
    expect(start.style.flex).toBe("0 1 71.87878787878788%");
    const rules = readFileSync("src/ui/UsageBar/UsageBar.module.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
    expect(rules).toContain("--usage-bar-figure-min: 16ch;");
    expect(rules).toContain(".atLeft { flex: 1 1 auto; min-width: var(--usage-bar-figure-min);");
    expect(rules).toContain(".atStart { flex: 0 0 auto; min-width: 0;");
  });

  it("drops the legend when the captions already name the parts", () => {
    render(<UsageBar label="Credits this period" segments={SEGMENTS} showLegend={false} />);
    expect(screen.queryByText("Left to use")).toBeNull();
  });

  it("takes the chart order for used parts that set no colour", () => {
    render(
      <UsageBar
        label="Credits this period"
        segments={[
          { id: "a", value: 100, label: "First" },
          { id: "b", value: 100, label: "Second" },
          { id: "c", value: 100, kind: "left", label: "Left" },
        ]}
      />,
    );
    const drawn = parts().map((p) => (p as HTMLElement).style.background);
    expect(drawn[0]).toBe("var(--bg-green)");
    expect(drawn[1]).toBe("var(--bg-olive)");
  });

  it("holds the figure at the start to the share of the bar before the first part still to spend", () => {
    const { container } = render(
      <UsageBar
        label="Credits this period"
        segments={SEGMENTS}
        figures={[
          { value: "480", label: "used so far", at: "start" },
          { value: "1,170", label: "left · 71%", at: "left" },
          { value: "1,650", label: "available", at: "end" },
        ]}
      />,
    );
    // 150 and 330 of 1,650 are spent, so the one at left starts at 29.09% — over the first left part.
    // 0 1 rather than 0 0: the start box gives its width up once the three figures would not fit on the line,
    // so the one at left keeps its floor and slides off its part instead of being squeezed to a word a row.
    const start = container.querySelector("[class*=atStart]") as HTMLElement;
    expect(start.style.flex).toContain("29.09");
    expect(start.style.flex.startsWith("0 1 ")).toBe(true);
    expect(screen.getByText("1,170")).toBeInTheDocument();
    expect(screen.getByText("available")).toBeInTheDocument();
  });
});
