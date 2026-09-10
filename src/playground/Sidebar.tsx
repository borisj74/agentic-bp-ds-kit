"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "@/ui/Icon/Icon";
import styles from "./shell.module.css";
import { components, patterns, slug } from "./nav";

type SectionKey = "start" | "foundations" | "components" | "patterns";

// Which section holds a route, so it can open when you land there.
const sectionOf = (path: string): SectionKey =>
  path.startsWith("/foundations") ? "foundations" : path.startsWith("/components") ? "components" : path.startsWith("/patterns") ? "patterns" : "start";

function NavLink({ href, children, sub }: { href: string; children: React.ReactNode; sub?: boolean }) {
  const path = usePathname();
  const active = path === href;
  return (
    <Link href={href} className={[styles.link, active ? styles.linkActive : "", sub ? styles.sub : ""].join(" ")} aria-current={active ? "page" : undefined}>
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
      </Section>
      <Section title="Foundations" open={open.foundations} onToggle={toggle("foundations")}>
        <NavLink href="/foundations">Color</NavLink>
        <NavLink href="/foundations/typography">Typography</NavLink>
        <NavLink href="/foundations/icons">Icons</NavLink>
        <NavLink href="/foundations/spacing">Spacing</NavLink>
        <NavLink href="/foundations/grid">Grid systems</NavLink>
        <NavLink href="/foundations/radius">Radius</NavLink>
        <NavLink href="/foundations/border">Border</NavLink>
        <NavLink href="/foundations/shadow">Shadow</NavLink>
        <NavLink href="/foundations/motion">Motion</NavLink>
        <NavLink href="/foundations/opacity">Opacity</NavLink>
      </Section>
      <Section title="Components" open={open.components} onToggle={toggle("components")}>
        <NavLink href="/components">Gallery</NavLink>
        {components.map((c) => (
          <NavLink key={c.name} href={`/components/${slug(c.name)}`} sub>{c.name}</NavLink>
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
