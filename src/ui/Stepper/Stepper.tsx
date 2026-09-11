import { Icon } from "../Icon/Icon";
import styles from "./Stepper.module.css";

export type StepperSize = "sm" | "md";
export type StepStatus = "complete" | "current" | "upcoming";

export interface StepperProps {
  steps: string[];
  current?: number;
  size?: StepperSize;
  fill?: boolean;
  label?: string;
  onStepClick?: (step: number) => void;
}

const SPOKEN: Record<StepStatus, string> = { complete: ", completed", current: ", current step", upcoming: ", not started" };

// Figma steps 2133:58431 and 2133:58480: done steps are green with a check, the current step is brand
// with its number, later steps are gray. The line into each step takes that step's color.
export function Stepper({ steps, current = 1, size = "md", fill = false, label = "Progress", onStepClick }: StepperProps) {
  return (
    <ol className={[styles.stepper, styles[size], fill ? styles.fill : ""].join(" ")} aria-label={label}>
      {steps.map((text, i) => {
        const n = i + 1;
        const status: StepStatus = n < current ? "complete" : n === current ? "current" : "upcoming";
        const body = (
          <>
            <span className={styles.node} aria-hidden="true">
              {status === "complete" ? <Icon name="check" size={size === "sm" ? "sm" : "md"} /> : n}
            </span>
            <span className={styles.label}>{text}</span>
            <span className={styles.srOnly}>{SPOKEN[status]}</span>
          </>
        );
        return (
          <li key={`${n}-${text}`} className={[styles.step, styles[status]].join(" ")} aria-current={status === "current" ? "step" : undefined}>
            {/* Only done steps go back; the current and later steps are not links. */}
            {onStepClick && status === "complete" ? (
              <button type="button" className={[styles.target, styles.link].join(" ")} onClick={() => onStepClick(n)}>{body}</button>
            ) : (
              <span className={styles.target}>{body}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
