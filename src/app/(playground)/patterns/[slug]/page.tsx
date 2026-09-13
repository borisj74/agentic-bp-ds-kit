import { notFound } from "next/navigation";
import shell from "@/playground/shell.module.css";
import { Master } from "@/playground/Master";
import { loadContract } from "@/playground/contracts";
import { patterns, slug } from "@/playground/nav";

export function generateStaticParams() {
  return patterns.map((p) => ({ slug: slug(p.name) }));
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: s } = await params;
  const contract = await loadContract(s, "patterns");
  if (!contract) notFound();
  return (
    <>
      <h1 className={shell.pageTitle}>{contract.name}</h1>
      <p className={shell.pageLead}>{contract.intent}</p>
      <Master contract={contract} />
    </>
  );
}
