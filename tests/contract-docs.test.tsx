import { readdirSync, readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContractDocs } from "@/playground/ContractDocs";
import { defaults, importLine, notUseText, propNote, splitDoNot } from "@/playground/contractRules";
import { neighbours } from "@/playground/PrevNext";
import { components } from "@/playground/nav";
import type { Contract } from "@/playground/Master";

const read = (file: string) => JSON.parse(readFileSync(`contracts/${file}`, "utf8")) as Contract;
const all = readdirSync("contracts").filter((f) => f.endsWith(".json") && f !== "index.json");

describe("splitDoNot", () => {
  it("sends a wrong-tool rule to When not to use", () => {
    const { notUse, stops } = splitDoNot(["Do not use it for a flat list. Use Select."]);
    expect(notUse).toHaveLength(1);
    expect(stops).toHaveLength(0);
  });
  it("keeps an invent rule under stops if, even when it names other pieces", () => {
    const { notUse, stops } = splitDoNot(["Do not invent a local Accordion, Collapse or Disclosure."]);
    expect(notUse).toHaveLength(0);
    expect(stops).toEqual(["Do not invent a local Accordion, Collapse or Disclosure."]);
  });
  it("keeps a rule that holds while you use the piece under stops if", () => {
    const { notUse, stops } = splitDoNot(["Do not use raw hex.", "Do not put search or filters in the table. Use a Toolbar above it."]);
    expect(notUse).toHaveLength(0);
    expect(stops).toHaveLength(2);
  });
  it("loses no rule from any contract", () => {
    for (const file of all) {
      const c = read(file);
      const { notUse, stops } = splitDoNot(c.doNot);
      expect(notUse.length + stops.length, file).toBe((c.doNot ?? []).length);
    }
  });
});

describe("notUseText", () => {
  it("reads as the job, with the piece to use instead", () => {
    expect(notUseText("Do not use it for a long, smooth trend. Use LineChart.")).toBe("a long, smooth trend — LineChart");
    expect(notUseText("Do not use for in-text navigation (use Link).")).toBe("in-text navigation — Link");
    expect(notUseText("Do not use it to switch views. Use Tabs.")).toBe("to switch views — Tabs");
  });
  it("leaves a rule with no alternative alone but for the full stop", () => {
    expect(notUseText("Do not use for status or category labels.")).toBe("status or category labels");
  });
});

describe("defaults and notes", () => {
  it("writes a default as its plain value", () => {
    const c = read("badge.json");
    const entry = defaults(c).find((d) => d.name === "size");
    expect(entry?.value).toBe(c.props.size.default);
  });
  it("puts an item shape in front of the note", () => {
    expect(propNote({ itemShape: "{ id: string }", note: "One per row." })).toBe("{ id: string } — One per row.");
  });
  it("imports from the kit path the contract gives", () => {
    expect(importLine(read("badge.json"))).toBe('import { Badge } from "@/ui/Badge/Badge";');
  });
});

describe("ContractDocs", () => {
  const contract = read("badge.json");
  it("shows the two when-to-use lists, the agent panel and the props table", () => {
    render(<ContractDocs contract={contract} />);
    expect(screen.getByRole("heading", { name: "When to use" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What an agent reads" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: /Badge props/ });
    for (const header of ["Name", "Type", "Required", "Default", "Notes"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
  });
  it("renders every contract without throwing", () => {
    for (const file of all) {
      const { unmount } = render(<ContractDocs contract={read(file)} />);
      unmount();
    }
  });
});

describe("PrevNext", () => {
  it("follows the catalog's own A to Z order", () => {
    const names = components.map((c) => c.name);
    expect(neighbours(names[1], "components")).toEqual({ prev: names[0], next: names[2] });
    expect(neighbours(names[0], "components").prev).toBeUndefined();
    expect(neighbours(names[names.length - 1], "components").next).toBeUndefined();
  });
});
