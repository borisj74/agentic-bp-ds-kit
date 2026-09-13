import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "@/ui/Tabs/Tabs";

const ITEMS = [
  { id: "overview", label: "Overview", content: "Overview panel" },
  { id: "invoices", label: "Invoices", content: "Invoices panel" },
  { id: "payments", label: "Payments", content: "Payments panel", disabled: true },
  { id: "notes", label: "Notes", content: "Notes panel" },
];

const setup = () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Tabs label="Account sections" items={ITEMS} onChange={onChange} />);
  return { user, onChange, tab: (name: string) => screen.getByRole("tab", { name }) };
};

describe("Tabs", () => {
  it("is a named tablist with the first tab selected and its panel shown", () => {
    const { tab } = setup();
    expect(screen.getByRole("tablist", { name: "Account sections" })).toBeInTheDocument();
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Overview" })).toHaveTextContent("Overview panel");
  });

  it("has one tab stop: only the selected tab is reachable with Tab", () => {
    const { tab } = setup();
    expect(tab("Overview")).toHaveAttribute("tabindex", "0");
    expect(tab("Invoices")).toHaveAttribute("tabindex", "-1");
  });

  it("moves and selects with the arrow keys, skipping disabled tabs", async () => {
    const { user, tab, onChange } = setup();
    await user.click(tab("Overview"));
    await user.keyboard("{ArrowRight}");
    expect(tab("Invoices")).toHaveFocus();
    expect(tab("Invoices")).toHaveAttribute("aria-selected", "true");
    expect(onChange).toHaveBeenLastCalledWith("invoices");
    await user.keyboard("{ArrowRight}");
    expect(tab("Notes")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(tab("Invoices")).toHaveFocus();
  });

  it("jumps to the ends with Home and End", async () => {
    const { user, tab } = setup();
    await user.click(tab("Overview"));
    await user.keyboard("{End}");
    expect(tab("Notes")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tab("Overview")).toHaveFocus();
  });

  // Regression: every tab pointed aria-controls at a panel, but only the selected panel is on the page.
  it("points aria-controls only from the selected tab, at a panel that exists", async () => {
    const { user, tab } = setup();
    const controlled = () => screen.getAllByRole("tab").filter((t) => t.hasAttribute("aria-controls"));
    expect(controlled()).toEqual([tab("Overview")]);
    expect(document.getElementById(tab("Overview").getAttribute("aria-controls")!)).toBeInTheDocument();
    await user.click(tab("Notes"));
    expect(controlled()).toEqual([tab("Notes")]);
    expect(screen.getByRole("tabpanel", { name: "Notes" })).toHaveTextContent("Notes panel");
  });
});
