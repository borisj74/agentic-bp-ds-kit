import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "@/ui/Button/Button";
import { Drawer } from "@/ui/Drawer/Drawer";
import { Input } from "@/ui/Input/Input";
import { Modal } from "@/ui/Modal/Modal";

// A Modal with a field and a footer button, and, when nested, a Drawer opened from inside it (a Lookup does the
// same with its own Modal).
function Screen({ nested = false }: { nested?: boolean }) {
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit customer</Button>
      <Modal open={open} title="Edit customer" onClose={() => setOpen(false)} footer={<Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>}>
        <Input label="Name" />
        {nested && <Button size="sm" onClick={() => setInner(true)}>Pick a parent</Button>}
        {nested && (
          <Drawer open={inner} title="Parent account" onClose={() => setInner(false)}>
            <Input label="Search accounts" />
            <Input label="Account number" />
          </Drawer>
        )}
      </Modal>
    </>
  );
}

const inside = (dialog: HTMLElement) => dialog.contains(document.activeElement);

describe("Modal", () => {
  it("is a named modal dialog that starts on its first field", async () => {
    const user = userEvent.setup();
    render(<Screen />);
    await user.click(screen.getByRole("button", { name: "Edit customer" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit customer" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus());
  });

  it("keeps Tab and Shift+Tab inside", async () => {
    const user = userEvent.setup();
    render(<Screen />);
    await user.click(screen.getByRole("button", { name: "Edit customer" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit customer" });
    await waitFor(() => expect(inside(dialog)).toBe(true));
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(inside(dialog), `Tab ${i + 1} stays inside`).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await user.tab({ shift: true });
      expect(inside(dialog), `Shift+Tab ${i + 1} stays inside`).toBe(true);
    }
  });

  it("closes on Escape and gives focus back to what opened it", async () => {
    const user = userEvent.setup();
    render(<Screen />);
    const opener = screen.getByRole("button", { name: "Edit customer" });
    await user.click(opener);
    await screen.findByRole("dialog", { name: "Edit customer" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});

describe("A Drawer opened from a Modal", () => {
  // Regression: Tab inside the inner dialog also ran the outer dialog's trap, which pulled focus back to the Modal.
  it("keeps Tab inside the inner dialog", async () => {
    const user = userEvent.setup();
    render(<Screen nested />);
    await user.click(screen.getByRole("button", { name: "Edit customer" }));
    await user.click(await screen.findByRole("button", { name: "Pick a parent" }));
    const drawer = await screen.findByRole("dialog", { name: "Parent account" });
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Search accounts" })).toHaveFocus());
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(inside(drawer), `Tab ${i + 1} stays in the drawer`).toBe(true);
    }
  });

  it("closes only itself on Escape and returns focus inside the Modal", async () => {
    const user = userEvent.setup();
    render(<Screen nested />);
    await user.click(screen.getByRole("button", { name: "Edit customer" }));
    const picker = await screen.findByRole("button", { name: "Pick a parent" });
    await user.click(picker);
    await screen.findByRole("dialog", { name: "Parent account" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Parent account" })).not.toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Edit customer" })).toBeInTheDocument();
    expect(picker).toHaveFocus();
  });
});
