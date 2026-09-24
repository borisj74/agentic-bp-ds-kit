"use client";
import type { ReactNode } from "react";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import { Breadcrumb, type BreadcrumbItem } from "../Breadcrumb/Breadcrumb";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import { titleCase } from "../titleCase";
import styles from "./PageHeader.module.css";

export interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: string;
  badge?: string;
  badgeIntent?: BadgeIntent;
  actions?: ReactNode;
  moreActions?: DropdownMenuEntry[];
  onMoreSelect?: (id: string) => void;
  sticky?: boolean;
  shadow?: boolean;
}

export function PageHeader({
  title, breadcrumbs = [], icon, badge, badgeIntent = "neutral", actions, moreActions, onMoreSelect, sticky = false, shadow = true,
}: PageHeaderProps) {
  // Kit headings read in title case, so a screen can pass its copy either way.
  const heading = titleCase(title);
  const hasControls = Boolean(actions) || Boolean(moreActions?.length);
  return (
    <header className={[styles.header, sticky ? styles.sticky : "", sticky && shadow ? styles.shadow : ""].join(" ")}>
      {/* The header measures its own width; the bar inside is what lays out to it, so a narrow header stacks. */}
      <div className={styles.bar}>
      <div className={styles.title}>
        {sticky ? (
          // Sticky: one compact line. The trail ends in the page title; the heading stays for screen readers.
          <>
            <Breadcrumb items={[...breadcrumbs, { label: heading }]} />
            <h1 className={styles.srOnly}>{heading}</h1>
          </>
        ) : (
          <>
            {/* The trail is Home, the section, then this page: the title closes it as the current crumb. */}
            {breadcrumbs.length > 0 && <Breadcrumb items={[...breadcrumbs, { label: heading }]} />}
            <div className={styles.titleRow}>
              {icon && <Icon name={icon} size="lg" intent="brand" />}
              <h1 className={styles.heading}>{heading}</h1>
              {badge && <Badge intent={badgeIntent}>{badge}</Badge>}
            </div>
          </>
        )}
      </div>
      {hasControls && (
        // Figma order: More (overflow) first, then the actions with the one primary last.
        <div className={styles.controls}>
          {moreActions && moreActions.length > 0 && (
            // Figma button-group: the overflow More is unbordered (tertiary) and sits first.
            <DropdownMenu label="More" variant="tertiary" size="sm" align="end" items={moreActions} onSelect={onMoreSelect} />
          )}
          {actions}
        </div>
      )}
      </div>
    </header>
  );
}
