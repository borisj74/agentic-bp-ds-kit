import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/ui/AppHeader/AppHeader";

// BP AI in the bar opens and closes the AppShell assistant, so the way in never moves when the panel opens.
describe("AppHeader BP AI", () => {
  it("shows BP AI before the utility icons and calls onToggle", () => {
    const onToggle = vi.fn();
    render(<AppHeader assistant={{ onToggle }} actions={[{ id: "help", label: "Help", icon: "help" }]} />);
    const ai = screen.getByRole("button", { name: "BP AI" });
    expect(ai).toHaveAttribute("aria-pressed", "false");
    const help = screen.getAllByRole("button", { name: "Help" })[0];
    expect(ai.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(ai);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows pressed while the assistant is open, with its own label", () => {
    render(<AppHeader assistant={{ label: "Ask BP AI", open: true, onToggle: () => {} }} />);
    expect(screen.getByRole("button", { name: "Ask BP AI" })).toHaveAttribute("aria-pressed", "true");
  });

  it("has no BP AI without assistant", () => {
    render(<AppHeader />);
    expect(screen.queryByRole("button", { name: "BP AI" })).toBeNull();
  });
});
