import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/ui/DataGrid/DataGrid";
import { HeaderCell } from "@/ui/HeaderCell/HeaderCell";
import { Table } from "@/ui/Table/Table";

// The HeaderCell inside a column header, found by its title.
const headerCell = (name: string) => screen.getByRole("columnheader", { name }).firstElementChild as HTMLElement;

describe("Header line", () => {
  it("HeaderCell is medium by default and thin when asked", () => {
    const { container } = render(
      <>
        <HeaderCell label="Customer" />
        <HeaderCell label="Status" line="thin" />
      </>,
    );
    const [medium, thin] = [...container.children] as HTMLElement[];
    expect(medium.className).not.toMatch(/thin/);
    expect(thin.className).toMatch(/thin/);
  });

  it("Table gives every header the same line, the select-all header too", () => {
    render(
      <Table
        line="thin" selectable rowLabel="Invoice"
        columns={[{ key: "invoice", header: "Invoice" }, { key: "amount", header: "Amount", numeric: true }]}
        rows={[{ id: "1", invoice: "INV-1", amount: "$10.00" }]}
      />,
    );
    expect(screen.getByRole("table").className).toMatch(/thin/);
    expect(headerCell("Invoice").className).toMatch(/thin/);
    expect(headerCell("Amount").className).toMatch(/thin/);
    expect(screen.getByRole("checkbox", { name: "Select all rows" }).closest("th")?.firstElementChild?.className).toMatch(/thin/);
  });

  it("Table keeps the 2px line by default", () => {
    render(<Table columns={[{ key: "invoice", header: "Invoice" }]} rows={[{ id: "1", invoice: "INV-1" }]} />);
    expect(screen.getByRole("table").className).not.toMatch(/thin/);
    expect(headerCell("Invoice").className).not.toMatch(/thin/);
  });

  it("DataGrid passes line to its headers", () => {
    render(<DataGrid label="Rates" line="thin" columns={[{ key: "name", header: "Name" }]} defaultRows={[{ id: "1", name: "Standard" }]} />);
    expect(headerCell("Name").className).toMatch(/thin/);
    expect(headerCell("#").className).toMatch(/thin/);
  });
});
