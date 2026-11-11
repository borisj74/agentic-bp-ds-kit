"use client";
import { useState } from "react";
import { Button } from "@/ui/Button/Button";
import { Segmented } from "@/ui/Segmented/Segmented";
import type { Contract } from "./Master";
import { PROMPT_TARGETS, componentPrompt, type PromptTarget } from "./componentPrompt";
import styles from "./master.module.css";
import { useCopy } from "./useCopy";

export function CopyPrompt({ contract }: { contract: Contract }) {
  const [target, setTarget] = useState<PromptTarget>("cursor");
  // The playground's own copy helper, as the foundations pages use: it holds the key it copied and clears it, and
  // it drops its timer when the page goes. Keyed by target, so switching to another agent asks to be copied again.
  const { copied, copy } = useCopy();
  const done = copied === target;

  return (
    <div className={styles.copyPrompt} role="group" aria-labelledby={`${contract.name}-copy-label`}>
      <span className={styles.copyPromptLabel} id={`${contract.name}-copy-label`}>
        Copy prompt for
      </span>
      <div className={styles.copyPromptTargets}>
        <Segmented
          label="Copy prompt target"
          hideLabel
          size="sm"
          value={target}
          onChange={(value) => setTarget(value as PromptTarget)}
          options={PROMPT_TARGETS.map((item) => ({ value: item.value, label: item.label }))}
        />
      </div>
      <Button
        size="sm"
        emphasis="subtle"
        iconStart={done ? "check" : "content_copy"}
        onClick={() => copy(target, componentPrompt(contract, target))}
      >
        {done ? "Copied" : "Copy"}
      </Button>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {done ? "Prompt copied to the clipboard" : ""}
      </span>
    </div>
  );
}
