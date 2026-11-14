import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridColumn, type DataGridRow } from "@/ui/DataGrid/DataGrid";
import { Table } from "@/ui/Table/Table";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { BOOT_ROWS_MAX } from "@/ui/LoadingLine/boot";

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

  it("names the + button with insertLabel when rows have a name of their own", async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();
    render(<DataGrid label="Conditions" columns={COLUMNS} defaultRows={ROWS} onRowsChange={onRowsChange} canInsertRows insertLabel="Add condition" />);
    expect(screen.queryByRole("button", { name: "Add row below row 1" })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Add condition" })[0]);
    expect(onRowsChange.mock.lastCall?.[0]).toHaveLength(3);
  });

  it("stands two actions on the row and puts the rest in a More menu", async () => {
    const user = userEvent.setup();
    render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} canInsertRows canRemoveRows canDeleteRows />);
    const row = screen.getByRole("button", { name: "Add row below row 1" }).closest("tr")!;
    const cells = [...row.querySelectorAll("td")];
    const actions = cells[cells.length - 1];
    // Add and remove are the everyday pair, so they stay on the row; delete moves behind the menu.
    expect([...actions.querySelectorAll("button")].map((b) => b.textContent)).toEqual([
      "addAdd row below row 1", "closeRemove row 1", "more_vertMore actions, row 1",
    ]);
    await user.click(screen.getByRole("button", { name: "More actions, row 1" }));
    expect(screen.getByRole("menuitem", { name: /Delete row 1/ })).toBeInTheDocument();
  });

  it("leaves the action column alone when only two actions are on", () => {
    render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} canInsertRows canRemoveRows />);
    expect(screen.queryByRole("button", { name: "More actions, row 1" })).not.toBeInTheDocument();
  });

  it("removes a row from the grid alone, and asks before deleting the record", async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();
    const onDeleteRow = vi.fn();
    render(
      <DataGrid
        label="Items" columns={COLUMNS} defaultRows={ROWS}
        onRowsChange={onRowsChange} onDeleteRow={onDeleteRow} canRemoveRows canDeleteRows
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove row 1" }));
    expect(onRowsChange.mock.lastCall?.[0].map((r: { id: string }) => r.id)).toEqual(["r2"]);
    // X is the grid's own business: the screen hears nothing about a record, and nothing asks.
    expect(onDeleteRow).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    // Only two actions are on, so Delete is still on the row.
    await user.click(screen.getByRole("button", { name: "Delete row 1" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete Silver plan?" });
    expect(dialog).toBeInTheDocument();
    expect(onDeleteRow).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onDeleteRow).not.toHaveBeenCalled();
    expect(onRowsChange.mock.lastCall?.[0]).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Delete row 1" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(onDeleteRow).toHaveBeenCalledTimes(1);
    expect(onDeleteRow.mock.lastCall?.[0]).toMatchObject({ id: "r2" });
    expect(onRowsChange.mock.lastCall?.[0]).toEqual([]);
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

  it("ticks rows one by one and all at once, and keeps ticks a filter hides", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<DataGrid label="Rates" columns={COLUMNS} rows={ROWS} selectable selected={["hidden"]} onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByRole("checkbox", { name: "Select Gold plan" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["hidden", "r1"]);
    const all = within(screen.getByRole("table", { name: "Rates" }).querySelector("thead")!).getByRole("checkbox");
    await user.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["hidden", "r1", "r2"]);
  });

  it("reads mixed when only some rows are ticked", () => {
    render(<DataGrid label="Rates" columns={COLUMNS} rows={ROWS} selectable selected={["r1"]} />);
    const all = within(screen.getByRole("table", { name: "Rates" }).querySelector("thead")!).getByRole("checkbox");
    expect(all).toBePartiallyChecked();
    expect(screen.getByRole("checkbox", { name: "Select Gold plan" })).toBeChecked();
  });

  it("shows only the actions actionsFor gives each row", () => {
    render(
      <DataGrid
        label="Rates" columns={COLUMNS} rows={ROWS} canRemoveRows canDeleteRows
        actionsFor={(row) => (row.id === "r1" ? ["delete"] : ["remove"])}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete row 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove row 1" })).toBeNull();
    expect(screen.getByRole("button", { name: "Remove row 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete row 2" })).toBeNull();
  });
});

describe("DataGrid schedule pieces", () => {
  const columns: DataGridColumn[] = [
    { key: "product", header: "Product", readOnly: true, hug: true },
    { key: "jan", header: "Jan", type: "number", hug: true },
  ];
  const rows: DataGridRow[] = [
    { id: "a", product: "Starter", parent: "", jan: "100.00" },
    { id: "a-adj", product: "Manual adjustments", parent: "a", jan: "--" },
  ];
  const grid = (more: Partial<Parameters<typeof DataGrid>[0]> = {}) => (
    <DataGrid
      label="Schedule" rowNumbers={false} columns={columns} defaultRows={rows}
      rowParent={(r) => r.parent || undefined} cellReadOnly={(r) => !r.parent}
      cellLink={(r, key) => (key === "product" ? !r.parent : Boolean(r.parent))}
      cellStatus={(r, key) => (key === "jan" && r.jan !== "--" ? { intent: "warning", label: "Unposted", tint: true } : undefined)}
      totalRow={{ id: "total", product: "Period total", jan: "100.00" }}
      legend={[{ intent: "success", label: "Posted" }, { intent: "warning", label: "Unposted" }]}
      {...more}
    />
  );

  it("hides and shows a group's rows from its toggle and the header's", async () => {
    render(grid());
    expect(screen.getByText("Manual adjustments")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hide rows under Starter" }));
    expect(screen.queryByText("Manual adjustments")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Show all rows" }));
    expect(screen.getByText("Manual adjustments")).toBeInTheDocument();
  });

  it("links a read-only value, edits a linked one, and keeps per-cell read only", async () => {
    const onCellLink = vi.fn();
    render(grid({ onCellLink }));
    await userEvent.click(screen.getByRole("button", { name: "Starter" }));
    expect(onCellLink).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }), "product");
    // The product row's month is read only; the adjustment's opens an editor.
    expect(screen.queryByRole("button", { name: /Jan, row 1/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Jan, row 2: --" }));
    expect(screen.getByRole("spinbutton", { name: "Jan, row 2" })).toBeInTheDocument();
  });

  it("marks and tints a cell's status, draws the total row and the key", () => {
    const { container } = render(grid());
    const cell = container.querySelector('[data-cell="a:jan"]')!;
    expect(cell.className).toContain("tint-warning");
    expect(within(cell as HTMLElement).getByRole("img", { name: "Unposted" })).toBeInTheDocument();
    expect(screen.getByText("Period total")).toBeInTheDocument();
    const key = within(screen.getByRole("list", { name: "Key" }));
    expect(key.getByText("Posted")).toBeInTheDocument();
    expect(key.getByText("Unposted")).toBeInTheDocument();
  });
});

// A DataGrid inside a loading page draws its own skeleton in place, from the page's loading on FormLayoutContext,
// the way a Table does. jsdom lays nothing out, so these check the structure and the stylesheet rules that give
// the booting grid the heights the ready grid has.
describe("a booting DataGrid", () => {
  const boot = (ui: React.ReactNode) => render(<FormLayoutContext.Provider value={{ loading: true }}>{ui}</FormLayoutContext.Provider>);
  const bars = (root: ParentNode) => root.querySelectorAll('[aria-busy="true"]');
  const reachable = () => document.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  const flat = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
  const EDITORS: DataGridColumn[] = [
    { key: "product", header: "Product" },
    { key: "plan", header: "Plan", type: "select", width: "200px", options: [{ value: "gold", label: "Gold" }] },
    { key: "start", header: "Start", type: "date" },
    { key: "qty", header: "Qty", type: "number" },
  ];
  const EDIT_ROWS: DataGridRow[] = [
    { id: "r1", product: "Gold plan", plan: "gold", start: "2027-01-08", qty: "5" },
    { id: "r2", product: "Silver plan", plan: "gold", start: "2027-02-01", qty: "1" },
  ];

  it("shows bars, not its values or editors, in one head row and one body row per row", () => {
    boot(<DataGrid label="Items" columns={EDITORS} defaultRows={EDIT_ROWS} />);
    expect(screen.queryByText("Gold plan")).toBeNull();
    expect(screen.queryByText("5")).toBeNull();
    expect(document.querySelectorAll("input, select, textarea, button")).toHaveLength(0);
    expect(document.querySelectorAll("thead tr")).toHaveLength(1);
    expect(document.querySelectorAll("tbody tr")).toHaveLength(EDIT_ROWS.length);
    // A value bar in every data column, and one in the # column.
    expect(bars(document.querySelector("tbody tr")!)).toHaveLength(EDITORS.length + 1);
  });

  it("draws three rows when it has no rows yet, and no more than a screenful when it has hundreds", () => {
    const { unmount } = boot(<DataGrid label="Items" columns={COLUMNS} defaultRows={[]} />);
    expect(document.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.queryByText("No rows yet.")).toBeNull();
    unmount();
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `m${i}`, product: `P${i}`, qty: "1" }));
    boot(<DataGrid label="Items" columns={COLUMNS} defaultRows={many} />);
    expect(document.querySelectorAll("tbody tr")).toHaveLength(BOOT_ROWS_MAX);
  });

  it("keeps its columns and widths, the # column, a tick column and an action column from its props", () => {
    boot(<DataGrid label="Items" columns={EDITORS} defaultRows={EDIT_ROWS} selectable canInsertRows canRemoveRows canDeleteRows />);
    const head = document.querySelector("thead tr")!;
    // Tick, #, four columns, actions.
    expect(head.children).toHaveLength(EDITORS.length + 3);
    expect(head.children[3]).toHaveAttribute("style", expect.stringContaining("width: 200px"));
    // A name bar for # and for each named column; nothing over the tick or the action column.
    expect(bars(head)).toHaveLength(EDITORS.length + 1);
    expect(bars(head.firstElementChild!)).toHaveLength(0);
    expect(bars(head.lastElementChild!)).toHaveLength(0);
    const row = document.querySelector("tbody tr")!;
    expect(row.children).toHaveLength(EDITORS.length + 3);
    expect(bars(row.firstElementChild!)).toHaveLength(0);
    expect(bars(row.lastElementChild!)).toHaveLength(0);
    // The action column keeps room for two buttons and the More menu.
    expect(row.lastElementChild!.querySelector("span")).toHaveAttribute("style", expect.stringContaining("--data-grid-boot-actions: 3"));
  });

  it("drops the # column when rowNumbers is off, and keeps the detail toggle column when rows open", () => {
    boot(<DataGrid label="Items" columns={EDITORS} defaultRows={EDIT_ROWS} rowNumbers={false} detail={() => "More"} />);
    const head = document.querySelector("thead tr")!;
    // Toggle and four columns; nothing over the toggle.
    expect(head.children).toHaveLength(EDITORS.length + 1);
    expect(bars(head)).toHaveLength(EDITORS.length);
    expect(bars(head.firstElementChild!)).toHaveLength(0);
  });

  it("draws the column names 64 by 8 and the values as 10px bars", () => {
    boot(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} rowNumbers={false} />);
    expect(bars(document.querySelector("thead")!)[0]).toHaveAttribute("style", expect.stringContaining("width: var(--skeleton-column-name)"));
    const value = bars(document.querySelector("tbody")!)[0].querySelector("[aria-hidden]")!;
    expect(value).toHaveAttribute("style", expect.stringContaining("height: var(--skeleton-row-bar)"));
  });

  it("keeps the grid's own row and header heights, so nothing jumps when the rows land", () => {
    const sheet = flat("src/ui/DataGrid/DataGrid.module.css");
    // The body cell rule the booting rows share with the ready ones: 38 at sm and 40 at md.
    expect(sheet).toContain(".sm > tbody > tr > td { height: calc(var(--cell-height-sm) - var(--border-width-thin)); }");
    expect(sheet).toContain(".md > tbody > tr > td { height: calc(var(--cell-height-md) - var(--border-width-thin)); }");
    // A ready cell is its value's line with 8px padding round it (what holds sm at 38); a booting cell keeps the same.
    expect(sheet).toContain("padding: var(--space-xsmall) var(--space-small); border: 0;");
    expect(sheet).toContain("--data-grid-boot-line: calc(var(--text-ref-cell-size) * var(--text-ref-cell-lh) + 2 * var(--space-xsmall));");
    expect(sheet).toContain(".sm .bootCell { min-height: max(calc(var(--cell-height-sm) - var(--border-width-thin)), var(--data-grid-boot-line)); }");
    expect(sheet).toContain(".md .bootCell { min-height: max(calc(var(--cell-height-md) - var(--border-width-thin)), var(--data-grid-boot-line)); }");
    // The booting header is the HeaderCell's own height and line.
    expect(sheet).toContain("min-height: var(--header-cell-height-md); padding: var(--space-xsmall) var(--space-small); background: var(--surface-flat); border-bottom: var(--border-width-medium) solid var(--border-brand-faint);");
    expect(sheet).toContain(".sm .bootHead { min-height: var(--header-cell-height-sm); }");
    expect(sheet).toContain(".bootHeadThin { border-bottom-width: var(--border-width-thin); }");
    for (const size of ["sm", "md"] as const) {
      const { unmount } = boot(<DataGrid label="Items" size={size} line="thin" columns={COLUMNS} defaultRows={ROWS} />);
      expect(document.querySelector("table")!.className).toContain(size);
      expect(document.querySelector('[class~="bootHeadThin"]')).not.toBeNull();
      unmount();
    }
  });

  it("keeps a Set for all block under the title of a column that has one", () => {
    boot(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} rowNumbers={false} />);
    const head = document.querySelector("thead tr")!;
    // Product: its name. Qty: its name and the menu's block.
    expect(bars(head.children[0])).toHaveLength(1);
    expect(bars(head.children[1])).toHaveLength(2);
  });

  it("keeps Add row, the total row and the key only when they were passed", () => {
    const total = () => document.querySelector('[class~="totalCell"]')?.closest("tr") ?? null;
    const { unmount } = boot(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} />);
    expect(document.querySelector('[class~="add"]')).toBeNull();
    expect(total()).toBeNull();
    expect(document.querySelector("ul")).toBeNull();
    unmount();
    boot(
      <DataGrid
        label="Items" columns={COLUMNS} defaultRows={ROWS} canAddRows totalRow={{ id: "total", product: "Total", qty: "6" }}
        legend={[{ intent: "success", label: "Posted" }, { intent: "warning", label: "Unposted" }]}
      />,
    );
    // Add row is a block its own size, not a button.
    const add = document.querySelector('[class~="add"]')!;
    expect(bars(add)).toHaveLength(1);
    expect(add.querySelector("button")).toBeNull();
    expect(bars(total()!)).toHaveLength(2);
    expect(screen.queryByText("Total")).toBeNull();
    expect(bars(document.querySelector("ul")!)).toHaveLength(2);
    expect(screen.queryByText("Posted")).toBeNull();
  });

  it("drops the total row while it has no rows yet, as the ready grid does", () => {
    boot(<DataGrid label="Items" columns={COLUMNS} defaultRows={[]} totalRow={{ id: "total", product: "Total", qty: "0" }} />);
    expect(document.querySelector('[class~="totalCell"]')).toBeNull();
  });

  it("leaves nothing on the grid reachable by the keyboard, and says nothing itself", () => {
    boot(<DataGrid label="Items" columns={EDITORS} defaultRows={EDIT_ROWS} selectable canAddRows canRemoveRows canDeleteRows detail={() => "More"} />);
    expect(reachable()).toHaveLength(0);
    expect(document.querySelector("[data-data-grid]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryAllByRole("status", { hidden: true })).toHaveLength(0);
  });

  it("is its real self outside a loading page", () => {
    render(<DataGrid label="Items" columns={COLUMNS} defaultRows={ROWS} />);
    expect(screen.getByRole("button", { name: "Product, row 1: Gold plan" })).toBeInTheDocument();
    expect(bars(document.body)).toHaveLength(0);
  });
});
