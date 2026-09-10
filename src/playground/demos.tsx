"use client";
import { useId, useState } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { AlertDialog, type AlertDialogProps } from "@/ui/AlertDialog/AlertDialog";
import { Button } from "@/ui/Button/Button";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { DropdownMenu, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { Modal, type ModalProps } from "@/ui/Modal/Modal";
import { Select } from "@/ui/Select/Select";
import { Switch } from "@/ui/Switch/Switch";
import { Textarea } from "@/ui/Textarea/Textarea";

export type ModalDemoContent = "text" | "form";
export type FormDemoContent = "fields" | "sections" | "details";

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "rs", label: "Serbia" },
];

// Playground harness: the real Form filled with sample kit fields. Save shows what was submitted. Not a kit piece.
export function FormDemo({ content = "fields", ...p }: Omit<FormProps, "children" | "sections" | "actions" | "onSubmit"> & { content?: FormDemoContent }) {
  const [saved, setSaved] = useState("");
  const size = p.variant === "card" ? "sm" : "md";
  const actions = (
    <>
      <Button size={size} onClick={() => setSaved("")}>Cancel</Button>
      <Button size={size} variant="primary" type="submit">Save</Button>
    </>
  );
  const onSubmit = (data: FormData) => setSaved(`Saved: ${String(data.get("company") ?? data.get("name") ?? data.get("po"))}`);

  return (
    <div style={{ display: "grid", gap: "var(--space-medium)" }}>
      {content === "details" ? (
        // Read-only rows sit flush as one list; the editable field below lines up with them.
        <Form {...p} actions={actions} onSubmit={onSubmit}>
          <FormDisplay label="Account ID" value="ACC-2041" />
          <FormDisplay label="Account type" value="Customer" help="Set when the account is created." />
          <FormDisplay label="Billing email" value="billing@acme.com" />
          <FormDisplay label="Payment terms" value="Net 30" />
          <FormDisplay label="Tax ID" />
          <Input label="PO number" name="po" placeholder="PO-0000" hint="Printed on the next invoice." required />
        </Form>
      ) : content === "sections" ? (
        <Form
          {...p}
          actions={actions}
          onSubmit={onSubmit}
          sections={[
            {
              title: "Profile",
              description: "How people see you in the app.",
              content: (
                <>
                  <Input label="Full name" name="name" defaultValue="Maya Chen" required />
                  <Input label="Email" name="email" type="email" defaultValue="maya@acme.com" />
                </>
              ),
            },
            {
              title: "Notifications",
              description: "Choose what we email you about.",
              content: (
                <>
                  <Switch label="Invoice paid" name="paid" defaultChecked />
                  <Switch label="Payment failed" name="failed" defaultChecked />
                  <Switch label="Weekly summary" name="weekly" />
                </>
              ),
            },
          ]}
        />
      ) : (
        <Form {...p} actions={actions} onSubmit={onSubmit}>
          <Input label="Company" name="company" defaultValue="Acme Inc." required />
          <Input label="Tax ID" name="taxId" placeholder="US-00-0000000" />
          <Input label="Billing email" name="email" type="email" defaultValue="billing@acme.com" hint="Invoices and receipts go here." />
          <Select label="Country" name="country" options={COUNTRIES} defaultValue="us" />
          <Textarea label="Notes" name="notes" size="sm" placeholder="Shown at the bottom of every invoice" />
          <Checkbox label="Send invoices by email" name="sendInvoices" defaultChecked />
        </Form>
      )}
      {saved && <Alert tone="success">{saved}</Alert>}
    </div>
  );
}

// Playground harness: a kit Button opens the real Modal with sample body content. Not a kit piece.
export function ModalDemo({ content = "text", ...p }: Omit<ModalProps, "open" | "onClose" | "children" | "footer"> & { content?: ModalDemoContent }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const formId = useId();

  // In form mode, Save sits in the Modal footer and submits the Form through its id.
  const footer = (
    <>
      <Button size="sm" onClick={close}>Cancel</Button>
      {content === "form"
        ? <Button size="sm" variant="primary" type="submit" form={formId}>Save</Button>
        : <Button size="sm" variant="primary" onClick={close}>Done</Button>}
    </>
  );
  const trigger = content === "form" ? "Edit customer" : `Open ${p.size ?? "sm"} modal`;

  return (
    <>
      <Button onClick={() => setOpen(true)}>{trigger}</Button>
      <Modal {...p} open={open} onClose={close} footer={footer}>
        {content === "form" ? (
          <Form id={formId} onSubmit={close}>
            <Input label="Company" name="company" defaultValue="Acme Inc." required />
            <Input label="Billing email" name="email" type="email" defaultValue="billing@acme.com" />
            <Textarea label="Notes" name="notes" size="sm" placeholder="Add a note for your team" />
          </Form>
        ) : (
          <p style={{ margin: 0 }}>Modals hold a short task or extra detail. Press Escape, the ×, or click outside to close.</p>
        )}
      </Modal>
    </>
  );
}

// Playground harness: a kit Button that opens the real AlertDialog. Not a kit piece.
export function AlertDialogDemo(p: Omit<AlertDialogProps, "open" | "onCancel" | "onAction">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Show dialog</Button>
      <AlertDialog {...p} open={open} onCancel={() => setOpen(false)} onAction={() => setOpen(false)} />
    </>
  );
}

// Playground harness: keeps the real DropdownMenu's items in state so checkbox and single-choice items respond. Not a kit piece.
export function DropdownMenuDemo(p: DropdownMenuProps) {
  const [items, setItems] = useState(p.items);
  const onSelect = (id: string) =>
    setItems((list) =>
      list.map((e) => {
        if ("divider" in e) return e;
        if (e.checkbox) return e.id === id ? { ...e, selected: !e.selected } : e;
        if (e.selected !== undefined) return { ...e, selected: e.id === id };
        return e;
      }),
    );
  const count = p.trigger === "filter" ? items.filter((e) => !("divider" in e) && e.checkbox && e.selected).length : p.count;
  return <DropdownMenu {...p} items={items} count={count} onSelect={onSelect} />;
}

// Playground-only Calculate for FormulaEditor: fills sample field values, then works out + - * / and brackets.
// Not a kit formula engine; real screens pass their own onCalculate.
const SAMPLE_FIELDS: Record<string, number> = { Amount: 1250, "Account.Discount": 0.1, "Invoice.Quantity": 3, "Invoice.Total": 1250 };

export function calculate(formula: string): string {
  const src = formula.replace(/\{!([\w.]+)\}/g, (_, id: string) => String(SAMPLE_FIELDS[id] ?? 0));
  if (!/^[\d\s+\-*/().]+$/.test(src)) throw new Error("This preview only calculates numbers, fields and + - * /.");
  let i = 0;
  const skip = () => { while (/\s/.test(src[i] ?? "")) i++; };
  const atom = (): number => {
    skip();
    if (src[i] === "(") { i++; const v = sum(); skip(); if (src[i++] !== ")") throw new Error("A closing ) is missing."); return v; }
    if (src[i] === "-") { i++; return -atom(); }
    const m = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error("A number is missing.");
    i += m[0].length;
    return Number(m[0]);
  };
  const product = (): number => {
    let v = atom();
    for (skip(); src[i] === "*" || src[i] === "/"; skip()) { const op = src[i++]; const r = atom(); v = op === "*" ? v * r : v / r; }
    return v;
  };
  const sum = (): number => {
    let v = product();
    for (skip(); src[i] === "+" || src[i] === "-"; skip()) { const op = src[i++]; const r = product(); v = op === "+" ? v + r : v - r; }
    return v;
  };
  const v = sum();
  skip();
  if (i < src.length) throw new Error("There is extra text at the end.");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);
}
