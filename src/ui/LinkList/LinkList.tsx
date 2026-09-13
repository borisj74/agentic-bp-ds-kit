import { Icon } from "../Icon/Icon";
import styles from "./LinkList.module.css";

export interface LinkListItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: string;
  description?: string;
  external?: boolean;
}

export interface LinkListProps {
  items: LinkListItem[];
  label?: string;
}

// Figma account quick links (Account Provisioning 76:5802): one link a row with a chevron at the end, in the link
// colours. It sits in a Section, which gives it its title; it draws no card of its own.
export function LinkList({ items, label = "Links" }: LinkListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => {
        const body = (
          <>
            {item.icon && <Icon name={item.icon} size="md" className={styles.lead} />}
            <span className={styles.text}>
              <span className={styles.label}>{item.label}</span>
              {item.description && <span className={styles.description}>{item.description}</span>}
            </span>
            <Icon name={item.external ? "open_in_new" : "chevron_right"} size="md" className={styles.end} />
            {item.external && <span className={styles.srOnly}> (opens in a new tab)</span>}
          </>
        );
        return (
          <li key={item.id} className={styles.item}>
            {item.href ? (
              <a
                className={styles.row} href={item.href} onClick={item.onClick}
                target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}
              >
                {body}
              </a>
            ) : (
              <button type="button" className={[styles.row, styles.button].join(" ")} onClick={item.onClick}>{body}</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
