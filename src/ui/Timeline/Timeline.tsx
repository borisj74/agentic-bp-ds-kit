import { Button } from "../Button/Button";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
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
  menu?: DropdownMenuEntry[];
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
                <DropdownMenu
                  label={`Actions for ${item.title}`} items={item.menu} iconOnly icon="more_horiz" variant="tertiary"
                  size={size === "sm" ? "sm" : "md"} align="end" onSelect={(id) => onMenuSelect?.(item.id, id)}
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
