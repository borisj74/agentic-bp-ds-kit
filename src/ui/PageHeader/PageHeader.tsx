"use client";
import type { ReactNode } from "react";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import { Breadcrumb, type BreadcrumbItem } from "../Breadcrumb/Breadcrumb";
import { Button } from "../Button/Button";
import { Dropdown, type DropdownEntry } from "../Dropdown/Dropdown";
import { Icon } from "../Icon/Icon";
import { Tooltip } from "../Tooltip/Tooltip";
import { titleCase } from "../titleCase";
import styles from "./PageHeader.module.css";

export interface PageHeaderBack {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  back?: PageHeaderBack;
  icon?: string;
  badge?: string;
  badgeIntent?: BadgeIntent;
  actions?: ReactNode;
  moreActions?: DropdownEntry[];
  onMoreSelect?: (id: string) => void;
  sticky?: boolean;
  shadow?: boolean;
}

export function PageHeader({
  title, breadcrumbs = [], back, icon, badge, badgeIntent = "neutral", actions, moreActions, onMoreSelect, sticky = false, shadow = true,
}: PageHeaderProps) {
  // Kit headings read in title case, so a screen can pass its copy either way.
  const heading = titleCase(title);
  const hasControls = Boolean(actions) || Boolean(moreActions?.length);
  // back is a shortcut to where the page was opened from, so a screen can pass the route (href), its own
  // handler (onClick), or neither and get the browser's own step back. The label is the button's name and
  // its tooltip, so it says where it goes rather than just "Back".
  const backButton = back ? (
    <Tooltip content={back.label}>
      <Button
        className={styles.back}
        emphasis="minimal"
        size="sm"
        iconOnly
        iconStart="arrow_back"
        iconSize="md"
        onClick={() => {
          if (back.onClick) back.onClick();
          else if (back.href) window.location.assign(back.href);
          else window.history.back();
        }}
      >
        {back.label}
      </Button>
    </Tooltip>
  ) : null;
  return (
    <header className={[styles.header, sticky ? styles.sticky : "", sticky && shadow ? styles.shadow : ""].join(" ")}>
      {/* The header measures its own width; the bar inside is what lays out to it, so a narrow header stacks. */}
      <div className={styles.bar}>
      <div className={[styles.title, sticky ? styles.stickyTitle : ""].join(" ")}>
        {sticky ? (
          // Sticky: one compact line. The trail ends in the page title; the heading stays for screen readers.
          // There is no title row to sit in, so back leads the bar.
          <>
            {backButton}
            <Breadcrumb items={[...breadcrumbs, { label: heading }]} />
            <h1 className={styles.srOnly}>{heading}</h1>
          </>
        ) : (
          <>
            {/* The trail is Home, the section, then this page: the title closes it as the current crumb. */}
            {breadcrumbs.length > 0 && <Breadcrumb items={[...breadcrumbs, { label: heading }]} />}
            <div className={styles.titleRow}>
              {backButton}
              {icon && <Icon name={icon} size="lg" intent="brand" />}
              <h1 className={styles.heading}>{heading}</h1>
              {badge && <Badge intent={badgeIntent}>{badge}</Badge>}
            </div>
          </>
        )}
      </div>
      {hasControls && (
        // Figma order: More (overflow) first, then the actions with the one strong brand Button last.
        <div className={styles.controls}>
          {moreActions && moreActions.length > 0 && (
            // Figma button-group: the overflow More is unbordered (minimal) and sits first.
            <Dropdown label="More" emphasis="minimal" size="sm" alignment="right" items={moreActions} onSelect={onMoreSelect} />
          )}
          {actions}
        </div>
      )}
      </div>
    </header>
  );
}
