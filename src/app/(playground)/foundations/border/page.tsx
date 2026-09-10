import shell from "@/playground/shell.module.css";
import { ScaleFoundation, type ScaleTab } from "@/playground/ScaleFoundation";

const tabs: ScaleTab[] = [
  { key: "primitives", label: "Primitives", sections: [
    { title: "Scale", prefix: "--border-width-thin → thick", rows: [
      { token: "border-width-thin", value: "1px" }, { token: "border-width-medium", value: "2px" }, { token: "border-width-thick", value: "3px" },
    ] },
  ] },
  { key: "semantics", label: "Semantics", sections: [
    { title: "Control", prefix: "--border-control*", note: "Inputs, selects, checkboxes. Strong for emphasized or selected controls.", rows: [
      { token: "border-control", value: "1px" }, { token: "border-control-strong", value: "2px" },
    ] },
    { title: "Surface", prefix: "--border-surface", note: "Cards, panels, table containers.", rows: [{ token: "border-surface", value: "1px" }] },
    { title: "Divider", prefix: "--border-divider*", note: "Rules between rows and sections.", rows: [
      { token: "border-divider", value: "1px" }, { token: "border-divider-strong", value: "2px" },
    ] },
    { title: "Focus", prefix: "--border-focus", note: "Focus ring width. Pair with --outline-brand or --outline-danger.", rows: [{ token: "border-focus", value: "2px" }] },
  ] },
];

export default function Border() {
  return (
    <>
      <h1 className={shell.pageTitle}>Border</h1>
      <p className={shell.pageLead}>Use semantic border widths in components. Pair them with color border tokens for stroke color.</p>
      <ScaleFoundation tabs={tabs} visual="border" />
    </>
  );
}
