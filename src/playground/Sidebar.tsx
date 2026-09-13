"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "@/ui/Icon/Icon";
import styles from "./shell.module.css";
import { componentNav, foundationPages, patterns, slug } from "./nav";

type SectionKey = "start" | "foundations" | "components" | "patterns";

// Which section holds a route, so it can open when you land there.
const sectionOf = (path: string): SectionKey =>
  path.startsWith("/foundations") ? "foundations" : path.startsWith("/components") ? "components" : path.startsWith("/patterns") ? "patterns" : "start";

function NavLink({ href, children, sub, deep }: { href: string; children: React.ReactNode; sub?: boolean; deep?: boolean }) {
  const path = usePathname();
  const active = path === href;
  return (
    <Link href={href} className={[styles.link, active ? styles.linkActive : "", sub ? styles.sub : "", deep ? styles.deep : ""].join(" ")} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className={styles.group}>
      <h2 className={styles.groupTitle}>
        <button type="button" className={styles.groupToggle} aria-expanded={open} aria-controls={id} onClick={onToggle}>
          {title}
          <Icon name="expand_more" size="sm" className={[styles.chevron, open ? styles.chevronOpen : ""].join(" ")} />
        </button>
      </h2>
      <div id={id} className={styles.groupList} hidden={!open}>{children}</div>
    </div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({ start: true, foundations: true, components: true, patterns: true });
  // On navigation, open the section that holds the new page (adjusting state during render, no effect).
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    const key = sectionOf(path);
    if (!open[key]) setOpen({ ...open, [key]: true });
  }
  const toggle = (key: SectionKey) => () => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <nav className={styles.sidebar} aria-label="Catalog">
      <Section title="Start" open={open.start} onToggle={toggle("start")}>
        <NavLink href="/">Overview</NavLink>
        <NavLink href="/start/installation">Installation</NavLink>
        <NavLink href="/start/patterns">Using patterns</NavLink>
        <NavLink href="/start/prompting">Prompting</NavLink>
      </Section>
      <Section title="Foundations" open={open.foundations} onToggle={toggle("foundations")}>
        {foundationPages.map((f) => <NavLink key={f.href} href={f.href}>{f.label}</NavLink>)}
      </Section>
      <Section title="Components" open={open.components} onToggle={toggle("components")}>
        <NavLink href="/components">Gallery</NavLink>
        {componentNav.map((e) => "group" in e ? (
          // A family heading (Chart) with its members indented under it.
          <div key={e.group} className={styles.family} role="group" aria-label={e.group}>
            <span className={[styles.link, styles.sub, styles.familyTitle].join(" ")} aria-hidden="true">{e.group}</span>
            {e.items.map((c) => <NavLink key={c.name} href={`/components/${slug(c.name)}`} deep>{c.label}</NavLink>)}
          </div>
        ) : (
          <NavLink key={e.name} href={`/components/${slug(e.name)}`} sub>{e.label}</NavLink>
        ))}
      </Section>
      <Section title="Patterns" open={open.patterns} onToggle={toggle("patterns")}>
        <NavLink href="/patterns">All patterns</NavLink>
        {patterns.map((p) => (
          <NavLink key={p.name} href={`/patterns/${slug(p.name)}`} sub>{p.name}</NavLink>
        ))}
      </Section>
    </nav>
  );
}
