import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListDetail } from "@/patterns/ListDetail/ListDetail";
import { Card } from "@/ui/Card/Card";
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

const accounts: ListViewItem[] = [
  { id: "apex", primary: "Apex", secondary: "2 invoices", children: [
    { id: "i1", primary: "INV-1042", secondary: "August" },
    { id: "i2", primary: "INV-0990", secondary: "July" },
  ] },
  { id: "globex", primary: "Globex" },
];

describe("ListView nested", () => {
  it("steps into a row's children, focuses Back, and Back returns focus to the row", () => {
    const onPathChange = vi.fn();
    render(<ListView label="Accounts" items={accounts} onPathChange={onPathChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Apex/ }));
    expect(onPathChange).toHaveBeenLastCalledWith(["apex"]);
    expect(screen.getByRole("heading", { level: 3, name: "Apex" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Apex" })).getAllByRole("listitem")).toHaveLength(2);
    const back = screen.getByRole("button", { name: "Back to Accounts" });
    expect(back).toHaveFocus();
    fireEvent.click(back);
    expect(onPathChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("button", { name: /Apex/ })).toHaveFocus();
  });

  it("opens with defaultPath, and moves stay inside the level on screen", () => {
    const onItemsChange = vi.fn();
    render(<ListView label="Accounts" items={accounts} defaultPath={["apex"]} interaction="drag" onItemsChange={onItemsChange} />);
    fireEvent.keyDown(screen.getByText("INV-1042").closest("li")!, { key: "ArrowDown", altKey: true });
    const next = onItemsChange.mock.calls[0][0] as ListViewItem[];
    expect(next[0].children!.map((i) => i.id)).toEqual(["i2", "i1"]);
    expect(next[1].id).toBe("globex");
  });

  it("a leaf row still opens its record", () => {
    const onOpen = vi.fn();
    render(<ListView label="Accounts" items={accounts} interaction="drill" defaultPath={["apex"]} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /INV-0990/ }));
    expect(onOpen).toHaveBeenCalledWith("i2");
  });
});

describe("ListDetail", () => {
  const list = <ListView label="Invoices" items={[{ id: "a", primary: "INV-1" }]} />;

  it("shows the empty pane until a record is open", () => {
    render(<ListDetail label="Invoices" list={list} empty={<p>Pick an invoice</p>} detail={<p>Details</p>} />);
    expect(screen.getByText("Pick an invoice")).toBeInTheDocument();
    expect(screen.queryByText("Details")).toBeNull();
  });

  it("shows the open record as a named region with Back", () => {
    const onBack = vi.fn();
    render(<ListDetail label="Invoices" list={list} open title="INV-1" detail={<p>Details</p>} onBack={onBack} backLabel="Back to invoices" />);
    expect(screen.getByRole("region", { name: "INV-1" })).toHaveTextContent("Details");
    expect(screen.getByRole("heading", { level: 2, name: "INV-1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to invoices", hidden: true }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe("Same actions in every view", () => {
  const menu = [{ id: "view", label: "View invoice" }, { id: "void", label: "Void", danger: true }];

  it("ListView: a row's More menu reports the row and the action", () => {
    const onAction = vi.fn();
    render(<ListView label="Invoices" items={[{ id: "a", primary: "INV-1", actions: [{ id: "send", label: "Send", icon: "send" }], menu }]} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Send INV-1" }));
    fireEvent.click(screen.getByRole("button", { name: "More actions for INV-1" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Void/ }));
    expect(onAction.mock.calls).toEqual([["a", "send"], ["a", "void"]]);
  });

  it("Card: footer actions report the action and do not tick the card", () => {
    const onAction = vi.fn();
    const onSelectedChange = vi.fn();
    render(<Card title="INV-1" selectable onSelectedChange={onSelectedChange} actions={[{ id: "send", label: "Send", icon: "send" }]} menu={menu} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Send INV-1" }));
    fireEvent.click(screen.getByRole("button", { name: "More actions for INV-1" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /View invoice/ }));
    expect(onAction.mock.calls).toEqual([["send"], ["view"]]);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});
