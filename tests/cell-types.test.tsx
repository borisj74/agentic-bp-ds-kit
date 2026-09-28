import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Cell } from "@/ui/Cell/Cell";
import { axeViolations } from "./axe";

// The reference table's cell types: number, date, status, switch, popupTrigger, textBlock, redirect.
describe("Cell reference types", () => {
  it("number is end-aligned with even-width digits and thousands separators", () => {
    const { container } = render(<Cell type="number" value={4321} />);
    const cell = container.firstElementChild!;
    expect(cell.className).toContain("end");
    expect(cell.className).toContain("number");
    expect(cell.textContent).toBe("4,321");
    render(<Cell type="number" value="$12,400.00" alignment="start" />);
    expect(screen.getByText("$12,400.00").parentElement!.className).toContain("start");
  });

  it("date writes an ISO day like DatePicker, in a time element, without a time-zone shift", () => {
    const { container } = render(<Cell type="date" value="2024-03-12" />);
    const time = container.querySelector("time")!;
    expect(time).toHaveAttribute("datetime", "2024-03-12");
    expect(time.textContent).toBe("Mar 12, 2024");
    render(<Cell type="date" value="not a date" />);
    expect(screen.getByText("not a date")).toBeInTheDocument();
  });

  it("status is a decorative dot in the intent colour and a label", () => {
    const { container } = render(<Cell type="status" label="Pending" intent="warning" />);
    const mark = container.querySelector(".mark")!;
    expect(mark.className).toContain("mark-warning");
    expect(mark.querySelector("[aria-hidden='true']")?.textContent).toBe("fiber_manual_record");
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("switch is a kit Switch named by label that toggles with the keyboard", () => {
    const onChange = vi.fn();
    render(<Cell type="switch" label="Auto-renew Acme" onCheckedChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Auto-renew Acme" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("popupTrigger is a neutral kit Link acting in place, then a decorative open_in_full", () => {
    const onClick = vi.fn();
    render(<Cell type="popupTrigger" label="3 contacts" onClick={onClick} />);
    const trigger = screen.getByRole("button", { name: "3 contacts" });
    expect(trigger.className).toContain("neutral");
    const mark = trigger.querySelector("[aria-hidden='true']")!;
    expect(mark.textContent).toBe("open_in_full");
    expect(mark.className).toContain("sm");
    expect(mark.className).toContain("trailIcon");
    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalled();
  });

  it("redirect is a brand kit Link in the same tab, then a decorative arrow_outward", () => {
    const onClick = vi.fn();
    render(<Cell type="redirect" label="Open billing run" href="/runs/42" onClick={onClick} />);
    const link = screen.getByRole("link", { name: "Open billing run" });
    expect(link).toHaveAttribute("href", "/runs/42");
    expect(link).not.toHaveAttribute("target");
    expect(link.className).toContain("brand");
    const arrow = link.querySelector("[aria-hidden='true']")!;
    expect(arrow.textContent).toBe("arrow_outward");
    expect(arrow.className).toContain("sm");
    expect(arrow.className).toContain("trailIcon");
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("textBlock wraps at md and holds one line at sm", () => {
    const { container, rerender } = render(<Cell type="textBlock" label="A long note." />);
    expect(container.firstElementChild!.className).toContain("textBlock");
    expect(container.firstElementChild!.className).toContain("md");
    rerender(<Cell type="textBlock" size="sm" label="A long note." />);
    expect(container.firstElementChild!.className).toContain("sm");
  });

  it("passes axe with every new type in one table-like column", async () => {
    render(
      <div>
        <Cell type="number" value={12} />
        <Cell type="date" value="2024-03-12" />
        <Cell type="status" label="Active" intent="success" />
        <Cell type="switch" label="Auto-renew" />
        <Cell type="popupTrigger" label="3 contacts" onClick={() => {}} />
        <Cell type="textBlock" label="Billed yearly." />
        <Cell type="redirect" label="Open billing run" href="#" />
      </div>,
    );
    expect((await axeViolations()).join("\n")).toBe("");
  });
});
