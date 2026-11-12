import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dropdown, type DropdownEntry } from "@/ui/Dropdown/Dropdown";

const ITEMS: DropdownEntry[] = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { divider: true },
  { id: "delete", label: "Delete", danger: true },
];

const setup = (onSelect = vi.fn()) => {
  const user = userEvent.setup();
  render(<Dropdown label="Actions" items={ITEMS} onSelect={onSelect} />);
  const trigger = screen.getByRole("button", { name: /^Actions/ });
  return { user, trigger, onSelect };
};
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("Dropdown", () => {
  it("opens on click with focus on the first item", async () => {
    const { user, trigger } = setup();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await waitFor(() => expect(item("Edit")).toHaveFocus());
  });

  it("moves with the arrow keys, Home and End, and wraps", async () => {
    const { user, trigger } = setup();
    await user.click(trigger);
    await waitFor(() => expect(item("Edit")).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(item("Duplicate")).toHaveFocus();
    await user.keyboard("{End}");
    expect(item("Delete")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("Edit")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Delete")).toHaveFocus();
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    const { user, trigger } = setup();
    await user.click(trigger);
    await waitFor(() => expect(item("Edit")).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on the last item with Arrow Up on the trigger", async () => {
    const { user, trigger } = setup();
    trigger.focus();
    await user.keyboard("{ArrowUp}");
    await waitFor(() => expect(item("Delete")).toHaveFocus());
  });

  // Regression: Arrow Up inside the open menu bubbled to the trigger and made the next click open on the last item.
  it("still opens on the first item after Arrow Up was pressed inside the menu", async () => {
    const { user, trigger } = setup();
    await user.click(trigger);
    await waitFor(() => expect(item("Edit")).toHaveFocus());
    await user.keyboard("{ArrowUp}{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await user.click(trigger);
    await waitFor(() => expect(item("Edit")).toHaveFocus());
  });

  it("picks an item with a click and closes", async () => {
    const { user, trigger, onSelect } = setup();
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
    expect(onSelect).toHaveBeenCalledWith("duplicate");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("picks the focused item with Enter", async () => {
    const { user, trigger, onSelect } = setup();
    await user.click(trigger);
    await waitFor(() => expect(item("Edit")).toHaveFocus());
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("duplicate");
  });

  describe("iconStyle", () => {
    const ICONS: DropdownEntry[] = [
      { id: "edit", label: "Edit", icon: "edit" },
      { divider: true },
      { id: "delete", label: "Delete", icon: "delete", danger: true },
    ];
    const open = async (iconStyle?: "tile" | "plain") => {
      const user = userEvent.setup();
      const view = render(<Dropdown label="Actions" items={ICONS} iconStyle={iconStyle} />);
      await user.click(screen.getByRole("button", { name: /^Actions/ }));
      return { menu: screen.getByRole("menu"), view };
    };

    it("tile (default) has no plain modifier and wraps the icon in a tile", async () => {
      const { menu } = await open();
      expect(menu.className).not.toMatch(/plainIcons/);
      expect(item("Edit").querySelector('[class*="tile"]')).not.toBeNull();
    });

    it("plain puts the modifier on the panel", async () => {
      const { menu } = await open("plain");
      expect(menu.className).toMatch(/plainIcons/);
    });

    it("danger item keeps its bare trailing icon under either value", async () => {
      for (const style of ["tile", "plain"] as const) {
        const { view } = await open(style);
        expect(item("Delete").querySelector('[class*="tile"]')).toBeNull();
        expect(item("Delete").querySelector('[class*="end"]')).not.toBeNull();
        view.unmount();
      }
    });
  });
});
