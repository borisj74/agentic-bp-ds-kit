"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/ui/Button/Button";
import { ChatHeader } from "@/ui/ChatHeader/ChatHeader";
import type { DropdownEntry } from "@/ui/Dropdown/Dropdown";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { Illustration, type IllustrationName } from "@/ui/Illustration/Illustration";
import styles from "./ChatWindow.module.css";

export type ChatWindowSize = "panel" | "full";
export type ChatWindowArt = IllustrationName;

export interface ChatWindowStarter {
  id: string;
  label: string;
}

export interface ChatWindowProps {
  composer: ReactNode;
  children?: ReactNode;
  empty?: ReactNode;
  starters?: ChatWindowStarter[];
  onStarter?: (id: string, label: string) => void;
  art?: ChatWindowArt;
  artAnimated?: boolean;
  autoFocus?: boolean;
  panel?: ReactNode;
  panelOpen?: boolean;
  size?: ChatWindowSize;
  title?: string;
  notice?: string;
  onNoticeDismiss?: () => void;
  onNewChat?: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onClose?: () => void;
  chatsCount?: number;
  playbooksCount?: number;
  planMode?: boolean;
  onPlanModeChange?: (planMode: boolean) => void;
  menu?: DropdownEntry[];
  onMenuSelect?: (id: string) => void;
}

// Figma BP AI get started 476:7442: the art and the name in the middle, the starters stacked under them
// against the start edge of the window, in line with the notice and the box.
function GetStarted({ starters, onStarter, art, animated }: { starters?: ChatWindowStarter[]; onStarter?: (id: string, label: string) => void; art: ChatWindowArt; animated: boolean }) {
  return (
    <div className={styles.start}>
      <div className={styles.startHead}>
        <EmptyState title="Get Started" media={<Illustration name={art} animated={animated} />} />
      </div>
      {starters && starters.length > 0 && (
        <ul className={styles.starters} aria-label="Suggestions">
          {starters.map((s) => (
            <li key={s.id}><Button size="sm" onClick={() => onStarter?.(s.id, s.label)}>{s.label}</Button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Figma BP AI get started 476:7427, side panel 492:12892 and full screen 492:13142: the kit ChatHeader over
// the turns, with the ChatComposer at the foot and the ChatList coming in beside or over them.
// A blueprint only: it composes kit pieces and keeps no state of its own.
export function ChatWindow({
  composer, children, empty, starters, onStarter, art = "ai-chip", artAnimated = false, autoFocus = false,
  panel, panelOpen = false, size = "panel", title = "Assistant",
  notice, onNoticeDismiss, onNewChat, expanded, onExpandedChange, onClose,
  chatsCount, playbooksCount, planMode, onPlanModeChange, menu, onMenuSelect,
}: ChatWindowProps) {
  const turns = children ?? null;
  const foot = useRef<HTMLDivElement>(null);
  // Opening the assistant puts the caret in its box, so a keyboard user can type straight away.
  useEffect(() => {
    // The field to type in, not the scope checkbox or a button that comes before it in the box.
    const box = foot.current;
    if (autoFocus && box) (box.querySelector<HTMLElement>("textarea") ?? box.querySelector<HTMLElement>("input[type='text'], [contenteditable='true']"))?.focus();
    // Only on mount: later renders must not pull focus back from wherever the person went.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A screen's own empty block wins; otherwise the built-in get started shows.
  const blank = empty ?? <GetStarted starters={starters} onStarter={onStarter} art={art} animated={artAnimated} />;
  return (
    <div className={[styles.window, styles[size]].join(" ")}>
      <ChatHeader
        title={title} onNewChat={onNewChat} expanded={expanded} onExpandedChange={onExpandedChange} onClose={onClose}
        chatsCount={chatsCount} playbooksCount={playbooksCount} planMode={planMode} onPlanModeChange={onPlanModeChange}
        menu={menu} onMenuSelect={onMenuSelect}
      />
      <div className={styles.main}>
        {/* Full screen sets the chats beside the conversation; the side panel lays them over it. */}
        {panel && panelOpen && size === "full" && <div className={styles.aside}>{panel}</div>}
        <div className={styles.column}>
          <div className={styles.body}>
            {turns ?? <div className={styles.blank}>{blank}</div>}
            {/* Figma BP AI get started 505:12204: the line about mistakes sits quietly at the foot of the
                turns, right over the box, with its own close rather than a coloured band. */}
            {notice && (
              <div className={styles.notice}>
                <p className={styles.noticeText}>{notice}</p>
                {onNoticeDismiss && (
                  <Button size="sm" variant="tertiary" iconOnly iconStart="close" onClick={onNoticeDismiss}>Dismiss</Button>
                )}
              </div>
            )}
          </div>
          <div ref={foot} className={styles.foot}>{composer}</div>
        </div>
        {panel && panelOpen && size === "panel" && <div className={styles.cover}>{panel}</div>}
      </div>
    </div>
  );
}
