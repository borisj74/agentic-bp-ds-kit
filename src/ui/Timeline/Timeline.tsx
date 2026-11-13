import { Button } from "../Button/Button";
import { Dropdown, type DropdownEntry } from "../Dropdown/Dropdown";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { BOOT_ROWS_MAX, skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import styles from "./Timeline.module.css";

export type TimelineSize = "sm" | "md";
export type TimelineIntent = "neutral" | "brand" | "success" | "warning" | "danger";

export interface TimelineLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface TimelineAction {
  label: string;
  onClick?: () => void;
}

export interface TimelineItem {
  id: string;
  title: string;
  timestamp?: string;
  subtitle?: string;
  icon?: string;
  intent?: TimelineIntent;
  notes?: string;
  links?: TimelineLink[];
  action?: TimelineAction;
  menu?: DropdownEntry[];
}

export interface TimelineProps {
  items: TimelineItem[];
  size?: TimelineSize;
  label?: string;
  onMenuSelect?: (itemId: string, actionId: string) => void;
}

// Figma activity list 21290:7737: a circled icon per entry, joined by a line down its middle, with the
// activity beside it and its notes, links and action under it.
export function Timeline({ items, size = "md", label = "Activity", onMenuSelect }: TimelineProps) {
  // A timeline in a booting page draws its own thread: the rail and a round block where each entry's icon will
  // be, with a bar for every line the entry carries, so the activity lands where its bars stood.
  const booting = useFieldSkeleton();
  if (booting) {
    // Each line keeps the line box its own words will take, so an entry is as tall booting as it will be and
    // nothing under the timeline moves when the activity arrives.
    // At most a screenful of entries, however long the thread is: the rest would animate below the fold.
    const bootItems = items.slice(0, BOOT_ROWS_MAX);
    const bar = (text: string, height: string, line?: string) => (
      <span className={styles.bootLine} style={line ? { minHeight: line } : undefined}>
        <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(text)} height={height} label="" />
      </span>
    );
    return (
      <ol className={[styles.timeline, styles[size]].join(" ")} aria-hidden="true">
        {bootItems.map((item, i) => {
          const first = i === 0;
          const last = i === bootItems.length - 1;
          const detail = Boolean(item.notes || item.links?.length || item.action);
          return (
            <li key={item.id} className={styles.item}>
              <span className={[styles.rail, first ? styles.first : "", last ? styles.last : ""].join(" ")} aria-hidden="true">
                <span className={styles.line} />
                {/* The node keeps its own circle, so the thread reads and the entries stay where they will be. */}
                <Skeleton shape="circle" animation="pulse" width="var(--node)" label="" />
                <span className={styles.line} />
              </span>
              <div className={styles.head}>
                <div className={styles.heading}>
                  {item.timestamp && bar(item.timestamp, "var(--font-size-xsmall)", "calc(var(--font-size-xsmall) * var(--line-height-normal))")}
                  {bar(item.title, "var(--skeleton-row-bar)", "calc(var(--font-size-regular) * var(--line-height-snug))")}
                  {item.subtitle && bar(item.subtitle, "var(--skeleton-cell)", "calc(var(--font-size-small) * var(--line-height-normal))")}
                </div>
                {item.menu && item.menu.length > 0 && (
                  <Skeleton shape="rect" animation="pulse" width="var(--control-small)" height="var(--control-small)" label="" />
                )}
              </div>
              {detail && (
                <>
                  <span className={[styles.under, last ? styles.last : ""].join(" ")} aria-hidden="true" />
                  <div className={styles.detail}>
                    {item.notes && bar(item.notes, "var(--skeleton-cell)", "calc(var(--font-size-small) * var(--line-height-normal))")}
                    {item.links?.map((link) => (
                      <Skeleton key={link.label} shape="rect" animation="pulse" width={skeletonBarWidth(link.label)} height="var(--skeleton-cell)" label="" />
                    ))}
                    {item.action && (
                      <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(item.action.label)} height="var(--control-medium)" label="" />
                    )}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol className={[styles.timeline, styles[size]].join(" ")} aria-label={label}>
      {items.map((item, i) => {
        const first = i === 0;
        const last = i === items.length - 1;
        const detail = Boolean(item.notes || item.links?.length || item.action);
        return (
          <li key={item.id} className={styles.item}>
            <span className={[styles.rail, first ? styles.first : "", last ? styles.last : ""].join(" ")} aria-hidden="true">
              <span className={styles.line} />
              <span className={[styles.node, styles[item.intent ?? "neutral"]].join(" ")}>
                <Icon name={item.icon ?? "history"} size={size === "sm" ? "sm" : "md"} />
              </span>
              <span className={styles.line} />
            </span>
            <div className={styles.head}>
              <div className={styles.heading}>
                {item.timestamp && <span className={styles.time}>{item.timestamp}</span>}
                <p className={styles.title}>{item.title}</p>
                {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
              </div>
              {item.menu && item.menu.length > 0 && (
                <Dropdown
                  label={`Actions for ${item.title}`} items={item.menu} iconOnly icon="more_horiz" emphasis="minimal"
                  size={size === "sm" ? "sm" : "md"} alignment="right" onSelect={(id) => onMenuSelect?.(item.id, id)}
                />
              )}
            </div>
            {detail && (
              <>
                {/* The line carries on past the head, beside the notes, but stops at the last entry. */}
                <span className={[styles.under, last ? styles.last : ""].join(" ")} aria-hidden="true" />
                <div className={styles.detail}>
                  {item.notes && <p className={styles.notes}>{item.notes}</p>}
                  {item.links && item.links.length > 0 && (
                    <div className={styles.links}>
                      {item.links.map((link) =>
                        link.href ? (
                          <a key={link.label} className={styles.link} href={link.href} onClick={link.onClick}>{link.label}</a>
                        ) : (
                          <button key={link.label} type="button" className={[styles.link, styles.linkButton].join(" ")} onClick={link.onClick}>{link.label}</button>
                        ),
                      )}
                    </div>
                  )}
                  {item.action && (
                    <span className={styles.action}>
                      <Button size={size === "sm" ? "sm" : "md"} onClick={item.action.onClick}>{item.action.label}</Button>
                    </span>
                  )}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
