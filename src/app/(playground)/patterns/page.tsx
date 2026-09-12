import Link from "next/link";
import shell from "@/playground/shell.module.css";
import styles from "@/playground/master.module.css";
import { PagePreview } from "@/playground/CardPreview";
import { patterns, slug } from "@/playground/nav";
import { loadContract } from "@/playground/contracts";

export default async function Patterns() {
  const contracts = await Promise.all(patterns.map((p) => loadContract(slug(p.name))));
  return (
    <>
      <h1 className={shell.pageTitle}>Patterns</h1>
      <p className={shell.pageLead}>Blueprints that compose kit pieces into screen-level layouts. Not new primitives.</p>
      {patterns.length === 0 && <p>No patterns yet.</p>}
      {/* Wider columns and taller previews than the component gallery: a blueprint has to read as a layout. */}
      <div className={[styles.grid, styles.gridWide].join(" ")}>
        {patterns.map((p, i) => (
          // The title link stretches over the whole card. The preview is inert, so its own links and buttons never nest inside the card link.
          <div key={p.name} className={styles.card}>
            <div className={[styles.cardPreview, styles.cardPreviewTall].join(" ")} inert aria-hidden="true">
              <PagePreview name={p.name} />
            </div>
            <div className={styles.cardBody}>
              <Link href={`/patterns/${slug(p.name)}`} className={styles.cardTitle}>{p.name}</Link>
              <div className={styles.cardDesc}>{contracts[i]?.intent}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
