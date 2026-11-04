import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cascader } from "@/ui/Cascader/Cascader";
import { DatePicker } from "@/ui/DatePicker/DatePicker";
import { Form } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { FormulaEditor } from "@/ui/FormulaEditor/FormulaEditor";
import { Input } from "@/ui/Input/Input";
import { Lookup } from "@/ui/Lookup/Lookup";
import { RadioGroup } from "@/ui/RadioGroup/RadioGroup";
import { Select } from "@/ui/Select/Select";
import { Textarea } from "@/ui/Textarea/Textarea";

// The start-label column comes in three widths. jsdom has no layout, so what the width does to the breakpoints is
// read from the CSS; what the Form puts on the element is read from the DOM.
const rules = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
const tokens = readFileSync("src/tokens/primitives.css", "utf8");
const px = (token: string) => Number(tokens.match(new RegExp(`--${token}:\\s*(\\d+)px`))![1]);

const form = (props: Parameters<typeof Form>[0]) => {
  const { container } = render(<Form title="Company details" {...props}><Input label="Email" name="email" /></Form>);
  return container.querySelector("form")!;
};

describe("Form labelWidth", () => {
  it("leaves md, the kit's own column, unmarked", () => {
    expect(form({ labelPosition: "start" }).getAttribute("data-label-width")).toBeNull();
    expect(form({ labelPosition: "start", labelWidth: "md" }).getAttribute("data-label-width")).toBeNull();
  });

  it("marks a narrower or wider column, so the fields and the columns can move their breakpoints with it", () => {
    const sm = form({ labelPosition: "start", labelWidth: "sm" });
    expect(sm.getAttribute("data-label-width")).toBe("sm");
    expect(sm.className).toMatch(/\bwidthSm\b/);
    const lg = form({ labelPosition: "start", labelWidth: "lg" });
    expect(lg.getAttribute("data-label-width")).toBe("lg");
    expect(lg.className).toMatch(/\bwidthLg\b/);
  });

  it("reads nothing with labels on top, where there is no column to size", () => {
    const top = form({ labelWidth: "sm" });
    expect(top.getAttribute("data-label-width")).toBeNull();
    expect(top.className).not.toMatch(/\bwidth(Sm|Lg)\b/);
  });

  it("takes the field column with it, so the field beside the label stays 308 at every step", () => {
    const gap = 12, field = 308;
    expect(px("layout-column-max-sm")).toBe(px("input-label-width-sm") + gap + field);
    expect(px("layout-column-max")).toBe(px("input-label-width") + gap + field);
    expect(px("layout-column-max-lg")).toBe(px("input-label-width-lg") + gap + field);
  });

  it("moves where the label goes back on top with the column", () => {
    // A label goes on top once the column plus the field no longer fit, which is the column cap itself.
    for (const [file, sel] of [["src/ui/Input/Input.module.css", ".start"], ["src/ui/RadioGroup/RadioGroup.module.css", ".startLabel"]] as const) {
      const css = rules(file);
      expect(css).toContain("@container (max-width: 554px)");
      expect(css).toContain(`@container (min-width: 461px) and (max-width: 554px) { :global([data-label-width="sm"]) ${sel}`);
      expect(css).toContain(`@container (min-width: 555px) and (max-width: 640px) { :global([data-label-width="lg"]) ${sel}`);
    }
  });

  it("moves where columns give way with it, each column carrying the label column it was given", () => {
    const css = rules("src/ui/Form/columns.module.css");
    // Three give way at 1019 (sm), 1301 (md) or 1559 (lg); two at 679, 867 or 1039.
    expect(css).toContain('@container (min-width: 1019px) and (max-width: 1300px) { :global([data-label-width="sm"]) .three');
    expect(css).toContain('@container (min-width: 1301px) and (max-width: 1558px) { :global([data-label-width="lg"]) .three');
    expect(css).toContain('@container (min-width: 679px) and (max-width: 866px) { :global([data-label-width="sm"]) :is(.two, .three)');
    expect(css).toContain('@container (min-width: 867px) and (max-width: 1038px) { :global([data-label-width="lg"]) :is(.two, .three)');
    // The sm and lg rules come after the plain ones, so at the widths they overlap the marked column wins.
    expect(css.indexOf('[data-label-width="sm"]) .three')).toBeGreaterThan(css.indexOf("@container (max-width: 1300px)"));
  });
});

// A field standing outside a Form sets its own column. Inside one it reads the Form's, so it stays unmarked.
const FIELDS = [
  ["Input", (p: object) => <Input label="Status" {...p} />],
  ["Textarea", (p: object) => <Textarea label="Notes" {...p} />],
  ["Select", (p: object) => <Select label="Status" options={[{ value: "active", label: "Active" }]} {...p} />],
  ["DatePicker", (p: object) => <DatePicker label="Invoice date" {...p} />],
  ["Lookup", (p: object) => <Lookup label="Account" columns={[{ key: "name", header: "Name" }]} rows={[{ id: "1", name: "Acme" }]} {...p} />],
  ["Cascader", (p: object) => <Cascader label="Product" options={[{ value: "a", label: "Acme" }]} {...p} />],
  ["FormulaEditor", (p: object) => <FormulaEditor label="Formula" {...p} />],
  ["FormDisplay", (p: object) => <FormDisplay label="Account ID" value="ACC-2041" {...p} />],
  ["RadioGroup", (p: object) => <RadioGroup legend="Billing cycle" options={[{ value: "m", label: "Monthly" }]} {...p} />],
] as const;

const widthClass = (ui: ReactElement) => {
  const { container } = render(ui);
  return (container.firstElementChild as HTMLElement).className.match(/\bwidth(Sm|Lg)\b/)?.[0] ?? null;
};

describe("Field labelWidth", () => {
  it.each(FIELDS)("lets %s stand on its own column", (_name, field) => {
    expect(widthClass(field({ labelPosition: "start", labelWidth: "sm" }))).toBe("widthSm");
    expect(widthClass(field({ labelPosition: "start", labelWidth: "lg" }))).toBe("widthLg");
  });

  it.each(FIELDS)("leaves %s on the kit's own column when it asks for md or nothing", (_name, field) => {
    expect(widthClass(field({ labelPosition: "start" }))).toBeNull();
    expect(widthClass(field({ labelPosition: "start", labelWidth: "md" }))).toBeNull();
  });

  // With no label there is no column, so the field takes no width even where one was passed.
  it("reads nothing on a field whose label is hidden", () => {
    expect(widthClass(<Input label="Status" hideLabel labelPosition="start" labelWidth="sm" />)).toBeNull();
    expect(widthClass(<RadioGroup legend="Billing cycle" hideLegend labelPosition="start" labelWidth="sm" options={[{ value: "m", label: "Monthly" }]} />)).toBeNull();
  });

  it("leaves a field inside a Form unmarked, so it stands on the Form's column", () => {
    const { container } = render(
      <Form title="Company details" labelPosition="start" labelWidth="sm"><Input label="Email" name="email" /></Form>,
    );
    expect(container.querySelector("form")!.className).toMatch(/\bwidthSm\b/);
    expect(container.querySelector('[data-label="start"]')!.className).not.toMatch(/\bwidth(Sm|Lg)\b/);
  });

  // A field that names its own step departs from the form's column: its own label column moves, nothing else does.
  it("lets one field in a Form depart on its own step", () => {
    const { container } = render(
      <Form title="Company details" labelPosition="start"><Input label="Status" labelWidth="sm" name="status" /></Form>,
    );
    expect(container.querySelector("form")!.className).not.toMatch(/\bwidth(Sm|Lg)\b/);
    expect(container.querySelector('[data-label="start"]')!.className).toMatch(/\bwidthSm\b/);
  });

  it("sets the column from the same tokens the Form uses", () => {
    for (const file of ["src/ui/Input/Input.module.css", "src/ui/RadioGroup/RadioGroup.module.css", "src/ui/FormDisplay/FormDisplay.module.css"]) {
      const css = rules(file);
      expect(css).toContain(".widthSm { --input-label-width: var(--input-label-width-sm); }");
      expect(css).toContain(".widthLg { --input-label-width: var(--input-label-width-lg); }");
    }
  });

  it("moves where its own label goes back on top with its own column", () => {
    for (const [file, sel] of [["src/ui/Input/Input.module.css", ".start"], ["src/ui/RadioGroup/RadioGroup.module.css", ".startLabel"]] as const) {
      const css = rules(file);
      expect(css).toContain(`.widthSm${sel}`);
      expect(css).toContain(`.widthLg${sel}`);
    }
  });
});
