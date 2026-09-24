"use client";
import { useState, type ReactNode } from "react";
import { Avatar } from "../Avatar/Avatar";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import { LogoAI } from "../LogoAI/LogoAI";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./ChatMessage.module.css";

export type ChatMessageAuthor = "user" | "assistant";
export type ChatMessageActionId = "copy" | "up" | "down" | "share" | "speak";

export interface ChatMessageSection {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
  defaultOpen?: boolean;
}

export interface ChatSuggestion {
  id: string;
  label: string;
}

export interface ChatMessagePerson {
  name?: string;
  src?: string;
  initials?: string;
}

export interface ChatMessageProps {
  author: ChatMessageAuthor;
  text?: string;
  children?: ReactNode;
  bubble?: boolean;
  status?: string;
  sections?: ChatMessageSection[];
  actions?: ChatMessageActionId[];
  pressed?: ChatMessageActionId[];
  onAction?: (action: ChatMessageActionId) => void;
  suggestions?: ChatSuggestion[];
  onSuggestion?: (id: string, label: string) => void;
  menu?: DropdownMenuEntry[];
  onMenuSelect?: (id: string) => void;
  person?: ChatMessagePerson;
  label?: string;
}

// Figma message elements 487:9608: the row of buttons under an answer, with the words their tooltips use.
const ACTIONS: Record<ChatMessageActionId, { icon: string; label: string }> = {
  copy: { icon: "content_copy", label: "Copy" },
  up: { icon: "thumb_up", label: "Good work!" },
  down: { icon: "thumb_down", label: "Needs work!" },
  share: { icon: "shortcut", label: "Share" },
  speak: { icon: "volume_up", label: "Read aloud" },
};

function Disclosure({ section }: { section: ChatMessageSection }) {
  const [open, setOpen] = useState(section.defaultOpen ?? false);
  return (
    <div className={styles.section}>
      <button type="button" className={styles.sectionHead} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="chevron_right" size="md" className={[styles.chevron, open ? styles.open : ""].join(" ")} />
        <span className={styles.sectionLabel}>{section.label}</span>
        {section.count !== undefined && <Badge>{String(section.count)}</Badge>}
      </button>
      {open && <div className={styles.sectionBody}>{section.content}</div>}
    </div>
  );
}

// Figma BP AI messages 487:9226 and message elements 487:9608: the person's line sits right in a grey bubble
// with their avatar; the assistant answers on the left under the AI mark, with its workings, buttons and suggestions.
export function ChatMessage({
  author, text, children, bubble, status, sections, actions, pressed = [], onAction,
  suggestions, onSuggestion, menu, onMenuSelect, person, label,
}: ChatMessageProps) {
  const mine = author === "user";
  // Both sides speak in a bubble: grey for the person, brand faint for the assistant. Pass bubble false
  // for a long answer that should run as plain text down the panel.
  const inBubble = bubble ?? true;
  const body = status ?? text;
  // While it is working there is nothing to copy or vote on yet, so the buttons wait.
  const keys = actions ?? (mine || status ? [] : (["copy", "up", "down", "share", "speak"] as ChatMessageActionId[]));
  const who = label ?? (mine ? person?.name ?? "You" : "Assistant");

  const avatar = mine
    ? <Avatar shape="square" name={person?.name ?? "You"} src={person?.src} initials={person?.initials} />
    : <span className={styles.aiMark}><LogoAI variant="symbol" intent="filled" label="Assistant" /></span>;

  return (
    <article className={[styles.message, mine ? styles.mine : styles.theirs].join(" ")} aria-label={`${who} said`}>
      <div className={styles.row}>
        {/* The person's More menu sits outside the bubble, on hover or focus. */}
        {mine && menu && menu.length > 0 && (
          <span className={styles.menu}>
            <DropdownMenu label={`Message actions`} items={menu} iconOnly icon="more_vert" variant="tertiary" size="sm" onSelect={(id) => onMenuSelect?.(id)} />
          </span>
        )}
        {!mine && <span className={styles.avatar}>{avatar}</span>}
        <div className={styles.body}>
          {inBubble
            ? (
              <>
                {body && <p className={[styles.bubble, status ? styles.working : ""].join(" ")}>{body}</p>}
                {/* Anything richer than a line goes under the bubble, where it has the width for it. */}
                {children && <div className={styles.text}>{children}</div>}
              </>
            )
            : (body || children) && (
              <div className={styles.text}>{body && <p className={styles.paragraph}>{body}</p>}{children}</div>
            )}
          {/* The workings open under the bubble, not inside it. */}
          {sections && sections.length > 0 && (
            <div className={styles.sections}>{sections.map((s) => <Disclosure key={s.id} section={s} />)}</div>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((s) => (
                <Button key={s.id} size="sm" onClick={() => onSuggestion?.(s.id, s.label)}>{s.label}</Button>
              ))}
            </div>
          )}
          {/* The buttons close the message: they come after the workings and the suggestions, never before the answer. */}
          {keys.length > 0 && (
            <div className={styles.actions}>
              {keys.map((k) => (
                <Tooltip key={k} content={ACTIONS[k].label}>
                  <Button
                    size="sm" variant="tertiary" iconOnly iconStart={ACTIONS[k].icon} pressed={pressed.includes(k)} onClick={() => onAction?.(k)}
                  >
                    {ACTIONS[k].label}
                  </Button>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
        {mine && <span className={styles.avatar}>{avatar}</span>}
      </div>
    </article>
  );
}
