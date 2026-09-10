"use client";
import { useId, type FormEvent, type ReactNode } from "react";
import { Alert } from "../Alert/Alert";
import { FormLayoutContext, type FieldLabelPosition } from "./FormContext";
import styles from "./Form.module.css";

export type FormVariant = "plain" | "card";
export type FormLabelPosition = FieldLabelPosition;
export type FormColumns = 1 | 2;

export interface FormSection {
  title: string;
  description?: string;
  content: ReactNode;
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

  const cls = [styles.form, styles[variant], labelPosition === "start" ? styles.start : "", columns === 2 ? styles.two : ""];
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
        {sections
          ? sections.map((s, i) => {
              const sectionDescription = `${base}-section-${i}`;
              return (
                <fieldset key={s.title} className={styles.section} aria-describedby={s.description ? sectionDescription : undefined}>
                  <legend className={styles.legend}>{s.title}</legend>
                  {s.description && <p id={sectionDescription} className={styles.sectionDescription}>{s.description}</p>}
                  <div className={styles.fields}>{s.content}</div>
                </fieldset>
              );
            })
          : <div className={styles.fields}>{children}</div>}
      </div>
      {actions && <footer className={styles.footer}>{actions}</footer>}
    </form>
    </FormLayoutContext.Provider>
  );
}
