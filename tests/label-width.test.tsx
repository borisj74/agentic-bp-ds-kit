import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Form } from "@/ui/Form/Form";
import { Input } from "@/ui/Input/Input";

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
