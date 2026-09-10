import shell from "@/playground/shell.module.css";
import { ScaleFoundation, type ScaleTab } from "@/playground/ScaleFoundation";

const tabs: ScaleTab[] = [
  { key: "primitives", label: "Primitives", sections: [
    { title: "Shadow", prefix: "--shadow-*", rows: [
      { token: "shadow-raised", value: "raised" }, { token: "shadow-floating", value: "floating" }, { token: "shadow-inset", value: "inset" },
    ] },
    { title: "Glow", prefix: "--glow-*", note: "Colored halos. Follow the active brand and status colors.", rows: [
      { token: "glow-brand", value: "brand" }, { token: "glow-info", value: "info" }, { token: "glow-success", value: "success" },
      { token: "glow-warning", value: "warning" }, { token: "glow-danger", value: "danger" }, { token: "glow-highlight", value: "highlight" },
    ] },
  ] },
  { key: "semantics", label: "Semantics", sections: [
    { title: "Raised", prefix: "--elevation-card", note: "Cards and tiles that sit just above the page.", rows: [{ token: "elevation-card", value: "raised" }] },
    { title: "Overlay", prefix: "--elevation-dropdown · popover · modal", note: "Menus, popovers, and modals that float over content.", rows: [
      { token: "elevation-dropdown", value: "floating" }, { token: "elevation-popover", value: "floating" }, { token: "elevation-modal", value: "floating" },
    ] },
    { title: "Inset", prefix: "--elevation-well", note: "Recessed wells and code blocks.", rows: [{ token: "elevation-well", value: "inset" }] },
    { title: "Focus", prefix: "--elevation-focus*", note: "Glow focus treatment. Danger for invalid fields.", rows: [
      { token: "elevation-focus", value: "glow brand" }, { token: "elevation-focus-danger", value: "glow danger" },
    ] },
  ] },
];

export default function Shadow() {
  return (
    <>
      <h1 className={shell.pageTitle}>Shadow</h1>
      <p className={shell.pageLead}>Use semantic elevation roles in components. Primitives are the source shadow and glow styles.</p>
      <ScaleFoundation tabs={tabs} visual="shadow" />
    </>
  );
}
