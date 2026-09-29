import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Form } from "@/ui/Form/Form";
import { RadioGroup } from "@/ui/RadioGroup/RadioGroup";
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
});

describe("RadioGroup labelPosition", () => {
  const options = [{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }];

  it("start puts the legend in the label column and marks the group for a Form", async () => {
    const { container } = render(<RadioGroup legend="Billing cycle" labelPosition="start" options={options} />);
    const group = container.querySelector("fieldset")!;
    expect(group.dataset.label).toBe("start");
    expect(group.className).toContain("startLabel");
    expect(screen.getByRole("group", { name: "Billing cycle" })).toBeInTheDocument();
    expect((await axeViolations()).join("\n")).toBe("");
  });

  it("top is the default, and a hidden legend never claims the label column", () => {
    const { container: top } = render(<RadioGroup legend="Billing cycle" options={options} />);
    expect(top.querySelector("fieldset")!.dataset.label).toBe("top");
    expect(top.querySelector("fieldset")!.className).not.toContain("startLabel");
    const { container: hidden } = render(<RadioGroup legend="Billing cycle" hideLegend labelPosition="start" options={options} />);
    expect(hidden.querySelector("fieldset")!.dataset.label).toBeUndefined();
    expect(hidden.querySelector("fieldset")!.className).not.toContain("startLabel");
  });

  it("takes the position from the Form around it", () => {
    const { container } = render(
      <Form title="Plan" labelPosition="start"><RadioGroup legend="Billing cycle" options={options} /></Form>,
    );
    expect(container.querySelector("fieldset[data-label]")!.getAttribute("data-label")).toBe("start");
  });
});
