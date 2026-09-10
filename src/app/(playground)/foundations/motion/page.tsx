import shell from "@/playground/shell.module.css";
import { MotionFoundation, type MotionTab, type MotionTile } from "@/playground/MotionFoundation";

// ms → duration step
const step: Record<number, string> = { 0: "0", 120: "100", 160: "150", 180: "200", 240: "300", 320: "400", 400: "500", 500: "600" };

// A demo tile: one duration + one easing from the scale.
const combo = (label: string, ms: number, ease: string): MotionTile => ({
  label,
  meta: `${ms}ms · ${ease}`,
  duration: `--motion-duration-${step[ms]}`,
  ease: `--motion-ease-${ease}`,
  copy: `var(--motion-duration-${step[ms]}) var(--motion-ease-${ease})`,
});

const role = (name: string, value: string): [string, string] => [`--motion-${name}-*`, value];

const tabs: MotionTab[] = [
  { key: "semantics", label: "Semantics", groups: [
    { title: "Interaction", note: "Hover, press, toggle, and color changes on controls.", tiles: [
      combo("Standard", 120, "out"), combo("Snappy", 120, "out"), combo("Soft", 180, "in-out"), combo("Emphasized", 120, "emphasized"),
      combo("Spring", 180, "spring"), combo("Linear", 120, "linear"), combo("Crisp", 160, "out"),
    ] },
    { title: "Expand", note: "Accordions, disclosures, and rows that open in place.", tiles: [
      combo("Emphasized", 240, "in-out"), combo("Standard", 240, "standard"), combo("Ease out", 240, "out"), combo("Spring", 240, "spring"),
      combo("In-out", 320, "in-out"), combo("Linear", 240, "linear"), combo("Ease in", 240, "in"),
    ] },
    { title: "Overlay", note: "Dropdowns, popovers, and tooltips. Exit faster than enter.", tiles: [
      combo("Enter · out", 180, "out"), combo("Enter · spring", 180, "spring"), combo("Enter · emphasized", 180, "emphasized"), combo("Enter · in-out", 180, "in-out"),
      combo("Exit · out", 120, "out"), combo("Exit · linear", 120, "linear"), combo("Exit · quick", 120, "standard"),
    ] },
    { title: "Modal", note: "Modals and drawers.", tiles: [
      combo("Enter · emphasized", 320, "emphasized"), combo("Enter · spring", 320, "spring"), combo("Enter · out", 320, "out"), combo("Enter · in-out", 320, "in-out"),
      combo("Exit · out", 180, "out"), combo("Exit · standard", 180, "standard"), combo("Exit · spring", 180, "spring"),
    ] },
    { title: "Page", note: "Route and large layout transitions.", tiles: [
      combo("Emphasized", 400, "emphasized"), combo("Standard", 400, "standard"), combo("In-out", 400, "in-out"), combo("Spring", 400, "spring"),
      combo("Soft out", 500, "out"), combo("Linear", 400, "linear"), combo("Crisp", 320, "out"),
    ] },
    { title: "Role tokens", note: "Components use these pairs. Each role has a -duration and an -easing token. The tiles above are options to compare.", tiles: [], usage: [
      role("interaction", "120ms · out"),
      role("expand", "240ms · in-out"),
      role("overlay", "180ms · out"),
      role("overlay-exit", "120ms · out"),
      role("modal", "400ms · spring-soft"),
      role("modal-exit", "180ms · out"),
      role("page", "400ms · emphasized"),
    ] },
  ] },
  { key: "primitives", label: "Primitives", groups: [
    { title: "Duration", note: "Played with the standard easing.", tiles: Object.entries(step).sort((a, b) => Number(a[0]) - Number(b[0])).map(([ms, k]) => ({
      label: `duration-${k}`, meta: `${ms}ms`, duration: `--motion-duration-${k}`, ease: "--motion-ease-standard", copy: `var(--motion-duration-${k})`, mono: true,
    })) },
    { title: "Easing", note: "Played at 400ms so the curve is easy to see.", tiles: ([
      ["linear", "constant speed"], ["in", "accelerate · avoid for enter"], ["out", "responsive enter"], ["in-out", "on-screen morph"],
      ["standard", "default UI · ease-out"], ["emphasized", "drawer and modal"], ["spring", "subtle overshoot"], ["spring-soft", "softer overshoot · modal"],
    ] as const).map(([k, d]) => ({ label: `ease-${k}`, meta: d, duration: "--motion-duration-500", ease: `--motion-ease-${k}`, copy: `var(--motion-ease-${k})`, mono: true })) },
  ] },
];

export default function Motion() {
  return (
    <>
      <h1 className={shell.pageTitle}>Motion</h1>
      <p className={shell.pageLead}>Use semantic motion roles in components. Primitives are the source timing and easing scale.</p>
      <MotionFoundation tabs={tabs} />
    </>
  );
}
