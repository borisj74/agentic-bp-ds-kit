"use client";
import type { ReactNode } from "react";
import { Badge, type BadgeIntent } from "../Badge/Badge";
import { Breadcrumb, type BreadcrumbItem } from "../Breadcrumb/Breadcrumb";
import { Button } from "../Button/Button";
import { Dropdown, type DropdownEntry } from "../Dropdown/Dropdown";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { countSkeletonBlocks, skeletonBarWidth, useBootSkeleton } from "../LoadingLine/boot";
import { Tooltip } from "../Tooltip/Tooltip";
import { titleCase } from "../titleCase";
import styles from "./PageHeader.module.css";
import { inspect } from "../inspect";

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
  loading?: boolean;
}

export function PageHeader({
  title, breadcrumbs = [], back, icon, badge, badgeIntent = "neutral", actions, moreActions, onMoreSelect, sticky = false, shadow = true, loading = false,
}: PageHeaderProps) {
  // Kit headings read in title case, so a screen can pass its copy either way.
  const heading = titleCase(title);
  // The whole trail as one string, so a booting crumb bar is as long as the trail it stands in for.
  const trail = [...breadcrumbs.map((b) => b.label), heading].join(" / ");
  // Booting, the title row holds its own shapes: a crumb trail, the page icon if there is one, and the title.
  // The actions keep their places as plain blocks rather than going away: BP COBALT screen 56 keeps More, Cancel
  // and Submit in the title row of a form while it loads, so the row does not resettle when they arrive.
  // Inside a booting frame the title row waits its turn in the sequence; on its own it draws at once.
  const { skeleton: booting } = useBootSkeleton(loading);
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
    <header {...inspect("PageHeader")} className={[styles.header, sticky ? styles.sticky : "", sticky && shadow ? styles.shadow : ""].join(" ")}>
      {/* The header measures its own width; the bar inside is what lays out to it, so a narrow header stacks. */}
      <div className={styles.bar}>
      <div className={[styles.title, sticky ? styles.stickyTitle : ""].join(" ")}>
        {booting ? (
          // The name is still read out, so the page has a heading before anything arrives; the bars stand in
          // for what it will say.
          <>
            {/* The bars are as long as the words they stand in for, so the trail and the name arrive at the
                length their bars held. The step back keeps its own button square, not a smaller stand-in, so
                the title row does not resettle when the arrow arrives. */}
            {/* Each row keeps the line box its own words will take, and the badge its own pill, so the header
                is as tall booting as it will be and nothing under it moves when the name arrives. */}
            <span className={styles.bootCrumbs}>
              <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(trail)} height="var(--skeleton-cell)" label="" />
            </span>
            <div className={[styles.titleRow, styles.bootTitleRow].join(" ")}>
              {back && <Skeleton shape="rect" animation="pulse" width="var(--control-small)" height="var(--control-small)" label="" />}
              {icon && <Skeleton shape="rect" animation="pulse" width="var(--icon-size-large)" height="var(--icon-size-large)" label="" />}
              <h1 className={styles.srOnly}>{heading}</h1>
              <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(heading)} height="var(--font-size-large)" label="" />
              {badge && <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(badge)} height="var(--badge-height-md)" label="" />}
            </div>
          </>
        ) : sticky ? (
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
          {booting ? (
            <>
              {moreActions && moreActions.length > 0 && (
                <Skeleton shape="rect" animation="pulse" width="var(--toolbar-more-skeleton)" height="var(--control-small)" label="" />
              )}
              {Array.from({ length: countSkeletonBlocks(actions) }, (_, i) => (
                <Skeleton key={i} shape="rect" animation="pulse" width="var(--toolbar-action-skeleton)" height="var(--control-small)" label="" />
              ))}
            </>
          ) : (
            <>
              {moreActions && moreActions.length > 0 && (
                // Figma button-group: the overflow More is unbordered (minimal) and sits first.
                <Dropdown label="More" emphasis="minimal" size="sm" alignment="right" items={moreActions} onSelect={onMoreSelect} />
              )}
              {actions}
            </>
          )}
        </div>
      )}
      </div>
    </header>
  );
}
