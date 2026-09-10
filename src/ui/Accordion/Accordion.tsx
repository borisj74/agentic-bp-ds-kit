"use client";
import { useId, useState, type ReactNode } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Accordion.module.css";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
}

export function Accordion({ items, defaultOpen }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);
  const base = useId();
  return (
    <div className={styles.root}>
      {items.map((item) => {
        const open = openId === item.id;
        const buttonId = `${base}-button-${item.id}`;
        const panelId = `${base}-panel-${item.id}`;
        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              id={buttonId}
              className={styles.trigger}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
            >
              <span className={styles.title}>{item.title}</span>
              <span className={[styles.chevron, open ? styles.chevronOpen : ""].join(" ")}>
                <Icon name="expand_more" tone="subtle" />
              </span>
            </button>
            <div id={panelId} role="region" aria-labelledby={buttonId} className={styles.panel} hidden={!open}>
              <div className={styles.body}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
