"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./ChatComposer.module.css";

export type ChatComposerMode = "quick" | "deep";

export interface ChatComposerAttachment {
  id: string;
  label: string;
}

export interface ChatComposerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSend?: (value: string) => void;
  placeholder?: string;
  hints?: string[];
  scopeLabel?: string;
  scoped?: boolean;
  defaultScoped?: boolean;
  onScopedChange?: (scoped: boolean) => void;
  attachments?: ChatComposerAttachment[];
  onAttachmentRemove?: (id: string) => void;
  addMenu?: DropdownMenuEntry[];
  onAdd?: (id: string) => void;
  selecting?: boolean;
  onSelectingChange?: (selecting: boolean) => void;
  dictating?: boolean;
  onDictatingChange?: (dictating: boolean) => void;
  mode?: ChatComposerMode;
  onModeChange?: (mode: ChatComposerMode) => void;
  disabled?: boolean;
  label?: string;
}

// The field grows with what is typed, up to six lines, then scrolls (Figma shell elements 483:7870).
const MAX_ROWS = 6;

export function ChatComposer({
  value, defaultValue = "", onChange, onSend, placeholder = "Ask questions", hints,
  scopeLabel, scoped, defaultScoped = false, onScopedChange,
  attachments, onAttachmentRemove, addMenu, onAdd,
  selecting = false, onSelectingChange, dictating = false, onDictatingChange,
  mode = "quick", onModeChange, disabled = false, label = "Ask BP AI",
}: ChatComposerProps) {
  const uid = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const text = value === undefined ? inner : value;
  const [innerScoped, setInnerScoped] = useState(defaultScoped);
  const on = scoped === undefined ? innerScoped : scoped;
  const [hint, setHint] = useState(0);

  // The hint text turns over while the box is empty, as in Figma: ask questions, analyze data, build dashboards.
  useEffect(() => {
    if (!hints || hints.length < 2 || text) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return;
    const t = setInterval(() => setHint((i) => (i + 1) % hints.length), 4000);
    return () => clearInterval(t);
  }, [hints, text]);

  // Grow to six lines, then let it scroll.
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_ROWS)}px`;
  }, [text]);

  const type = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const send = () => {
    const ready = text.trim();
    if (!ready || disabled) return;
    onSend?.(ready);
    if (value === undefined) setInner("");
    onChange?.("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const ask = hints && hints.length > 0 && !text ? hints[hint % hints.length] : placeholder;

  return (
    <div className={[styles.composer, disabled ? styles.disabled : ""].join(" ")} data-chat-composer="">
      {/* Scope: what the question is about, like the page the person is on. */}
      {scopeLabel && (
        <div className={styles.scope}>
          <Checkbox
            label={`Scope to ${scopeLabel}`} size="sm" checked={on} disabled={disabled}
            onChange={(next) => { if (scoped === undefined) setInnerScoped(next); onScopedChange?.(next); }}
          />
        </div>
      )}
      {/* Attachments: the files and fields going with the message. The bar is gone when there are none. */}
      {attachments && attachments.length > 0 && (
        <ul className={styles.attachments} aria-label="Attachments">
          {attachments.map((a) => (
            <li key={a.id}>
              <Badge removable onRemove={() => onAttachmentRemove?.(a.id)}>{a.label}</Badge>
            </li>
          ))}
        </ul>
      )}
      <label className={styles.srOnly} htmlFor={`${uid}-ask`}>{label}</label>
      <textarea
        ref={field} id={`${uid}-ask`} className={styles.field} rows={1} placeholder={ask} value={text} disabled={disabled}
        onChange={(e) => type(e.target.value)} onKeyDown={onKeyDown}
      />
      <div className={styles.footer}>
        {addMenu && addMenu.length > 0 ? (
          <DropdownMenu label="Add to the message" items={addMenu} iconOnly icon="add" variant="tertiary" size="sm" disabled={disabled} onSelect={(id) => onAdd?.(id)} />
        ) : (
          <Tooltip content="Add">
            <Button size="sm" variant="tertiary" iconOnly iconStart="add" disabled={disabled} onClick={() => onAdd?.("add")}>Add</Button>
          </Tooltip>
        )}
        <span className={styles.spacer} />
        {/* Picking fields and dictating are switches: while one is on it turns red and says how to stop. */}
        <Tooltip content={selecting ? "Stop field selection" : "Select fields on page"}>
          <Button
            size="sm" variant={selecting ? "danger" : "tertiary"} iconOnly iconStart={selecting ? "stop_circle" : "near_me"}
            disabled={disabled} onClick={() => onSelectingChange?.(!selecting)}
          >
            {selecting ? "Stop field selection" : "Select fields on page"}
          </Button>
        </Tooltip>
        <Tooltip content={dictating ? "Stop dictation" : "Dictate message"}>
          <Button
            size="sm" variant={dictating ? "danger" : "tertiary"} iconOnly iconStart={dictating ? "stop_circle" : "mic_none"}
            disabled={disabled} onClick={() => onDictatingChange?.(!dictating)}
          >
            {dictating ? "Stop dictation" : "Dictate message"}
          </Button>
        </Tooltip>
        {onModeChange && (
          <Tooltip content={mode === "deep" ? "Using Deep Thought" : "Use Deep Thought"}>
            <span className={mode === "deep" ? styles.on : undefined}>
              <Button
                size="sm" variant="tertiary" iconOnly iconStart="psychology" disabled={disabled}
                onClick={() => onModeChange(mode === "deep" ? "quick" : "deep")}
              >
                {mode === "deep" ? "Using Deep Thought" : "Use Deep Thought"}
              </Button>
            </span>
          </Tooltip>
        )}
        <Tooltip content="Send message">
          <Button size="sm" variant="primary" iconOnly iconStart="arrow_upward" disabled={disabled || !text.trim()} onClick={send}>Send message</Button>
        </Tooltip>
      </div>
    </div>
  );
}
