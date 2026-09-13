"use client";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Count } from "../Count/Count";
import { Icon } from "../Icon/Icon";
import styles from "./Tabs.module.css";

export type TabsSize = "sm" | "md" | "lg";
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  countLabel?: string;
  disabled?: boolean;
  content?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  size?: TabsSize;
  expand?: boolean;
  border?: boolean;
}

export function Tabs({ items, label = "Tabs", value, defaultValue, onChange, size = "sm", expand = false, border = true }: TabsProps) {
  const base = useId();
  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = (id: string) => `${base}-panel-${id}`;
  const enabled = items.filter((i) => !i.disabled);
  const [inner, setInner] = useState(defaultValue ?? enabled[0]?.id ?? "");
  const selected = value ?? inner;
  const active = enabled.find((i) => i.id === selected) ?? enabled[0];
  const hasPanels = items.some((i) => i.content !== undefined && i.content !== null);

  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };

  // Arrow keys move and select (selection follows focus); Home and End jump to the ends. Disabled tabs are skipped.
  const onKeyDown = (e: KeyboardEvent) => {
    const at = enabled.findIndex((i) => i.id === active?.id);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    const next = step ? enabled[(at + step + enabled.length) % enabled.length] : e.key === "Home" ? enabled[0] : e.key === "End" ? enabled[enabled.length - 1] : undefined;
    if (!next) return;
    e.preventDefault();
    select(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <div className={styles.tabs}>
      <div
        role="tablist" aria-label={label} onKeyDown={onKeyDown}
        className={[styles.list, styles[size], expand ? styles.expand : "", border ? styles.border : ""].join(" ")}
      >
        {items.map((item) => {
          const on = item.id === active?.id;
          return (
            <button
              key={item.id} id={tabId(item.id)} type="button" role="tab" aria-selected={on}
              aria-controls={hasPanels && on ? panelId(item.id) : undefined} tabIndex={on ? 0 : -1} disabled={item.disabled}
              className={[styles.tab, on ? styles.on : ""].join(" ")} onClick={() => select(item.id)}
            >
              {item.icon && <Icon name={item.icon} size={size === "lg" ? "lg" : "md"} />}
              <span className={styles.text}>{item.label}</span>
              {item.count !== undefined && (
                <Count count={item.count} size={size === "sm" ? "sm" : "md"} disabled={item.disabled} label={item.countLabel} />
              )}
            </button>
          );
        })}
      </div>
      {hasPanels && active && (
        <div id={panelId(active.id)} role="tabpanel" aria-labelledby={tabId(active.id)} tabIndex={0} className={styles.panel}>
          {active.content}
        </div>
      )}
    </div>
  );
}
