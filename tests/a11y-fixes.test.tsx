import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "@/ui/Avatar/Avatar";
import { Cell } from "@/ui/Cell/Cell";
import { Empty } from "@/ui/Empty/Empty";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
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

// Regression for WCAG 2.1.1: a strip of plain cards scrolled sideways but nothing in it could take focus.
describe("Scoreboard scroll strip", () => {
  const ITEMS = [
    { id: "a", title: "Revenue", metric: "$1.2M" },
    { id: "b", title: "Accounts", metric: "412" },
  ];
  const widths = (scroll: number, client: number) => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scroll);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(client);
  };
  afterEach(() => vi.restoreAllMocks());

  it("is a named focus stop when the cards overflow", () => {
    widths(900, 400);
    render(<Scoreboard items={ITEMS} label="Key metrics" />);
    expect(screen.getByRole("region", { name: "Key metrics" })).toHaveAttribute("tabindex", "0");
  });
  it("stays out of the tab order when everything fits", () => {
    widths(400, 400);
    render(<Scoreboard items={ITEMS} label="Key metrics" />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("leaves focus to selectable cards, which are buttons", () => {
    widths(900, 400);
    render(<Scoreboard items={ITEMS} label="Key metrics" selectable />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("Table scroll box", () => {
  const COLUMNS = [{ key: "name", header: "Name" }, { key: "amount", header: "Amount", numeric: true }];
  const ROWS = [{ id: "1", name: "Invoice 1", amount: "$10.00" }];
  afterEach(() => vi.restoreAllMocks());

  it("is a focus stop named by its caption when the table is wider than its box", () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    render(<Table columns={COLUMNS} rows={ROWS} caption="Invoices" />);
    expect(screen.getByRole("region", { name: "Invoices" })).toHaveAttribute("tabindex", "0");
  });
  it("adds no tab stop when the table fits", () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    render(<Table columns={COLUMNS} rows={ROWS} caption="Invoices" />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
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
