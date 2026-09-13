import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "@/ui/Avatar/Avatar";
import { Cell } from "@/ui/Cell/Cell";
import { Empty } from "@/ui/Empty/Empty";
import { Table } from "@/ui/Table/Table";

// Small checks that pin the accessibility fixes the contract-driven axe run turned up.

describe("Empty headingLevel", () => {
  it("is an h3 by default", () => {
    render(<Empty title="No invoices yet" />);
    expect(screen.getByRole("heading", { level: 3, name: "No invoices yet" })).toBeInTheDocument();
  });
  it("follows the page's headings when told to", () => {
    render(<Empty title="No invoices yet" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "No invoices yet" })).toBeInTheDocument();
  });
});

describe("Avatar decorative", () => {
  it("names a photo by default", () => {
    render(<Avatar name="Maya Chen" src="/maya.jpg" />);
    expect(screen.getByRole("img", { name: "Maya Chen" })).toBeInTheDocument();
  });
  it("names the initials circle by default", () => {
    render(<Avatar name="Maya Chen" />);
    expect(screen.getByRole("img", { name: "Maya Chen" })).toHaveTextContent("MC");
  });
  it("stays quiet when the name is written beside it", () => {
    const { container } = render(<><Avatar name="Maya Chen" src="/maya.jpg" decorative /><Avatar name="Noah Williams" decorative /></>);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});

describe("Cell avatar", () => {
  it("reads the person's name once when the name is shown", () => {
    const { container } = render(<Cell type="avatar" name="Maya Chen" src="/maya.jpg" />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
  });
  it("keeps the picture named when the text is off", () => {
    render(<Cell type="avatar" name="Maya Chen" src="/maya.jpg" text={false} />);
    expect(screen.getByRole("img", { name: "Maya Chen" })).toBeInTheDocument();
  });
});

describe("Table header row", () => {
  it("gives a column with no header a plain cell, not an empty header", () => {
    render(
      <Table
        columns={[{ key: "name", header: "Name" }, { key: "amount", header: "Amount", numeric: true }, { key: "actions", header: "" }]}
        rows={[{ id: "1", name: "Invoice 1", amount: "$10.00", actions: "" }]}
      />,
    );
    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Name", "Amount"]);
    expect(document.querySelectorAll("thead td")).toHaveLength(1);
  });
});
