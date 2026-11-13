import { notFound } from "next/navigation";
import shell from "@/playground/shell.module.css";
import { Badge } from "@/ui/Badge/Badge";
import { Master } from "@/playground/Master";
import { PrevNext } from "@/playground/PrevNext";
import { loadContract } from "@/playground/contracts";
import { components, slug } from "@/playground/nav";

export function generateStaticParams() {
  return components.map((c) => ({ slug: slug(c.name) }));
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: s } = await params;
  const contract = await loadContract(s, "components");
  if (!contract) notFound();
  return (
    <>
      <div className={shell.pageTitleRow}>
        <h1 className={shell.pageTitle}>{contract.name}</h1>
        {/* The level from the contract: Atom, Molecule, Organism or Template. */}
        {contract.level ? <Badge>{contract.level.charAt(0).toUpperCase() + contract.level.slice(1)}</Badge> : null}
      </div>
      <p className={shell.pageLead}>{contract.intent}</p>
      <Master contract={contract} />
      <PrevNext name={contract.name} group="components" />
    </>
  );
}
