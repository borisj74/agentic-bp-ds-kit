"use client";
import { useId, useState, type ReactNode } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav, type AnchorNavProps } from "@/ui/AnchorNav/AnchorNav";
import { AlertDialog, type AlertDialogProps } from "@/ui/AlertDialog/AlertDialog";
import { Avatar } from "@/ui/Avatar/Avatar";
import { AppHeader, type AppHeaderDensity, type AppHeaderProps } from "@/ui/AppHeader/AppHeader";
import { Button } from "@/ui/Button/Button";
import { ButtonFilter, type ButtonFilterProps, type ButtonFilterToggle } from "@/ui/ButtonFilter/ButtonFilter";
import { Cell, type CellSize } from "@/ui/Cell/Cell";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Density, type DensityValue } from "@/ui/Density/Density";
import { Drawer, type DrawerProps } from "@/ui/Drawer/Drawer";
import { DropdownMenu, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { Legend, type LegendProps } from "@/ui/Legend/Legend";
import { Lookup } from "@/ui/Lookup/Lookup";
import { Modal, type ModalProps } from "@/ui/Modal/Modal";
import { SegmentedControl } from "@/ui/SegmentedControl/SegmentedControl";
import { Select } from "@/ui/Select/Select";
import { Skeleton, type SkeletonProps } from "@/ui/Skeleton/Skeleton";
import { Stepper, type StepperProps } from "@/ui/Stepper/Stepper";
import { Switch } from "@/ui/Switch/Switch";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import { Textarea } from "@/ui/Textarea/Textarea";
import { Toast, type ToastProps } from "@/ui/Toast/Toast";
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
          <Lookup label="Parent account" name="parentAccount" columns={ACCOUNT_LOOKUP_COLUMNS} rows={PARENT_ACCOUNTS} defaultValue="ACC-1001" />
          <Textarea label="Notes" name="notes" size="sm" placeholder="Shown at the bottom of every invoice" />
          <Checkbox label="Send invoices by email" name="sendInvoices" defaultChecked />
        </Form>
      )}
      {saved && <Alert tone="success">{saved}</Alert>}
    </div>
  );
}

// Parent accounts for the Form demo's Lookup field.
const PARENT_ACCOUNTS: TableRow[] = [
  { id: "ACC-1001", name: "Northwind Holdings", type: "Enterprise", region: "North America", owner: "Maya Chen" },
  { id: "ACC-1002", name: "Globex Corporation", type: "Enterprise", region: "Europe", owner: "Noah Williams" },
  { id: "ACC-1003", name: "Initech Group", type: "Mid-market", region: "North America", owner: "Iris Okafor" },
  { id: "ACC-1004", name: "Umbrella Health", type: "Enterprise", region: "Asia Pacific", owner: "Jordan Lee" },
  { id: "ACC-1005", name: "Stark Logistics", type: "Mid-market", region: "Europe", owner: "Maya Chen" },
];
const ACCOUNT_LOOKUP_COLUMNS: TableColumn[] = [
  { key: "name", header: "Account name" }, { key: "id", header: "ID" }, { key: "type", header: "Type" },
  { key: "region", header: "Region" }, { key: "owner", header: "Owner" },
];

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

// Playground harness: a kit Button shows the real Toast, as an action would. Its action reopens a note. Not a kit piece.
export function ToastDemo(p: Omit<ToastProps, "open" | "onClose" | "onAction">) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: "var(--space-xsmall)" }}>
      <Button onClick={() => { setDone(""); setOpen(true); }}>{`Show ${p.tone ?? "info"} toast`}</Button>
      {done && <span style={{ fontSize: "var(--font-size-xsmall)", color: "var(--text-neutral)" }}>{done}</span>}
      <Toast {...p} open={open} onClose={() => setOpen(false)} onAction={() => setDone(`${p.actionLabel} picked`)} />
    </div>
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

// Playground harness: a kit Table whose first column is tree Cells, parent and child accounts that open and close.
// The Table and Cells are the real kit; this only keeps which rows are open. Not a kit piece.
interface AccountNode { id: string; name: string; owner: string; mrr: string; icon?: string; children?: AccountNode[] }
const ACCOUNT_TREE: AccountNode[] = [
  { id: "acme", name: "Acme Holdings", owner: "Maya Chen", mrr: "$48,200", icon: "domain", children: [
    { id: "acme-us", name: "Acme US", owner: "Noah Williams", mrr: "$31,500", icon: "domain", children: [
      { id: "acme-east", name: "Acme East", owner: "Iris Okafor", mrr: "$18,900", icon: "store" },
      { id: "acme-west", name: "Acme West", owner: "Jordan Lee", mrr: "$12,600", icon: "store" },
    ] },
    { id: "acme-eu", name: "Acme EU", owner: "Maya Chen", mrr: "$16,700", icon: "store" },
  ] },
  { id: "globex", name: "Globex", owner: "Jordan Lee", mrr: "$22,400", icon: "domain", children: [
    { id: "globex-retail", name: "Globex Retail", owner: "Iris Okafor", mrr: "$22,400", icon: "store" },
  ] },
  { id: "initech", name: "Initech", owner: "Noah Williams", mrr: "$9,800", icon: "store" },
];

export function CellTreeDemo({ size, checkbox = false, showLines = true, icons = true }: { size?: CellSize; checkbox?: boolean; showLines?: boolean; icons?: boolean }) {
  const [open, setOpen] = useState<string[]>(["acme", "acme-us"]);
  const rows: { id: string; account: ReactNode; owner: string; mrr: string }[] = [];
  const add = (list: AccountNode[], level: number) => list.forEach((a) => {
    const isOpen = open.includes(a.id);
    rows.push({
      id: a.id, owner: a.owner, mrr: a.mrr,
      account: (
        <Cell
          type="tree" size={size} label={a.name} level={level} checkbox={checkbox} showLines={showLines} icon={icons ? a.icon : undefined}
          expanded={a.children ? isOpen : undefined}
          onExpandedChange={(next) => setOpen((o) => (next ? [...o, a.id] : o.filter((id) => id !== a.id)))}
        />
      ),
    });
    if (a.children && isOpen) add(a.children, level + 1);
  });
  add(ACCOUNT_TREE, 1);
  return (
    <Table
      size={size} caption="Accounts and their sub-accounts"
      columns={[{ key: "account", header: "Account", width: "45%" }, { key: "owner", header: "Owner" }, { key: "mrr", header: "MRR", numeric: true }]}
      rows={rows}
    />
  );
}

// Playground harness: kit Skeletons in the layout of real content (a card, a list, a table), each wrapping the content
// it stands for, so turning loading off swaps in the real thing. Not a kit piece.
export type SkeletonDemoLayout = "single" | "card" | "list" | "table";
const PEOPLE = [
  { name: "Maya Chen", email: "maya@acme.com", src: "/faces/maya-chen.jpg" },
  { name: "Noah Williams", email: "noah@acme.com", src: "/faces/noah-williams.jpg" },
  { name: "Iris Okafor", email: "iris@acme.com", src: "/faces/iris-okafor.jpg" },
];
const panel = { display: "grid", gap: "var(--space-small)", padding: "var(--space-medium)", background: "var(--surface-flat)", borderRadius: "var(--radius-medium)", border: "var(--border-width-thin) solid var(--border-neutral-faint)" } as const;
const person = { display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: "var(--space-small)" } as const;
const copy = { display: "grid", gap: "var(--space-xxxsmall)", minWidth: 0, fontSize: "var(--font-size-small)" } as const;

export function SkeletonDemo({ layout = "single", ...p }: SkeletonProps & { layout?: SkeletonDemoLayout }) {
  const { loading = true, animation } = p;
  const bone = (props: SkeletonProps, content: ReactNode) => <Skeleton loading={loading} animation={animation} label="" {...props}>{content}</Skeleton>;
  const row = (who: (typeof PEOPLE)[number], first: boolean) => (
    <div key={who.name} style={person}>
      {bone({ shape: "circle", size: "md", label: first ? "Loading people" : "" }, <Avatar name={who.name} src={who.src} size="md" />)}
      <div style={copy}>
        {bone({ size: "sm", width: "40%" }, <strong>{who.name}</strong>)}
        {bone({ size: "sm", width: "60%" }, <span style={{ color: "var(--text-neutral)" }}>{who.email}</span>)}
      </div>
    </div>
  );

  if (layout === "card") {
    return (
      <div style={{ ...panel, width: 320 }}>
        {row(PEOPLE[0], true)}
        {bone({ shape: "rect", height: 96 }, <div style={{ height: 96, borderRadius: "var(--radius-medium)", background: "var(--bg-brand-faint)", display: "grid", placeItems: "center", color: "var(--text-brand)" }}>Q3 revenue up 12%</div>)}
        {bone({ lines: 2, size: "sm" }, <p style={{ margin: 0, fontSize: "var(--font-size-small)" }}>Renewals closed early this quarter, and two new accounts signed annual plans.</p>)}
      </div>
    );
  }
  if (layout === "list") return <div style={{ ...panel, width: 320 }}>{PEOPLE.map((who, i) => row(who, i === 0))}</div>;
  if (layout === "table") {
    // One text line per cell, padded like a Cell, keeps the columns in place while rows load.
    const cell = (text: string, first = false) => (
      <div style={{ padding: "var(--space-small)" }}>{bone({ size: "sm", width: first ? "70%" : "50%", label: first ? "Loading invoices" : "" }, <span style={{ fontSize: "var(--font-size-small)" }}>{text}</span>)}</div>
    );
    const rows = [["INV001", "Paid", "$250.00"], ["INV002", "Pending", "$150.00"], ["INV003", "Unpaid", "$350.00"], ["INV004", "Paid", "$450.00"]]
      .map(([invoice, status, amount], i) => ({ id: invoice, invoice: cell(invoice, i === 0), status: cell(status), amount: cell(amount) }));
    return (
      <div style={{ width: 480 }}>
        <Table size="sm" columns={[{ key: "invoice", header: "Invoice" }, { key: "status", header: "Status" }, { key: "amount", header: "Amount" }]} rows={rows} />
      </div>
    );
  }
  // One Skeleton, wrapping the content it stands for.
  const real = p.shape === "circle"
    ? <Avatar name="Maya Chen" src="/faces/maya-chen.jpg" size={p.size === "sm" ? "sm" : p.size === "lg" ? "lg" : "md"} />
    : p.shape === "rect"
      ? <div style={{ height: 96, borderRadius: "var(--radius-medium)", background: "var(--bg-brand-faint)", display: "grid", placeItems: "center", color: "var(--text-brand)" }}>Chart ready</div>
      : <p style={{ margin: 0 }}>Invoices sync every night at 2 AM. Failed payments retry after three days, then the account owner gets an email.</p>;
  return <div style={{ width: 320 }}><Skeleton {...p}>{real}</Skeleton></div>;
}

// Playground harness: the real Stepper walked with Back and Next, and done steps clickable. Not a kit piece.
export function StepperDemo({ current = 1, steps, ...p }: StepperProps) {
  const [at, setAt] = useState(current);
  const [from, setFrom] = useState(current);
  // A new start step from the controls resets the walk.
  if (from !== current) { setFrom(current); setAt(current); }
  const last = steps.length;
  return (
    <div style={{ display: "grid", gap: "var(--space-large)", width: "100%" }}>
      <Stepper {...p} steps={steps} current={at} onStepClick={setAt} />
      <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-xsmall)" }}>
        <Button size="sm" disabled={at <= 1} onClick={() => setAt(Math.max(at - 1, 1))}>Back</Button>
        <Button size="sm" variant="primary" disabled={at > last} onClick={() => setAt(at + 1)}>{at >= last ? "Finish" : "Next"}</Button>
      </div>
    </div>
  );
}

const PAGE_SECTIONS = [
  { id: "demo-details", label: "Details", body: "Name, owner and the account this record belongs to." },
  { id: "demo-billing", label: "Billing", body: "Terms, the billing day and the invoice the run writes to." },
  { id: "demo-usage", label: "Usage", body: "Metered lines, the rate they are billed at and this period's totals." },
  { id: "demo-history", label: "History", body: "Every change on the record, newest first." },
];

// Playground harness: the real AnchorNav beside a short scrolling page, so the caret follows. Not a kit piece.
export function AnchorNavDemo(p: Omit<AnchorNavProps, "items">) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", gap: "var(--space-xlarge)", alignItems: "start" }}>
      <AnchorNav {...p} items={PAGE_SECTIONS.map(({ id, label }) => ({ id, label }))} />
      <div style={{ height: 260, overflowY: "auto", display: "grid", gap: "var(--space-large)", padding: "var(--space-medium)", background: "var(--surface-flat)", border: "var(--border-width-thin) solid var(--border-neutral-faint)", borderRadius: "var(--radius-large)" }}>
        {PAGE_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} style={{ display: "grid", gap: "var(--space-xsmall)", minHeight: 200 }}>
            <h3 style={{ margin: 0, font: "var(--font-weight-semibold) var(--font-size-regular) / var(--line-height-snug) var(--font-sans)", color: "var(--text-neutral-strong)" }}>{s.label}</h3>
            <p style={{ margin: 0, fontSize: "var(--font-size-small)", lineHeight: "var(--line-height-normal)", color: "var(--text-neutral)" }}>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

// Playground harness: the real Legend with its keys wired up, so switching one off shows. Not a kit piece.
export function LegendDemo(p: LegendProps) {
  const [hidden, setHidden] = useState<string[]>([]);
  return <Legend {...p} hidden={hidden} onHiddenChange={setHidden} />;
}
