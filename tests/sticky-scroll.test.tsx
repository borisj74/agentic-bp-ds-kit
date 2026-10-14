import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "@/ui/Table/Table";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";

// On a page that scrolls, the name stays at the top, the bar holds under it, and a Table that owns a box with a
// height of its own scrolls its rows inside it with the column names held at the top. jsdom has no layout, so the
// rules themselves are read from the CSS; what the markup has to get right is tested by rendering.
const rules = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

const columns = [{ key: "name", header: "Name" }, { key: "due", header: "Due" }];
const rows = [{ id: "r1", name: "Northwind", due: "Sep 02" }];

describe("sticky on scroll", () => {
  it("holds a table's column names against the page, under whatever is pinned over them", () => {
    const table = rules("src/ui/Table/Table.module.css");
    expect(table).toContain(".table thead th, .table thead td { position: sticky; top: var(--table-stick-top, 0px); z-index: 2; background: var(--surface-flat); }");
    // No overflow of its own: a box that scrolls on either axis would become what the names hold against.
    expect(table).toContain(".wrap { max-width: 100%; container-type: inline-size; }");
    // The frozen first column's header cell holds both ways at once, so it stands above its row and its column.
    expect(table).toContain('.table thead tr > :is(:first-child, .select + *):not(.empty) { z-index: 3; }');
  });

  it("draws the page-wide scroll shadow only while the band is pinned, with the content keeping its padding", () => {
    const list = rules("src/patterns/ListPage/ListPage.module.css");
    // The bar and the table keep the page inset; only this box reaches the edges, and only once pinned.
    expect(list).toContain(".list:has(> .body table) { gap: 0; }");
    expect(list).toContain(".scrollShadow { height: var(--border-width-medium); margin-block-end: calc(-1 * var(--border-width-medium)); position: sticky; z-index: 3; top: calc(var(--table-stick-top, 0px) + var(--table-head-height, 0px)); width: auto; margin-inline: calc(-1 * var(--layout-margin-md)); }");
    // A background paints the line; the shadow needs a box with height to project from.
    // Clipped to its top edge: the blur is wider than the offset and would otherwise spill up over the names.
    expect(list).toContain(".scrollShadow[data-stuck] { box-shadow: var(--elevation-card); clip-path: inset(0 0 -100vh 0); }");
    // Pinned, the header gives up its own line so the page-wide one is the only rule on that row.
    expect(list).toContain(".scrollShadow[data-stuck] ~ .body thead :is(th, td) { border-bottom-color: transparent; }");
  });

  it("pins both pages' bars one compact header bar down", () => {
    const pin = "top: calc(var(--page-header-height-sticky) - var(--layout-margin-md)); background: var(--surface-flat);";
    // The list bar stands over the column names it pins above; a record's bar only has rows under it.
    expect(rules("src/patterns/ListPage/ListPage.module.css")).toContain(`.bar, .bulk { position: sticky; z-index: 2; ${pin} }`);
    expect(rules("src/patterns/RecordPage/RecordPage.module.css")).toContain(".toolbar { min-width: 0; position: sticky; z-index: 1; top: calc(var(--page-header-height-sticky) - var(--layout-margin-md));");
  });

  it("gives a ListPage toolbar a box of its own to be pinned by", () => {
    const { container } = render(
      <ListPage label="Invoices" toolbar={<Toolbar label="Invoice actions" onRefresh={() => {}} />}>
        <Table columns={columns} rows={rows} rowLabel="name" />
      </ListPage>,
    );
    const bar = container.querySelector('[class*="bar"]');
    expect(bar).not.toBeNull();
    expect(bar!.contains(screen.getByRole("group", { name: "Invoice actions" }))).toBe(true);
  });

  it("keeps a record's bar out of the block that scrolls away, so it can hold still", () => {
    const { container } = render(
      <RecordPage
        label="Account"
        tabs={<div data-testid="tabs">Details</div>}
        toolbar={<Toolbar label="Record actions" onRefresh={() => {}} />}
      >
        <div>Details</div>
      </RecordPage>,
    );
    const bar = container.querySelector('[class*="toolbar"]')!;
    const top = container.querySelector('[class*="top"]')!;
    // A sticky box can only hold inside its own parent: in the block with the tabs it would leave with them.
    expect(top.contains(screen.getByTestId("tabs"))).toBe(true);
    expect(top.contains(bar)).toBe(false);
  });
});
