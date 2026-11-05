import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Legend } from "@/ui/Legend/Legend";

const marks = (container: HTMLElement) => [...container.querySelectorAll("[class*=mark]")] as HTMLElement[];

describe("Legend", () => {
  it("paints every key its own colour", () => {
    const { container } = render(
      <Legend label="Balances" items={[{ label: "Free credits", intent: "mint" }, { label: "AI plan", intent: "purple" }]} />,
    );
    expect(marks(container).map((m) => m.style.background)).toEqual(["var(--bg-mint)", "var(--bg-purple)"]);
  });

  // outline keys what is empty rather than coloured, like the part of a usage bar still to be used.
  it("leaves an outline key without a colour of its own", () => {
    const { container } = render(
      <Legend label="Credits" items={[{ label: "Used", intent: "purple" }, { label: "Left to use", shape: "outline" }]} />,
    );
    const [used, left] = marks(container);
    expect(used.style.background).toBe("var(--bg-purple)");
    expect(left.className).toMatch(/outline/);
    expect(left.style.background).toBe("");
  });

  it("takes an outline for every key when the legend asks for it", () => {
    const { container } = render(<Legend label="Empty" shape="outline" items={[{ label: "Left", intent: "purple" }]} />);
    const [mark] = marks(container);
    expect(mark.className).toMatch(/outline/);
    // The intent is ignored rather than fighting the empty box.
    expect(mark.style.background).toBe("");
  });

  // strong keys a darker part drawn in the same colour as the whole it came out of.
  it("paints a strong key the strong step of its colour", () => {
    const { container } = render(
      <Legend
        label="Credits"
        items={[{ label: "AI plan", intent: "purple" }, { label: "Used in the last hour", intent: "purple", strong: true }]}
      />,
    );
    expect(marks(container).map((m) => m.style.background)).toEqual(["var(--bg-purple)", "var(--bg-purple-strong)"]);
  });

  // BP's series order, and red held out of it: red means danger, so a tenth series taking it would read as a
  // problem it is not. A key only draws red by asking for it, and past the ninth the order starts again.
  it("hands out BP's series order and never red", () => {
    const { container } = render(
      <Legend label="Series" items={[...Array(10)].map((_, i) => ({ label: `Series ${i + 1}` }))} />,
    );
    const drawn = marks(container).map((m) => m.style.background);
    expect(drawn.slice(0, 9)).toEqual(
      ["pink", "orange", "gray", "cyan", "mint", "green", "olive", "yellow", "purple"].map((h) => `var(--bg-${h})`),
    );
    expect(drawn).not.toContain("var(--bg-red)");
    expect(drawn[9]).toBe("var(--bg-pink)");
  });

  it("still names the keys", () => {
    render(<Legend label="Credits" items={[{ label: "Used", intent: "purple" }, { label: "Left to use", shape: "outline" }]} />);
    expect(screen.getByRole("list", { name: "Credits" })).toBeInTheDocument();
    expect(screen.getByText("Left to use")).toBeInTheDocument();
  });
});
