"use client";
import { useId, useState } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { AlertDialog, type AlertDialogProps } from "@/ui/AlertDialog/AlertDialog";
import { AppHeader, type AppHeaderDensity, type AppHeaderProps } from "@/ui/AppHeader/AppHeader";
import { Button } from "@/ui/Button/Button";
import { ButtonFilter, type ButtonFilterProps, type ButtonFilterToggle } from "@/ui/ButtonFilter/ButtonFilter";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Density, type DensityValue } from "@/ui/Density/Density";
import { Drawer, type DrawerProps } from "@/ui/Drawer/Drawer";
import { DropdownMenu, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { Modal, type ModalProps } from "@/ui/Modal/Modal";
import { SegmentedControl } from "@/ui/SegmentedControl/SegmentedControl";
import { Select } from "@/ui/Select/Select";
import { Switch } from "@/ui/Switch/Switch";
import { Textarea } from "@/ui/Textarea/Textarea";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

export type ModalDemoContent = "text" | "form";
export type DrawerDemoContent = "details" | "form";
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
  const onSubmit = (data: FormData) => setSaved(`Saved: ${String(data.get("company") ?? data.get("name"))}`);

  return (
    <div style={{ display: "grid", gap: "var(--space-medium)" }}>
      {content === "details" ? (
        // Read-only rows sit flush as one list. Nothing to edit, so no Cancel or Save.
        <Form {...p}>
          <FormDisplay label="Account ID" value="ACC-2041" />
          <FormDisplay label="Account type" value="Customer" help="Set when the account is created." />
          <FormDisplay label="Billing email" value="billing@acme.com" />
          <FormDisplay label="Payment terms" value="Net 30" />
          <FormDisplay label="Tax ID" />
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

// Playground harness: a kit Button opens the real Drawer with sample details or an edit form. Not a kit piece.
export function DrawerDemo({ content = "details", ...p }: Omit<DrawerProps, "open" | "onClose" | "children" | "footer"> & { content?: DrawerDemoContent }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const formId = useId();

  // Details only read, so the footer just closes; the form's Save submits it through its id.
  const footer = content === "form" ? (
    <>
      <Button size="sm" onClick={close}>Cancel</Button>
      <Button size="sm" variant="primary" type="submit" form={formId}>Save</Button>
    </>
  ) : (
    <Button size="sm" onClick={close}>Close</Button>
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>{`Open ${p.size ?? "narrow"} drawer`}</Button>
      <Drawer {...p} open={open} onClose={close} footer={footer}>
        {content === "form" ? (
          <Form id={formId} onSubmit={close}>
            <Input label="Name" name="name" defaultValue="Maria Anders" required />
            <Input label="Email" name="email" type="email" defaultValue="maria@northwind.com" />
            <Select label="Role" options={[{ value: "billing", label: "Billing contact" }, { value: "admin", label: "Admin" }]} defaultValue="billing" />
            <Textarea label="Notes" name="notes" size="sm" placeholder="Add a note for your team" />
          </Form>
        ) : (
          <div>
            <FormDisplay label="Invoice" value="INV-1042" />
            <FormDisplay label="Account" value="Northwind Traders" />
            <FormDisplay label="Amount" value="$2,500.00" />
            <FormDisplay label="Due date" value="30 Sep 2026" />
            <FormDisplay label="Status" value="Pending" />
          </div>
        )}
      </Drawer>
    </>
  );
}

// Playground harness: the real AppHeader with its account menu wired to local state. Not a kit piece.
export function AppHeaderDemo(p: AppHeaderProps) {
  const [darkMode, setDarkMode] = useState(Boolean(p.darkMode));
  const [density, setDensity] = useState<AppHeaderDensity>(p.density ?? "default");
  const [navOpen, setNavOpen] = useState(Boolean(p.navOpen));
  // onNavToggle="{toggleNav}" in props turns on the menu button; here it flips a local open flag.
  return (
    <AppHeader
      {...p} darkMode={darkMode} onDarkModeChange={setDarkMode} density={density} onDensityChange={setDensity}
      onUserSettings={() => {}} onLogout={() => {}}
      navOpen={navOpen} onNavToggle={p.onNavToggle ? () => setNavOpen((o) => !o) : undefined}
    />
  );
}

// Playground harness: real kit controls with no size set, so the Density around them decides. Not a kit piece.
export function DensityDemo({ value = "default" }: { value?: DensityValue }) {
  return (
    <Density value={value}>
      <div style={{ display: "grid", gap: "var(--space-medium)", width: 360, maxWidth: "100%" }}>
        <Input label="Company" defaultValue="Acme Inc." />
        <Select label="Country" options={COUNTRIES} defaultValue="us" />
        <SegmentedControl label="View" options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }]} defaultValue="list" />
        <Switch label="Email notifications" defaultChecked />
        <div style={{ display: "flex", gap: "var(--space-xsmall)" }}>
          <Button>Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    </Density>
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

// Playground harness: onToggle="{toggleStatus}" in props turns on the split; here it flips a local on/off.
export function ButtonFilterDemo({ children, toggle, onToggle, ...p }: Omit<ButtonFilterProps, "children" | "onToggle"> & { children?: string; onToggle?: unknown }) {
  const [state, setState] = useState<ButtonFilterToggle | undefined>(toggle);
  const local = onToggle !== undefined || p.hasDropdown === false;
  return (
    <ButtonFilter
      {...p} toggle={local ? state : toggle}
      onToggle={local ? () => setState((s) => (s === "on" ? "off" : "on")) : undefined}
    >
      {children || "Status"}
    </ButtonFilter>
  );
}

// Playground harness for Toolbar: real filter chips (kit DropdownMenu trigger filter) with their value and on/off in
// local state. Contract props arrive as "{name}" placeholders; each one present turns on that part.
type FilterOption = { id: string; label: string };
const FILTER_SETS: { id: string; label: string; options: FilterOption[]; start?: string }[] = [
  { id: "status", label: "Status", start: "pending", options: [{ id: "pending", label: "Pending" }, { id: "paid", label: "Paid" }, { id: "overdue", label: "Overdue" }] },
  { id: "account", label: "Account Name", options: [{ id: "acme", label: "Acme Inc." }, { id: "globex", label: "Globex" }, { id: "initech", label: "Initech" }] },
  { id: "accountId", label: "Account ID", options: [{ id: "a-1001", label: "A-1001" }, { id: "a-1002", label: "A-1002" }] },
  { id: "period", label: "Period", options: [{ id: "month", label: "This month" }, { id: "last", label: "Last month" }, { id: "quarter", label: "This quarter" }] },
];
const QUICK_LINKS = [{
  heading: "Quick navigation",
  items: ["Salesforce", "Sales Tax", "Sales Team", "Team Sales", "Workgroup Sales", "Acme Inc.", "Globex", "Invoices", "Payments"].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label })),
}];
const START = Object.fromEntries(FILTER_SETS.map((f) => [f.id, f.start]));

export function ToolbarDemo(p: Record<string, unknown>) {
  const [values, setValues] = useState<Record<string, string | undefined>>(START);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const chips = FILTER_SETS.map((f) => {
    const value = values[f.id];
    return (
      <DropdownMenu
        key={f.id} trigger="filter" size="sm" label={f.label}
        text={f.options.find((o) => o.id === value)?.label}
        toggle={value ? (off[f.id] ? "off" : "on") : undefined}
        onToggle={value ? () => setOff((o) => ({ ...o, [f.id]: !o[f.id] })) : undefined}
        items={f.options.map((o) => ({ ...o, selected: o.id === value }))}
        onSelect={(id) => { setValues((v) => ({ ...v, [f.id]: v[f.id] === id ? undefined : id })); setOff((o) => ({ ...o, [f.id]: false })); }}
      />
    );
  });
  return (
    <Toolbar
      defaultFiltersOpen={Boolean(p.defaultFiltersOpen)}
      filters={p.filters ? <>{chips}</> : undefined}
      onReset={p.onReset ? () => { setValues({}); setOff({}); } : undefined}
      onApply={p.onApply ? () => {} : undefined}
      filterHelp={typeof p.filterHelp === "string" ? p.filterHelp : undefined}
      onSearchChange={p.onSearchChange ? setQuery : undefined}
      searchValue={query}
      searchGroups={p.searchGroups ? QUICK_LINKS : undefined}
      onSearchSelect={() => {}}
      onSearchViewAll={p.onSearchViewAll ? () => {} : undefined}
      views={p.views ? [{ id: "list", label: "List View" }, { id: "board", label: "Board View" }, { id: "calendar", label: "Calendar View" }] : undefined}
      onRefresh={p.onRefresh ? () => {} : undefined}
      moreActions={p.moreActions ? [{ id: "import", label: "Import" }, { id: "columns", label: "Edit columns" }, { divider: true }, { id: "delete", label: "Delete all", danger: true }] : undefined}
      onMoreSelect={() => {}}
      actions={p.actions ? <><Button size="sm">Export</Button><Button size="sm" variant="primary">Create</Button></> : undefined}
    />
  );
}
