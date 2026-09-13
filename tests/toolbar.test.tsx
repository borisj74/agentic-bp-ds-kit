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
    render(<Toolbar label="Invoice tools" actions={<><Button size="sm">Export</Button><Button size="sm" variant="primary">New invoice</Button></>} />);
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
});
