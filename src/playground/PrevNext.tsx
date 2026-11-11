import { Link } from "@/ui/Link/Link";
import styles from "./contractDocs.module.css";
import { components, patterns, slug } from "./nav";

/** The neighbours in the catalog's own A to Z order, within the page's own group. */
export function neighbours(name: string, group: "components" | "patterns") {
  const list = (group === "components" ? components : patterns).map((c) => c.name);
  const i = list.indexOf(name);
  if (i === -1) return { prev: undefined, next: undefined };
  return { prev: list[i - 1], next: list[i + 1] };
}

export function PrevNext({ name, group }: { name: string; group: "components" | "patterns" }) {
  const { prev, next } = neighbours(name, group);
  if (!prev && !next) return null;
  return (
    <nav className={styles.prevNext} aria-label="Catalog">
      {prev && (
        <div>
          <span className={styles.prevNextLabel}>Previous</span>
          <Link href={`/${group}/${slug(prev)}`}>{prev}</Link>
        </div>
      )}
      {next && (
        <div className={styles.prevNextEnd}>
          <span className={styles.prevNextLabel}>Next</span>
          <Link href={`/${group}/${slug(next)}`}>{next}</Link>
        </div>
      )}
    </nav>
  );
}
