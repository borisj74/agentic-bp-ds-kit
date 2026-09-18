import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListView, type ListViewItem } from "@/ui/ListView/ListView";

const items: ListViewItem[] = [
  { id: "a", primary: "Rhea Walsh", secondary: "Billing admin", avatar: "Rhea Walsh", group: "admins" },
  { id: "b", primary: "Ammar Malik", secondary: "Finance lead", group: "members" },
  { id: "c", primary: "Sienna Cole", secondary: "Account owner", group: "members" },
];
const order = () => screen.getAllByRole("listitem").map((li) => li.querySelector("[class*=primary]")?.textContent);

describe("ListView", () => {
  it("is a list named by its label", () => {
    render(<ListView label="Team" items={items} />);
    expect(within(screen.getByRole("list", { name: "Team" })).getAllByRole("listitem")).toHaveLength(3);
  });

  it("single: a click picks one row", () => {
    const onSelectedChange = vi.fn();
    render(<ListView label="Team" items={items} selection="single" onSelectedChange={onSelectedChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Ammar Malik/ }));
    expect(onSelectedChange).toHaveBeenCalledWith(["b"]);
    expect(screen.getByRole("button", { name: /Ammar Malik/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("multiple: each row has a checkbox, and a click on the row toggles it", () => {
    render(<ListView label="Team" items={items} selection="multiple" defaultSelected={["a"]} />);
    expect(screen.getByRole("checkbox", { name: "Rhea Walsh" })).toBeChecked();
    fireEvent.click(screen.getByText("Account owner"));
    expect(screen.getByRole("checkbox", { name: "Sienna Cole" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Rhea Walsh" }));
    expect(screen.getByRole("checkbox", { name: "Rhea Walsh" })).not.toBeChecked();
  });

  it("drill: a click opens the record", () => {
    const onOpen = vi.fn();
    render(<ListView label="Team" items={items} interaction="drill" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /Sienna Cole/ }));
    expect(onOpen).toHaveBeenCalledWith("c");
  });

  it("names each action by the action and the row", () => {
    const onAction = vi.fn();
    render(<ListView label="Team" items={[{ ...items[0], actions: [{ id: "share", label: "Share", icon: "share" }] }]} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Share Rhea Walsh" }));
    expect(onAction).toHaveBeenCalledWith("a", "share");
  });

  it("drag: Alt with the arrows moves the row and says where it went", () => {
    const onItemsChange = vi.fn();
    const { rerender } = render(<ListView label="Team" items={items} interaction="drag" onItemsChange={onItemsChange} />);
    const row = screen.getByText("Rhea Walsh").closest("li")!;
    fireEvent.keyDown(row, { key: "ArrowDown", altKey: true });
    const moved = onItemsChange.mock.calls[0][0] as ListViewItem[];
    expect(moved.map((i) => i.id)).toEqual(["b", "a", "c"]);
    rerender(<ListView label="Team" items={moved} interaction="drag" onItemsChange={onItemsChange} />);
    expect(order()).toEqual(["Ammar Malik", "Rhea Walsh", "Sienna Cole"]);
    expect(screen.getByText("Moved Rhea Walsh, 2 of 3")).toBeInTheDocument();
  });

  it("drag without onItemsChange keeps its own order", () => {
    render(<ListView label="Team" items={items} interaction="drag" />);
    fireEvent.keyDown(screen.getByText("Sienna Cole").closest("li")!, { key: "Home", altKey: true });
    expect(order()).toEqual(["Sienna Cole", "Rhea Walsh", "Ammar Malik"]);
  });

  it("groups: each header names its own list, and moves stay inside the group", () => {
    render(
      <ListView
        label="Team" items={items} interaction="drag"
        groups={[{ id: "admins", title: "Admins" }, { id: "members", title: "Members" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Admins" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Members" })).getAllByRole("listitem")).toHaveLength(2);
    // The only admin has nowhere to go.
    fireEvent.keyDown(screen.getByText("Rhea Walsh").closest("li")!, { key: "ArrowDown", altKey: true });
    expect(order()).toEqual(["Rhea Walsh", "Ammar Malik", "Sienna Cole"]);
  });

  it("collapsible: a header button folds its rows away", () => {
    render(<ListView label="Team" items={items} collapsible groups={[{ id: "admins", title: "Admins" }, { id: "members", title: "Members" }]} />);
    const head = screen.getByRole("button", { name: "Members" });
    expect(head).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(head);
    expect(head).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list", { name: "Members" })).toBeNull();
  });

  it("reads the unread dot and shows an item-level message", () => {
    render(<ListView label="Inbox" items={[{ id: "m", primary: "Payment received", unread: true, message: "Posted to the ledger", messageTone: "success" }]} />);
    expect(screen.getByText("Unread")).toBeInTheDocument();
    expect(screen.getByText("Posted to the ledger")).toBeInTheDocument();
  });
});
