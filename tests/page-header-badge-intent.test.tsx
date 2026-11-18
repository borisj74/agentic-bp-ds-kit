import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/ui/PageHeader/PageHeader";

// PageHeader hands badgeIntent straight to Badge, so its contract must list the same intents Badge does. The enum
// had drifted: Badge allows hollow and PageHeader's contract did not, which made a legal screen fail the review.
const contract = (name: string) => JSON.parse(readFileSync(`contracts/${name}.json`, "utf8"));

describe("PageHeader badgeIntent", () => {
  it("lists exactly the intents Badge lists", () => {
    const badge: string[] = contract("badge").props.intent.enum;
    const header: string[] = contract("pageheader").props.badgeIntent.enum;
    expect(header).toEqual(badge);
  });

  it("keeps hollow in the contract, the one that had drifted", () => {
    expect(contract("pageheader").props.badgeIntent.enum).toContain("hollow");
  });

  it("defaults to the same intent Badge defaults to", () => {
    expect(contract("pageheader").props.badgeIntent.default).toBe(contract("badge").props.intent.default);
  });

  it("renders every contract intent, hollow included", () => {
    for (const intent of contract("pageheader").props.badgeIntent.enum) {
      const { unmount } = render(<PageHeader title={`Invoices ${intent}`} badge="Draft" badgeIntent={intent} />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
      unmount();
    }
  });

  it("renders the hollow badge the component's own type accepts", () => {
    // Not a cast: the literal has to fit BadgeIntent, so typecheck fails if the code drops hollow.
    render(<PageHeader title="Invoices" badge="Draft" badgeIntent="hollow" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});
