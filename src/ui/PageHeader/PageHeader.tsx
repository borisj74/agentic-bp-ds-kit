"use client";
import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "../Badge/Badge";
import { Breadcrumb, type BreadcrumbItem } from "../Breadcrumb/Breadcrumb";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import styles from "./PageHeader.module.css";

export interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  actions?: ReactNode;
  moreActions?: DropdownMenuEntry[];
  onMoreSelect?: (id: string) => void;
  sticky?: boolean;
  shadow?: boolean;
}

export function PageHeader({
  title, breadcrumbs = [], icon, badge, badgeTone = "neutral", actions, moreActions, onMoreSelect, sticky = false, shadow = true,
}: PageHeaderProps) {
  const hasControls = Boolean(actions) || Boolean(moreActions?.length);
  return (
    <header className={[styles.header, sticky ? styles.sticky : "", sticky && shadow ? styles.shadow : ""].join(" ")}>
      <div className={styles.title}>
        {sticky ? (
          // Sticky: one compact line. The trail ends in the page title; the heading stays for screen readers.
          <>
            <Breadcrumb items={[...breadcrumbs, { label: title }]} />
            <h1 className={styles.srOnly}>{title}</h1>
          </>
        ) : (
          <>
            {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} current={false} />}
            <div className={styles.titleRow}>
              {icon && <Icon name={icon} size="lg" tone="brand" />}
              <h1 className={styles.heading}>{title}</h1>
              {badge && <Badge tone={badgeTone}>{badge}</Badge>}
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
    </header>
  );
}
