"use client";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "../Button/Button";
import { Dropdown, type DropdownEntry } from "../Dropdown/Dropdown";
import { labelWidthClass, useLabelPosition } from "../Form/FormContext";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import { Icon } from "../Icon/Icon";
import { HelpPopover } from "../HelpPopover/HelpPopover";
// Label, help, hint and error share Input's styles so all form fields match.
import field from "../Input/Input.module.css";
import styles from "./FormulaEditor.module.css";

export type FormulaEditorSize = "sm" | "md" | "lg";
export type FormulaEditorLabelPosition = "top" | "start";
export type FormulaEditorLabelWidth = "sm" | "md" | "lg";
export interface FormulaField { id: string; label: string }
export interface FormulaFunction { name: string; syntax?: string; description?: string }

export interface FormulaEditorProps {
  label: string;
  hideLabel?: boolean;
  labelPosition?: FormulaEditorLabelPosition;
  labelWidth?: FormulaEditorLabelWidth;
  size?: FormulaEditorSize;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  fields?: FormulaField[];
  functions?: FormulaFunction[];
  onCheckSyntax?: (value: string) => string | null | undefined;
  onCalculate?: (value: string) => string;
  onAiAssist?: () => void;
  aiActive?: boolean;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  help?: string;
}

const OPERATORS: { symbol: string; description: string }[][] = [
  [{ symbol: "+", description: "Add" }, { symbol: "-", description: "Subtract" }, { symbol: "*", description: "Multiply" }, { symbol: "/", description: "Divide" }],
  [{ symbol: "=", description: "Equals" }, { symbol: "<>", description: "Not equal" }, { symbol: "<", description: "Less than" }, { symbol: ">", description: "Greater than" }, { symbol: "<=", description: "Less than or equal" }, { symbol: ">=", description: "Greater than or equal" }],
  [{ symbol: "&", description: "Join text" }, { symbol: "AND", description: "Both are true" }, { symbol: "OR", description: "Either is true" }],
];
const OPERATOR_LIST = OPERATORS.flat();
// Menu ids are indexes: symbols and dotted field ids are not safe DOM ids.
const OPERATOR_ITEMS: DropdownEntry[] = OPERATORS.flatMap((group, g) => [
  ...(g ? [{ divider: true as const }] : []),
  ...group.map((op) => ({ id: `op-${OPERATOR_LIST.indexOf(op)}`, label: op.symbol, description: op.description })),
]);

// The menu row shows the syntax, with what it does underneath. Picking one inserts NAME().
const DEFAULT_FUNCTIONS: FormulaFunction[] = [
  { name: "IF", syntax: "IF(condition, then, else)", description: "One value when true, another when false" },
  { name: "AND", syntax: "AND(a, b, …)", description: "True when all are true" },
  { name: "OR", syntax: "OR(a, b, …)", description: "True when any is true" },
  { name: "NOT", syntax: "NOT(value)", description: "Flips true and false" },
  { name: "ISBLANK", syntax: "ISBLANK(value)", description: "True when the value is empty" },
  { name: "ROUND", syntax: "ROUND(number, digits)", description: "Rounds to a number of decimals" },
  { name: "ABS", syntax: "ABS(number)", description: "Drops the minus sign" },
  { name: "MIN", syntax: "MIN(a, b, …)", description: "The smallest value" },
  { name: "MAX", syntax: "MAX(a, b, …)", description: "The largest value" },
  { name: "SUM", syntax: "SUM(a, b, …)", description: "Adds the values up" },
  { name: "TODAY", syntax: "TODAY()", description: "The current date" },
];

const CLOSE: Record<string, string> = { "(": ")", "{": "}", "[": "]" };
const OPEN: Record<string, string> = { ")": "(", "}": "{", "]": "[" };

// Built-in check: brackets and quotes must close. Pass onCheckSyntax for real parsing.
function checkBrackets(formula: string): string | null {
  if (!formula.trim()) return "The formula is empty.";
  const stack: string[] = [];
  let quote = "";
  for (const ch of formula) {
    if (quote) { if (ch === quote) quote = ""; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (CLOSE[ch]) stack.push(ch);
    else if (OPEN[ch] && stack.pop() !== OPEN[ch]) return `There is a ${ch} with no opening bracket.`;
  }
  if (quote) return "A text value is missing its closing quote.";
  if (stack.length) return `A closing ${CLOSE[stack[stack.length - 1]]} is missing.`;
  return null;
}

type Result = { intent: "success" | "error"; text: string } | null;

export function FormulaEditor({
  label, hideLabel = false, labelPosition: ownLabelPosition, labelWidth, size = "sm", placeholder, value, defaultValue, onChange,
  fields, functions = DEFAULT_FUNCTIONS, onCheckSyntax, onCalculate, onAiAssist, aiActive = false, name, id,
  required = false, disabled = false, readOnly = false, invalid = false, error, hint, help,
}: FormulaEditorProps) {
  const labelPosition = useLabelPosition(ownLabelPosition);
  // A field in a booting page draws itself as bars, in its own place.
  const booting = useFieldSkeleton();
  // The label column this field stands on. With no label there is no column, and md is the kit's 234.
  const width = hideLabel ? undefined : labelWidthClass(labelWidth);
  const autoId = useId();
  const areaId = id ?? autoId;
  const messageId = `${areaId}-message`;
  const helpId = `${areaId}-help`;
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue ?? "");
  const [result, setResult] = useState<Result>(null);
  const current = value ?? inner;
  const bad = invalid || Boolean(error) || result?.intent === "error";
  // A passed error wins, then the last check or calculation, then the hint.
  const message = error || result?.text || hint;
  const messageClass = error || result?.intent === "error" ? field.error : result ? styles.success : field.hint;
  const describedBy = [message ? messageId : "", help ? helpId : ""].filter(Boolean).join(" ") || undefined;
  const locked = disabled || readOnly;

  const emit = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
    setResult(null);
  };

  // Inserts at the cursor (or over the selection), then puts focus back in the formula.
  // The textarea keeps its selection while a menu is open.
  const insert = (text: string, caretBack = 0) => {
    const area = areaRef.current;
    if (!area) return;
    area.setRangeText(text, area.selectionStart, area.selectionEnd, "end");
    const caret = area.selectionEnd - caretBack;
    emit(area.value);
    // After the menu hands focus back to its trigger.
    setTimeout(() => { area.focus(); area.setSelectionRange(caret, caret); }, 0);
  };

  const check = () => (onCheckSyntax ?? checkBrackets)(current) ?? null;
  const runCheck = () => {
    const problem = check();
    setResult(problem ? { intent: "error", text: problem } : { intent: "success", text: "No syntax errors found." });
  };
  const runCalculate = () => {
    const problem = check();
    if (problem) { setResult({ intent: "error", text: problem }); return; }
    try {
      setResult({ intent: "success", text: `Result: ${onCalculate?.(current)}` });
    } catch (e) {
      setResult({ intent: "error", text: e instanceof Error ? e.message : "This formula could not be calculated." });
    }
  };

  const cls = [field.input, styles.root, hideLabel ? "" : field[labelPosition], width ? field[width] : ""];
  // Booting: the editor keeps its frame, so its toolbar band and the writing area under it are already the
  // height they will be. data-full-row keeps the row it spans while there is no textarea in the tree.
  if (booting) {
    return (
      <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition} data-full-row="">
        {!hideLabel && (
          <div className={field.labelRow}>
            <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(label)} height="var(--skeleton-cell)" label="" />
          </div>
        )}
        <div className={field.body}>
          <div className={styles.editor}>
            <div className={styles.toolbar}>
              <Skeleton shape="rect" animation="pulse" width="var(--toolbar-action-skeleton)" height="var(--control-small)" label="" />
            </div>
            <Skeleton shape="rect" animation="pulse" height={`var(--textarea-height-${size})`} label="" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cls.join(" ")} data-label={hideLabel ? undefined : labelPosition} data-full-row="">
      <div className={hideLabel ? field.srOnly : field.labelRow}>
        <label htmlFor={areaId} className={field.label}>
          {required && <span className={field.required} aria-hidden="true">*</span>}
          {label}
        </label>
        {help && !hideLabel && (
          // help opens a HelpPopover titled with the label: hover, keyboard focus or click.
          <HelpPopover title={label} content={help}><button type="button" className={field.help} aria-label={`About ${label}`}><Icon name="help_center" size="sm" /></button></HelpPopover>
        )}
        {help && <span id={helpId} className={field.srOnly}>{help}</span>}
      </div>
      <div className={field.body}>
        <div className={[styles.editor, bad ? styles.invalid : "", disabled ? styles.disabled : ""].join(" ")}>
          <div className={styles.toolbar} role="group" aria-label={`${label} tools`}>
            {/* First in the row: asking for a formula comes before writing one by hand. Toggled on while the
                assistant is open for this field, so it is clear where an answer will land. */}
            {onAiAssist && (
              <Button size="sm" iconStart="auto_awesome" toggle={aiActive} disabled={locked} onClick={onAiAssist}>AI assistant</Button>
            )}
            {fields && fields.length > 0 && (
              <Dropdown
                label="Insert field" icon="add" size="sm" searchable searchPlaceholder="Search fields" disabled={locked}
                items={fields.map((f, i) => ({ id: `field-${i}`, label: f.label, description: `{!${f.id}}` }))}
                onSelect={(itemId) => insert(`{!${fields[Number(itemId.slice(6))].id}}`)}
              />
            )}
            <Dropdown
              label="Insert operator" icon="add" size="sm" disabled={locked} items={OPERATOR_ITEMS}
              onSelect={(itemId) => insert(` ${OPERATOR_LIST[Number(itemId.slice(3))].symbol} `)}
            />
            <Dropdown
              label="Insert function" icon="add" size="sm" searchable searchPlaceholder="Search functions" disabled={locked}
              items={functions.map((f, i) => ({ id: `fn-${i}`, label: f.syntax ?? f.name, description: f.description }))}
              onSelect={(itemId) => insert(`${functions[Number(itemId.slice(3))].name}()`, 1)}
            />
            <Button size="sm" iconStart="check" disabled={disabled} onClick={runCheck}>Check syntax</Button>
            {onCalculate && <Button size="sm" iconStart="equal" disabled={disabled} onClick={runCalculate}>Calculate</Button>}
          </div>
          <textarea
            ref={areaRef} id={areaId} name={name} placeholder={placeholder} value={current}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => emit(e.target.value)}
            required={required} disabled={disabled} readOnly={readOnly} spellCheck={false}
            aria-invalid={bad || undefined} aria-describedby={describedBy}
            className={[styles.area, styles[size]].join(" ")}
          />
        </div>
        {message && <p id={messageId} className={messageClass}>{message}</p>}
        {/* Check and Calculate results are announced here; the visible line above can't be a live region because it comes and goes. */}
        <span className={field.srOnly} role="status">{result?.text}</span>
      </div>
    </div>
  );
}
