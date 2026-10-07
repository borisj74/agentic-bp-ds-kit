import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/ui/DataGrid/DataGrid";
import { Form } from "@/ui/Form/Form";
import { Input } from "@/ui/Input/Input";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Modal } from "@/ui/Modal/Modal";
import { Section } from "@/ui/Section/Section";
import { FormPage } from "@/patterns/FormPage/FormPage";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";

// K2: record and form views lay rows and fields out in 1, 2 or 3 capped columns. The page sets them once; Sections
// and Forms follow unless they set their own, and a dialog opened from the page starts from the kit's defaults.
const body = (name: string) => screen.getByRole("region", { name }).querySelector(":scope > div:last-child")!;
const fields = (form: HTMLElement) => form.querySelector("form > div > div")!;

describe("columns", () => {
  it("leaves a Section and a Form without columns as they were", () => {
    render(
      <>
        <Section title="Rows"><FormDisplay label="Account" value="A" /></Section>
        <Form title="Plain"><FormDisplay label="Account" value="A" /></Form>
      </>,
    );
    expect(body("Rows").className).not.toMatch(/\bgrid\b/);
    expect(fields(screen.getByRole("form", { name: "Plain" })).className).not.toMatch(/\bgrid\b/);
  });

  it("gives a Section its own columns", () => {
    render(<Section title="Rows" columns={3}><FormDisplay label="Account" value="A" /></Section>);
    expect(body("Rows").className).toMatch(/\bgrid\b.*\bthree\b/);
  });

  it("passes a record's columns and labels to its Sections, unless a Section sets its own", () => {
    render(
      <RecordPage label="Account">
        <Section title="Account information"><FormDisplay label="Account" value="A" /></Section>
        <Section title="Billing" columns={3}><FormDisplay label="Terms" value="Net 30" /></Section>
      </RecordPage>,
    );
    expect(body("Account Information").className).toMatch(/\btwo\b/);
    expect(body("Billing").className).toMatch(/\bthree\b/);
    expect(screen.getByText("Account").closest("dl")).toHaveAttribute("data-label", "start");
  });

  it("passes a form page's columns to its Form", () => {
    render(<FormPage columns={3}><Form title="Create account"><FormDisplay label="Account" value="A" /></Form></FormPage>);
    expect(fields(screen.getByRole("form", { name: "Create account" })).className).toMatch(/\bthree\b/);
  });

  it("does not carry the page's columns or labels into a Modal opened from it", () => {
    render(
      <RecordPage label="Account" columns={3}>
        <Section title="Rows"><FormDisplay label="Account" value="A" /></Section>
        <Modal open title="Edit contact" onClose={() => {}}>
          <Form title="Contact"><FormDisplay label="Email" value="a@b.com" /></Form>
        </Modal>
      </RecordPage>,
    );
    expect(fields(screen.getByRole("form", { name: "Contact" })).className).not.toMatch(/\bgrid\b/);
    expect(screen.getByText("Email").closest("dl")).toHaveAttribute("data-label", "top");
  });

  // K7: a DataGrid (like a product's rate bands) needs the whole row for its columns, and its column headers stand in
  // for a label, so with start labels it starts at the section's edge. jsdom has no layout, so the rules are read
  // from the CSS the grid's own box is scoped by.
  const rules = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

  it("spans the row with a DataGrid in a columns Form, starting at the section's edge with start labels", () => {
    render(
      <Form title="Product pricing" columns={2} labelPosition="start">
        <Input label="Product" name="name" />
        <DataGrid label="Rate bands" columns={[{ key: "currency", header: "Currency" }]} defaultRows={[{ id: "r1", currency: "USD" }]} />
      </Form>,
    );
    const grid = document.querySelector("[data-data-grid]")!;
    expect(grid.parentElement).toBe(fields(screen.getByRole("form", { name: "Product pricing" })));
    expect(grid.parentElement!.className).toMatch(/\bgrid\b.*\btwo\b.*\bstart\b/);
    const columns = rules("src/ui/Form/columns.module.css");
    expect(columns).toContain(".grid > [data-data-grid] { grid-column: 1 / -1; }");
    expect(columns).toContain('.grid:is(.start, :has(> [data-label="start"])) > [data-data-grid] { margin-inline-start: 0; }');
    // It comes after the rule that shifts unlabelled controls over, so at the same weight the 0 wins.
    expect(columns.indexOf("> [data-data-grid] { margin-inline-start: 0; }")).toBeGreaterThan(columns.indexOf('> :not([data-label="start"]) { margin-inline-start: calc('));
  });

  it("starts a DataGrid at the section's edge in a one-column Form with start labels", () => {
    render(
      <Form title="Product pricing" labelPosition="start">
        <Input label="Product" name="name" />
        <DataGrid label="Rate bands" columns={[{ key: "currency", header: "Currency" }]} defaultRows={[{ id: "r1", currency: "USD" }]} />
      </Form>,
    );
    expect(screen.getByRole("form", { name: "Product pricing" }).className).toMatch(/\bstart\b/);
    const form = rules("src/ui/Form/Form.module.css");
    expect(form).toContain(".start .fields > [data-data-grid] { margin-inline-start: 0; }");
    expect(form.indexOf(".start .fields > [data-data-grid]")).toBeGreaterThan(form.indexOf('.start .fields > :not([data-label="start"]) { margin-inline-start: calc('));
  });
});
