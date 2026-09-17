import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Section } from "@/ui/Section/Section";
import { titleCase } from "@/ui/titleCase";

describe("titleCase", () => {
  it("raises each main word", () => {
    expect(titleCase("Billing settings")).toBe("Billing Settings");
    expect(titleCase("product utilization")).toBe("Product Utilization");
  });

  it("keeps small words down inside the line, up at either end", () => {
    expect(titleCase("terms of service")).toBe("Terms of Service");
    expect(titleCase("of counsel")).toBe("Of Counsel");
    expect(titleCase("what to pay for")).toBe("What to Pay For");
  });

  it("leaves a word that already carries a capital alone", () => {
    expect(titleCase("API keys")).toBe("API Keys");
    expect(titleCase("iPhone orders")).toBe("iPhone Orders");
  });

  it("raises both halves of a hyphenated word", () => {
    expect(titleCase("year-end report")).toBe("Year-End Report");
  });
});

describe("kit headings", () => {
  it("writes a Section title in title case", () => {
    render(<Section title="account information">Body</Section>);
    expect(screen.getByRole("heading", { name: "Account Information" })).toBeInTheDocument();
  });

  it("writes a PageHeader title in title case", () => {
    render(<PageHeader title="billing settings" />);
    expect(screen.getByRole("heading", { level: 1, name: "Billing Settings" })).toBeInTheDocument();
  });
});
