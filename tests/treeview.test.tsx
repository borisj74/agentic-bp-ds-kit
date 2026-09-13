import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TreeView, type TreeItem } from "@/ui/TreeView/TreeView";

const ITEMS: TreeItem[] = [
  { id: "plans", label: "Plans", children: [{ id: "gold", label: "Gold" }] },
  { id: "usage", label: "Usage" },
  { id: "tax", label: "Tax" },
];

const setup = () => {
  const onItemsChange = vi.fn();
  render(<TreeView label="Catalog" defaultItems={ITEMS} defaultExpanded={["plans"]} reorderable onItemsChange={onItemsChange} />);
  return { user: userEvent.setup(), onItemsChange };
};
// Visible rows as id:level, in order.
const rows = () => screen.getAllByRole("treeitem").map((r) => `${r.dataset.id}:${r.getAttribute("aria-level")}`);
const row = (id: string) => screen.getAllByRole("treeitem").find((r) => r.dataset.id === id)!;

// Regression for WCAG 2.5.7 and 2.1.1: reordering needed a drag, and a keyboard could not move a row in or out of a folder.
describe("TreeView moves without dragging", () => {
  it("moves a row up from its Move menu, without selecting it", async () => {
    const { user, onItemsChange } = setup();
    await user.click(screen.getByRole("button", { name: "Move Tax" }));
    const menu = screen.getByRole("menu", { name: "Move Tax" });
    expect(within(menu).getByRole("menuitem", { name: /Move up/ })).not.toHaveAttribute("aria-disabled");
    expect(within(menu).getByRole("menuitem", { name: /Move down/ })).toHaveAttribute("aria-disabled", "true");
    await user.click(within(menu).getByRole("menuitem", { name: /Move up/ }));
    expect(rows()).toEqual(["plans:1", "gold:2", "tax:1", "usage:1"]);
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(row("tax")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Moved Tax, 2 of 3")).toBeInTheDocument();
  });

  it("moves a row into the folder above and back out from the menu", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Move Usage" }));
    await user.click(screen.getByRole("menuitem", { name: /Move into Plans/ }));
    expect(rows()).toEqual(["plans:1", "gold:2", "usage:2", "tax:1"]);
    await user.click(screen.getByRole("button", { name: "Move Usage" }));
    await user.click(screen.getByRole("menuitem", { name: /Move out of Plans/ }));
    expect(rows()).toEqual(["plans:1", "gold:2", "usage:1", "tax:1"]);
  });

  it("moves into and out of folders with Alt and the side arrows", () => {
    setup();
    fireEvent.keyDown(row("usage"), { key: "ArrowRight", altKey: true });
    expect(rows()).toEqual(["plans:1", "gold:2", "usage:2", "tax:1"]);
    expect(screen.getByText("Moved Usage into Plans")).toBeInTheDocument();
    fireEvent.keyDown(row("gold"), { key: "ArrowLeft", altKey: true });
    expect(rows()).toEqual(["plans:1", "usage:2", "gold:1", "tax:1"]);
    expect(screen.getByText("Moved Gold out of Plans")).toBeInTheDocument();
  });

  it("opens the Move menu with Shift+F10 and keeps its button out of the tab order", async () => {
    setup();
    const button = screen.getByRole("button", { name: "Move Usage" });
    expect(button).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(row("usage"), { key: "F10", shiftKey: true });
    await waitFor(() => expect(screen.getByRole("menu", { name: "Move Usage" })).toBeInTheDocument());
    expect(screen.getByRole("tree")).toHaveAccessibleDescription(/Alt with the arrow keys moves the row/);
  });

  it("does not move the tree focus when arrowing inside the open menu", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Move Usage" }));
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Move up/ })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Move down/ })).toHaveFocus();
    expect(rows()).toEqual(["plans:1", "gold:2", "usage:1", "tax:1"]);
  });
});
