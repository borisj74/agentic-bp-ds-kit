"use client";
import { useState } from "react";
import { Button } from "@/ui/Button/Button";
import { Segmented } from "@/ui/Segmented/Segmented";
import type { Contract } from "./Master";
import { PROMPT_TARGETS, componentPrompt, type PromptTarget } from "./componentPrompt";
import styles from "./master.module.css";

export function CopyPrompt({ contract }: { contract: Contract }) {
  const [target, setTarget] = useState<PromptTarget>("cursor");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = componentPrompt(contract, target);
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

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
        iconStart={copied ? "check" : "content_copy"}
        onClick={copy}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {copied ? "Prompt copied to the clipboard" : ""}
      </span>
    </div>
  );
}
