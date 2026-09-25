import { useId } from "react";
import { Button, type ButtonPair } from "../Button/Button";
import { Dropdown } from "../Dropdown/Dropdown";
import { Icon } from "../Icon/Icon";
import styles from "./GuidedProcess.module.css";

export type GuidedProcessStatus = "success" | "warning" | "error";
export type GuidedProcessPlacement = "auto" | "side" | "band";
export type GuidedProcessShade = 1 | 2 | 3 | 4 | 5;
export type GuidedProcessSide = "start" | "end";

export interface GuidedProcessTask {
  label: string;
  done?: boolean;
}

export interface GuidedProcessStep {
  title: string;
  status?: GuidedProcessStatus;
  statusText?: string;
  tasks?: GuidedProcessTask[];
}

/** The footer action looks: strong brand (Submit), subtle (Continue) or minimal (the rest). */
export type GuidedProcessActionLook =
  | { emphasis: "strong"; intent: "brand" }
  | { emphasis?: "subtle" | "minimal"; intent?: "neutral" };

export type GuidedProcessAction = GuidedProcessActionLook & {
  id: string;
  label: string;
  icon?: string;
  type?: "button" | "submit";
  form?: string;
  disabled?: boolean;
};
// An action with no emphasis takes its place's look: minimal for the quieter ones, subtle for the last.
const look = (a: GuidedProcessAction, fallback: "subtle" | "minimal"): ButtonPair =>
  a.emphasis === "strong" ? { emphasis: "strong", intent: "brand" } : { emphasis: a.emphasis ?? fallback } as ButtonPair;


export interface GuidedProcessPanelProps {
  part?: "panel";
  title?: string;
  subtitle?: string;
  steps: GuidedProcessStep[];
  current?: number;
  started?: boolean;
  placement?: GuidedProcessPlacement;
  shade?: GuidedProcessShade;
  startLabel?: string;
  onStart?: () => void;
  onCancel?: () => void;
}

export interface GuidedProcessStepsProps {
  part: "steps";
  steps: GuidedProcessStep[];
  current?: number;
  side?: GuidedProcessSide;
  onClose?: () => void;
}

export interface GuidedProcessHeaderProps {
  part: "header";
  title: string;
  stepTitle: string;
  current?: number;
  total?: number;
  onStepsOpen?: () => void;
}

export interface GuidedProcessFooterProps {
  part: "footer";
  actions?: GuidedProcessAction[];
  onAction?: (id: string) => void;
  updated?: string;
}

export type GuidedProcessProps = GuidedProcessPanelProps | GuidedProcessStepsProps | GuidedProcessHeaderProps | GuidedProcessFooterProps;

const STATUS: Record<GuidedProcessStatus, { icon: string; text: string }> = {
  success: { icon: "check_circle", text: "Completed" },
  warning: { icon: "warning", text: "Needs a look" },
  error: { icon: "block", text: "Could not finish" },
};

const clamp = (current: number, total: number) => Math.min(Math.max(current, 1), Math.max(total, 1));

// Figma Guided Process (template 29102:2): the panel for one step (2183:44371), the steps beside the page
// (template 29120:95981), the step's header (29120:102574) and the footer (2530:87948). One component; part picks
// which of the four it draws.
export function GuidedProcess(props: GuidedProcessProps) {
  switch (props.part) {
    case "footer": return <Footer {...props} />;
    case "steps": return <Steps {...props} />;
    case "header": return <Header {...props} />;
    default: return <Panel {...props} />;
  }
}

// One step as a dark column: its number, its title and how it went, with the process name over the first one
// and Start and Cancel before the process begins. A dark island: the panel carries data-theme dark, so its text,
// icons and Buttons take their dark roles in either theme.
function Panel({
  title, subtitle, steps, current = 1, started = true, placement = "auto", shade = 1,
  startLabel = "Start", onStart, onCancel,
}: GuidedProcessPanelProps) {
  const titleId = useId();
  const n = clamp(current, steps.length);
  const step = steps[n - 1];

  return (
    <section
      className={[styles.panel, styles[placement], styles[`shade${shade}`]].filter(Boolean).join(" ")}
      data-theme="dark" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : step?.title}
    >
      {title && (
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}

      {step && (
        // Read out when the step changes, so moving on is heard as well as seen.
        <div className={styles.current} aria-live="polite">
          <p className={styles.number} aria-hidden="true">{String(n).padStart(2, "0")}</p>
          <p className={styles.name}>
            <span className={styles.srOnly}>Step {n} of {steps.length}: </span>{step.title}
          </p>
          {step.status && (
            <p className={styles.status}>
              <Icon name={STATUS[step.status].icon} size="sm" filled className={styles[step.status]} />
              <span>{step.statusText ?? STATUS[step.status].text}</span>
            </p>
          )}
        </div>
      )}

      {!started && (onStart || onCancel) && (
        <div className={styles.actions}>
          {onStart && <Button emphasis="strong" intent="brand" onClick={onStart}>{startLabel}</Button>}
          {onCancel && <Button emphasis="minimal" onClick={onCancel}>Cancel</Button>}
        </div>
      )}
    </section>
  );
}

// 4 | 6: the step the person is on over how many there are. Screen readers hear Step 4 of 6.
function Counter({ current, total }: { current: number; total: number }) {
  return (
    <span className={styles.counter}>
      <span className={styles.srOnly}>Step {current} of {total}</span>
      <span className={styles.at} aria-hidden="true">{current}</span>
      <span className={styles.bar} aria-hidden="true" />
      <span className={styles.of} aria-hidden="true">{total}</span>
    </span>
  );
}

// Every step beside the page: the counter at the top, the list at the foot, a notch in the edge at the step the
// person is on and what is left in it. side is the edge of the page the panel sits on, so the notch points in.
function Steps({ steps, current = 1, side = "end", onClose }: GuidedProcessStepsProps) {
  const n = clamp(current, steps.length);
  return (
    <nav className={[styles.toc, side === "start" ? styles.tocStart : ""].join(" ")} aria-label="Steps">
      <div className={styles.tocInner} data-theme="dark">
        <div className={styles.tocTop}>
          <Counter current={n} total={steps.length} />
          {/* Only a drawer can be closed; beside a wide page the steps are always there. */}
          {onClose && (
            <span className={styles.close}>
              <Button emphasis="minimal" iconOnly iconStart="close" onClick={onClose}>Close steps</Button>
            </span>
          )}
        </div>
        <ol className={styles.steps}>
          {steps.map((s, i) => {
            const on = i + 1 === n;
            return (
              <li key={`${i}-${s.title}`} className={[styles.step, on ? styles.on : ""].join(" ")} aria-current={on ? "step" : undefined}>
                <div className={styles.row}>
                  <span className={styles.stepTitle}>{s.title}</span>
                  {s.status && (
                    <Icon name={STATUS[s.status].icon} size="lg" filled className={styles[s.status]} label={s.statusText ?? STATUS[s.status].text} />
                  )}
                </div>
                {/* Only the step the person is on lists what is left to do in it. */}
                {on && s.tasks && s.tasks.length > 0 && (
                  <ul className={styles.tasks}>
                    {s.tasks.map((t, j) => (
                      <li key={`${j}-${t.label}`} className={styles.task}>
                        {t.done ? <Icon name="check" size="sm" /> : <span className={styles.dot} aria-hidden="true" />}
                        <span>{t.label}{t.done && <span className={styles.srOnly}>, done</span>}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

// The process name over the step's title. On a narrow box, where the steps are a drawer, the counter beside
// it opens them.
function Header({ title, stepTitle, current = 1, total, onStepsOpen }: GuidedProcessHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headText}>
        <p className={styles.process}>{title}</p>
        <h1 className={styles.stepTitle1}>{stepTitle}</h1>
      </div>
      {total !== undefined && onStepsOpen && (
        <button type="button" className={styles.counterButton} onClick={onStepsOpen}>
          <Counter current={clamp(current, total)} total={total} />
          <span className={styles.srOnly}>, show steps</span>
        </button>
      )}
    </div>
  );
}

// When the work was last saved at the start, and the step's actions at the end. The last action moves the
// process on (Continue, or Submit on the last step); the rest are quieter.
function Footer({ actions = [], onAction, updated }: GuidedProcessFooterProps) {
  const rest = actions.slice(0, -1);
  const last = actions[actions.length - 1];
  // On a phone an action with an icon is its own icon button; only those without one still need the menu.
  const iconed = rest.filter((a) => a.icon);
  const plain = rest.filter((a) => !a.icon);
  const menu = (items: GuidedProcessAction[]) => (
    <Dropdown
      label="More actions" icon="more_horiz" iconOnly emphasis="minimal" alignment="left"
      items={items.map((a) => ({ id: a.id, label: a.label, icon: a.icon, disabled: a.disabled }))}
      onSelect={(id) => onAction?.(id)}
    />
  );

  return (
    <footer className={styles.footer}>
      {updated && <p className={styles.updated}>{updated}</p>}
      {last && (
        <div className={styles.buttons}>
          {/* Render all, show one: the quieter actions as Buttons from 1024 of box width, folded into one menu
              under it, and as icon buttons on a phone. The hidden sets are display none, so no action is a
              keyboard stop twice. */}
          {rest.length > 0 && (
            <>
              <div className={styles.rest}>
                {rest.map((a) => (
                  <Button key={a.id} {...look(a, "minimal")} type={a.type ?? "button"} form={a.form} disabled={a.disabled} onClick={() => onAction?.(a.id)}>
                    {a.label}
                  </Button>
                ))}
              </div>
              <div className={styles.more}>{menu(rest)}</div>
              {iconed.length > 0 && (
                <div className={styles.icons}>
                  {iconed.map((a) => (
                    <Button key={a.id} emphasis="minimal" size="lg" iconOnly iconStart={a.icon} iconSize="xl" type={a.type ?? "button"} form={a.form} disabled={a.disabled} onClick={() => onAction?.(a.id)}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
              {plain.length > 0 && <div className={styles.morePhone}>{menu(plain)}</div>}
            </>
          )}
          <span className={styles.last}>
            <Button {...look(last, "subtle")} type={last.type ?? "button"} form={last.form} disabled={last.disabled} fullWidth onClick={() => onAction?.(last.id)}>
              {last.label}
            </Button>
          </span>
        </div>
      )}
    </footer>
  );
}
