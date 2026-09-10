import shell from "@/playground/shell.module.css";
import { ScaleFoundation, type ScaleTab } from "@/playground/ScaleFoundation";

const scale = [["0", "0"], ["100", "0.08"], ["200", "0.16"], ["300", "0.32"], ["400", "0.48"], ["500", "0.64"], ["600", "0.8"], ["700", "1"]] as const;

const tabs: ScaleTab[] = [
  { key: "semantics", label: "Semantics", sections: [
    { title: "Disabled", prefix: "--opacity-disabled", note: "Disabled controls and their labels.", rows: [{ token: "opacity-disabled", value: "0.48" }] },
    { title: "Muted", prefix: "--opacity-muted", note: "De-emphasized content that stays readable.", rows: [{ token: "opacity-muted", value: "0.64" }] },
    { title: "Hover", prefix: "--opacity-hover", note: "Tint layered on a surface under the pointer.", rows: [{ token: "opacity-hover", value: "0.08" }] },
    { title: "Scrim", prefix: "--opacity-scrim*", note: "Backdrop behind modals and drawers.", rows: [{ token: "opacity-scrim-soft", value: "0.32" }, { token: "opacity-scrim", value: "0.64" }] },
    { title: "Full", prefix: "--opacity-full", rows: [{ token: "opacity-full", value: "1" }] },
  ] },
  { key: "primitives", label: "Primitives", sections: [
    { title: "Scale", prefix: "--opacity-0 → 700", rows: scale.map(([k, v]) => ({ token: `opacity-${k}`, value: v })) },
  ] },
];

export default function Opacity() {
  return (
    <>
      <h1 className={shell.pageTitle}>Opacity</h1>
      <p className={shell.pageLead}>Use semantic opacity roles in components. Primitives are the source transparency scale.</p>
      <ScaleFoundation tabs={tabs} visual="opacity" />
    </>
  );
}
