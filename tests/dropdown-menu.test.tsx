import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenu, type DropdownMenuEntry } from "@/ui/DropdownMenu/DropdownMenu";

const ITEMS: DropdownMenuEntry[] = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { divider: true },
  { id: "delete", label: "Delete", danger: true },
];

const setup = (onSelect = vi.fn()) => {
  const user = userEvent.setup();
  render(<DropdownMenu label="Actions" items={ITEMS} onSelect={onSelect} />);
  const trigger = screen.getByRole("button", { name: /^Actions/ });
  return { user, trigger, onSelect };
};
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("DropdownMenu", () => {
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
});
