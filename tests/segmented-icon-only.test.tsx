import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Segmented } from "@/ui/Segmented/Segmented";

const MODES = [
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
];

describe("Segmented iconOnly", () => {
  it("keeps each option's label as its accessible name", () => {
    render(<Segmented label="Colour mode" hideLabel iconOnly defaultValue="light" options={MODES} />);
    const group = screen.getByRole("radiogroup", { name: "Colour mode" });
    expect(within(group).getByRole("radio", { name: "Light" })).toBeChecked();
    expect(within(group).getByRole("radio", { name: "Dark" })).not.toBeChecked();
  });
  it("takes the words off the buttons", () => {
    const { container } = render(<Segmented label="Colour mode" iconOnly defaultValue="light" options={MODES} />);
    // The label lives on in hidden text, so it is read but never laid out as a visible word.
    const visible = [...container.querySelectorAll('[role="radio"] span')].filter((s) => s.className.includes("label"));
    expect(visible).toHaveLength(0);
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
  });
  it("leaves an option with no icon its label, so a half-marked group still reads", () => {
    render(<Segmented label="View" iconOnly defaultValue="list" options={[{ value: "list", label: "List", icon: "view_list" }, { value: "board", label: "Board" }]} />);
    expect(screen.getByRole("radio", { name: "Board" })).toHaveTextContent("Board");
  });
  it("shows the words without it", () => {
    render(<Segmented label="Colour mode" defaultValue="light" options={MODES} />);
    expect(screen.getByRole("radio", { name: "Light" })).toHaveTextContent("Light");
  });
});
