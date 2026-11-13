import index from "../../contracts/index.json";
import startersIndex from "../../starters/index.json";

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
// Sidebar and gallery list components A to Z, whatever order the index uses.
export const components = [...index.components].sort((a, b) => a.name.localeCompare(b.name));
export const patterns = index.patterns as { name: string; contract: string }[];
// The starter screens, from starters/index.json, so the catalog never falls behind the folder. A starter is a
// page: a template filled with real-looking content. It is not a contract and has no level.
export type Starter = { id: string; template: string | null; title: string; about: string };
export const starters = startersIndex.starters as Starter[];

// Foundation pages in sidebar order. The Foundations landing page is the color page.
export const foundationPages = [
  { href: "/foundations", label: "Color" },
  { href: "/foundations/typography", label: "Typography" },
  { href: "/foundations/icons", label: "Icons" },
  { href: "/foundations/spacing", label: "Spacing" },
  { href: "/foundations/grid", label: "Grid systems" },
  { href: "/foundations/radius", label: "Radius" },
  { href: "/foundations/border", label: "Border" },
  { href: "/foundations/shadow", label: "Shadow" },
  { href: "/foundations/motion", label: "Motion" },
  { href: "/foundations/opacity", label: "Opacity" },
];

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

// The trail above every catalog page: Home, the side-nav section, then the page. A section's own page is the
// last crumb itself, so /components reads Home > Components rather than Home > Components > Components, and the
// Overview at / has no trail at all.
export type Crumb = { label: string; href?: string };
const START_PAGES: Record<string, string> = {
  "start-here": "Start here",
  installation: "Installation",
  mcp: "MCP server",
  patterns: "Using patterns",
  prompting: "Prompting",
};
const named = (list: { name: string }[], s: string) => list.find((c) => slug(c.name) === s)?.name;

export function catalogTrail(pathname: string): Crumb[] | null {
  const [section, rest] = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const home: Crumb = { label: "Home", href: "/" };
  if (!section) return null;
  if (section === "start") {
    const label = rest ? START_PAGES[rest] : undefined;
    return label ? [home, { label }] : null;
  }
  if (section === "foundations") {
    const page = rest ? foundationPages.find((f) => f.href === pathname) : undefined;
    if (!rest) return [home, { label: "Foundations" }];
    return page ? [home, { label: "Foundations", href: "/foundations" }, { label: page.label }] : null;
  }
  if (section === "components" || section === "patterns") {
    const label = section === "components" ? "Components" : "Patterns";
    if (!rest) return [home, { label }];
    const name = named(section === "components" ? components : patterns, rest);
    return name ? [home, { label, href: `/${section}` }, { label: name }] : null;
  }
  return null;
}
