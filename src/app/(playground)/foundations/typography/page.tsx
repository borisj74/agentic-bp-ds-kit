import shell from "@/playground/shell.module.css";
import { TypographyFoundation } from "@/playground/TypographyFoundation";

export default function Typography() {
  return (
    <>
      <h1 className={shell.pageTitle}>Typography</h1>
      <p className={shell.pageLead}>Inter for display and text, Roboto Mono for code. Primitives are the source scale. Components use the semantic text roles.</p>
      <TypographyFoundation />
    </>
  );
}
