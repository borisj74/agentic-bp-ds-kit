import Link from "next/link";
import shell from "@/playground/shell.module.css";
import styles from "@/playground/master.module.css";
import { registry } from "@/playground/registry";
import { components, slug } from "@/playground/nav";
import { loadContract } from "@/playground/contracts";

export default async function Gallery() {
  const contracts = await Promise.all(components.map((c) => loadContract(slug(c.name))));
  return (
    <>
      <h1 className={shell.pageTitle}>Components</h1>
      <p className={shell.pageLead}>Every building block in the kit. Open a card for the master, variants and contract.</p>
      <div className={styles.grid}>
        {components.map((c, i) => (
          // The title link stretches over the whole card. The preview is inert, so its own links and buttons never nest inside the card link.
          <div key={c.name} className={styles.card}>
            <div className={styles.cardPreview} inert aria-hidden="true">{registry[c.name]?.card}</div>
            <div className={styles.cardBody}>
              <Link href={`/components/${slug(c.name)}`} className={styles.cardTitle}>{c.name}</Link>
              <div className={styles.cardDesc}>{contracts[i]?.intent}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
