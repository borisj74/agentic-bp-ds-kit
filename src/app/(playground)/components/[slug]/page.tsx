import { notFound } from "next/navigation";
import shell from "@/playground/shell.module.css";
import { Master } from "@/playground/Master";
import { loadContract } from "@/playground/contracts";
import { components, slug } from "@/playground/nav";

export function generateStaticParams() {
  return components.map((c) => ({ slug: slug(c.name) }));
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: s } = await params;
  const contract = await loadContract(s);
  if (!contract) notFound();
  return (
    <>
      <h1 className={shell.pageTitle}>{contract.name}</h1>
      <p className={shell.pageLead}>{contract.intent}</p>
      <Master contract={contract} />
    </>
  );
}
