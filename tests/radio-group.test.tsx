import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadioGroup } from "@/ui/RadioGroup/RadioGroup";
import { Cell } from "@/ui/Cell/Cell";
import { axeViolations } from "./axe";

describe("RadioGroup option hideLabel", () => {
  it("keeps the label for screen readers and shows only the circle", async () => {
    const { container } = render(
      <RadioGroup legend="Default plan" hideLegend options={[{ value: "basic", label: "Basic", hideLabel: true }, { value: "pro", label: "Pro" }]} />,
    );
    expect(screen.getByRole("radio", { name: "Basic" })).toBeInTheDocument();
    expect(screen.getByText("Basic").className).toContain("srOnly");
    expect(screen.getByText("Pro").className).toContain("label");
    expect(container.querySelectorAll(".srOnly").length).toBe(2); // the hidden legend and the hidden label
    expect((await axeViolations()).join("\n")).toBe("");
  });

  it("is what the radio Cell uses, with no styles reaching into RadioGroup", () => {
    render(<Cell type="radio" name="plan" label="Default plan Basic" checked />);
    expect(screen.getByText("Default plan Basic", { selector: "label > span" }).className).toContain("srOnly");
  });
});
