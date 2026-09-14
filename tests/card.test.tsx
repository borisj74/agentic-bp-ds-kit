import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Card } from "@/ui/Card/Card";

describe("Card", () => {
  it("opens with onClick: the title is one button that covers the card", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card overline="72082" title="Brightwater Analytics" description="Account · Monthly billing" onClick={onClick} />);
    const open = screen.getByRole("button", { name: "Brightwater Analytics" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await user.click(open);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("opens from the keyboard: Tab to the card, then Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card title="Cedar Peak Logistics" onClick={onClick} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Cedar Peak Logistics" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("opens with href as a real link, reachable with Tab", async () => {
    const user = userEvent.setup();
    render(<Card title="Lakeshore Clinics" href="/accounts/72074" />);
    const link = screen.getByRole("link", { name: "Lakeshore Clinics" });
    expect(link).toHaveAttribute("href", "/accounts/72074");
    await user.tab();
    expect(link).toHaveFocus();
  });

  it("names the link by the overline when there is no title", () => {
    render(<Card overline="Req 6787690" description="Two monitors" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Req 6787690" })).toBeInTheDocument();
  });

  it("does not open when selectable or disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Card title="Keystone keyboard" selectable onClick={onClick} />);
    expect(screen.queryByRole("button", { name: "Keystone keyboard" })).not.toBeInTheDocument();
    await user.click(screen.getByText("Keystone keyboard"));
    expect(onClick).not.toHaveBeenCalled();
    rerender(<Card title="Keystone keyboard" disabled onClick={onClick} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
