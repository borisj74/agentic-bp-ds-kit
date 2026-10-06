import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Cell } from "@/ui/Cell/Cell";
import { Table, type TableColumn } from "@/ui/Table/Table";

const LONG = "Software Maintenance - Dedicated Support Enterprise";
const COLUMNS: TableColumn[] = [
  { key: "product", header: "Product", maxWidth: "240px" },
  { key: "note", header: "Note", maxWidth: "120px" },
  { key: "rate", header: "Rate", numeric: true },
];

describe("Table columns", () => {
  it("caps the column and keeps the whole value on hover and for screen readers", () => {
    render(
      <Table
        columns={COLUMNS}
        rows={[{ id: "r1", product: <Cell type="link" label={LONG} href="#" />, note: "A long plain note", rate: "$12,000.00" }]}
      />,
    );
    const link = screen.getByRole("link", { name: LONG });
    const cell = link.closest("td")!;
    expect(cell.style.getPropertyValue("--table-column-max")).toBe("240px");
    expect(cell).toHaveAttribute("title", LONG);
    // A string value gets its text as the title too.
    expect(screen.getByText("A long plain note").closest("td")).toHaveAttribute("title", "A long plain note");
  });

  it("leaves columns without maxWidth alone", () => {
    render(<Table columns={COLUMNS} rows={[{ id: "r1", product: "Gold", note: "", rate: "$1.00" }]} />);
    const rate = screen.getByText("$1.00").closest("td")!;
    expect(rate).not.toHaveAttribute("title");
    expect(rate.style.getPropertyValue("--table-column-max")).toBe("");
  });

  it("opens a row from the Count after an opensDetail value, without picking the row", async () => {
    const user = userEvent.setup();
    const picked: string[] = [];
    render(
      <Table
        columns={[{ key: "product", header: "Product" }, { key: "rate", header: "Rate", opensDetail: true }]}
        rows={[{ id: "a", product: "API calls", rate: "$0.08" }, { id: "b", product: "Seat license", rate: "$40.00" }]}
        detail={(row) => (row.id === "a" ? <p>Every band</p> : null)} detailCount={(row) => (row.id === "a" ? 4 : undefined)}
        onRowClick={(id) => picked.push(id)}
      />,
    );
    expect(screen.queryByRole("button", { name: /more, row 2/ })).not.toBeInTheDocument();
    const more = screen.getByRole("button", { name: "4 more, row 1" });
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Details, row 1" })).toHaveTextContent("Every band");
    expect(picked).toEqual([]);
    await user.click(more);
    expect(screen.queryByText("Every band")).not.toBeInTheDocument();
  });
});
