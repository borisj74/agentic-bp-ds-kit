import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageHeader } from "@/ui/PageHeader/PageHeader";

// back is a shortcut to where the page was opened from: an icon-only Button named by its label, which falls
// back through onClick, then href, then the browser's own step back.
const header = (props: Partial<Parameters<typeof PageHeader>[0]> = {}) =>
  render(<PageHeader title="Northwind Traders" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Accounts", href: "/accounts" }]} {...props} />);

const backButton = () => screen.getByRole("button", { name: "Back to accounts" });

afterEach(() => vi.restoreAllMocks());

describe("PageHeader back", () => {
  it("draws nothing without the prop", () => {
    header();
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
  });

  it("names the button with the label, so the arrow says where it goes", () => {
    header({ back: { label: "Back to accounts" } });
    expect(backButton()).toBeTruthy();
  });

  it("sits at the start of the title line, before the icon and the heading", () => {
    const { container } = header({ back: { label: "Back to accounts" }, icon: "folder_open" });
    const heading = container.querySelector("h1")!;
    const row = heading.parentElement!;
    const arrow = row.querySelector("button")!;
    // The Tooltip wraps the Button, so the arrow is the row's first child or sits inside it.
    expect(row.firstElementChild!.contains(arrow)).toBe(true);
    expect(arrow.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(arrow.textContent).toContain("Back to accounts");
  });

  it("calls onClick and leaves history alone", async () => {
    const onClick = vi.fn();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    header({ back: { label: "Back to accounts", onClick } });
    await userEvent.click(backButton());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
  });

  it("follows href when there is no onClick", async () => {
    // jsdom's location cannot be spied on, so it is swapped for the one call back reads.
    const real = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { assign } });
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    try {
      header({ back: { label: "Back to accounts", href: "/accounts" } });
      await userEvent.click(backButton());
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: real });
    }
    expect(assign).toHaveBeenCalledWith("/accounts");
    expect(back).not.toHaveBeenCalled();
  });

  it("goes back one step with neither", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    header({ back: { label: "Back to accounts" } });
    await userEvent.click(backButton());
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("leads the compact bar in sticky, where there is no title row", () => {
    const { container } = header({ back: { label: "Back to accounts" }, sticky: true });
    const line = container.querySelector("button")!.closest("div")!;
    expect(line.querySelector("nav[aria-label='Breadcrumb']")).toBeTruthy();
    expect(container.querySelector("button")!.compareDocumentPosition(line.querySelector("nav")!))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
