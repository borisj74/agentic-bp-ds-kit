import { describe, expect, it } from "vitest";
import { transform } from "../scripts/codemod-a3-renames.mjs";

const before = `import { Alert, type AlertProps } from "@/ui/Alert/Alert";
import { DropdownMenu, type DropdownMenuAlign } from "@/ui/DropdownMenu/DropdownMenu";
import { Tooltip } from "@/ui/Tooltip/Tooltip";
import { Section } from "@/ui/Section/Section";
import { Modal } from "@/ui/Modal/Modal";
const p: AlertProps = { children: "Saved" };
const a: DropdownMenuAlign = "end";
export function Screen({ open }: { open: boolean }) {
  return (
    <>
      <Alert intent="info" dismissible onDismiss={() => {}}>Alert text stays</Alert>
      <DropdownMenu label="Row actions" align="end" items={[]} onOpenChange={() => {}} />
      <Tooltip content="Help" placement={"bottom"}><button>?</button></Tooltip>
      <Section title="More" collapsible defaultOpen={false} onOpenChange={(o) => o}>x</Section>
      <Modal open={open} size="full" title="Big" onClose={() => {}} />
    </>
  );
}`;

describe("codemod-a3-renames", () => {
  const after = transform(before);

  it("renames the component, its imports and its types", () => {
    expect(after).toContain(`import { Callout, type CalloutProps } from "@/ui/Callout/Callout";`);
    expect(after).toContain(`<Callout intent="info" closeButton onDismiss={() => {}}>Alert text stays</Callout>`);
    expect(after).toContain(`const p: CalloutProps`);
    expect(after).toContain(`import { Dropdown, type DropdownAlignment } from "@/ui/Dropdown/Dropdown";`);
  });

  it("renames props and values only on the component that owns them", () => {
    expect(after).toContain(`<Dropdown label="Row actions" alignment="right" items={[]} onOpenChange={() => {}} />`);
    expect(after).toContain(`<Tooltip content="Help" position="below">`);
    expect(after).toContain(`<Section title="More" collapsible defaultExpanded={false} onExpandedChange={(o) => o}>`);
    expect(after).toContain(`<Modal open={open} size="fullscreen" title="Big"`);
  });

  it("leaves copy alone and changes nothing on a second run", () => {
    expect(after).toContain("Alert text stays");
    expect(transform(after)).toBe(after);
  });

  it("flags props it cannot read", () => {
    const hints: string[] = [];
    transform(`import { Tooltip } from "@/ui/Tooltip/Tooltip";\n<Tooltip content="x" placement={side} {...rest} />`, hints);
    expect(hints).toHaveLength(2);
  });
});
