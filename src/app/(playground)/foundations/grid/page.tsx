import shell from "@/playground/shell.module.css";
import { GridFoundation } from "@/playground/GridFoundation";

export default function GridSystems() {
  return (
    <>
      <h1 className={shell.pageTitle}>Grid systems</h1>
      <p className={shell.pageMeta}>Viewport widths 1280, 1440 and 1920 are the base widths. Gutters and margins use the spacing steps. The rest is kit-defined.</p>
      <p className={shell.pageLead}>Product layout patterns first: app shell, canvas, workspace, metrics, and content splits. Primitives stay available as the source scale.</p>
      <GridFoundation />
    </>
  );
}
