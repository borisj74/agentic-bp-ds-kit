"use client";
// The catalog's ⌘K palette: the kit GlobalSearch inside a kit Modal, over every page the sidebar links to.
// Nothing here is a new piece — the catalog is a screen like any other, so it composes what the kit already has.
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { GlobalSearch } from "@/ui/GlobalSearch/GlobalSearch";
import { Modal } from "@/ui/Modal/Modal";
import { componentNav, foundationPages, patterns, slug } from "./nav";

// The id of a row is the page it goes to, so picking one is a navigation and nothing has to be looked up.
const group = (heading: string, icon: string, items: { href: string; label: string; description?: string }[]) => ({
  heading,
  items: items.map((i) => ({ id: i.href, label: i.label, description: i.description, icon })),
});

export function CatalogSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  const groups = useMemo(() => [
    group("Start", "rocket_launch", [
      { href: "/", label: "Overview" },
      { href: "/start/installation", label: "Installation" },
      { href: "/start/mcp", label: "MCP server" },
      { href: "/start/patterns", label: "Using patterns" },
      { href: "/start/prompting", label: "Prompting" },
    ]),
    group("Foundations", "layers", foundationPages.map((f) => ({ href: f.href, label: f.label }))),
    group("Components", "widgets", [
      { href: "/components", label: "Gallery", description: "Every component, with a preview each" },
      // A component in a family (Chart) carries the family in its name, so "chart" finds Bar as well as Line.
      ...componentNav.flatMap((e) => ("group" in e
        ? e.items.map((c) => ({ href: `/components/${slug(c.name)}`, label: `${c.label} ${e.group}` }))
        : [{ href: `/components/${slug(e.name)}`, label: e.label }])),
    ]),
    group("Patterns", "dashboard", [
      { href: "/patterns", label: "All patterns" },
      ...patterns.map((p) => ({ href: `/patterns/${slug(p.name)}`, label: p.name })),
    ]),
  ], []);

  // The palette keeps no state of its own: closing throws the component away, so the next ⌘K opens it empty.
  useEffect(() => {
    if (!open) return;
    router.prefetch("/components");
  }, [open, router]);

  if (!open) return null;

  return (
    <Modal open title="Search" size="md" onClose={onClose}>
      <GlobalSearch
        groups={groups}
        label="Search the catalog"
        placeholder="Components, patterns, foundations"
        empty="Nothing in the catalog matches this search."
        autoFocus
        onSelect={(href) => { onClose(); router.push(href); }}
      />
    </Modal>
  );
}
