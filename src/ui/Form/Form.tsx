"use client";
import { useContext, useId, type FormEvent, type ReactNode } from "react";
import { Callout } from "../Callout/Callout";
import { Section, type SectionLine } from "../Section/Section";
import { FormLayoutContext, type FieldColumns, type FieldLabelPosition } from "./FormContext";
import styles from "./Form.module.css";
import grid from "./columns.module.css";

export type FormVariant = "plain" | "card";
export type FormLabelPosition = FieldLabelPosition;
export type FormColumns = FieldColumns;

export interface FormSection {
  title: string;
  description?: string;
  help?: string;
  actions?: ReactNode;
  content: ReactNode;
  line?: SectionLine;
  collapsible?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
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
  title, description, variant = "plain", labelPosition: ownLabelPosition, columns: ownColumns, children, sections, actions, error, onSubmit, id,
}: FormProps) {
  const base = useId();
  const titleId = `${base}-title`;
  const descriptionId = `${base}-description`;
  // Unset, the Form takes the labels of the record and the columns of the page it is in.
  const page = useContext(FormLayoutContext);
  const labelPosition = ownLabelPosition ?? page.labelPosition ?? "top";
  const columns = ownColumns ?? page.columns;

  // The page never reloads; the caller gets the field values by name.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(new FormData(e.currentTarget));
  };

  const cls = [styles.form, styles[variant], labelPosition === "start" ? styles.start : ""];
  // Set columns cap each column at --layout-column-max; unset, the fields fill the form.
  const fields = [styles.fields, ...(columns ? [grid.grid, grid[["", "one", "two", "three"][columns]], labelPosition === "start" ? grid.start : ""] : [])].join(" ");
  return (
    // Fields inside take the Form's labelPosition unless they set their own. The page's columns stop here: the
    // Form lays its own fields out, so the Sections it titles them with take none.
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
        {error && <Callout intent="danger">{error}</Callout>}
        {/* A group of fields is titled by the kit Section, so a group in a form folds away, carries its help and
            reads the same as a block anywhere else in the kit. */}
        {sections
          ? sections.map((s) => (
              <Section
                key={s.title} title={s.title} description={s.description} help={s.help} actions={s.actions} line={s.line}
                collapsible={s.collapsible} expanded={s.expanded} defaultExpanded={s.defaultExpanded} onExpandedChange={s.onExpandedChange}
              >
                <div className={fields}>{s.content}</div>
              </Section>
            ))
          : <div className={fields}>{children}</div>}
      </div>
      {actions && <footer className={styles.footer}>{actions}</footer>}
    </form>
    </FormLayoutContext.Provider>
  );
}
