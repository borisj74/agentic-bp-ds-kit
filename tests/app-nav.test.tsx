import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { APP_NAV, APP_NAV_END, appNavPlace } from "@/patterns/AppShell/appNav";
import { AppNav } from "@/ui/AppNav/AppNav";

// Every prototype takes the side nav from one place, so it always carries the whole app nav.
describe("App nav", () => {
  const sections = APP_NAV.flatMap((e) => ("divider" in e ? [] : [e]));

  it("has every rail section, in order", () => {
    expect(sections.map((s) => s.label)).toEqual([
      "Home", "Accounts", "Products", "Quotes", "Orders", "Billing", "AR", "Revenue", "Mediation", "Reports", "Settings",
    ]);
    expect(APP_NAV_END.map((s) => s.label)).toEqual(["Recycle Bin", "Processes"]);
  });

  it("gives every link a unique id", () => {
    const ids = [...sections, ...APP_NAV_END].flatMap((s) => [s.id, ...(s.children ?? []).flatMap((c) => ("divider" in c ? [] : [c.id]))]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names the section and page for a link", () => {
    expect(appNavPlace("revenue-general-ledger")).toEqual({ section: "Revenue", page: "General Ledger", icon: "monetization_on" });
    expect(appNavPlace("processes")).toMatchObject({ section: "Processes", page: "Processes" });
  });

  it("renders every section in the kit AppNav", () => {
    render(<AppNav items={APP_NAV} endItems={APP_NAV_END} expanded />);
    for (const s of [...sections, ...APP_NAV_END]) expect(screen.getAllByText(s.label).length).toBeGreaterThan(0);
  });
});
