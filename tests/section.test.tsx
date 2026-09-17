import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Form } from "@/ui/Form/Form";
import { Section } from "@/ui/Section/Section";

// The section element named by its title, which Section writes in title case.
const section = (name: string) => screen.getByRole("region", { name });

describe("Section line", () => {
  it("is medium by default and thin when asked", () => {
    render(
      <>
        <Section title="Account information">Rows</Section>
        <Section title="Billing information" line="thin">Rows</Section>
      </>,
    );
    expect(section("Account Information").className).not.toMatch(/thin/);
    expect(section("Billing Information").className).toMatch(/thin/);
  });

  it("keeps each subsection's own line: a thin section does not thin the section inside it", () => {
    render(
      <Section title="Billing" line="thin">
        <Section title="Payment method">Rows</Section>
        <Section title="Invoice delivery" line="thin">Rows</Section>
      </Section>,
    );
    expect(section("Billing").className).toMatch(/thin/);
    expect(section("Payment Method").className).not.toMatch(/thin/);
    expect(section("Invoice Delivery").className).toMatch(/thin/);
  });

  it("passes line through Form sections", () => {
    render(<Form title="Billing" sections={[{ title: "Payment method", line: "thin", content: "Fields" }, { title: "Address", content: "Fields" }]} />);
    expect(section("Payment Method").className).toMatch(/thin/);
    expect(section("Address").className).not.toMatch(/thin/);
  });
});
