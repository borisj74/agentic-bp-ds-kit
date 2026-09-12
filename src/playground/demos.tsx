"use client";
import { useId, useState, type ReactNode } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav, type AnchorNavProps } from "@/ui/AnchorNav/AnchorNav";
import { AlertDialog, type AlertDialogProps } from "@/ui/AlertDialog/AlertDialog";
import { Avatar } from "@/ui/Avatar/Avatar";
import { AppHeader, type AppHeaderDensity, type AppHeaderProps } from "@/ui/AppHeader/AppHeader";
import { AppShell, type AppShellProps } from "@/patterns/AppShell/AppShell";
import { ListPage, type ListPageProps, type ListPageState } from "@/patterns/ListPage/ListPage";
import { Button } from "@/ui/Button/Button";
import { ButtonFilter, type ButtonFilterProps, type ButtonFilterToggle } from "@/ui/ButtonFilter/ButtonFilter";
import { Cell, type CellSize } from "@/ui/Cell/Cell";
import { ChatComposer, type ChatComposerMode, type ChatComposerProps } from "@/ui/ChatComposer/ChatComposer";
import { ChatComposer as ChatComposerPiece } from "@/ui/ChatComposer/ChatComposer";
import { ChatHeader, type ChatHeaderProps } from "@/ui/ChatHeader/ChatHeader";
import { ChatList, type ChatListProps } from "@/ui/ChatList/ChatList";
import { ChatMessage, type ChatMessageActionId, type ChatMessageProps } from "@/ui/ChatMessage/ChatMessage";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Empty } from "@/ui/Empty/Empty";
import { Illustration, type IllustrationName } from "@/ui/Illustration/Illustration";
import { ChatWindow, type ChatWindowProps } from "@/patterns/ChatWindow/ChatWindow";
import { Density, type DensityValue } from "@/ui/Density/Density";
import { Drawer, type DrawerProps } from "@/ui/Drawer/Drawer";
import { DropdownMenu, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { Legend, type LegendProps } from "@/ui/Legend/Legend";
import { Lookup } from "@/ui/Lookup/Lookup";
import { Modal, type ModalProps } from "@/ui/Modal/Modal";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Pagination } from "@/ui/Pagination/Pagination";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { SegmentedControl } from "@/ui/SegmentedControl/SegmentedControl";
import { SideNav, type SideNavEntry, type SideNavItem } from "@/ui/SideNav/SideNav";
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

const CHAT_MENU = [
  { id: "edit", label: "Edit message", icon: "edit" },
  { id: "copy", label: "Copy message", icon: "content_copy" },
];
const CHAT_SECTIONS = [
  { id: "reasoning", label: "Reasoning", count: 1, content: "Checked the account list for the last sign-in date, then counted the ones over 90 days." },
  { id: "tools", label: "Tool References", count: 2, content: "bp_entity_schema, bp_entity_schema2" },
];
const CHAT_SUGGESTIONS = [
  { id: "new", label: "Create a new account" },
  { id: "trends", label: "Show revenue trends across accounts" },
  { id: "more", label: "View more suggestions" },
];

// Playground harness: a short conversation with the real ChatMessage, so votes and menus work. Not a kit piece.
export function ChatMessageDemo(p: Omit<ChatMessageProps, "author">) {
  const [vote, setVote] = useState<ChatMessageActionId[]>([]);
  const [said, setSaid] = useState("");
  const act = (a: ChatMessageActionId) => {
    if (a === "up" || a === "down") setVote(vote.includes(a) ? [] : [a]);
    setSaid(a === "copy" ? "Copied" : a === "share" ? "Shared" : a === "speak" ? "Reading aloud" : a === "up" ? "Marked good work" : "Marked needs work");
  };
  return (
    <div style={{ display: "grid", gap: "var(--space-large)", width: "100%", maxWidth: 460 }}>
      <ChatMessage author="user" text="How many accounts are inactive?" person={{ name: "Ana Petrovic" }} menu={CHAT_MENU} onMenuSelect={(id) => setSaid(id === "edit" ? "Editing the message" : "Copied the message")} />
      <ChatMessage
        {...p} author="assistant"
        text="42 accounts have had no activity for 90 days or more. Most sit on the Standard plan, and 11 of them still have an open balance."
        sections={CHAT_SECTIONS} suggestions={CHAT_SUGGESTIONS} pressed={vote} onAction={act} onSuggestion={(_, labelText) => setSaid(`Asked: ${labelText}`)}
      />
      {said && <p style={{ margin: 0, fontSize: "var(--font-size-xsmall)", color: "var(--text-neutral)" }}>{said}</p>}
    </div>
  );
}

const ASK_HINTS = ["Ask questions", "Analyze data", "Build dashboards", "Create reports", "Develop widgets"];
const ADD_MENU = [
  { id: "file", label: "Add file or image", icon: "attach_file" },
  { id: "playbook", label: "Run playbook", icon: "play_arrow" },
];

// Playground harness: the real ChatComposer wired up, so sending, attachments and the switches work. Not a kit piece.
export function ChatComposerDemo({ selecting: askSelecting, dictating: askDictating, mode: askMode, scopeLabel, ...p }: ChatComposerProps) {
  const [scoping, setScoping] = useState(true);
  const [files, setFiles] = useState([{ id: "raw", label: "Raw-Data.xls" }, { id: "photo", label: "Photo1.jpg" }]);
  const [selecting, setSelecting] = useState(Boolean(askSelecting));
  const [dictating, setDictating] = useState(Boolean(askDictating));
  const [mode, setMode] = useState<ChatComposerMode>(askMode ?? "quick");
  const [sent, setSent] = useState<string[]>([]);
  // The control panel sets the switches; pressing them in the box then carries on from there.
  const [from, setFrom] = useState({ askSelecting, askDictating, askMode, scopeLabel });
  if (from.askSelecting !== askSelecting || from.askDictating !== askDictating || from.askMode !== askMode || from.scopeLabel !== scopeLabel) {
    setFrom({ askSelecting, askDictating, askMode, scopeLabel });
    setScoping(true);
    setSelecting(Boolean(askSelecting));
    setDictating(Boolean(askDictating));
    setMode(askMode ?? "quick");
  }
  return (
    <div style={{ display: "grid", gap: "var(--space-small)", width: "100%", maxWidth: 460 }}>
      {sent.map((t, i) => (
        <p key={i} style={{ margin: 0, fontSize: "var(--font-size-xsmall)", color: "var(--text-neutral)" }}>{`Sent: ${t}`}</p>
      ))}
      <ChatComposer
        {...p} scopeLabel={scoping ? scopeLabel : undefined} onScopeClose={() => setScoping(false)}
        hints={ASK_HINTS} addMenu={ADD_MENU} attachments={files} onAttachmentRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
        selecting={selecting} onSelectingChange={setSelecting} dictating={dictating} onDictatingChange={setDictating}
        mode={mode} onModeChange={setMode} onSend={(text) => setSent([...sent, text].slice(-3))}
        onAdd={(id) => setFiles([...files, { id: `${id}-${files.length}`, label: id === "playbook" ? "Monthly close" : "New-file.csv" }])}
      />
    </div>
  );
}

const CHAT_ROW_MENU = [
  { id: "pin", label: "Pin", icon: "push_pin" },
  { id: "rename", label: "Rename", icon: "edit" },
  { id: "delete", label: "Delete", icon: "delete", danger: true },
];
const PINNED_MENU = [{ ...CHAT_ROW_MENU[0], id: "unpin", label: "Unpin" }, CHAT_ROW_MENU[1], CHAT_ROW_MENU[2]];
export const CHAT_GROUPS = [
  {
    id: "pinned", label: "Pinned Chats",
    items: [
      { id: "unpaid", label: "What invoices have not been paid", menu: PINNED_MENU },
      { id: "renew", label: "What customers renew in 30 days", menu: PINNED_MENU },
      { id: "failed", label: "List customers with failed payments", menu: PINNED_MENU },
    ],
  },
  {
    id: "recent", label: "Recent Chats",
    items: [
      { id: "revenue", label: "How much is our total revenue", menu: CHAT_ROW_MENU },
      { id: "invoice", label: "Create a $3450 invoice for Acme Corp", menu: CHAT_ROW_MENU },
      { id: "reminders", label: "Send reminders on overdue invoices", menu: CHAT_ROW_MENU },
      { id: "delinquent", label: "List all delinquent accounts", menu: CHAT_ROW_MENU },
    ],
  },
];
export const PLAYBOOK_ITEMS = [
  { id: "entity", label: "Create Entity", icon: "play_circle" },
  { id: "field", label: "Create Entity Field", icon: "play_circle" },
  { id: "coupling", label: "Coupling Account & Billing Profile", icon: "play_circle" },
  { id: "template", label: "Editing Invoice Template", icon: "play_circle" },
  { id: "action", label: "Setup Workflow Action", icon: "play_circle" },
  { id: "rule", label: "Setup Workflow Rule", icon: "play_circle" },
  { id: "custom", label: "Custom User Playbook", icon: "play_circle", menu: [{ id: "edit", label: "Edit", icon: "edit" }, { id: "delete", label: "Delete", icon: "delete", danger: true }] },
];

// Playground harness: the real ChatList with the open row and its menus wired up. Not a kit piece.
export function ChatListDemo(p: ChatListProps) {
  const [open, setOpen] = useState(p.groups ? "unpaid" : "entity");
  const [said, setSaid] = useState("");
  return (
    <div style={{ display: "grid", gap: "var(--space-xsmall)", width: 340 }}>
      <div style={{ height: 420, border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden" }}>
        <ChatList
          {...p} selected={open} onSelect={(id) => { setOpen(id); setSaid(`Opened ${id}`); }}
          onItemMenuSelect={(itemId, actionId) => setSaid(`${actionId} on ${itemId}`)}
          onCreate={() => setSaid("Started a new one")} onClose={() => setSaid("Closed the panel")}
          more={p.groups ? { label: "View chats older than 30 days", onClick: () => setSaid("Looked further back") } : undefined}
        />
      </div>
      {said && <p style={{ margin: 0, fontSize: "var(--font-size-xsmall)", color: "var(--text-neutral)" }}>{said}</p>}
    </div>
  );
}

// Playground harness: the real ChatHeader with Plan Mode and full screen wired up. Not a kit piece.
export function ChatHeaderDemo(p: ChatHeaderProps) {
  const [plan, setPlan] = useState(Boolean(p.planMode));
  const [full, setFull] = useState(Boolean(p.expanded));
  const [said, setSaid] = useState("");
  const [from, setFrom] = useState({ planMode: p.planMode, expanded: p.expanded });
  if (from.planMode !== p.planMode || from.expanded !== p.expanded) {
    setFrom({ planMode: p.planMode, expanded: p.expanded });
    setPlan(Boolean(p.planMode));
    setFull(Boolean(p.expanded));
  }
  return (
    <div style={{ display: "grid", gap: "var(--space-xsmall)", width: "100%", maxWidth: 460 }}>
      <ChatHeader
        {...p} planMode={plan} onPlanModeChange={setPlan} expanded={full} onExpandedChange={setFull}
        onNewChat={() => setSaid("Started a new chat")} onClose={() => setSaid("Closed the assistant")}
        onMenuSelect={(id) => setSaid(id === "planMode" ? "Switched Plan Mode" : `Opened ${id}`)}
      />
      {said && <p style={{ margin: 0, fontSize: "var(--font-size-xsmall)", color: "var(--text-neutral)" }}>{said}</p>}
    </div>
  );
}

const START_SUGGESTIONS = [
  { id: "learn", label: "Learn about BP AI" },
  { id: "dashboard", label: "Build a dashboard" },
  { id: "records", label: "Create or update records" },
  { id: "draft", label: "Draft document" },
  { id: "overview", label: "Review recent message overview" },
  { id: "trends", label: "Review message volume trends" },
  { id: "more", label: "View more suggestions" },
];

// Whatever page the assistant is opened from: the scope row takes its name, or is gone when there is none.
const SCOPE_PAGES: Record<string, string | undefined> = {
  accounts: "Accounts page",
  product: "Product page",
  invoice: "Invoice page",
  none: undefined,
};

// Figma BP AI get started 476:7442: the mark and the name in the middle, the starters stacked under them
// against the left edge of the window, in line with the notice and the box. Shared, so the assistant opens
// the same way whether it is shown on its own or beside a screen.
function GetStarted({ art = "ai-chip", moving = false, onPick }: { art?: IllustrationName; moving?: boolean; onPick: (label: string) => void }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-medium)" }}>
      {/* The name is the biggest thing on an otherwise empty panel, so the title steps up one size.
          Only the size the kit Empty reads for its title is swapped; the component is untouched. */}
      <div style={{ ["--font-size-large" as string]: "var(--font-size-xxlarge)" }}>
        <Empty title="Get Started" media={<Illustration name={art} animated={moving} />} />
      </div>
      {/* The starters sit on the quiet grey rather than white paper, so they read as things to pick,
          not as the buttons of a form. The kit Button is unchanged: only the surface under it is. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "var(--space-xsmall)", ["--surface-raised" as string]: "var(--bg-neutral-subtle)" }}>
        {START_SUGGESTIONS.map((s) => (
          <Button key={s.id} size="sm" onClick={() => onPick(s.label)}>{s.label}</Button>
        ))}
      </div>
    </div>
  );
}

// Playground harness: the ChatWindow pattern driven like a screen would drive it. Not a kit piece.
export function ChatWindowDemo({ started = false, page = "accounts", size: asked = "panel", ...p }: Omit<ChatWindowProps, "composer"> & { started?: boolean; page?: string }) {
  const [turns, setTurns] = useState<{ id: string; author: "user" | "assistant"; text: string }[]>(
    started ? [{ id: "q1", author: "user", text: "How many accounts are inactive?" }, { id: "a1", author: "assistant", text: "42 accounts have had no activity for 90 days or more." }] : [],
  );
  const [view, setView] = useState<"chat" | "chats" | "playbooks">("chat");
  const [notice, setNotice] = useState(true);
  const [plan, setPlan] = useState(false);
  const [scoping, setScoping] = useState(true);
  // A new chat opens on the magnifier art; the first opening of the assistant on the AI chip.
  const [freshChat, setFreshChat] = useState(false);
  // The screen owns the size, so the full-screen button in the header works like it does on its own.
  const [size, setSize] = useState(asked);
  const [from, setFrom] = useState({ started, asked, page });
  if (from.started !== started || from.asked !== asked || from.page !== page) {
    setFrom({ started, asked, page });
    setSize(asked);
    setScoping(true);
    setFreshChat(false);
    setTurns(started ? [{ id: "q1", author: "user", text: "How many accounts are inactive?" }, { id: "a1", author: "assistant", text: "42 accounts have had no activity for 90 days or more." }] : []);
  }
  const ask = (text: string) => setTurns((old) => [
    ...old,
    { id: `q${old.length}`, author: "user" as const, text },
    { id: `a${old.length}`, author: "assistant" as const, text: "Here is what I found. 42 accounts have had no activity for 90 days or more." },
  ]);
  return (
    // Tall enough to show the whole window, the way it stands beside a real screen (Figma panel 411 x 1044).
    <div style={{ height: 800, display: "flex", justifyContent: "center", background: "var(--bg-neutral-subtle)" }}>
      <ChatWindow
        {...p}
        size={size} expanded={size === "full"} onExpandedChange={(full) => setSize(full ? "full" : "panel")}
        title="BP AI" chatsCount={7} playbooksCount={9} planMode={plan} onPlanModeChange={setPlan}
        onNewChat={() => { setTurns([]); setView("chat"); setFreshChat(true); }} onClose={() => setView("chat")}
        onMenuSelect={(id) => { if (id === "chats" || id === "playbooks") setView(view === id ? "chat" : id); }}
        notice={notice ? "AI can make mistakes, verify important information." : undefined}
        onNoticeDismiss={() => setNotice(false)}
        panelOpen={view !== "chat"}
        panel={
          <ChatList
            title={view === "playbooks" ? "Playbooks" : "Chats"}
            groups={view === "playbooks" ? undefined : CHAT_GROUPS}
            items={view === "playbooks" ? PLAYBOOK_ITEMS : undefined}
            onClose={() => setView("chat")} onCreate={() => setView("chat")}
            more={view === "playbooks" ? undefined : { label: "View chats older than 30 days" }}
          />
        }
        empty={<GetStarted art={freshChat ? "chat-search" : "ai-chip"} moving={freshChat} onPick={ask} />}
        // The scope row names whatever page the person is on, and is gone on a page with nothing to scope to.
        composer={<ChatComposerPiece scopeLabel={scoping ? SCOPE_PAGES[page] : undefined} onScopeClose={() => setScoping(false)} defaultScoped hints={ASK_HINTS} addMenu={ADD_MENU} onSend={ask} />}
      >
        {turns.length > 0 ? turns.map((t) => <ChatMessage key={t.id} author={t.author} text={t.text} person={{ name: "Ana Petrovic" }} />) : null}
      </ChatWindow>
    </div>
  );
}

// Sample screen for the AppShell harness: the real app sections, two page blocks.
// SideNav sample: the app sections and menus from the Figma secondary navigation. "-" is a divider.
export const menu = (section: string, labels: string[]) =>
  labels.map((l) => (l === "-" ? { divider: true as const } : { id: `${section}-${l.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label: l }));
export const SIDE_NAV_SECTIONS: SideNavEntry[] = [
  { id: "home", label: "Home", icon: "home", children: menu("home", ["Home Dashboards", "Approval Management", "Alert Groups", "Grouped Activity"]) },
  { id: "accounts", label: "Accounts", icon: "group" },
  { id: "products", label: "Products", icon: "inventory_2", children: menu("products", ["Products", "Product Categories", "Packages", "Rate Classes"]) },
  { divider: true },
  { id: "quotes", label: "Quotes", icon: "request_quote", children: menu("quotes", ["Quotes", "Quote Rules", "Product Relationships"]) },
  { id: "orders", label: "Orders", icon: "shopping_cart" },
  { id: "billing", label: "Billing", icon: "receipt_long", children: menu("billing", ["Invoices", "Invoice Management", "Statements", "Electronic Files", "Invoice Periods", "Tiered Pricing", "Bulk Actions"]) },
  { id: "ar", label: "AR", icon: "account_balance", children: menu("ar", ["Account Ledgers", "Payments & Refunds", "BP Payouts", "Payouts", "Chargebacks", "Scheduled Payment Retries", "-", "Lockbox Files", "Lockbox Matching Rules", "Unreconciled Payments", "-", "Credit Memos", "Bulk Approve/Reject Credits"]) },
  { id: "revenue", label: "Revenue", icon: "monetization_on", children: menu("revenue", ["Month-End Close Dashboard", "Chart of Accounts", "Chart of Account Categories", "General Ledger", "General Ledger Rules", "Journal Entries", "Ledger Accrual History", "-", "SSP Profiles", "Revenue Allocation Groups", "Revenue Allocation Routines", "-", "Accounting Period Configuration", "Legal Entities"]) },
  { id: "mediation", label: "Mediation", icon: "speed", children: menu("mediation", ["Usage Collectors", "Usage Identifiers", "MDL Events", "Unaggregated Data Browser", "Usage Reload", "Usage Data"]) },
  { divider: true },
  { id: "reports", label: "Reports", icon: "summarize", children: menu("reports", ["Reports Home", "AI Report Builder", "-", "Accounting", "Accounts & Insights", "AR", "Billing", "Financials", "Payments & Credits", "Products", "Revenue", "-", "All Reports"]) },
  { id: "settings", label: "Settings", icon: "settings", children: menu("settings", ["Settings Home", "Develop", "External Connectors", "Security & Users", "Monitoring & Logs", "System", "Configuration Deployment", "-", "AI Settings", "Billing", "Payments", "Financials & Revenue", "Collections"]) },
];
export const SIDE_NAV_END: SideNavItem[] = [
  { id: "recycle", label: "Recycle Bin", icon: "recycling" },
  { id: "processes", label: "Processes", icon: "tune" },
];

const SHELL_SCORES = [
  { id: "open", title: "Open invoices", metric: "1,284", trend: { value: "4.2", unit: "%", status: "success" as const, direction: "up" as const } },
  // One card carries a badge and one a sparkline, so both show beside the plain ones.
  { id: "overdue", title: "Overdue", metric: "312", badge: "Needs review", trend: { value: "1.8", unit: "%", status: "danger" as const, direction: "up" as const } },
  {
    id: "collected", title: "Collected", metric: "$4.1M", metadata: "Last 30 days",
    trend: { value: "6.5", unit: "%", status: "success" as const, direction: "up" as const },
    chart: { points: [12, 18, 15, 24, 22, 31, 29, 38], status: "success" as const, area: true },
  },
  { id: "disputed", title: "Disputed", metric: "48", trend: { value: "0.4", unit: "%", status: "success" as const, direction: "down" as const } },
  { id: "credits", title: "Credit memos", metric: "$212K", trend: { value: "2.1", unit: "%", status: "neutral" as const, direction: "none" as const } },
  { id: "dso", title: "Days sales outstanding", metric: "41", metadata: "Target 38", trend: { value: "3", unit: "days", status: "danger" as const, direction: "up" as const } },
];
const SHELL_COLUMNS: TableColumn[] = [
  { key: "id", header: "Invoice", emphasis: true }, { key: "account", header: "Account" }, { key: "due", header: "Due" },
  { key: "amount", header: "Amount", numeric: true }, { key: "actions", header: "", align: "end", width: "96px" },
];
// The row's own actions: the two it is used for as icon buttons, the rest behind More.
const rowActions = (
  <Cell
    type="actionIcons" align="end"
    actions={[
      { label: "Send", icon: "send" },
      { label: "Download PDF", icon: "download" },
    ]}
    menu={[
      { label: "View invoice", icon: "open_in_new" },
      { label: "Record payment", icon: "payments" },
      { label: "Duplicate", icon: "content_copy" },
      { label: "Credit memo", icon: "receipt_long" },
      { label: "Void", icon: "block", variant: "danger" },
    ]}
  />
);
const SHELL_ROWS: TableRow[] = [
  { id: "INV-4471", account: "Northwind Holdings", due: "12 Sep 2026", amount: "$18,400.00", actions: rowActions },
  { id: "INV-4472", account: "Globex Corporation", due: "14 Sep 2026", amount: "$7,250.00", actions: rowActions },
  { id: "INV-4473", account: "Initech Group", due: "18 Sep 2026", amount: "$2,980.00", actions: rowActions },
  { id: "INV-4474", account: "Umbrella Health", due: "21 Sep 2026", amount: "$44,120.00", actions: rowActions },
];

// What the bar carries on a product screen: recent records in the search, the scopes it can search in,
// and the three utility buttons.
const SHELL_SEARCH = [
  {
    heading: "Recent",
    items: [
      { id: "r1", label: "Acme Inc. \u2014 renewal quote", icon: "description" },
      { id: "r2", label: "Premium support plan", icon: "radio_button_unchecked" },
      { id: "r3", label: "Q3 revenue report", icon: "bar_chart" },
      { id: "r4", label: "INV-1042", icon: "description" },
    ],
  },
];
const SHELL_SEARCH_SCOPES = [
  { value: "products", label: "Products" },
  { value: "accounts", label: "Accounts" },
  { value: "invoices", label: "Invoices" },
];
const SHELL_HEADER_ACTIONS = [
  { id: "help", label: "Help", icon: "help" },
  { id: "news", label: "What's new", icon: "campaign" },
  { id: "feedback", label: "Feedback", icon: "chat_info" },
];

// Playground harness: the AppShell pattern driven like a screen would drive it. Not a kit piece.
// How wide the preview box is, so the frame can be watched answering to its own width.
const STAGE_WIDTHS: Record<string, number | undefined> = { desktop: undefined, laptop: 1024, tablet: 768, phone: 390 };

export function AppShellDemo({ assistant = false, stage = "desktop", ...p }: Omit<AppShellProps, "children" | "assistant"> & { assistant?: boolean; stage?: string }) {
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("billing-invoices");
  const [scope, setScope] = useState("invoices");
  const [notice, setNotice] = useState(true);
  const [scoping, setScoping] = useState(true);
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [chatOpen, setChatOpen] = useState(assistant);
  const [turns, setTurns] = useState<{ id: string; author: "user" | "assistant"; text: string }[]>([]);
  const [from, setFrom] = useState(assistant);
  if (from !== assistant) { setFrom(assistant); setChatOpen(assistant); }
  const ask = (text: string) => setTurns((old) => [
    ...old,
    { id: `q${old.length}`, author: "user" as const, text },
    { id: `a${old.length}`, author: "assistant" as const, text: "312 invoices are overdue, worth $1.2M in total." },
  ]);

  return (
    // Tall enough for the whole frame: the bar, the nav down to its end items, the page and the assistant.
    // The box narrows with the Stage control, and the frame answers to the box, not to the window.
    <div
      style={{
        height: 900, width: STAGE_WIDTHS[stage] ?? "100%", maxWidth: "100%", marginInline: "auto",
        border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden",
      }}
    >
      <AppShell
        {...p}
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" environmentTone="success"
            searchShortcut="Ctrl+K" searchGroups={SHELL_SEARCH} searchVariant="list" searchIconStyle="tile"
            searchScopes={SHELL_SEARCH_SCOPES} searchScope={scope} onSearchScopeChange={setScope}
            onSearchSelect={() => {}}
            actions={SHELL_HEADER_ACTIONS} onAction={() => {}}
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        pageHeader={
          <PageHeader
            title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]}
            actions={
              <>
                <Button size="sm" iconStart="auto_awesome" onClick={() => setChatOpen((o) => !o)}>Ask BP AI</Button>
                <Button size="sm" variant="primary">New invoice</Button>
              </>
            }
          />
        }
        assistantOpen={chatOpen}
        assistant={
          <ChatWindow
            title="BP AI" chatsCount={7} onClose={() => setChatOpen(false)} onNewChat={() => setTurns([])}
            notice={notice ? "AI can make mistakes, verify important information." : undefined}
            onNoticeDismiss={() => setNotice(false)}
            empty={<GetStarted onPick={ask} />}
            composer={
              <ChatComposerPiece
                scopeLabel={scoping ? "Invoices page" : undefined} onScopeClose={() => setScoping(false)}
                defaultScoped hints={ASK_HINTS} addMenu={ADD_MENU} onSend={ask}
              />
            }
          >
            {turns.length > 0 ? turns.map((t) => <ChatMessage key={t.id} author={t.author} text={t.text} person={{ name: "Ana Petrovic" }} />) : null}
          </ChatWindow>
        }
      >
        <Section title="Summary" description="Where billing stands this month." collapsible>
          <Scoreboard items={SHELL_SCORES} selectable defaultSelected="overdue" scroll label="Billing summary" />
        </Section>
        <Section title="Invoices" collapsible actions={<Button size="sm" iconStart="download">Export</Button>}>
          <Table columns={SHELL_COLUMNS} rows={SHELL_ROWS} />
        </Section>
      </AppShell>
    </div>
  );
}

// Playground harness: the ListPage pattern driven like a screen would drive it. Not a kit piece.
// A longer invoice list, so the pages and the ticked-row bar have something to work on.
const LIST_ROWS: TableRow[] = Array.from({ length: 12 }, (_, i) => {
  const accounts = ["Northwind Holdings", "Globex Corporation", "Initech Group", "Umbrella Health", "Stark Logistics"];
  const status = ["Paid", "Pending", "Overdue"][i % 3];
  return {
    id: `INV-44${71 + i}`,
    account: accounts[i % accounts.length],
    status: <Cell type="badge" tone={status === "Paid" ? "success" : status === "Overdue" ? "danger" : "warning"} label={status} />,
    due: `${12 + i} Sep 2026`,
    amount: `$${(2_980 + i * 1_450).toLocaleString("en-US")}.00`,
    actions: rowActions,
  };
});
const LIST_COLUMNS: TableColumn[] = [
  { key: "id", header: "Invoice", emphasis: true }, { key: "account", header: "Account" }, { key: "status", header: "Status" },
  { key: "due", header: "Due" }, { key: "amount", header: "Amount", numeric: true },
  { key: "actions", header: "", align: "end", width: "112px" },
];

export function ListPageDemo({ state = "ready", ...p }: Omit<ListPageProps, "children"> & { state?: ListPageState }) {
  const [values, setValues] = useState<Record<string, string | undefined>>(START);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  const [picked, setPicked] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  // The control panel sets the state; clearing the ticks and the page then carries on from there.
  const [from, setFrom] = useState(state);
  if (from !== state) { setFrom(state); setPicked([]); setPage(1); }

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
  const shown = LIST_ROWS.filter((r) => String(r.id).toLowerCase().includes(query.toLowerCase()));
  const start = (page - 1) * size;

  return (
    <ListPage
      {...p}
      state={state}
      label="Invoices"
      toolbar={
        <Toolbar
          label="Invoices" filters={<>{chips}</>} defaultFiltersOpen
          onReset={() => { setValues({}); setOff({}); }} onApply={() => {}}
          searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search invoices"
          views={[{ id: "list", label: "List View" }, { id: "board", label: "Board View" }]}
          view={view} onViewChange={setView} onRefresh={() => {}}
          moreActions={[{ id: "import", label: "Import" }, { id: "export", label: "Export all" }]} onMoreSelect={() => {}}
          actions={<Button size="sm" variant="primary" iconStart="add">New invoice</Button>}
        />
      }
      bulk={
        picked.length > 0 ? (
          <>
            <strong style={{ fontSize: "var(--font-size-small)" }}>{`${picked.length} selected`}</strong>
            <Button size="sm" iconStart="send">Send</Button>
            <Button size="sm" iconStart="download">Download</Button>
            <Button size="sm" variant="danger" iconStart="block">Void</Button>
            <span style={{ marginInlineStart: "auto" }}>
              <Button size="sm" variant="tertiary" onClick={() => setPicked([])}>Clear</Button>
            </span>
          </>
        ) : undefined
      }
      pagination={
        <Pagination
          total={shown.length} page={page} onPageChange={setPage}
          pageSize={size} onPageSizeChange={(next) => { setSize(next); setPage(1); }} label="Invoices"
        />
      }
      empty={<Empty icon="receipt_long" title="No invoices yet" description="Invoices appear here once a billing run completes." actions={<Button size="sm" variant="primary" iconStart="add">New invoice</Button>} />}
      error="The invoice list could not be loaded."
      onRetry={() => {}}
    >
      <Table
        columns={LIST_COLUMNS} rows={shown.slice(start, start + size)} caption="Invoices"
        selectable selected={picked} onSelectionChange={setPicked} rowLabel="id"
      />
    </ListPage>
  );
}
