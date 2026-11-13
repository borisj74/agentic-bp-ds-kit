import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListDetail } from "@/patterns/ListDetail/ListDetail";
import { Button } from "@/ui/Button/Button";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { ListView, type ListViewItem } from "@/ui/ListView/ListView";
import { Section } from "@/ui/Section/Section";
import { axeViolations } from "./axe";

// A booting ListDetail draws its own content: the list it was given on one side, the open record on the other,
// each in the shape it will land in. loadingShape rows keeps the old fixed split for a screen with nothing to
// follow yet.

const INVOICES: ListViewItem[] = [
  { id: "INV-1042", primary: "INV-1042", secondary: "Apex Digital Services · $4,820.00", badge: "Overdue", badgeIntent: "danger" },
  { id: "INV-1043", primary: "INV-1043", secondary: "Northwind Traders · $1,260.00", badge: "Paid", badgeIntent: "success" },
  { id: "INV-1044", primary: "INV-1044", secondary: "Globex Corporation · $980.00", badge: "Draft" },
  { id: "INV-1045", primary: "INV-1045", secondary: "Initech · $2,150.00", badge: "Sent", badgeIntent: "info" },
  { id: "INV-1046", primary: "INV-1046", secondary: "Umbrella Corp · $3,400.00", badge: "Sent", badgeIntent: "info" },
];
// The inbox template: the same rows with the account's avatar on each.
const TEMPLATE: ListViewItem[] = INVOICES.map((it) => ({ ...it, avatar: String(it.secondary).split(" · ")[0] }));

const bars = (root: ParentNode) => root.querySelectorAll('[aria-busy="true"]');
// The list's own rows, wherever they stand: a ListView draws one li per item, booting or ready.
const listRows = () => document.querySelectorAll('li[class~="row"]');
const byClass = (name: string, root: ParentNode = document) => root.querySelectorAll(`[class~="${name}"]`);
// Nothing a keyboard can reach: while the split is bars, every real control is behind inert.
const reachable = () => document.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");

const detail = (
  <>
    <Section title="Invoice Details">
      <div>
        <FormDisplay label="Account" value="Apex Digital Services" labelPosition="start" />
        <FormDisplay label="Amount" value="$4,820.00" labelPosition="start" />
        <FormDisplay label="Billing period" value="August 2026" labelPosition="start" />
        <FormDisplay label="Due date" value="Sep 1, 2026" labelPosition="start" />
        <FormDisplay label="Status" value="Overdue" labelPosition="start" />
      </div>
    </Section>
    <Section title="Payment history" collapsible defaultExpanded={false}>
      <FormDisplay label="Last attempt" value="Sep 3, 2026" labelPosition="start" />
    </Section>
  </>
);

const split = (props: Partial<Parameters<typeof ListDetail>[0]> = {}) =>
  render(
    <ListDetail
      label="Invoices" loading open title="INV-1042"
      actions={<Button size="sm" iconStart="download">Download</Button>}
      empty={<EmptyState icon="receipt_long" title="Pick an invoice" />}
      list={<ListView label="Invoices" selection="single" interaction="drill" items={INVOICES} selected={["INV-1042"]} />}
      detail={detail}
      {...props}
    />,
  );

describe("a booting ListDetail follows the list and the open record", () => {
  it("draws one row per row the list has, with its badge", () => {
    split();
    const rows = listRows();
    expect(rows).toHaveLength(INVOICES.length);
    // Each row: the tick cell, the primary and secondary bars, and the badge. No avatar on the plain rows.
    for (const row of rows) expect(bars(row)).toHaveLength(4);
    // No real row text with them: the rows are bars, in the list's own places.
    expect(screen.queryByText("INV-1042")).not.toBeInTheDocument();
  });

  it("draws avatars only when the items have them", () => {
    const plainSplit = split();
    const plain = bars(listRows()[0]).length;
    plainSplit.unmount();
    split({ list: <ListView label="Invoices" selection="single" interaction="drill" items={TEMPLATE} selected={["INV-1042"]} /> });
    // The template's rows carry one more block each: the avatar.
    expect(bars(listRows()[0]).length).toBe(plain + 1);
  });

  it("keeps the record's header: the title bar at the title's length and a block per action", () => {
    const one = split();
    const head = byClass("head")[0];
    expect(bars(head)).toHaveLength(2);
    expect(head.querySelector('[aria-busy="true"]')).toHaveStyle({ width: "var(--skeleton-bar-sm)" });
    one.unmount();
    // A longer name steps the bar up; two actions draw two blocks.
    split({ title: "INV-1042 · Apex Digital Services", actions: <><Button size="sm">Send</Button><Button size="sm">Download</Button></> });
    const wide = byClass("head")[0];
    expect(bars(wide)).toHaveLength(3);
    expect(wide.querySelector('[aria-busy="true"]')).toHaveStyle({ width: "var(--skeleton-bar-lg)" });
  });

  it("draws the record's own sections and rows, a folded one as its header only", () => {
    split();
    for (const title of ["Invoice Details", "Payment History"]) {
      const section = screen.getByRole("region", { name: title, hidden: true });
      expect(bars(section.querySelector("h2")!)).toHaveLength(1);
    }
    // Five rows in the open section, and the folded one is its header only: its body stays folded away.
    const open = screen.getByRole("region", { name: "Invoice Details", hidden: true });
    expect(byClass("display", open)).toHaveLength(5);
    const folded = screen.getByRole("region", { name: "Payment History", hidden: true });
    expect(folded.querySelector("[hidden]")).toBeInTheDocument();
    expect(byClass("display", folded.querySelector("[hidden]")!)).toHaveLength(1);
  });

  it("keeps the real list, the record and the empty pane out of reach and out of the reading order", () => {
    split();
    expect(reachable()).toHaveLength(0);
    expect(document.querySelectorAll("[inert]").length).toBeGreaterThan(0);
    // Nothing of either side is read out: no row text, no field value, no action.
    expect(screen.queryByText("INV-1043")).not.toBeInTheDocument();
    expect(screen.queryByText("Apex Digital Services")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
    // With nothing open the pane has no record to follow, and the empty state waits with it.
    const first = screen.getAllByRole("status").length;
    expect(first).toBe(1);
    cleanup();
    split({ open: false, detail: undefined, title: undefined, actions: undefined });
    expect(screen.queryByText("Pick an invoice")).not.toBeInTheDocument();
    expect(reachable()).toHaveLength(0);
  });

  it("says what is loading once", () => {
    split();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading Invoices");
  });

  it("has nothing for axe to report", async () => {
    const { container } = split();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("every layout", () => {
  it("keeps the split's two columns in side and stacked, and the list alone in inline", () => {
    for (const layout of ["side", "stacked"] as const) {
      const { unmount } = split({ layout });
      expect(byClass("list")).not.toHaveLength(0);
      expect(byClass("pane")).toHaveLength(1);
      expect(listRows()).toHaveLength(INVOICES.length);
      unmount();
    }
    split({ layout: "inline" });
    expect(byClass("pane")).toHaveLength(0);
    expect(byClass("single")).toHaveLength(1);
    expect(listRows()).toHaveLength(INVOICES.length);
  });

  it("draws the record's own content in side and stacked, and says what is loading once in all three", () => {
    for (const layout of ["side", "stacked", "inline"] as const) {
      const { unmount } = split({ layout });
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(reachable()).toHaveLength(0);
      if (layout !== "inline") expect(screen.getByRole("region", { name: "Invoice Details", hidden: true })).toBeInTheDocument();
      unmount();
    }
  });
});

describe("loadingShape rows", () => {
  it("keeps the old split: a fixed count of rows beside the record's label and value rows", () => {
    split({ loadingShape: "rows", loadingRows: 8 });
    // Nothing of the real list or record is in the tree, so nothing follows them.
    expect(listRows()).toHaveLength(0);
    expect(screen.queryByRole("region", { name: "Invoice Details", hidden: true })).not.toBeInTheDocument();
    expect(byClass("bootRow")).toHaveLength(8);
    expect(byClass("bootField")).toHaveLength(8);
    // Each row: the avatar circle and its two lines; each field: a label and a value.
    expect(bars(byClass("bootRow")[0])).toHaveLength(3);
    expect(bars(byClass("bootField")[0])).toHaveLength(2);
  });

  it("follows loadingRows and says what is loading once", () => {
    split({ loadingShape: "rows", loadingRows: 3 });
    expect(byClass("bootRow")).toHaveLength(3);
    expect(byClass("bootField")).toHaveLength(3);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(reachable()).toHaveLength(0);
  });
});

describe("ready", () => {
  it("draws the real list and the real record once they arrive", () => {
    split({ loading: false });
    expect(screen.getByText("INV-1043")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getAllByText("Apex Digital Services").length).toBeGreaterThan(0);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
