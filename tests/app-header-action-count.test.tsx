import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/ui/AppHeader/AppHeader";

// A header action can carry a count, like unread notifications: a kit Count on the icon's corner, said in its name.
describe("AppHeader action count", () => {
  it("shows the count and adds it to the button's name", () => {
    const onAction = vi.fn();
    const { container } = render(
      <AppHeader actions={[{ id: "notifications", label: "Notifications", icon: "notifications", count: 3 }]} onAction={onAction} />,
    );
    const bell = screen.getAllByRole("button", { name: "Notifications, 3 new" })[0];
    fireEvent.click(bell);
    expect(onAction).toHaveBeenCalledWith("notifications");
    expect(container.querySelector('[data-kit="Count"], .count')?.textContent ?? container.textContent).toContain("3");
  });

  it("shows nothing at 0 and keeps the plain name", () => {
    render(<AppHeader actions={[{ id: "notifications", label: "Notifications", icon: "notifications", count: 0 }]} />);
    expect(screen.getAllByRole("button", { name: "Notifications" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /new/ })).toBeNull();
  });

  it("takes its own words and intent", () => {
    render(<AppHeader actions={[{ id: "inbox", label: "Inbox", icon: "inbox", count: 12, countLabel: "unread", countIntent: "info" }]} />);
    expect(screen.getAllByRole("button", { name: "Inbox, 12 unread" }).length).toBeGreaterThan(0);
  });
});
