import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatMessage } from "@/ui/ChatMessage/ChatMessage";
import { DataGrid } from "@/ui/DataGrid/DataGrid";
import { FormulaEditor } from "@/ui/FormulaEditor/FormulaEditor";

// The three pieces the price-ramps screens had to hand-build: a date a screen only reads, the way into the
// assistant from a formula field, and the way an answer gets back into that field.
describe("FormulaEditor AI assistant", () => {
  it("has no assistant button until a screen can answer", () => {
    render(<FormulaEditor label="New rate formula" defaultValue="{!Amount} * 1.05" />);
    expect(screen.queryByRole("button", { name: "AI assistant" })).toBeNull();
  });

  it("puts the assistant first in the toolbar and presses it while the assistant is open", async () => {
    const user = userEvent.setup();
    const onAiAssist = vi.fn();
    const { rerender } = render(
      <FormulaEditor label="New rate formula" defaultValue="{!Amount} * 1.05" fields={[{ id: "Amount", label: "Amount" }]} onAiAssist={onAiAssist} />,
    );
    const tools = screen.getByRole("group", { name: "New rate formula tools" });
    // Asking for a formula comes before writing one: the button stands ahead of Insert field.
    const first = tools.querySelector("button")!;
    expect(first).toHaveAccessibleName("AI assistant");
    await user.click(first);
    expect(onAiAssist).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveAttribute("aria-pressed", "true");

    rerender(
      <FormulaEditor label="New rate formula" defaultValue="{!Amount} * 1.05" fields={[{ id: "Amount", label: "Amount" }]} onAiAssist={onAiAssist} aiActive />,
    );
    expect(screen.getByRole("button", { name: "AI assistant" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ChatMessage apply", () => {
  it("names what it does, sits above the icon row, and only on a finished answer", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const { container, rerender } = render(
      <ChatMessage author="assistant" text="Try {!Amount} * (1 + {!Account.Uplift})." apply={{ label: "Insert into formula", onApply }} />,
    );
    const button = screen.getByRole("button", { name: "Insert into formula" });
    await user.click(button);
    expect(onApply).toHaveBeenCalledTimes(1);
    // The icon row is unchanged and still closes the message.
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.indexOf(button)).toBeLessThan(buttons.findIndex((b) => b.textContent?.includes("Copy")));

    // Nothing to apply while the answer is still being written.
    rerender(<ChatMessage author="assistant" text="Working" status="Thinking" apply={{ label: "Insert into formula", onApply }} />);
    expect(screen.queryByRole("button", { name: "Insert into formula" })).toBeNull();
  });

  it("stays off a person's own turn", () => {
    render(<ChatMessage author="user" text="Give me a formula" apply={{ label: "Insert into formula", onApply: () => {} }} />);
    expect(screen.queryByRole("button", { name: "Insert into formula" })).toBeNull();
  });
});

describe("DataGrid read-only date", () => {
  const columns = [
    { key: "product", header: "Product" },
    { key: "from", header: "Billed from", type: "date" as const, readOnly: true },
    { key: "starts", header: "Starts on", type: "date" as const },
  ];
  const rows = [{ id: "r1", product: "Seat license", from: "2027-01-01", starts: "2027-01-01" }];

  it("writes a date people cannot change the way the kit writes one, with no picker", () => {
    const { container } = render(<DataGrid label="Price steps" columns={columns} rows={rows} />);
    const cell = container.querySelector('td[data-cell="r1:from"]')!;
    // The ISO day is what it stores; Jan 1, 2027 is what it says — and not in the code font a formula cell uses.
    expect(cell).toHaveTextContent("Jan 1, 2027");
    expect(cell.querySelector("button")).toBeNull();
    expect(cell.querySelector('[class*="mono"]')).toBeNull();
    // A date column people can change still gets the picker, right beside it.
    expect(container.querySelector('td[data-cell="r1:starts"] button[aria-haspopup="dialog"]')).not.toBeNull();
  });
});
