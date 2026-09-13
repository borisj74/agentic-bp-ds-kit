import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "@/ui/ChatComposer/ChatComposer";

const field = () => screen.getByRole("textbox", { name: "Ask the assistant" });

describe("ChatComposer", () => {
  it("keeps Send disabled until something is typed", async () => {
    const user = userEvent.setup();
    render(<ChatComposer onSend={() => {}} />);
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();
    await user.type(field(), "Hello");
    expect(send).toBeEnabled();
  });

  it("sends the trimmed text with Enter and clears the box", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    await user.type(field(), "  Show overdue invoices  {Enter}");
    expect(onSend).toHaveBeenCalledWith("Show overdue invoices");
    expect(field()).toHaveValue("");
  });

  it("starts a new line with Shift+Enter instead of sending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    await user.type(field(), "First line{Shift>}{Enter}{/Shift}");
    expect(onSend).not.toHaveBeenCalled();
  });

  // Regression: Enter that confirmed a word in a Japanese, Chinese or Korean input method sent half-typed text.
  it("does not send while an input method is composing", () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: "にほん" } });
    fireEvent.keyDown(field(), { key: "Enter", isComposing: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("にほん");
  });

  // Regression: Deep Thought showed its on state only as a tint, so screen readers were never told.
  it("announces the Deep Thought toggle state", () => {
    const onModeChange = vi.fn();
    const { rerender } = render(<ChatComposer mode="quick" onModeChange={onModeChange} />);
    const toggle = screen.getByRole("button", { name: "Deep Thought" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(onModeChange).toHaveBeenCalledWith("deep");
    rerender(<ChatComposer mode="deep" onModeChange={onModeChange} />);
    expect(screen.getByRole("button", { name: "Deep Thought" })).toHaveAttribute("aria-pressed", "true");
  });
});
