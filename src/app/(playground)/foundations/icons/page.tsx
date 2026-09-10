import shell from "@/playground/shell.module.css";
import { IconsFoundation } from "@/playground/IconsFoundation";

export default function Icons() {
  return (
    <>
      <h1 className={shell.pageTitle}>Icons</h1>
      <p className={shell.pageMeta}>Interface icons provided by <a href="https://fonts.google.com/icons?icon.style=Outlined" target="_blank" rel="noreferrer">Google Material Symbols</a>, Outlined style.</p>
      <p className={shell.pageLead}>One consistent outline set with semantic icon colors and accessible labels.</p>
      <IconsFoundation />
    </>
  );
}
