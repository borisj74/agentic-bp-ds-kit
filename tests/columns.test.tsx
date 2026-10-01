import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Form } from "@/ui/Form/Form";
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
});
