"use client";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { LogoAI } from "../LogoAI/LogoAI";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./ChatHeader.module.css";

export interface ChatHeaderProps {
  title?: string;
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
  label?: string;
}

// Figma BP AI shell elements 483:7870: Chats and Playbooks carry how many there are, Plan Mode is ticked
// while it is on, and a count is left off when there are none.
function options(chats?: number, playbooks?: number, planMode?: boolean): DropdownMenuEntry[] {
  return [
    { id: "chats", label: "Chats", icon: "forum", count: chats || undefined },
    { id: "playbooks", label: "Playbooks", icon: "play_circle", count: playbooks || undefined },
    { id: "planMode", label: "Plan Mode", icon: "checklist", selected: Boolean(planMode) },
    { divider: true },
    { id: "settings", label: "Settings", icon: "settings" },
  ];
}

// Figma BP AI header 487:11110: the AI mark and the name, then new chat, full screen, options and close.
export function ChatHeader({
  title = "Assistant", onNewChat, expanded = false, onExpandedChange, onClose,
  chatsCount, playbooksCount, planMode = false, onPlanModeChange, menu, onMenuSelect, label,
}: ChatHeaderProps) {
  const items = menu ?? options(chatsCount, playbooksCount, planMode);
  const pick = (id: string) => {
    // Plan Mode is a switch in the menu; everything else is passed on to the screen.
    if (id === "planMode" && !menu) onPlanModeChange?.(!planMode);
    onMenuSelect?.(id);
  };

  return (
    <div className={styles.frame}>
    <header className={styles.header} aria-label={label ?? title}>
      <span className={styles.mark}><LogoAI variant="symbol" intent="filled" label={title} /></span>
      <h2 className={styles.title}>{title}</h2>
      {/* While Plan Mode is on the bar says so, so the tick in the menu is not the only sign of it. On a narrow
          bar the badge drops to its icon, still named Plan Mode, so the name stays whole. */}
      {planMode && (
        <>
          <span className={[styles.flag, styles.flagText].join(" ")}><Badge intent="info" icon="checklist">Plan Mode</Badge></span>
          <span className={[styles.flag, styles.flagIcon].join(" ")}><Badge intent="info" icon="checklist" iconOnly>Plan Mode</Badge></span>
        </>
      )}
      <div className={styles.actions}>
        {onNewChat && (
          <Tooltip content="Start new chat">
            <Button size="sm" variant="tertiary" iconOnly iconStart="add_comment" onClick={onNewChat}>Start new chat</Button>
          </Tooltip>
        )}
        {onExpandedChange && (
          <Tooltip content={expanded ? "Back to the side panel" : "Full screen"}>
            <Button
              size="sm" variant="tertiary" iconOnly iconStart={expanded ? "close_fullscreen" : "open_in_full"}
              onClick={() => onExpandedChange(!expanded)}
            >
              {expanded ? "Back to the side panel" : "Full screen"}
            </Button>
          </Tooltip>
        )}
        <DropdownMenu label="Options" items={items} iconOnly icon="more_vert" variant="tertiary" size="sm" align="end" onSelect={pick} />
        {onClose && (
          <Tooltip content={`Close ${title}`}>
            <Button size="sm" variant="tertiary" iconOnly iconStart="close" onClick={onClose}>{`Close ${title}`}</Button>
          </Tooltip>
        )}
      </div>
    </header>
    </div>
  );
}
