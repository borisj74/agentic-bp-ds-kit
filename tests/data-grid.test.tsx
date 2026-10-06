import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridColumn, type DataGridRow } from "@/ui/DataGrid/DataGrid";
import { Table } from "@/ui/Table/Table";

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

  it("opens a row from its +N more button when a column has opensDetail", async () => {
    const user = userEvent.setup();
    render(
      <DataGrid
        label="Items" defaultRows={ROWS}
        columns={[{ key: "product", header: "Product" }, { key: "qty", header: "Qty", readOnly: true, opensDetail: true }]}
        detail={(row) => (row.id === "r1" ? <p>All rates for Gold plan</p> : null)}
        detailCount={(row) => (row.id === "r1" ? 3 : undefined)}
      />,
    );
    // No toggle column: the cell's button is the only way in, and only on the row with more.
    expect(screen.queryByRole("button", { name: /details, row/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more, row 2/ })).not.toBeInTheDocument();
    const more = screen.getByRole("button", { name: "3 more, row 1" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Details, row 1" })).toHaveTextContent("All rates for Gold plan");
    await user.click(more);
    expect(screen.queryByText("All rates for Gold plan")).not.toBeInTheDocument();
  });

  it("gives a toggle only to rows that have a detail", () => {
    render(
      <DataGrid
        label="Items" columns={COLUMNS} defaultRows={ROWS} defaultExpanded={["r2"]}
        detail={(row) => (row.id === "r1" ? <p>Bands for Gold plan</p> : null)}
      />,
    );
    expect(screen.getByRole("button", { name: "Show details, row 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /details, row 2/ })).not.toBeInTheDocument();
    // A row without a detail never opens, even when it is listed as expanded.
    expect(screen.queryByRole("group", { name: "Details, row 2" })).not.toBeInTheDocument();
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

  it("adds an empty row under a row from its + button", async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();
    render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} onRowsChange={onRowsChange} canInsertRows canRemoveRows />);
    await user.click(screen.getByRole("button", { name: "Add row below row 1" }));
    const next = onRowsChange.mock.lastCall?.[0];
    expect(next).toHaveLength(3);
    expect(next[0].id).toBe("r1");
    expect(next[1]).toMatchObject({ product: "", qty: "" });
    expect(next[2].id).toBe("r2");
    expect(screen.getByRole("button", { name: "Remove row 1" })).toBeInTheDocument();
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
  it("shows the opensDetail value, then a Count of the other values inside the button", () => {
    render(
      <DataGrid
        label="Products" defaultRows={[{ id: "m1", product: "Sandbox Environment", rate: "USD 0–10,000: 1,800.00" }]}
        columns={[{ key: "product", header: "Product" }, { key: "rate", header: "Rate", readOnly: true, opensDetail: true }]}
        detail={() => <p>Every band</p>} detailCount={() => 2}
      />,
    );
    const more = screen.getByRole("button", { name: "2 more, row 1" });
    const cell = more.closest("td")!;
    expect(cell).toHaveTextContent("USD 0–10,000: 1,800.00");
    // The kit Count sits in the button: its digit, and its "2 more" text for screen readers.
    expect(more).toHaveTextContent("2");
    expect(more).toHaveTextContent("2 more");
    expect(more.querySelector(".material-symbols-outlined, [aria-hidden='true']")).not.toBeNull();
  });

  it("keeps a kit Table inside an open detail free of the grid's cell look", () => {
    render(
      <DataGrid
        label="Products" defaultRows={[{ id: "m1", product: "Sandbox Environment", rate: "USD 0–10,000: 1,800.00" }]} defaultExpanded={["m1"]}
        columns={[{ key: "product", header: "Product" }, { key: "rate", header: "Rate", readOnly: true, opensDetail: true }]}
        detail={() => <Table size="sm" line="thin" caption="Sandbox Environment: 3 rates in USD." columns={[{ key: "rate", header: "Rate" }]} rows={[{ id: "b1", rate: "1,800.00" }]} />}
        detailCount={() => 2}
      />,
    );
    const grid = document.querySelector("[data-data-grid]")!;
    const outer = grid.querySelector("table")!;
    const inner = screen.getByRole("table", { name: /Sandbox Environment: 3 rates in USD\./ });
    expect(inner).not.toBe(outer);
    // The inner Table's cells carry none of the grid's classes.
    const gridClasses = new Set([...outer.querySelectorAll(":scope > tbody > tr > td")].flatMap((td) => [...td.classList]));
    inner.querySelectorAll("td, th").forEach((c) => [...c.classList].forEach((k) => expect(gridClasses.has(k)).toBe(false)));
    // Every plain cell rule in the grid's CSS goes through .table > thead/tbody > tr, so it cannot reach a nested table.
    const css = readFileSync("src/ui/DataGrid/DataGrid.module.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = css.split("}").map((r) => r.split("{")[0]).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
    const loose = selectors.filter((s) => /(^|\s)(td|th)(?![\w.-])/.test(s) && !/> (tbody|thead) > tr > (td|th)/.test(s) && !/(td|th)(\.|:has)/.test(s));
    expect(loose).toEqual([]);
  });
});
