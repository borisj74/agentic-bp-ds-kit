import shell from "@/playground/shell.module.css";
import { ScaleFoundation, type ScaleTab } from "@/playground/ScaleFoundation";

const ref = [[0, 0], [50, 1], [100, 2], [200, 4], [300, 8], [400, 12], [500, 16], [600, 20], [700, 24], [800, 28], [900, 32], [1000, 36], [1100, 40], [1200, 44], [1300, 48]] as const;
const named = [["xxxsmall", 2], ["xxsmall", 4], ["xsmall", 8], ["small", 12], ["medium", 16], ["large", 20], ["xlarge", 24], ["xxlarge", 28]] as const;

const tabs: ScaleTab[] = [
  { key: "primitives", label: "Primitives", sections: [
    { title: "Scale", prefix: "--ref-space-0 → 1300", rows: ref.map(([k, px]) => ({ token: `ref-space-${k}`, value: `${px}px` })) },
  ] },
  { key: "semantics", label: "Semantics", sections: [
    { title: "Space", prefix: "--space-*", note: "Use for padding, gaps and stacks. Density modes remap these values.", rows: named.map(([k, px]) => ({ token: `space-${k}`, value: `${px}px` })) },
  ] },
];

export default function Spacing() {
  return (
    <>
      <h1 className={shell.pageTitle}>Spacing</h1>
      <p className={shell.pageLead}>Primitives are the source scale. Components use the named spacing roles.</p>
      <ScaleFoundation tabs={tabs} visual="bar" />
    </>
  );
}
