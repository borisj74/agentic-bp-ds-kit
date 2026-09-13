import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Lookup, type LookupRow } from "@/ui/Lookup/Lookup";
import type { TableColumn } from "@/ui/Table/Table";

const COLUMNS: TableColumn[] = [{ key: "name", header: "Name" }, { key: "status", header: "Status" }];
const ROWS: LookupRow[] = [
  { id: "p1", name: "Gold plan", status: "Active" },
  { id: "p2", name: "Silver plan", status: "Paused" },
];

const field = () => document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;

describe("Lookup", () => {
  it("opens a named dialog from the field", async () => {
    const user = userEvent.setup();
    render(<Lookup label="Product" columns={COLUMNS} rows={ROWS} labelKey="name" />);
    expect(field()).toBeInTheDocument();
    await user.click(field());
    expect(await screen.findByRole("dialog", { name: "Lookup: Product" })).toBeInTheDocument();
  });

  it("picks a row from the keyboard-reachable name, closes, and shows the pick", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Lookup label="Product" columns={COLUMNS} rows={ROWS} labelKey="name" onChange={onChange} />);
    await user.click(field());
    const dialog = await screen.findByRole("dialog", { name: "Lookup: Product" });
    await user.click(within(dialog).getByRole("button", { name: "Silver plan" }));
    expect(onChange).toHaveBeenCalledWith("p2", expect.objectContaining({ id: "p2" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(field()).toHaveTextContent("Silver plan");
  });

  it("gives focus back to the field when the dialog closes", async () => {
    const user = userEvent.setup();
    render(<Lookup label="Product" columns={COLUMNS} rows={ROWS} labelKey="name" />);
    await user.click(field());
    await screen.findByRole("dialog", { name: "Lookup: Product" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(field()).toHaveFocus();
  });

  it("clears the pick with the named Clear button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Lookup label="Product" columns={COLUMNS} rows={ROWS} labelKey="name" defaultValue="p1" clearable onChange={onChange} />);
    expect(field()).toHaveTextContent("Gold plan");
    await user.click(screen.getByRole("button", { name: "Clear Product" }));
    expect(onChange).toHaveBeenCalledWith(null, null);
  });
});
