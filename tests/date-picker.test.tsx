import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatePicker } from "@/ui/DatePicker/DatePicker";

const openPanel = () => fireEvent.click(screen.getByRole("button", { name: /Invoice date|Date of birth/ }));
// The month on show: the panel's own heading, read by screen readers either way.
const monthShown = () => screen.getByRole("grid").getAttribute("aria-labelledby");
const headingText = () => document.getElementById(monthShown() ?? "")?.textContent;

describe("DatePicker month and year menus", () => {
  it("writes the month and year as a title by default", () => {
    render(<DatePicker label="Invoice date" defaultValue="2027-01-08" />);
    openPanel();
    expect(headingText()).toBe("January 2027");
    expect(screen.queryByRole("button", { name: /^Month/ })).toBeNull();
  });

  it("offers the month and the year as menus", () => {
    render(<DatePicker label="Date of birth" monthYear="menus" defaultValue="2027-01-08" presets={false} />);
    openPanel();
    expect(screen.getByRole("button", { name: "Month January" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year 2027" })).toBeInTheDocument();
    // The arrows stay beside them.
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
  });

  it("jumps to the month picked and leaves the panel open", () => {
    render(<DatePicker label="Date of birth" monthYear="menus" defaultValue="2027-01-08" presets={false} />);
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: /^Month/ }));
    fireEvent.click(within(screen.getByRole("menu", { name: "Month" })).getByRole("menuitemradio", { name: "September" }));
    expect(headingText()).toBe("September 2027");
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("jumps to the year picked", () => {
    render(<DatePicker label="Date of birth" monthYear="menus" defaultValue="2027-01-08" presets={false} />);
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: /^Year/ }));
    fireEvent.click(within(screen.getByRole("menu", { name: "Year" })).getByRole("menuitemradio", { name: "2021" }));
    expect(headingText()).toBe("January 2021");
  });

  it("offers only the years between minDate and maxDate", () => {
    render(<DatePicker label="Date of birth" monthYear="menus" defaultValue="2027-01-08" minDate="2025-03-01" maxDate="2028-06-30" presets={false} />);
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: /^Year/ }));
    const items = within(screen.getByRole("menu", { name: "Year" })).getAllByRole("menuitemradio");
    expect(items.map((i) => i.textContent?.replace(/check$/, ""))).toEqual(["2025", "2026", "2027", "2028"]);
  });

  it("switches off a month with no day inside the limits", () => {
    render(<DatePicker label="Date of birth" monthYear="menus" defaultValue="2027-01-08" minDate="2027-04-01" presets={false} />);
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: /^Month/ }));
    const menu = screen.getByRole("menu", { name: "Month" });
    expect(within(menu).getByRole("menuitemradio", { name: "February" })).toHaveAttribute("aria-disabled", "true");
    expect(within(menu).getByRole("menuitemradio", { name: "May" })).not.toHaveAttribute("aria-disabled", "true");
  });
});
