import { Icon } from "../Icon/Icon";
import { Progress, type ProgressIntent } from "../Progress/Progress";
import styles from "./UsageList.module.css";

export interface UsageListItem {
  id: string;
  label: string;
  used: number;
  limit: number;
  unit?: string;
  note?: string;
}

export interface UsageListProps {
  items: UsageListItem[];
  label?: string;
}

// A row turns amber once 80% of its limit is used and red once all of it is.
const WARN_AT = 80;
const FULL_AT = 100;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function stateOf(used: number, limit: number) {
  const pct = limit > 0 ? (used / limit) * 100 : used > 0 ? FULL_AT : 0;
  if (pct >= FULL_AT) return { pct, intent: "danger" as ProgressIntent, icon: "error", text: "Limit reached" };
  if (pct >= WARN_AT) return { pct, intent: "warning" as ProgressIntent, icon: "warning", text: "Almost at limit" };
  return { pct, intent: undefined, icon: undefined, text: undefined };
}

// One limit a row: its name and used of limit on one line, a kit Progress bar under them, then an optional note.
// It sits in a Section or Card, which gives it its title; it draws no box of its own.
export function UsageList({ items, label = "Usage" }: UsageListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => {
        const { pct, intent, icon, text } = stateOf(item.used, item.limit);
        const count = `${number.format(item.used)} of ${number.format(item.limit)}${item.unit ? ` ${item.unit}` : ""}`;
        return (
          <li key={item.id} className={styles.item}>
            <div className={styles.head}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.count}>
                {icon && <Icon name={icon} size="sm" intent={intent} filled />}
                {count}
                {text && <span className={styles.srOnly}>, {text}</span>}
              </span>
            </div>
            <Progress value={pct} intent={intent} label={`${item.label}: ${count} used${text ? `, ${text}` : ""}`} />
            {item.note && <p className={styles.note}>{item.note}</p>}
          </li>
        );
      })}
    </ul>
  );
}
