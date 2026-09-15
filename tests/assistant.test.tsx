import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { ChatWindow } from "@/patterns/ChatWindow/ChatWindow";
import { ChatHeader } from "@/ui/ChatHeader/ChatHeader";
import { PieChart } from "@/ui/PieChart/PieChart";

// Class names are not scoped in tests, so another sheet's .panel rule hides the window in jsdom. The queries below
// look past visibility, and find words by text, since a hidden element's words do not count toward its name there.
const box = <textarea aria-label="Ask the assistant" />;
const starters = [{ id: "learn", label: "Learn about the assistant" }, { id: "draft", label: "Draft document" }];

describe("ChatWindow get started", () => {
  it("stacks the starters as a named list of buttons and says which was picked", () => {
    const onStarter = vi.fn();
    const { container } = render(<ChatWindow composer={box} starters={starters} onStarter={onStarter} />);
    expect(screen.getByText("Get Started").tagName).toBe("H3");
    const list = container.querySelector<HTMLElement>('ul[aria-label="Suggestions"]')!;
    expect(within(list).getAllByRole("button", { hidden: true })).toHaveLength(2);
    fireEvent.click(screen.getByText("Draft document").closest("button")!);
    expect(onStarter).toHaveBeenCalledWith("draft", "Draft document");
  });

  it("lets a screen's own empty block replace get started", () => {
    render(<ChatWindow composer={box} starters={starters} empty={<p>Nothing yet</p>} />);
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
    expect(document.querySelector('ul[aria-label="Suggestions"]')).toBeNull();
  });

  it("hides get started once there are turns", () => {
    render(<ChatWindow composer={box} starters={starters}><p>A turn</p></ChatWindow>);
    expect(screen.queryByText("Get Started")).toBeNull();
  });

  it("puts focus in the box on open only with autoFocus", () => {
    const { unmount } = render(<ChatWindow composer={box} />);
    expect(screen.getByRole("textbox", { hidden: true })).not.toHaveFocus();
    unmount();
    render(<ChatWindow composer={box} autoFocus />);
    expect(screen.getByRole("textbox", { hidden: true })).toHaveFocus();
  });
});

describe("AppShell full assistant", () => {
  const shell = (size: "panel" | "full") => (
    <AppShell pageHeader={<h1>Invoices</h1>} assistantOpen assistantSize={size} assistant={<ChatWindow composer={box} size={size} />}>
      <p>Page</p>
    </AppShell>
  );

  it("keeps the assistant the same element, with focus, when it goes full", () => {
    const { rerender, container } = render(shell("panel"));
    const field = screen.getByRole("textbox", { hidden: true });
    field.focus();
    expect(container.querySelector(".fullAssistant")).toBeNull();
    rerender(shell("full"));
    expect(screen.getByRole("textbox", { hidden: true })).toBe(field);
    expect(field).toHaveFocus();
    // The page is hidden, not removed.
    expect(container.querySelector(".fullAssistant")).not.toBeNull();
    expect(container.querySelector("main")).toHaveTextContent("Page");
  });

  it("does not go full while the assistant is shut", () => {
    const { container } = render(
      <AppShell assistantSize="full" assistant={<ChatWindow composer={box} />}><p>Page</p></AppShell>,
    );
    expect(container.querySelector(".fullAssistant")).toBeNull();
  });
});

describe("ChatHeader Plan Mode", () => {
  it("has a worded badge and an icon-only one for narrow bars, both named Plan Mode", () => {
    const { container } = render(<ChatHeader planMode />);
    expect(container.querySelector(".flagText")).toHaveTextContent("Plan Mode");
    expect(container.querySelector(".flagIcon")).toHaveTextContent("Plan Mode");
    expect(container.querySelector(".flagIcon .iconOnly")).not.toBeNull();
  });
});

describe("PieChart align", () => {
  const data = [{ label: "Card", value: 5 }, { label: "ACH", value: 3 }];
  it("hugs the start by default and centres with align center", () => {
    const { container, rerender } = render(<PieChart label="Payments" data={data} animate={false} />);
    expect(container.querySelector(".layout.center")).toBeNull();
    rerender(<PieChart label="Payments" data={data} animate={false} align="center" />);
    expect(container.querySelector(".layout.center")).not.toBeNull();
  });
});
