import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsageList } from "@/ui/UsageList/UsageList";

// The fill inside a row's bar, where the intent shows.
const fillOf = (bar: HTMLElement) => bar.querySelector("span[style*=width]") as HTMLElement;

describe("UsageList", () => {
  it("names the list and writes used of limit with the unit", () => {
    render(<UsageList label="Plan usage" items={[{ id: "storage", label: "Storage", used: 32, limit: 50, unit: "GB" }]} />);
    const list = screen.getByRole("list", { name: "Plan usage" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(list).toHaveTextContent("Storage");
    expect(list).toHaveTextContent("32 of 50 GB");
  });

  it("stays blue under 80% of the limit", () => {
    render(<UsageList items={[{ id: "api", label: "API calls", used: 7999, limit: 10000 }]} />);
    const bar = screen.getByRole("progressbar", { name: "API calls: 7,999 of 10,000 used" });
    expect(bar).toHaveAttribute("aria-valuenow", "80");
    expect(fillOf(bar).className).toMatch(/info/);
  });

  it("turns amber at 80% and says it is almost at the limit", () => {
    render(<UsageList items={[{ id: "api", label: "API calls", used: 8000, limit: 10000 }]} />);
    const bar = screen.getByRole("progressbar", { name: "API calls: 8,000 of 10,000 used, Almost at limit" });
    expect(fillOf(bar).className).toMatch(/warning/);
  });

  it("turns red at 100% and says the limit is reached", () => {
    render(<UsageList items={[{ id: "seats", label: "Seats", used: 12, limit: 12 }]} />);
    const bar = screen.getByRole("progressbar", { name: "Seats: 12 of 12 used, Limit reached" });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(fillOf(bar).className).toMatch(/danger/);
  });

  it("shows use over the limit as it is, with a full red bar", () => {
    render(<UsageList items={[{ id: "inv", label: "Invoices sent", used: 1240, limit: 1000 }]} />);
    const bar = screen.getByRole("progressbar", { name: "Invoices sent: 1,240 of 1,000 used, Limit reached" });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("list")).toHaveTextContent("1,240 of 1,000");
  });

  it("shows the note under the bar", () => {
    render(<UsageList items={[{ id: "api", label: "API calls", used: 10, limit: 100, note: "Resets on Oct 1" }]} />);
    expect(screen.getByText("Resets on Oct 1")).toBeInTheDocument();
  });

  it("treats a zero limit with any use as reached, and without use as empty", () => {
    render(
      <UsageList
        items={[
          { id: "a", label: "Add-ons", used: 1, limit: 0 },
          { id: "b", label: "Exports", used: 0, limit: 0 },
        ]}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "Add-ons: 1 of 0 used, Limit reached" })).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("progressbar", { name: "Exports: 0 of 0 used" })).toHaveAttribute("aria-valuenow", "0");
  });
});
