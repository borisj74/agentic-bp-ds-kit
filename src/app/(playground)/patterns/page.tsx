import shell from "@/playground/shell.module.css";
import { patterns } from "@/playground/nav";

export default function Patterns() {
  return (
    <>
      <h1 className={shell.pageTitle}>Patterns</h1>
      <p className={shell.pageLead}>Blueprints that compose kit pieces into screen-level layouts. Not new primitives.</p>
      {patterns.length === 0 && <p>No patterns yet.</p>}
    </>
  );
}
