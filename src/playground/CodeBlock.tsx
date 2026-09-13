"use client";
import { Button } from "@/ui/Button/Button";
import docs from "./docs.module.css";
import styles from "./master.module.css";
import { useCopy } from "./useCopy";

// A copyable block for the commands and sample prompts on the Start pages: the same look as the code under a
// component. wrap lets a long prompt break onto more lines instead of scrolling sideways.
export function CodeBlock({ code, wrap = false }: { code: string; wrap?: boolean }) {
  const c = useCopy();
  const done = c.copied === "code";
  return (
    <div className={styles.codeWrap}>
      <pre className={[styles.code, wrap ? docs.wrap : ""].join(" ")} tabIndex={wrap ? undefined : 0} role={wrap ? undefined : "region"} aria-label={wrap ? undefined : "Code"}>{code}</pre>
      <span className={styles.copy}>
        <Button size="sm" variant="secondary" iconStart={done ? "check" : "content_copy"} onClick={() => c.copy("code", code)}>
          {done ? "Copied" : "Copy"}
        </Button>
      </span>
    </div>
  );
}
