"use client";
import { useId, type FormEvent, type ReactNode } from "react";
import { Alert } from "../Alert/Alert";
import { Section, type SectionLine } from "../Section/Section";
import { FormLayoutContext, type FieldLabelPosition } from "./FormContext";
import styles from "./Form.module.css";

export type FormVariant = "plain" | "card";
export type FormLabelPosition = FieldLabelPosition;
export type FormColumns = 1 | 2 | 3;

export interface FormSection {
  title: string;
  description?: string;
  help?: string;
  actions?: ReactNode;
  content: ReactNode;
  line?: SectionLine;
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface FormProps {
  title?: string;
  description?: string;
  variant?: FormVariant;
  labelPosition?: FormLabelPosition;
  columns?: FormColumns;
  children?: ReactNode;
  sections?: FormSection[];
  actions?: ReactNode;
  error?: string;
  onSubmit?: (data: FormData) => void;
  id?: string;
}

export function Form({
  title, description, variant = "plain", labelPosition = "top", columns = 1, children, sections, actions, error, onSubmit, id,
}: FormProps) {
  const base = useId();
  const titleId = `${base}-title`;
  const descriptionId = `${base}-description`;

  // The page never reloads; the caller gets the field values by name.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(new FormData(e.currentTarget));
  };

  const cls = [styles.form, styles[variant], labelPosition === "start" ? styles.start : "", columns === 2 ? styles.two : columns === 3 ? styles.three : ""];
  return (
    // Fields inside take the Form's labelPosition unless they set their own.
    <FormLayoutContext.Provider value={{ labelPosition }}>
    <form
      id={id}
      className={cls.join(" ")}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onSubmit={submit}
    >
      {(title || description) && (
        <header className={styles.header}>
          {title && <h2 id={titleId} className={styles.title}>{title}</h2>}
          {description && <p id={descriptionId} className={styles.description}>{description}</p>}
        </header>
      )}
      <div className={styles.body}>
        {error && <Alert tone="danger">{error}</Alert>}
        {/* A group of fields is titled by the kit Section, so a group in a form folds away, carries its help and
            reads the same as a block anywhere else in the kit. */}
        {sections
          ? sections.map((s) => (
              <Section
                key={s.title} title={s.title} description={s.description} help={s.help} actions={s.actions} line={s.line}
                collapsible={s.collapsible} open={s.open} defaultOpen={s.defaultOpen} onOpenChange={s.onOpenChange}
              >
                <div className={styles.fields}>{s.content}</div>
              </Section>
            ))
          : <div className={styles.fields}>{children}</div>}
      </div>
      {actions && <footer className={styles.footer}>{actions}</footer>}
    </form>
    </FormLayoutContext.Provider>
  );
}
