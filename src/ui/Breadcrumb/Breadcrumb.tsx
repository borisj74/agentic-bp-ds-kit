import { Fragment } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Breadcrumb.module.css";

export type BreadcrumbSeparator = "slash" | "chevron";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  separator?: BreadcrumbSeparator;
  maxItems?: number;
  items: BreadcrumbItem[];
}

type Node = { kind: "ellipsis" } | { kind: "item"; item: BreadcrumbItem; index: number };

// Long trails: first crumb, an ellipsis, then the last maxItems - 1 crumbs.
function visible(items: BreadcrumbItem[], maxItems?: number): Node[] {
  const all: Node[] = items.map((item, index) => ({ kind: "item", item, index }));
  if (!maxItems || maxItems < 2 || items.length <= maxItems) return all;
  return [all[0], { kind: "ellipsis" }, ...all.slice(items.length - (maxItems - 1))];
}

export function Breadcrumb({ separator = "slash", maxItems, items }: BreadcrumbProps) {
  const nodes = visible(items, maxItems);
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb">
      <ol className={styles.list}>
        {nodes.map((node, i) => (
          <Fragment key={node.kind === "ellipsis" ? "ellipsis" : node.index}>
            {i > 0 && (
              <li className={styles.separator} aria-hidden="true">
                {separator === "slash" ? "/" : <Icon name="chevron_right" size="sm" />}
              </li>
            )}
            {node.kind === "ellipsis" ? (
              <li className={styles.separator} aria-hidden="true"><Icon name="more_horiz" size="sm" /></li>
            ) : (
              <li className={styles.item}>
                {node.index === last ? (
                  <span className={styles.current} aria-current="page">{node.item.label}</span>
                ) : node.item.onClick ? (
                  <button type="button" className={styles.link} onClick={node.item.onClick}>{node.item.label}</button>
                ) : node.item.href ? (
                  <a className={styles.link} href={node.item.href}>{node.item.label}</a>
                ) : (
                  <span className={styles.crumb}>{node.item.label}</span>
                )}
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
