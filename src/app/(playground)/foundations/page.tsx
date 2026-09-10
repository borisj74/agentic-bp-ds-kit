import shell from "@/playground/shell.module.css";
import { loadColorTokens } from "@/playground/tokens";
import { ColorFoundation } from "@/playground/ColorFoundation";

export default function Color() {
  const data = loadColorTokens(0);
  return (
    <>
      <h1 className={shell.pageTitle}>Color</h1>
      <p className={shell.pageLead}>Start with the palette, map it through the scheme layer, then give it meaning with semantic roles. Hex values shown for the Cobalt brand.</p>
      <ColorFoundation {...data} />
    </>
  );
}
