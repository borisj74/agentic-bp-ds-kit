import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Cell } from "@/ui/Cell/Cell";

describe("Cell tree toggle", () => {
  it("opens and closes with a chevron by default", () => {
    const { container } = render(<Cell type="tree" label="Acme Holdings" expanded={false} onExpandedChange={() => {}} />);
    const toggle = screen.getByRole("button", { name: "Expand Acme Holdings" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".box")).toBeNull();
    expect(container.querySelector(".material-symbols-outlined")?.textContent).toBe("chevron_right");
  });

  it("draws the outlined square with add or remove for treeToggle box", () => {
    const onExpandedChange = vi.fn();
    const { container, rerender } = render(
      <Cell type="tree" label="Acme Holdings" treeToggle="box" expanded={false} onExpandedChange={onExpandedChange} />,
    );
    const box = container.querySelector("button.box")!;
    expect(box).toHaveAttribute("aria-expanded", "false");
    expect(box.textContent).toContain("add");
    fireEvent.click(screen.getByRole("button", { name: "Expand Acme Holdings" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    rerender(<Cell type="tree" label="Acme Holdings" treeToggle="box" expanded onExpandedChange={onExpandedChange} />);
    expect(container.querySelector("button.box")!.textContent).toContain("remove");
    expect(screen.getByRole("button", { name: "Collapse Acme Holdings" })).toBeInTheDocument();
  });

  it("keeps rows without children free of a toggle", () => {
    const { container } = render(<Cell type="tree" label="Acme East" level={3} treeToggle="box" />);
    expect(container.querySelector("button")).toBeNull();
  });
});
