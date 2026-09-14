import { CardPreview } from "@/playground/CardPreview";
import { GallerySearch } from "@/playground/GallerySearch";
import { components, slug } from "@/playground/nav";
import { loadContract } from "@/playground/contracts";

export default async function Gallery() {
  const contracts = await Promise.all(components.map((c) => loadContract(slug(c.name))));
  const items = components.map((c, i) => ({
    name: c.name,
    href: `/components/${slug(c.name)}`,
    intent: contracts[i]?.intent,
    category: c.category,
    tags: c.tags,
    preview: <CardPreview name={c.name} />,
  }));
  return (
    <GallerySearch
      title="Components"
      lead="Every building block in the kit. Search by name or by what it does, then open a card for the master, variants and contract."
      items={items}
    />
  );
}
