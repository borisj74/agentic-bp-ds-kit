import shell from "@/playground/shell.module.css";
import { ScaleFoundation, type ScaleTab } from "@/playground/ScaleFoundation";

const tabs: ScaleTab[] = [
  { key: "primitives", label: "Primitives", sections: [
    { title: "Scale", prefix: "--radius-small → full", rows: [
      { token: "radius-small", value: "2px" }, { token: "radius-medium", value: "4px" }, { token: "radius-large", value: "8px" }, { token: "radius-full", value: "9999px" },
    ] },
  ] },
  { key: "semantics", label: "Semantics", sections: [
    { title: "Control", prefix: "--radius-control-*", note: "Buttons, inputs, chips. Size follows the control size.", rows: [
      { token: "radius-control-small", value: "2px" }, { token: "radius-control-medium", value: "4px" }, { token: "radius-control-large", value: "8px" },
    ] },
    { title: "Surface", prefix: "--radius-surface", note: "Cards, panels, modals.", rows: [{ token: "radius-surface", value: "8px" }] },
    { title: "Pill", prefix: "--radius-pill", note: "Badges, tags, toggles.", rows: [{ token: "radius-pill", value: "9999px" }] },
  ] },
];

export default function Radius() {
  return (
    <>
      <h1 className={shell.pageTitle}>Radius</h1>
      <p className={shell.pageLead}>Primitives are the source corner scale. Components use the radius roles.</p>
      <ScaleFoundation tabs={tabs} visual="box" />
    </>
  );
}
