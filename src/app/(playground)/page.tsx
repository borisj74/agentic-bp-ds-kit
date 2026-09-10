import styles from "@/playground/shell.module.css";
import { components, patterns } from "@/playground/nav";

export default function Home() {
  return (
    <>
      <h1 className={styles.pageTitle}>Agentic BP DS</h1>
      <p className={styles.pageLead}>
        Code-only design system. Tokens, contracts and React components in one place so agents can prototype real product screens from it.
      </p>
      <p>{components.length} components · {patterns.length} patterns</p>
      <ol>
        <li>Search <code>contracts/index.json</code>.</li>
        <li>Open only the matching contracts.</li>
        <li>Compose kit pieces. Match closed enums.</li>
        <li>If something is missing, stop and ask.</li>
      </ol>
    </>
  );
}
