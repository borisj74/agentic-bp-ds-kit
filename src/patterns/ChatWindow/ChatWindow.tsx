"use client";
import type { ReactNode } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { ChatHeader } from "@/ui/ChatHeader/ChatHeader";
import type { DropdownMenuEntry } from "@/ui/DropdownMenu/DropdownMenu";
import styles from "./ChatWindow.module.css";

export type ChatWindowSize = "panel" | "full";

export interface ChatWindowProps {
  composer: ReactNode;
  children?: ReactNode;
  empty?: ReactNode;
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
  menu?: DropdownMenuEntry[];
  onMenuSelect?: (id: string) => void;
}

// Figma BP AI get started 476:7427, side panel 492:12892 and full screen 492:13142: the kit ChatHeader over
// the turns, with the ChatComposer at the foot and the ChatList coming in beside or over them.
// A blueprint only: it composes kit pieces and keeps no state of its own.
export function ChatWindow({
  composer, children, empty, panel, panelOpen = false, size = "panel", title = "BP AI",
  notice, onNoticeDismiss, onNewChat, expanded, onExpandedChange, onClose,
  chatsCount, playbooksCount, planMode, onPlanModeChange, menu, onMenuSelect,
}: ChatWindowProps) {
  const turns = children ?? null;
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
            {turns ?? (empty && <div className={styles.blank}>{empty}</div>)}
            {notice && (
              <div className={styles.notice}>
                <Alert tone="info" dismissible onDismiss={onNoticeDismiss}>{notice}</Alert>
              </div>
            )}
          </div>
          <div className={styles.foot}>{composer}</div>
        </div>
        {panel && panelOpen && size === "panel" && <div className={styles.cover}>{panel}</div>}
      </div>
    </div>
  );
}
