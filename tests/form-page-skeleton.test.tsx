import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormPage } from "@/patterns/FormPage/FormPage";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Form } from "@/ui/Form/Form";
import { Input } from "@/ui/Input/Input";
import { Section } from "@/ui/Section/Section";
import { Select } from "@/ui/Select/Select";
import { Table } from "@/ui/Table/Table";
import { Textarea } from "@/ui/Textarea/Textarea";
import { axeViolations } from "./axe";

// A booting FormPage draws the page's own content: its sections, their headers, its fields in their columns, so
// nothing moves when the form arrives. loadingShape rows keeps the old fixed grid for a page with nothing to
// follow yet.

const SECTIONS = [
  {
    title: "Account information",
    collapsible: true,
    content: (
      <>
        <Input label="Account name" name="name" />
        <Select label="Status" name="status" options={[{ value: "a", label: "Active" }]} />
        <Checkbox label="Restricted rates" name="restricted" />
      </>
    ),
  },
  {
    title: "Billing profile",
    collapsible: true,
    defaultExpanded: false,
    content: (
      <>
        <Input label="Cycle" name="cycle" />
        <Textarea label="Notes" name="notes" />
      </>
    ),
  },
];

const page = (props: Partial<Parameters<typeof FormPage>[0]> = {}) =>
  render(
    <FormPage label="Create account" loading {...props}>
      <Form id="f" labelPosition="start" sections={SECTIONS} />
      <Section title="Contacts">
        <Table columns={[{ key: "name", header: "Name" }, { key: "role", header: "Role" }]} rows={[{ id: "1", name: "A", role: "B" }]} />
      </Section>
    </FormPage>,
  );

// A field's own box: every field that has a label column carries data-label, and a Checkbox, which has none,
// stays the label it always is. Between them they are what the columns grid lays out.
const fieldBoxes = () => document.querySelectorAll("[data-label], label");
const bars = (root: ParentNode) => root.querySelectorAll('[aria-busy="true"]');

describe("a booting FormPage follows its own content", () => {
  it("draws one skeleton field per real field and one header per section", () => {
    page();
    // Three fields in the open group (one of them a Checkbox), two in the folded one, and no real controls.
    expect(fieldBoxes()).toHaveLength(5);
    expect(document.querySelectorAll("input, select, textarea")).toHaveLength(0);
    // Every section keeps its header and its name, with a bar where the words will be.
    for (const title of ["Account Information", "Billing Profile", "Contacts"]) {
      const section = screen.getByRole("region", { name: title, hidden: true });
      expect(bars(section.querySelector("h2")!)).toHaveLength(1);
    }
  });

  it("shows a folded section as its header only", () => {
    page();
    const folded = screen.getByRole("region", { name: "Billing Profile", hidden: true });
    expect(folded.querySelector("h2")).not.toBeNull();
    // The body is still hidden, so a group that was folded away does not open while it loads.
    expect(folded.querySelector("[hidden]")).not.toBeNull();
  });

  it("keeps the chevron's own square, so the title does not slide over when the button arrives", () => {
    page();
    const open = screen.getByRole("region", { name: "Account Information", hidden: true });
    // The chevron's block and the title's bar: two in the header row, none of them a button.
    expect(bars(open.querySelector("header")!)).toHaveLength(2);
    expect(open.querySelectorAll("header button")).toHaveLength(0);
  });

  it("draws a table as its own head row and three body rows, a bar in every column", () => {
    page();
    const table = document.querySelector("table")!;
    expect(table.querySelectorAll("thead tr")).toHaveLength(1);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
    // Two columns, so eight bars: one head row and three body rows.
    expect(bars(table)).toHaveLength(8);
  });

  it("puts the fields in the page's columns, three when the page asks for three", () => {
    page({ columns: 3 });
    const grid = document.querySelector('[class*="three"]');
    expect(grid).not.toBeNull();
    expect(document.querySelector('[class*="two"]')).toBeNull();
  });

  it("puts the label bar in the label column with start labels and over the field with top labels", () => {
    const { unmount } = page();
    // start: the field's box says so, which is what moves the label into its column.
    expect(document.querySelector("[data-label]")!.getAttribute("data-label")).toBe("start");
    unmount();
    render(
      <FormPage label="Create account" loading>
        <Form id="f" labelPosition="top" sections={SECTIONS} />
      </FormPage>,
    );
    expect(document.querySelector("[data-label]")!.getAttribute("data-label")).toBe("top");
  });

  it("keeps the form out of reach of the keyboard and out of the reading order", () => {
    page();
    const fields = document.querySelector("[inert]")!;
    expect(fields.getAttribute("aria-hidden")).toBe("true");
    expect(fields.querySelector("[data-label]")).not.toBeNull();
  });

  it("says what is loading once", () => {
    page();
    const status = screen.getAllByRole("status");
    expect(status).toHaveLength(1);
    expect(status[0]).toHaveTextContent("Loading Create account");
  });

  it("keeps the notice's space without reading it out", () => {
    page({ notice: <p>Read this first.</p> });
    const ghost = screen.getByText("Read this first.").closest("[aria-hidden]")!;
    expect(ghost.hasAttribute("inert")).toBe(true);
  });

  it("has nothing for axe to report", async () => {
    page();
    expect(await axeViolations()).toEqual([]);
  });
});

describe("loadingShape rows", () => {
  it("keeps the old fixed grid instead of the content", () => {
    page({ loadingShape: "rows", loadingRows: 12 });
    // No field boxes: the grid stands in for them all.
    expect(fieldBoxes()).toHaveLength(0);
    expect(document.querySelectorAll('[class*="loadingRow"]')).toHaveLength(12);
  });

  it("splits its rows across the page's columns, three when the page asks for three", () => {
    page({ loadingShape: "rows", loadingRows: 12, columns: 3 });
    expect(document.querySelectorAll('[class*="loadingColumn"]')).toHaveLength(3);
    expect(document.querySelector(".layout-split--thirds")).not.toBeNull();
  });

  it("draws one column when the page asks for one", () => {
    page({ loadingShape: "rows", loadingRows: 4, columns: 1 });
    expect(document.querySelectorAll('[class*="loadingRow"]')).toHaveLength(4);
    expect(document.querySelector(".layout-split")).toBeNull();
  });
});

describe("a loaded FormPage", () => {
  it("draws the real fields and no bars at all", () => {
    page({ loading: false });
    expect(document.querySelectorAll("input, select, textarea").length).toBeGreaterThan(0);
    expect(bars(document.body)).toHaveLength(0);
    expect(document.querySelector("[inert]")).toBeNull();
  });
});
