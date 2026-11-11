"use client";
import { Button } from "@/ui/Button/Button";
import type { Contract } from "./Master";
import { PROMPT_TARGETS, componentPrompt, promptUrl, type PromptTarget } from "./componentPrompt";
import styles from "./master.module.css";
import { TOOL_MARKS } from "./toolIcons";
import { useCopy } from "./useCopy";

/** What the plain Copy button writes: the prompt for an agent that has the repo open, same as the Claude one. */
const PLAIN_TARGET: PromptTarget = "claude-code";
/** Its own copied key, so copying from a tool button does not tick the plain Copy button too. */
const PLAIN_KEY = "plain";

export function CopyPrompt({ contract }: { contract: Contract }) {
  // The playground's own copy helper, as the foundations pages use: it holds the key it copied and clears it, and
  // it drops its timer when the page goes. Keyed by target, so each button marks only its own copy.
  const { copied, copy } = useCopy();

  const hand = (target: PromptTarget) => {
    const prompt = componentPrompt(contract, target);
    copy(target, prompt);
    const tool = PROMPT_TARGETS.find((item) => item.value === target);
    // MCP has nothing to open: its prompt already points the agent at our own server.
    if (tool?.open) window.open(promptUrl(tool.open, prompt), "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.copyPrompt} role="group" aria-labelledby={`${contract.name}-copy-label`}>
      <span className={styles.copyPromptLabel} id={`${contract.name}-copy-label`}>
        Copy prompt for
      </span>
      <div className={styles.copyPromptTargets}>
        {PROMPT_TARGETS.map((tool) => (
          <Button
            key={tool.value}
            size="sm"
            // The brand marks are not Material Symbols, so they go in as children rather than through iconStart,
            // and the name a screen reader reads comes from aria-label. The class gives the kit's icon-only width.
            className={TOOL_MARKS[tool.value] ? styles.toolButton : `${styles.toolButton} ${styles.toolButtonWord}`}
            aria-label={tool.open ? `Copy prompt and open in ${tool.label}` : `Copy ${tool.label} prompt`}
            onClick={() => hand(tool.value)}
          >
            {TOOL_MARKS[tool.value] ?? <span className={styles.toolWord}>{tool.label}</span>}
          </Button>
        ))}
      </div>
      <Button
        size="sm"
        emphasis="subtle"
        iconStart={copied === PLAIN_KEY ? "check" : "content_copy"}
        onClick={() => copy(PLAIN_KEY, componentPrompt(contract, PLAIN_TARGET))}
      >
        {copied === PLAIN_KEY ? "Copied" : "Copy"}
      </Button>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {copied ? "Prompt copied to the clipboard" : ""}
      </span>
    </div>
  );
}
