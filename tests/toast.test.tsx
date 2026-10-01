import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "@/ui/Toast/Toast";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const stack = () => document.getElementById("kit-toasts");
const card = () => stack()?.firstElementChild as HTMLElement;

describe("Toast", () => {
  // Regression: the role sat on each card, which arrives already filled in, so screen readers could miss it.
  it("joins a shared stack that is the polite live region", () => {
    render(<Toast open onClose={() => {}} title="Saved successfully" />);
    expect(stack()).toHaveAttribute("role", "status");
    expect(stack()).toHaveAttribute("aria-live", "polite");
    expect(card()).toHaveTextContent("Saved successfully");
    expect(card()).not.toHaveAttribute("role");
  });

  it("makes a danger toast an alert, named by its title", () => {
    render(<Toast open intent="danger" onClose={() => {}} title="Payment failed" />);
    expect(screen.getByRole("alert", { name: "Payment failed" })).toBeInTheDocument();
  });

  it("closes itself when its time is up", () => {
    const onClose = vi.fn();
    render(<Toast open onClose={onClose} title="Saved" duration={3000} />);
    act(() => { vi.advanceTimersByTime(2999); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pauses the countdown while the pointer is over it", () => {
    const onClose = vi.fn();
    render(<Toast open onClose={onClose} title="Saved" duration={3000} />);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.mouseEnter(card());
    act(() => { vi.advanceTimersByTime(10000); });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseLeave(card());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no close button; it stays when duration is null, and Escape closes it", () => {
    const onClose = vi.fn();
    render(<Toast open onClose={onClose} title="Saved" duration={null} />);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(60000); });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(card(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Regression: an Undo toast closed after 5 seconds, before keyboard and screen reader users could reach it.
  it("counts down 8 seconds when it has an action and no duration", () => {
    const onClose = vi.fn();
    render(<Toast open onClose={onClose} title="Deleted" actionLabel="Undo" onAction={() => {}} />);
    act(() => { vi.advanceTimersByTime(7999); });
    expect(onClose).not.toHaveBeenCalled();
    expect(card()).toHaveTextContent("Undo");
    act(() => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("still counts down with an action when a duration is set", () => {
    const onClose = vi.fn();
    render(<Toast open onClose={onClose} title="Deleted" actionLabel="Undo" duration={8000} />);
    act(() => { vi.advanceTimersByTime(8000); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("runs its action and closes", () => {
    const onClose = vi.fn();
    const onAction = vi.fn();
    render(<Toast open onClose={onClose} title="Deleted" actionLabel="Undo" onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Toast loading mode", () => {
  const top = () => document.getElementById("kit-toasts-loading");

  it("joins its own polite stack at the top, apart from confirmations", () => {
    render(<Toast open onClose={() => {}} title="Data is loading" progress="indeterminate" />);
    expect(top()).toHaveAttribute("role", "status");
    expect(top()).toHaveAttribute("aria-live", "polite");
    expect(top()).toHaveTextContent("Data is loading");
    expect(stack()?.textContent ?? "").not.toContain("Data is loading");
  });

  it("never closes itself, even with a duration or Escape", () => {
    const onClose = vi.fn();
    render(<Toast open onClose={onClose} title="Data is loading" progress="indeterminate" duration={3000} />);
    act(() => { vi.advanceTimersByTime(60000); });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(top()!.firstElementChild!, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows a progressbar named by the title, with the value or none when indeterminate", () => {
    const { rerender } = render(<Toast open onClose={() => {}} title="Importing invoices" progress={42} />);
    const bar = screen.getByRole("progressbar", { name: "Importing invoices" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    rerender(<Toast open onClose={() => {}} title="Importing invoices" progress="indeterminate" />);
    expect(screen.getByRole("progressbar", { name: "Importing invoices" })).not.toHaveAttribute("aria-valuenow");
  });

  it("Cancel is a real button that runs the action and then closes", () => {
    const onClose = vi.fn();
    const onAction = vi.fn();
    render(<Toast open onClose={onClose} title="Data is loading" progress="indeterminate" actionLabel="Cancel" onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays polite for danger, since nothing has gone wrong yet", () => {
    render(<Toast open intent="danger" onClose={() => {}} title="Retrying sync" progress="indeterminate" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
