import { Sidebar } from "@/playground/Sidebar";
import { ThemeControls } from "@/playground/ThemeControls";
import styles from "@/playground/shell.module.css";

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Agentic BP DS</span>
          <span className={styles.brandTag}>code-only design system</span>
        </div>
        <div className={styles.topbarRight}><ThemeControls /></div>
      </header>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
