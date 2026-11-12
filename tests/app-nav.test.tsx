import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { APP_NAV, APP_NAV_END, appNavPlace } from "@/patterns/AppShell/appNav";
import { AppNav } from "@/ui/AppNav/AppNav";

// Every prototype takes the side nav from one place, so it always carries the whole app nav.
describe("App nav", () => {
  const sections = APP_NAV.flatMap((e) => ("divider" in e ? [] : [e]));
  // A menu mixes links, groups and dividers; a group's own links are the pages under it.
  const linksOf = (s: { children?: unknown[] }) =>
    (s.children ?? []).flatMap((c) => {
      const child = c as { divider?: true; items?: { id: string; label: string }[]; id?: string; label?: string };
      if (child.divider) return [];
      return child.items ?? [{ id: child.id!, label: child.label! }];
    });

  it("has every rail section, in order", () => {
    expect(sections.map((s) => s.label)).toEqual([
      "Home", "Accounts", "Products", "Quotes", "Orders", "Billing", "AR", "Revenue", "Mediation", "Reports", "Settings",
    ]);
    expect(APP_NAV_END.map((s) => s.label)).toEqual(["Recycle Bin", "Processes"]);
  });

  it("gives every link a unique id", () => {
    const ids = [...sections, ...APP_NAV_END].flatMap((s) => [s.id, ...linksOf(s).map((l) => l.id)]);
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

  // The menu is as wide as the longest link in the whole nav, so it does not resize from section to section: every
  // section's links sit in a hidden sizer behind the menu, which jsdom cannot measure but can count.
  it("keeps every section's links in a hidden sizer, so the menu is one width", () => {
    const { container } = render(<AppNav items={APP_NAV} endItems={APP_NAV_END} />);
    const sizer = container.querySelector('[class*="sizer"]')!;
    expect(sizer).toHaveAttribute("aria-hidden", "true");
    const measured = new Set([...sizer.querySelectorAll("span")].map((el) => el.textContent));
    for (const s of [...sections, ...APP_NAV_END]) {
      if (!(s.children ?? []).length) continue;
      expect(measured.has(s.label)).toBe(true);
      for (const l of linksOf(s)) expect(measured.has(l.label)).toBe(true);
    }
  });
});

// Named folders inside a section's menu (BP COBALT 1953:85844). AR carries four of them.
describe("App nav groups", () => {
  const openFlyout = (container: HTMLElement, id: string) => {
    const row = container.querySelector<HTMLElement>(`[data-section="${id}"]`)!;
    fireEvent.pointerOver(row, { pointerType: "mouse" });
    fireEvent.pointerEnter(row, { pointerType: "mouse" });
  };
  const groupList = (name: string) => screen.getByRole("list", { name });

  it("heads each run of AR links with its group name", () => {
    render(<AppNav items={APP_NAV} endItems={APP_NAV_END} defaultPinned defaultCurrent="ar-payments-refunds" />);
    for (const name of ["Ledgers", "Payments", "Lockbox", "Credits"]) {
      expect(within(groupList(name)).getAllByRole("listitem").length).toBeGreaterThan(0);
    }
    expect(within(groupList("Lockbox")).getByRole("button", { name: "Lockbox Files" })).toBeInTheDocument();
  });

  it("pinned, collapses a group from a button named by the group", () => {
    render(<AppNav items={APP_NAV} endItems={APP_NAV_END} defaultPinned defaultCurrent="ar-payments-refunds" />);
    const toggle = screen.getByRole("button", { name: "Lockbox" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const list = groupList("Lockbox");
    expect(toggle).toHaveAttribute("aria-controls", list.id);
    expect(list).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(list).not.toBeVisible();
    // The other groups stay as they were.
    expect(groupList("Credits")).toBeVisible();

    fireEvent.click(toggle);
    expect(list).toBeVisible();
  });

  it("in a flyout, shows the group name with nothing to collapse", () => {
    const { container } = render(<AppNav items={APP_NAV} endItems={APP_NAV_END} expanded />);
    openFlyout(container, "ar");
    expect(groupList("Lockbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lockbox" })).not.toBeInTheDocument();
  });

  it("drops a collapse when the menu closes", () => {
    const { container } = render(<AppNav items={APP_NAV} endItems={APP_NAV_END} defaultPinned defaultCurrent="ar-payments-refunds" />);
    const list = groupList("Lockbox");
    fireEvent.click(screen.getByRole("button", { name: "Lockbox" }));
    expect(list).not.toBeVisible();
    // Another section's menu takes the dock, and AR comes back with its groups open.
    openFlyout(container, "billing");
    openFlyout(container, "ar");
    expect(groupList("Lockbox")).toBeVisible();
  });
});

// Expanded, the cascade chevron goes and the section row itself is the keyboard way into the menu.
describe("App nav cascade", () => {
  const menu = (panel: HTMLElement) => panel.querySelector<HTMLElement>("ul.links")!;
  it("keeps the cascade button in the icon rail", () => {
    render(<AppNav items={APP_NAV} endItems={APP_NAV_END} />);
    expect(screen.getByRole("button", { name: "AR menu" })).toBeInTheDocument();
  });

  it("drops it when expanded, leaving nothing focusable behind", () => {
    const { container } = render(<AppNav items={APP_NAV} endItems={APP_NAV_END} expanded />);
    expect(screen.queryByRole("button", { name: "AR menu" })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[class*="cascade"]')).toHaveLength(0);
  });

  it("gives the section row the menu's state and opens it on Enter", () => {
    const { container } = render(<AppNav items={APP_NAV} endItems={APP_NAV_END} expanded />);
    const row = within(container.querySelector<HTMLElement>('[data-section="ar"]')!).getByRole("button", { name: /AR/ });
    expect(row).toHaveAttribute("aria-expanded", "false");
    expect(row).toHaveAttribute("aria-controls");

    fireEvent.keyDown(row, { key: "Enter" });
    expect(row).toHaveAttribute("aria-expanded", "true");
    // Focus lands in the menu, and the links are reachable from there.
    const panel = document.getElementById(row.getAttribute("aria-controls")!)!;
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(within(menu(panel)).getByText("Account Ledgers")).toBeInTheDocument();
  });
});
