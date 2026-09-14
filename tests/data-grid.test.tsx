import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridColumn, type DataGridRow } from "@/ui/DataGrid/DataGrid";

const COLUMNS: DataGridColumn[] = [
  { key: "product", header: "Product" },
  { key: "qty", header: "Qty", type: "number", setForAll: true },
];
const ROWS: DataGridRow[] = [
  { id: "r1", product: "Gold plan", qty: "5" },
  { id: "r2", product: "Silver plan", qty: "1" },
];

describe("DataGrid", () => {
  it("copies row 1's value to every row from Set for all", async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();
    render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} onRowsChange={onRowsChange} />);
    await user.click(screen.getByRole("button", { name: /Set for all/ }));
    await user.click(await screen.findByRole("menuitem", { name: /Use row 1 value: 5/ }));
    expect(onRowsChange).toHaveBeenLastCalledWith([
      { id: "r1", product: "Gold plan", qty: "5" },
      { id: "r2", product: "Silver plan", qty: "5" },
    ]);
  });

  it("clears the column from Set for all", async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();
    render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} onRowsChange={onRowsChange} />);
    await user.click(screen.getByRole("button", { name: /Set for all/ }));
    await user.click(await screen.findByRole("menuitem", { name: /Clear all rows/ }));
    expect(onRowsChange).toHaveBeenLastCalledWith([
      { id: "r1", product: "Gold plan", qty: "" },
      { id: "r2", product: "Silver plan", qty: "" },
    ]);
  });

  it("opens and closes a row's detail from its toggle", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <DataGrid
        label="Items" columns={COLUMNS} defaultRows={ROWS} onExpandedChange={onExpandedChange}
        detail={(row) => <p>{`Bands for ${row.product}`}</p>}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Show details, row 1" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Bands for Gold plan")).not.toBeInTheDocument();
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(["r1"]);
    const open = screen.getByRole("button", { name: "Hide details, row 1" });
    expect(open).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Details, row 1" })).toHaveTextContent("Bands for Gold plan");
    await user.click(open);
    expect(screen.queryByText("Bands for Gold plan")).not.toBeInTheDocument();
  });

  it("shows date cells as a date picker with the formatted value", () => {
    render(
      <DataGrid
        label="Terms" columns={[{ key: "product", header: "Product" }, { key: "start", header: "Start date", type: "date" }]}
        defaultRows={[{ id: "t1", product: "Gold plan", start: "2026-08-01" }]}
      />,
    );
    const picker = document.querySelector<HTMLButtonElement>('td[data-cell="t1:start"] button[aria-haspopup="dialog"]');
    expect(picker).not.toBeNull();
    expect(picker).toHaveTextContent("2026");
  });

  it("pins the # column and the first column unless turned off", () => {
    const { rerender } = render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} />);
    const header = () => screen.getByRole("columnheader", { name: "Product" });
    expect(header().className).toMatch(/sticky/);
    rerender(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} stickyFirstColumn={false} />);
    expect(header().className).not.toMatch(/sticky/);
  });
});
