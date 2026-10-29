import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/ui/Button/Button";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

describe("Toolbar", () => {
  // Regression: aria-controls pointed at the filter bar while the bar was closed and not on the page.
  it("toggles the filter bar, pointing aria-controls at it only while it is open", async () => {
    const user = userEvent.setup();
    const onFiltersOpenChange = vi.fn();
    render(
      <Toolbar
        label="Invoice tools" filters={<Button size="sm">Status</Button>} onReset={() => {}} onFiltersOpenChange={onFiltersOpenChange}
      />,
    );
    const filters = screen.getByRole("button", { name: "Filters" });
    expect(filters).toHaveAttribute("aria-expanded", "false");
    expect(filters).not.toHaveAttribute("aria-controls");

    await user.click(filters);
    expect(onFiltersOpenChange).toHaveBeenCalledWith(true);
    expect(filters).toHaveAttribute("aria-expanded", "true");
    const bar = document.getElementById(filters.getAttribute("aria-controls")!);
    expect(bar).toHaveAttribute("role", "group");
    expect(bar).toHaveAccessibleName("Filters");
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("shows how many filters are on", () => {
    render(<Toolbar filters={<Button size="sm">Status</Button>} filterCount={2} />);
    expect(screen.getByRole("button", { name: /Filters/ })).toHaveTextContent("2");
  });

  it("is a named group whose actions appear once to assistive tech, despite the hidden measuring copy", () => {
    render(<Toolbar label="Invoice tools" actions={<><Button size="sm">Export</Button><Button size="sm" emphasis="strong" intent="brand">New invoice</Button></>} />);
    expect(screen.getByRole("group", { name: "Invoice tools" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Export" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "New invoice" })).toHaveLength(1);
  });

  it("names the Refresh icon button and runs it", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<Toolbar onRefresh={onRefresh} />);
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("keeps a field after the search and says how many rows are ticked", () => {
    render(
      <Toolbar
        label="Rate tools" onSearchChange={() => {}} field={<Button size="sm">Effective on</Button>} selectedCount={3}
        actions={<Button size="sm">Add pricing</Button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Effective on" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 selected");
  });

  // Regression: the field slot was a plain block, so two controls passed in a fragment touched with no gap.
  it("holds two field controls in one slot, spaced like the bar", () => {
    render(
      <Toolbar
        label="Rate tools" onSearchChange={() => {}}
        field={<><Button size="sm">Effective on</Button><Button size="sm">Collapse all</Button></>}
      />,
    );
    const effective = screen.getByRole("button", { name: "Effective on" });
    const collapse = screen.getByRole("button", { name: "Collapse all" });
    expect(effective.parentElement).toBe(collapse.parentElement);

    // jsdom applies no CSS Module rules, so the slot's own spacing is read off the stylesheet.
    const css = readFileSync("src/ui/Toolbar/Toolbar.module.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
    expect(css).toContain(".field { display: flex; align-items: center; gap: var(--space-xsmall);");
  });

  it("shows no count when nothing is ticked", () => {
    render(<Toolbar label="Rate tools" selectedCount={0} actions={<Button size="sm">Add pricing</Button>} />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
