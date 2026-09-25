import { describe, expect, it } from "vitest";
import { transform } from "../scripts/codemod-a4a-button.mjs";

const before = `import { Button } from "@/ui/Button/Button";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { AlertDialog, type AlertDialogActionVariant } from "@/ui/AlertDialog/AlertDialog";
import { Form } from "@/ui/Form/Form";
const ACTIONS = [{ label: "View" }, { label: "Delete", variant: "danger" as const }];
const next = { id: "submit", label: "Submit", variant: "primary", type: "submit" };
const a: AlertDialogActionVariant = "danger";
export function Screen({ open, on }: { open: boolean; on: boolean }) {
  return (
    <>
      <Button variant="primary" iconStart="add">Create invoice</Button>
      <Button variant="secondary">Cancel</Button>
      <Button
        size="sm" variant="tertiary" iconOnly iconStart="filter_list" pressed={on}
      >Filters</Button>
      <Button variant={"danger"} pressed>Delete</Button>
      <Button variant={on ? "danger" : "tertiary"}>Stop</Button>
      <Dropdown label="More" variant="tertiary" items={[]} />
      <Form variant="card" title="Pick a primary button" />
      <AlertDialog open={open} title="Delete?" description="Gone." actionLabel="Delete" actionVariant="danger" onCancel={() => {}} onAction={() => {}} />
      <p>Use the primary button. variant="primary" in copy stays.</p>
    </>
  );
}`;

describe("codemod-a4a-button", () => {
  const hints: string[] = [];
  const after = transform(before, "screen.tsx", hints);

  it("maps variant to emphasis and intent on Button and Dropdown", () => {
    expect(after).toContain(`<Button emphasis="strong" intent="brand" iconStart="add">Create invoice</Button>`);
    expect(after).toContain(`<Button emphasis="subtle">Cancel</Button>`);
    expect(after).toContain(`size="sm" emphasis="minimal" iconOnly iconStart="filter_list" toggle={on}`);
    expect(after).toContain(`<Button emphasis="strong" intent="danger" toggle>Delete</Button>`);
    expect(after).toContain(`<Dropdown label="More" emphasis="minimal" items={[]} />`);
  });

  it("renames AlertDialog actionVariant and its type", () => {
    expect(after).toContain(`actionIntent="danger"`);
    expect(after).toContain(`type AlertDialogActionIntent }`);
    expect(after).toContain(`const a: AlertDialogActionIntent = "danger";`);
  });

  it("maps object-literal action data", () => {
    expect(after).toContain(`{ label: "Delete", emphasis: "strong" as const, intent: "danger" as const }`);
    expect(after).toContain(`{ id: "submit", label: "Submit", emphasis: "strong", intent: "brand", type: "submit" }`);
  });

  it("leaves other components and copy alone, and hints at expressions", () => {
    expect(after).toContain(`<Form variant="card" title="Pick a primary button" />`);
    expect(after).toContain(`<p>Use the primary button. variant="primary" in copy stays.</p>`);
    expect(after).toContain(`<Button variant={on ? "danger" : "tertiary"}>Stop</Button>`);
    expect(hints.some((h) => h.startsWith("screen.tsx:17 ") && h.includes("variant={...}"))).toBe(true);
  });

  it("rewrites JSON examples", () => {
    const json = `{\n  "props": {\n    "variant": "danger",\n    "children": "Delete"\n  },\n  "dialog": { "actionVariant": "primary" }\n}`;
    const out = transform(json, "button.json");
    expect(out).toContain(`    "emphasis": "strong",\n    "intent": "danger",\n    "children": "Delete"`);
    expect(out).toContain(`"actionIntent": "brand"`);
    expect(transform(out, "button.json")).toBe(out);
  });

  it("changes nothing on a second run", () => {
    expect(transform(after, "screen.tsx", [])).toBe(after);
  });
});
