import index from "../../contracts/index.json";

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
// Sidebar and gallery list components A to Z, whatever order the index uses.
export const components = [...index.components].sort((a, b) => a.name.localeCompare(b.name));
export const patterns = index.patterns as { name: string; contract: string }[];

// Sidebar entries: families like BarChart, LineChart and PieChart sit under one heading (Chart) with short names,
// placed where the heading falls A to Z. The gallery keeps the full names.
const FAMILIES = ["Chart"];
export type NavItem = { name: string; label: string };
export type NavEntry = NavItem | { group: string; items: NavItem[] };
export const componentNav: NavEntry[] = (() => {
  const entries: NavEntry[] = [];
  const groups = new Map<string, NavItem[]>();
  for (const c of components) {
    const family = FAMILIES.find((f) => c.name.endsWith(f) && c.name !== f);
    if (!family) { entries.push({ name: c.name, label: c.name }); continue; }
    if (!groups.has(family)) { groups.set(family, []); entries.push({ group: family, items: groups.get(family)! }); }
    groups.get(family)!.push({ name: c.name, label: c.name.slice(0, -family.length) });
  }
  const key = (e: NavEntry) => ("group" in e ? e.group : e.label);
  return entries.sort((a, b) => key(a).localeCompare(key(b)));
})();
