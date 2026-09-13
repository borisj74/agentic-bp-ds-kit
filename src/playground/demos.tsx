"use client";
import { useId, useState, type ReactNode } from "react";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav, type AnchorNavProps } from "@/ui/AnchorNav/AnchorNav";
import { AlertDialog, type AlertDialogProps } from "@/ui/AlertDialog/AlertDialog";
import { Avatar } from "@/ui/Avatar/Avatar";
import { AppHeader, type AppHeaderDensity, type AppHeaderProps } from "@/ui/AppHeader/AppHeader";
import { AppShell, type AppShellProps } from "@/patterns/AppShell/AppShell";
import { ListPage, type ListPageProps, type ListPageState } from "@/patterns/ListPage/ListPage";
import { FormPage, type FormPageProps } from "@/patterns/FormPage/FormPage";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";
import { Dashboard, type DashboardProps, type DashboardState } from "@/patterns/Dashboard/Dashboard";
import { SettingsPage, type SettingsPageProps } from "@/patterns/SettingsPage/SettingsPage";
import { Badge } from "@/ui/Badge/Badge";
import { Button } from "@/ui/Button/Button";
import { ButtonFilter, type ButtonFilterProps, type ButtonFilterToggle } from "@/ui/ButtonFilter/ButtonFilter";
import { Card } from "@/ui/Card/Card";
import { Cell, type CellSize } from "@/ui/Cell/Cell";
import { ChatComposer, type ChatComposerMode, type ChatComposerProps } from "@/ui/ChatComposer/ChatComposer";
import { ChatComposer as ChatComposerPiece } from "@/ui/ChatComposer/ChatComposer";
import { ChatHeader, type ChatHeaderProps } from "@/ui/ChatHeader/ChatHeader";
import { ChatList, type ChatListProps } from "@/ui/ChatList/ChatList";
import { ChatMessage, type ChatMessageActionId, type ChatMessageProps } from "@/ui/ChatMessage/ChatMessage";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { DatePicker } from "@/ui/DatePicker/DatePicker";
import { Empty } from "@/ui/Empty/Empty";
import { Illustration, type IllustrationName } from "@/ui/Illustration/Illustration";
import { ChatWindow, type ChatWindowProps } from "@/patterns/ChatWindow/ChatWindow";
import { Density, type DensityValue } from "@/ui/Density/Density";
import { Drawer, type DrawerProps } from "@/ui/Drawer/Drawer";
import { DropdownMenu, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormColumns, type FormLabelPosition, type FormProps } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { BarChart } from "@/ui/BarChart/BarChart";
import { LineChart } from "@/ui/LineChart/LineChart";
import { PieChart } from "@/ui/PieChart/PieChart";
import { Legend, type LegendProps } from "@/ui/Legend/Legend";
import { Lookup } from "@/ui/Lookup/Lookup";
import { Modal, type ModalProps } from "@/ui/Modal/Modal";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Progress } from "@/ui/Progress/Progress";
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
import { Tabs, type TabItem } from "@/ui/Tabs/Tabs";
import { Textarea } from "@/ui/Textarea/Textarea";
import { Toast, type ToastProps } from "@/ui/Toast/Toast";
import { Tile, type TileTone } from "@/ui/Tile/Tile";
import { Timeline } from "@/ui/Timeline/Timeline";
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
  // Dark mode sets the theme on the block around it, so the switch changes what you are looking at.
  return (
    <div data-theme={darkMode ? "dark" : undefined}>
      <AppHeader
        {...p} darkMode={darkMode} onDarkModeChange={setDarkMode} density={density} onDensityChange={setDensity}
        onUserSettings={() => {}} onLogout={() => {}}
        navOpen={navOpen} onNavToggle={p.onNavToggle ? () => setNavOpen((o) => !o) : undefined}
      />
    </div>
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
      moreActions={p.moreActions ? [{ id: "import", label: "Import", icon: "upload" }, { id: "columns", label: "Edit columns", icon: "view_column" }, { divider: true }, { id: "delete", label: "Delete all", icon: "delete", danger: true }] : undefined}
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
// Where a nav id lands: the section it sits under and the page's own name, for the trail and the title.
export function navPlace(id: string): { section: string; page: string; icon?: string } {
  for (const entry of SIDE_NAV_SECTIONS) {
    if ("divider" in entry) continue;
    if (entry.id === id) return { section: entry.label, page: entry.label, icon: entry.icon };
    for (const child of entry.children ?? []) {
      if ("divider" in child) continue;
      if (child.id === id) return { section: entry.label, page: child.label, icon: entry.icon };
    }
  }
  const end = SIDE_NAV_END.find((e) => e.id === id);
  return end ? { section: end.label, page: end.label, icon: end.icon } : { section: "Home", page: "Home", icon: "home" };
}
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
  // The screen holds whether the top of the page has scrolled away; the frame only reports the crossing.
  const [compact, setCompact] = useState(false);
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
      data-theme={dark ? "dark" : undefined}
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
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        onPageHeaderStick={setCompact}
        pageHeader={
          <PageHeader
            title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]}
            sticky={compact}
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
        {/* Enough page to scroll, so the page header can be watched staying at the top and shrinking. */}
        <Section title="Billing settings" collapsible>
          <RecordFields fields={BILLING_FIELDS} />
        </Section>
      </AppShell>
    </div>
  );
}

// Playground harness: the ListPage pattern driven like a screen would drive it. Not a kit piece.
// A longer invoice list, so the pages and the ticked-row bar have something to work on.
// The records behind every view: the table, the list and the cards all read from these.
const LIST_RECORDS = Array.from({ length: 12 }, (_, i) => {
  const accounts = ["Northwind Holdings", "Globex Corporation", "Initech Group", "Umbrella Health", "Stark Logistics"];
  const paid = ["Paid", "Partially paid", "Unpaid"][i % 3];
  return {
    id: `INV-44${71 + i}`,
    account: accounts[i % accounts.length],
    paid,
    active: i % 4 !== 3,
    due: `${12 + i} Sep 2026`,
    amount: `$${(2_980 + i * 1_450).toLocaleString("en-US")}.00`,
  };
});
const LIST_PAID: Record<string, string> = Object.fromEntries(LIST_RECORDS.map((r) => [r.id, r.paid]));
const paidTone = (paid: string) => (paid === "Paid" ? "success" : paid === "Unpaid" ? "danger" : "warning");
const LIST_ROWS: TableRow[] = LIST_RECORDS.map((r) => ({
  id: r.id,
  account: r.account,
  status: <Cell type="badge" tone={paidTone(r.paid)} label={r.paid} />,
  due: r.due,
  amount: r.amount,
  actions: rowActions,
}));
// List View (BP DS Hub list view): the account is one two-line cell — its name over the record number and
// how it is paid — then whether it is active, the balance, the date and the row's actions.
const LIST_VIEW_COLUMNS: TableColumn[] = [
  { key: "account", header: "Account" }, { key: "state", header: "Status" },
  { key: "amount", header: "Balance", numeric: true }, { key: "due", header: "Date" },
  { key: "actions", header: "Actions", align: "end", width: "112px" },
];
const LIST_VIEW_ROWS: TableRow[] = LIST_RECORDS.map((r) => ({
  id: r.id,
  account: <Cell type="avatar" name={r.account} label={`${r.id} \u00b7 ${r.paid}`} />,
  state: <Cell type="badge" tone={r.active ? "success" : "neutral"} label={r.active ? "Active" : "Inactive"} />,
  amount: r.amount,
  due: r.due,
  actions: (
    <Cell
      type="actionIcons" align="end" actions={[{ label: "Edit", icon: "edit" }]}
      menu={[{ label: "Send", icon: "send" }, { label: "Download PDF", icon: "download" }, { label: "Void", icon: "block", variant: "danger" }]}
    />
  ),
}));
const LIST_COLUMNS: TableColumn[] = [
  { key: "id", header: "Invoice", emphasis: true }, { key: "account", header: "Account" }, { key: "status", header: "Status" },
  { key: "due", header: "Due" }, { key: "amount", header: "Amount", numeric: true },
  { key: "actions", header: "", align: "end", width: "112px" },
];

export function ListPageDemo({ state = "ready", shell = false, stage = "desktop", ...p }: Omit<ListPageProps, "children"> & { state?: ListPageState; shell?: boolean; stage?: string }) {
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("billing-invoices");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [values, setValues] = useState<Record<string, string | undefined>>(START);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState("table");
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

  const list = (
    <ListPage
      {...p}
      state={state}
      label="Invoices"
      toolbar={
        <Toolbar
          label="Invoices" filters={<>{chips}</>} filterCount={FILTER_SETS.filter((f) => values[f.id] && !off[f.id]).length} defaultFiltersOpen
          onReset={() => { setValues({}); setOff({}); }} onApply={() => {}}
          searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search invoices"
          views={[{ id: "table", label: "Table View" }, { id: "list", label: "List View" }, { id: "card", label: "Card View" }]}
          view={view} onViewChange={setView} onRefresh={() => {}}
          moreActions={[{ id: "import", label: "Import", icon: "upload" }, { id: "export", label: "Export all", icon: "download" }]} onMoreSelect={() => {}}
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
      {view === "card" ? (
        // Card View: the same records as kit Cards, wrapped by the layout class rather than a new grid.
        <div className="layout-metrics">
          {shown.slice(start, start + size).map((r) => (
            <Card
              key={String(r.id)} overline={String(r.id)} title={String(r.account)} amount={String(r.amount)}
              badge={LIST_PAID[String(r.id)]} badgeTone={paidTone(LIST_PAID[String(r.id)])}
              description={`Due ${String(r.due)}`}
              selectable selected={picked.includes(String(r.id))}
              onSelectedChange={(on) => setPicked((old) => (on ? [...old, String(r.id)] : old.filter((id) => id !== String(r.id))))}
            />
          ))}
        </div>
      ) : (
        <Table
          columns={view === "list" ? LIST_VIEW_COLUMNS : LIST_COLUMNS}
          rows={(view === "list" ? LIST_VIEW_ROWS : shown).slice(start, start + size)}
          selectable selected={picked} onSelectionChange={setPicked} rowLabel="id"
        />
      )}
    </ListPage>
  );

  if (!shell) return list;
  // In the frame, the way a screen would ship it.
  return (
    <div
      data-theme={dark ? "dark" : undefined}
      style={{
        height: 900, width: STAGE_WIDTHS[stage] ?? "100%", maxWidth: "100%", marginInline: "auto",
        border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden",
      }}
    >
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" searchShortcut="Ctrl+K" searchGroups={SHELL_SEARCH} searchScopes={SHELL_SEARCH_SCOPES}
            actions={SHELL_HEADER_ACTIONS} onAction={() => {}}
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        pageHeader={
          // No actions on the bar: a list keeps them in its own Toolbar, which owns the one primary.
          <PageHeader icon="receipt_long" title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]} />
        }
      >
        {list}
      </AppShell>
    </div>
  );
}

// Playground harness: the RecordPage pattern in the AppShell frame, driven like a screen would drive it.
// Not a kit piece. Follows the BP DS Hub record layout: name and actions, the record's tabs, a notice,
// the bar, the numbers, then the details in folding sections of two-column pairs.
const RECORD_TABS: TabItem[] = [
  { id: "details", label: "Details" },
  { id: "contacts", label: "Contacts", count: 4, countLabel: "contacts" },
  { id: "invoices", label: "Invoices", count: 12, countLabel: "invoices" },
  { id: "payments", label: "Payments" },
  { id: "usage", label: "Usage" },
  { id: "history", label: "History" },
];
const RECORD_NUMBERS = [
  { id: "status", title: "Status", metric: "Active", trend: { value: "2.1", unit: "% YoY", status: "success" as const, direction: "up" as const } },
  { id: "balance", title: "Current balance", metric: "$12,600.50", trend: { value: "4.8", unit: "% MoM", status: "success" as const, direction: "up" as const } },
  { id: "next", title: "Next payment", metric: "05/26/2026", trend: { value: "0", unit: "", status: "neutral" as const, direction: "none" as const } },
  { id: "since", title: "Customer since", metric: "12/02/2017", trend: { value: "8.4", unit: "% YoY", status: "success" as const, direction: "up" as const } },
];
// Each pair is a FormDisplay; the value is text unless the record says otherwise.
const ACCOUNT_FIELDS: { label: string; value: ReactNode; help: string }[] = [
  { label: "Account name", value: "Apex Digital Services", help: "The name on invoices and statements." },
  { label: "Status", value: <Badge tone="success">Active</Badge>, help: "Whether the account can be billed." },
  { label: "Account number", value: "ACC-10428", help: "Set when the account is created." },
  { label: "Industry", value: "Software & Technology", help: "Used for reporting." },
  { label: "Account type", value: "Customer", help: "Customer, prospect or partner." },
  { label: "Account owner", value: "Jordan Ellis", help: "Who looks after this account." },
  { label: "Parent account", value: "Apex Holdings", help: "The account this one rolls up to." },
  { label: "Created on", value: "Mar 14, 2024", help: "When the record was created." },
];
const BILLING_FIELDS: { label: string; value: ReactNode; help: string }[] = [
  { label: "Billing cycle", value: "Monthly", help: "How often invoices are raised." },
  { label: "Invoice delivery", value: "Email + customer portal", help: "How invoices reach the account." },
  { label: "Billing day", value: "1st of the month", help: "The day the cycle runs." },
  { label: "Billing contact", value: "Priya Raman", help: "Who receives the invoice." },
  { label: "Payment terms", value: "Net 30", help: "How long they have to pay." },
  { label: "Billing address", value: "480 Harrison Street, Suite 220, Seattle, WA 98104", help: "Where invoices are addressed." },
  { label: "Currency", value: "USD — US Dollar", help: "The currency invoices are raised in." },
  { label: "Tax ID", value: "US-91-4820117", help: "Used on tax documents." },
];
const USAGE_FIELDS: { label: string; value: ReactNode; help: string }[] = [
  { label: "API calls", value: <RecordMeter value={78} label="API calls used" of="3.9M of 5M" />, help: "Against the plan's monthly allowance." },
  { label: "Seats", value: <RecordMeter value={92} label="Seats used" of="184 of 200" />, help: "Named users against the plan." },
  { label: "Storage", value: <RecordMeter value={46} label="Storage used" of="920 GB of 2 TB" />, help: "Against the plan's storage." },
  { label: "Sandbox environments", value: <RecordMeter value={33} label="Sandboxes used" of="1 of 3" />, help: "Against the plan's sandboxes." },
];

// A used-against-allowance value: the kit Progress with its percent, and the raw figures beside it.
function RecordMeter({ value, label, of }: { value: number; label: string; of: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-xsmall)", minWidth: 0 }}>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}><Progress value={value} label={label} size="sm" showValue /></span>
      <span style={{ flex: "none", fontSize: "var(--font-size-xsmall)", color: "var(--text-neutral)" }}>{of}</span>
    </span>
  );
}

function RecordFields({ fields }: { fields: { label: string; value: ReactNode; help: string }[] }) {
  return (
    <Form columns={2} labelPosition="start">
      {fields.map((f) => <FormDisplay key={f.label} label={f.label} value={f.value} help={f.help} />)}
    </Form>
  );
}

export function RecordPageDemo({ sticky = true, shell = true, stage = "desktop" }: { sticky?: boolean; shell?: boolean; stage?: string }) {
  const [tab, setTab] = useState("details");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [notice, setNotice] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("accounts");
  // The screen holds whether the top has scrolled away; the pattern only reports the crossing.
  const [compact, setCompact] = useState(false);

  const record = (
    <RecordPage
      label="Account" sticky={sticky} onStickyChange={setCompact}
      header={
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }]}
          icon="account_balance" title="Apex Digital Services" badge="Active" badgeTone="success"
          sticky={sticky && compact}
          actions={<><Button size="sm">Clone</Button><Button size="sm" variant="primary">Edit</Button></>}
        />
      }
      tabs={<Tabs label="What belongs to this account" items={RECORD_TABS} value={tab} onChange={setTab} />}
      notice={
        notice ? (
          <Alert tone="warning" dismissible onDismiss={() => setNotice(false)} actionLabel="Review invoices" onAction={() => setTab("invoices")}>
            This account has 2 invoices past due, totalling $22,940.00.
          </Alert>
        ) : undefined
      }
      toolbar={
        <Toolbar
          label="Account details" onRefresh={() => {}}
          moreActions={[{ id: "print", label: "Print", icon: "print" }, { id: "export", label: "Export", icon: "download" }]} onMoreSelect={() => {}}
          actions={<><Button size="sm">Record payment</Button><Button size="sm" variant="primary" iconStart="add">New invoice</Button></>}
        />
      }
      summary={<Scoreboard items={RECORD_NUMBERS} />}
    >
      {tab === "details" ? (
        <>
          <Section title="Account information" collapsible><RecordFields fields={ACCOUNT_FIELDS} /></Section>
          <Section title="Billing information" collapsible><RecordFields fields={BILLING_FIELDS} /></Section>
          <Section title="Product utilization" collapsible><RecordFields fields={USAGE_FIELDS} /></Section>
        </>
      ) : (
        <Section title={RECORD_TABS.find((t) => t.id === tab)?.label ?? "Details"}>
          <Empty icon="folder_open" title={`${RECORD_TABS.find((t) => t.id === tab)?.label} go here`} description="Each tab holds its own list or details." />
        </Section>
      )}
    </RecordPage>
  );

  if (!shell) return record;
  // In the frame, the way a screen would ship it.
  return (
    <div
      data-theme={dark ? "dark" : undefined}
      style={{
        height: 900, width: STAGE_WIDTHS[stage] ?? "100%", maxWidth: "100%", marginInline: "auto",
        border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden",
      }}
    >
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" searchShortcut="Ctrl+K" searchGroups={SHELL_SEARCH} searchScopes={SHELL_SEARCH_SCOPES}
            actions={SHELL_HEADER_ACTIONS} onAction={() => {}}
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
      >
        {record}
      </AppShell>
    </div>
  );
}

// Playground harness: the Dashboard pattern driven like a screen would drive it. Not a kit piece.
// The numbers, charts and lists of an accounting home dashboard: what is owed, what is due, what closed.
const AR_SCORES = [
  { id: "open-ar", title: "Open AR", metric: "$1.2M", trend: { value: "3.2", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "credits", title: "Credits Applied", metric: "$84k", trend: { value: "11.2", unit: "% MoM", direction: "down" as const, status: "danger" as const } },
  { id: "write-offs", title: "Write-offs", metric: "$12k", trend: { value: "2.8", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "dso", title: "DSO", metric: "42", trend: { value: "5.2", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "collection", title: "Collection Rate", metric: "96%", trend: { value: "2.1", unit: "% MoM", direction: "up" as const, status: "success" as const } },
];
const INVOICE_SCORES = [
  { id: "cash", title: "Cash Position", metric: "$2.4M", trend: { value: "4.1", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "dso-2", title: "DSO", metric: "42", trend: { value: "5.2", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "working", title: "Working Capital", metric: "$6.1M", trend: { value: "1.8", unit: "% MoM", direction: "down" as const, status: "danger" as const } },
  { id: "balance", title: "Total AR Balance", metric: "$1.2M", trend: { value: "3.2", unit: "% MoM", direction: "up" as const, status: "success" as const } },
];
const CASH_SCORES = [
  { id: "unapplied", title: "Unapplied Cash", metric: "$128k", trend: { value: "6.4", unit: "% MoM", direction: "down" as const, status: "success" as const } },
  { id: "excess", title: "Excess Payments", metric: "$22k", trend: { value: "3.1", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "unreconciled", title: "Unreconciled Payments", metric: "$41k", trend: { value: "8.7", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "pending", title: "Credit Pending Approval", metric: "$18k", trend: { value: "2.4", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
];
const REVENUE_SCORES = [
  { id: "revenue", title: "Revenue | 30D", metric: "$4.9M", trend: { value: "6.8", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "payments", title: "Total Payments | 30D", metric: "$4.2M", trend: { value: "5.1", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "billed", title: "Invoice Billed | 30D", metric: "$5.1M", trend: { value: "4.4", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "gl", title: "GL Entries | 30D", metric: "128", trend: { value: "3.0", unit: "% MoM", direction: "up" as const, status: "success" as const } },
];
const GL_SCORES = [
  { id: "entries", title: "GL Entries", metric: "128", trend: { value: "3.0", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "unposted", title: "Unposted Entries", metric: "7", trend: { value: "2", unit: " WoW", direction: "up" as const, status: "danger" as const } },
  { id: "credits-total", title: "Total Credits", metric: "$2.4M", trend: { value: "0", unit: "% MoM", direction: "none" as const, status: "neutral" as const } },
  { id: "debits-total", title: "Total Debits", metric: "$2.4M", trend: { value: "0", unit: "% MoM", direction: "none" as const, status: "neutral" as const } },
];

const AGING_BUCKETS = ["Current", "1-30", "31-60", "61-90", "91-120", "120+"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const AGING_COLUMNS: TableColumn[] = [
  { key: "account", header: "Account" },
  { key: "current", header: "Current", numeric: true },
  { key: "d30", header: "1-30", numeric: true },
  { key: "d60", header: "31-60", numeric: true },
  { key: "d90", header: "61-90", numeric: true },
  { key: "d120", header: "91-120", numeric: true },
  { key: "over", header: "120+", numeric: true },
  { key: "total", header: "Total", numeric: true, emphasis: true },
];
const AGING_RECORDS = [
  { id: "apex", account: "Apex Digital Services", current: "$84,200", d30: "$12,400", d60: "$4,100", d90: "$1,250", d120: "$0", over: "$0", total: "$101,950", overdue: "$17,750 overdue" },
  { id: "bright", account: "Bright Future Labs", current: "$61,080", d30: "$8,220", d60: "$2,640", d90: "$980", d120: "$410", over: "$0", total: "$73,330", overdue: "$12,250 overdue" },
  { id: "northwind", account: "Northwind Retail", current: "$44,500", d30: "$15,800", d60: "$6,200", d90: "$2,100", d120: "$1,050", over: "$420", total: "$70,070", overdue: "$25,570 overdue" },
  { id: "helios", account: "Helios Cloud", current: "$38,120", d30: "$5,640", d60: "$1,880", d90: "$0", d120: "$0", over: "$0", total: "$45,640", overdue: "$7,520 overdue" },
];
// List View: one line per account with its balance beside it, the way the invoice list reads.
const AGING_LIST_COLUMNS: TableColumn[] = [
  { key: "account", header: "Account" },
  { key: "aging", header: "Overdue" },
  { key: "total", header: "Total", numeric: true, emphasis: true },
];
const LEDGER_COLUMNS: TableColumn[] = [
  { key: "date", header: "Date" },
  { key: "account", header: "Account" },
  { key: "debit", header: "Debit", numeric: true },
  { key: "credit", header: "Credit", numeric: true },
];
const LEDGER_ROWS: TableRow[] = [
  { id: "gl1", date: "04/22/2026", account: "4000 — Product Revenue", debit: "—", credit: "$18,400.00" },
  { id: "gl2", date: "04/21/2026", account: "1100 — Accounts Receivable", debit: "$12,250.00", credit: "—" },
  { id: "gl3", date: "04/20/2026", account: "1200 — Unapplied Cash", debit: "—", credit: "$3,180.00" },
  { id: "gl4", date: "04/18/2026", account: "5100 — Bad Debt Expense", debit: "$1,250.00", credit: "—" },
];

const CLOSE_TASKS = [
  { id: "t1", title: "Review and approve invoices", timestamp: "Apr 12", subtitle: "Jordan Ellis", icon: "check_circle", tone: "success" as const },
  { id: "t2", title: "Post recurring charges", timestamp: "Apr 14", subtitle: "Priya Raman", icon: "check_circle", tone: "success" as const },
  { id: "t3", title: "Reconcile unapplied cash", timestamp: "Due Apr 28", subtitle: "Billing Operations", icon: "schedule", tone: "warning" as const },
  { id: "t4", title: "Run revenue recognition", timestamp: "Due Apr 30", subtitle: "Finance", icon: "schedule", tone: "warning" as const },
];
const PRIOR_ADJUSTMENTS = [
  { id: "a1", title: "Credit memo CM-10428", timestamp: "New", subtitle: "Apex Digital Services · $2,140.00", icon: "receipt_long", tone: "brand" as const },
  { id: "a2", title: "Balance transfer BT-331", timestamp: "Posted", subtitle: "Bright Future Labs · $880.00", icon: "swap_horiz", tone: "neutral" as const },
  { id: "a3", title: "Write-off WO-8821", timestamp: "Draft", subtitle: "Northwind Retail · $410.00", icon: "block", tone: "neutral" as const },
  { id: "a4", title: "Late-fee reversal LF-19", timestamp: "Posted", subtitle: "Helios Cloud · $125.00", icon: "undo", tone: "neutral" as const },
];
const PERIODS = [
  { id: "mtd", label: "Month to date" },
  { id: "qtd", label: "Quarter to date" },
  { id: "ytd", label: "Year to date" },
];
const BUCKET_FILTERS = [
  { id: "all", label: "All buckets" },
  { id: "over", label: "Overdue only" },
];
const SAVED_DASHBOARDS = [
  { id: "accounting", label: "Accounting Dashboard" },
  { id: "collections", label: "Collections Dashboard" },
  { id: "revenue", label: "Revenue Dashboard" },
];

// Two tiles side by side, from the layout classes. Never a grid of its own.
function Tiles({ children }: { children: ReactNode }) {
  return <div className="layout-split">{children}</div>;
}

export function DashboardDemo({ state = "ready", shell = true, stage = "desktop", ...p }: Omit<DashboardProps, "children"> & { state?: DashboardState; shell?: boolean; stage?: string }) {
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("home-home-dashboards");
  const [saved, setSaved] = useState("accounting");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [period, setPeriod] = useState("");
  const [bucket, setBucket] = useState("");
  const [aging, setAging] = useState("table");
  const [agingQuery, setAgingQuery] = useState("");
  // The assistant beside the dashboard: open or shut is the screen's, like everything else here.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNotice, setChatNotice] = useState(true);
  const [scoping, setScoping] = useState(true);
  const [turns, setTurns] = useState<{ id: string; author: "user" | "assistant"; text: string }[]>([]);
  const ask = (text: string) => setTurns((old) => [
    ...old,
    { id: `q${old.length}`, author: "user" as const, text },
    { id: `a${old.length}`, author: "assistant" as const, text: "Open AR is $1.2M, up 3.2% on last month. $312k of it is more than 60 days past due." },
  ]);
  // The screen holds whether the top of the page has scrolled away; the frame only reports the crossing.
  const [compact, setCompact] = useState(false);
  const name = SAVED_DASHBOARDS.find((d) => d.id === saved)?.label ?? "Dashboard";
  const agingShown = AGING_RECORDS
    .filter((r) => r.account.toLowerCase().includes(agingQuery.toLowerCase()))
    .filter((r) => bucket !== "over" || r.overdue !== "$0 overdue");
  // The side nav says which page is open: the header follows it, and the dashboard itself belongs to
  // Home Dashboards, so anywhere else the page stands empty.
  const place = navPlace(section);
  const onDashboards = section === "home-home-dashboards";
  const shown = shell && !onDashboards ? "empty" : state;

  const dash = (
    <Dashboard
      {...p}
      state={shown}
      label={onDashboards ? name : place.page}
      empty={onDashboards
        ? <Empty icon="dashboard" title="No dashboard yet" description="Build one from the numbers your team watches every morning." actions={<Button size="sm" variant="primary" iconStart="add">New dashboard</Button>} />
        : <Empty icon="construction" title={`${place.page} is not built here`} description="This playground only ships the Home Dashboards page. The frame, the bar and the page header are the kit's own." />}
      toolbar={!onDashboards ? undefined : (
        <Toolbar
          label={name} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search"
          filterCount={period ? 1 : 0}
          filters={
            <DropdownMenu
              trigger="filter" size="sm" label="Period"
              text={PERIODS.find((o) => o.id === period)?.label}
              toggle={period ? "on" : undefined} onToggle={period ? () => setPeriod("") : undefined}
              items={PERIODS.map((o) => ({ ...o, selected: o.id === period }))}
              onSelect={(id) => setPeriod((was) => (was === id ? "" : id))}
            />
          }
          views={SAVED_DASHBOARDS}
          view={saved} onViewChange={setSaved} onRefresh={() => {}}
        />
      )}
      name={onDashboards ? name : undefined}
    >
      <Section title="All" help="Every account, every period. Narrow it with the bar above." collapsible>
        <Scoreboard items={AR_SCORES} selectable defaultSelected="open-ar" scroll label="Receivables summary" />
        <Tiles>
          <BarChart
            label="AR aging by time" title="AR Aging By Time" showTitle categories={AGING_BUCKETS}
            series={[{ name: "Balance", values: [230, 60, 22, 8, 3, 1], tone: "orange" }]}
            height={220}
          />
          <LineChart
            label="DSO by time" title="DSO By Time" showTitle categories={MONTHS}
            series={[{ name: "DSO", values: [38, 51, 43, 57, 45, 42], tone: "cyan" }]}
            showPoints height={220}
          />
        </Tiles>
        <Section title="AR Aging By Account" collapsible>
          <Toolbar
            label="AR aging by account" onRefresh={() => {}}
            searchValue={agingQuery} onSearchChange={setAgingQuery} searchPlaceholder="Search accounts"
            filterCount={bucket ? 1 : 0}
            filters={
              <DropdownMenu
                trigger="filter" size="sm" label="Aging"
                text={BUCKET_FILTERS.find((o) => o.id === bucket)?.label}
                toggle={bucket ? "on" : undefined} onToggle={bucket ? () => setBucket("") : undefined}
                items={BUCKET_FILTERS.map((o) => ({ ...o, selected: o.id === bucket }))}
                onSelect={(id) => setBucket((was) => (was === id ? "" : id))}
              />
            }
            views={[{ id: "table", label: "Table View" }, { id: "list", label: "List View" }, { id: "card", label: "Card View" }]}
            view={aging} onViewChange={setAging}
            actions={<Button size="sm" iconStart="download">Export</Button>}
          />
          {aging === "card" ? (
            // Card View: the same accounts as kit Cards, wrapped by the layout class rather than a new grid.
            <div className="layout-metrics">
              {agingShown.map((r) => (
                <Card key={r.id} overline={r.overdue} title={r.account} amount={r.total} description={`${r.current} current`} />
              ))}
            </div>
          ) : (
            <Table
              columns={aging === "list" ? AGING_LIST_COLUMNS : AGING_COLUMNS}
              rows={agingShown.map((r) => (aging === "list"
                ? { id: r.id, account: <Cell type="avatar" name={r.account} label={`${r.current} current`} />, aging: <Cell type="badge" tone={r.over === "$0" ? "warning" : "danger"} label={r.overdue} />, total: r.total }
                : r))}
            />
          )}
          <Button size="sm" variant="tertiary" iconEnd="arrow_forward">View AR Aging by Account Report</Button>
        </Section>
      </Section>

      <Section title="Month-End Close" help="What has to happen before the period can close." collapsible>
        <Tiles>
          <Section title="Close Tasks | April 2026">
            <Timeline items={CLOSE_TASKS} label="Close tasks" />
          </Section>
          <Section title="Prior Adjustments | 30D">
            <Timeline items={PRIOR_ADJUSTMENTS} label="Prior adjustments" />
          </Section>
        </Tiles>
      </Section>

      <Section title="Invoices" help="Where this period's invoices stand." collapsible>
        <Scoreboard items={INVOICE_SCORES} scroll label="Invoice summary" />
        <BarChart
          label="Invoices by status" title="Invoice By Status" showTitle orientation="horizontal"
          categories={["Draft", "Waiting", "Open", "Approved", "Sent", "Paid"]}
          series={[{ name: "Invoices", values: [8, 12, 25, 18, 15, 44], tone: "purple" }]}
          showValues height={240}
        />
      </Section>

      <Section title="Cash & Credits" help="Money in that is not yet applied to an invoice." collapsible>
        <Scoreboard items={CASH_SCORES} scroll label="Cash summary" />
        <Tiles>
          <PieChart
            label="Payments by method" title="Payment Methods" showTitle donut showTotal
            data={[{ label: "Bank", value: 52 }, { label: "Credit Card", value: 28 }, { label: "Check", value: 12 }, { label: "Other", value: 8 }]}
          />
          <BarChart
            label="Unapplied cash by time" title="Unapplied Cash By Time" showTitle categories={MONTHS}
            series={[{ name: "Unapplied", values: [96, 112, 128, 140, 132, 128], tone: "mint" }]}
            height={220}
          />
        </Tiles>
      </Section>

      <Section title="Revenue" help="What was earned, and what is still deferred." collapsible>
        <Scoreboard items={REVENUE_SCORES} scroll label="Revenue summary" />
        <Tiles>
          <LineChart
            label="Revenue by time" title="Revenue by Time" showTitle categories={MONTHS}
            series={[{ name: "Revenue", values: [4300, 4400, 4600, 4500, 4800, 4900] }]}
            area showPoints height={220}
          />
          <BarChart
            label="Revenue recognition schedule" title="Revenue Recognition Schedule" showTitle categories={MONTHS}
            series={[
              { name: "Recognized", values: [3200, 3400, 3600, 3500, 3800, 3900] },
              { name: "Deferred", values: [820, 780, 760, 800, 740, 720] },
            ]}
            showLegend legend="bottom" height={220}
          />
        </Tiles>
      </Section>

      <Section title="GL Entries" help="What posted to the ledger this period." collapsible>
        <Scoreboard items={GL_SCORES} scroll label="Ledger summary" />
        <Table columns={LEDGER_COLUMNS} rows={LEDGER_ROWS} />
        <Button size="sm" variant="tertiary" iconEnd="arrow_forward">View GL Entries Report</Button>
      </Section>
    </Dashboard>
  );

  if (!shell) return dash;
  // In the frame, the way a screen would ship it.
  return (
    <div
      data-theme={dark ? "dark" : undefined}
      style={{
        height: 900, width: STAGE_WIDTHS[stage] ?? "100%", maxWidth: "100%", marginInline: "auto",
        border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden",
      }}
    >
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" searchShortcut="Ctrl+K" searchGroups={SHELL_SEARCH} searchScopes={SHELL_SEARCH_SCOPES}
            actions={SHELL_HEADER_ACTIONS} onAction={() => {}}
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        onPageHeaderStick={setCompact}
        pageHeader={
          <PageHeader
            icon={place.icon ?? "dashboard"} title={place.page} breadcrumbs={[{ label: place.section, href: "#" }]}
            sticky={compact}
            actions={
              <>
                <Button size="sm" iconStart="auto_awesome" onClick={() => setChatOpen((o) => !o)}>Ask BP AI</Button>
                <Button size="sm" variant="primary" iconStart="add">New dashboard</Button>
              </>
            }
          />
        }
        assistantOpen={chatOpen}
        assistant={
          <ChatWindow
            title="BP AI" chatsCount={7} onClose={() => setChatOpen(false)} onNewChat={() => setTurns([])}
            notice={chatNotice ? "AI can make mistakes, verify important information." : undefined}
            onNoticeDismiss={() => setChatNotice(false)}
            empty={<GetStarted onPick={ask} />}
            composer={
              <ChatComposerPiece
                scopeLabel={scoping ? `${place.page} page` : undefined} onScopeClose={() => setScoping(false)}
                defaultScoped hints={ASK_HINTS} addMenu={ADD_MENU} onSend={ask}
              />
            }
          >
            {turns.length > 0 ? turns.map((t) => <ChatMessage key={t.id} author={t.author} text={t.text} person={{ name: "Ana Petrovic" }} />) : null}
          </ChatWindow>
        }
      >
        {dash}
      </AppShell>
    </div>
  );
}

// Playground harness: the SettingsPage pattern in the AppShell frame, driven like a screen would drive it.
// Not a kit piece. The places are the real Settings entries from the side nav, with the descriptions and
// colors of the BP DS Hub settings home.
const SETTINGS_PLACES: { id: string; title: string; description: string; icon: string; tone: TileTone }[] = [
  { id: "settings-develop", title: "Develop", description: "Includes entities, workflows, functions, data presentations, OAuth, and APIs.", icon: "handyman", tone: "yellow" },
  { id: "settings-external-connectors", title: "External Connectors", description: "Includes application, data and tax connectors.", icon: "account_tree", tone: "olive" },
  { id: "settings-security-users", title: "Security & Users", description: "Includes roles, sharing groups, approvals, authentication, and user management.", icon: "shield_person", tone: "red" },
  { id: "settings-monitoring-logs", title: "Monitoring & Logs", description: "Includes process console, alerts, scheduled jobs, logs, events and recycle bin.", icon: "monitor_heart", tone: "cyan" },
  { id: "settings-system", title: "System", description: "Includes company setup, system parameters, reference, localization, and email settings.", icon: "settings_applications", tone: "pink" },
  { id: "settings-ai-settings", title: "AI Settings", description: "Includes assistants, prompts and the data they are allowed to read.", icon: "auto_awesome", tone: "purple" },
  { id: "settings-billing", title: "Billing", description: "Includes invoices, statements, templates, periods and tiered pricing.", icon: "receipt_long", tone: "brand" },
  { id: "settings-payments", title: "Payments", description: "Includes gateways, payment methods and retry rules.", icon: "credit_card", tone: "green" },
  { id: "settings-financials-revenue", title: "Financials & Revenue", description: "Includes accounting periods, legal entities and revenue contracts.", icon: "paid", tone: "gray" },
  { id: "settings-collections", title: "Collections", description: "Includes collection modules and dunning templates.", icon: "account_balance", tone: "orange" },
];

export function SettingsPageDemo({ shell = true, notice = false, stage = "desktop", ...p }: Omit<SettingsPageProps, "children"> & { shell?: boolean; notice?: boolean; stage?: string }) {
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("settings-settings-home");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [open, setOpen] = useState(true);
  // Picking a tile goes to that place, and only the landing itself is built here.
  const chosen = SETTINGS_PLACES.find((s) => s.id === section);

  const settings = (
    <SettingsPage
      {...p}
      label="Settings"
      intro={notice && open ? (
        <Alert tone="warning" dismissible onDismiss={() => setOpen(false)} actionLabel="Review users" onAction={() => {}}>
          Four users have not signed in for 90 days.
        </Alert>
      ) : undefined}
    >
      {SETTINGS_PLACES.map((s) => (
        <Tile
          key={s.id} title={s.title} description={s.description} icon={s.icon} tone={s.tone}
          onClick={() => setSection(s.id)}
        />
      ))}
    </SettingsPage>
  );

  if (!shell) return settings;
  // In the frame, the way a screen would ship it.
  return (
    <div
      data-theme={dark ? "dark" : undefined}
      style={{
        height: 900, width: STAGE_WIDTHS[stage] ?? "100%", maxWidth: "100%", marginInline: "auto",
        border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden",
      }}
    >
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" searchShortcut="Ctrl+K" searchGroups={SHELL_SEARCH} searchScopes={SHELL_SEARCH_SCOPES}
            actions={SHELL_HEADER_ACTIONS} onAction={() => {}}
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        pageHeader={
          <PageHeader
            title={chosen ? chosen.title : "Settings"}
            breadcrumbs={chosen
              ? [{ label: "Home", href: "#" }, { label: "Settings", onClick: () => setSection("settings-settings-home") }]
              : [{ label: "Home", href: "#" }]}
          />
        }
      >
        {chosen ? (
          <Empty
            icon="construction" title={`${chosen.title} is not built here`}
            description="This playground ships the settings home. Go back to Settings for the way in."
            actions={<Button size="sm" onClick={() => setSection("settings-settings-home")}>Back to Settings</Button>}
          />
        ) : settings}
      </AppShell>
    </div>
  );
}

// Playground harness: the FormPage pattern driven like a screen would drive it. Not a kit piece.
// The fields of a new account, from the portal's create-account form: what the account is, then how it bills.
const TIME_ZONES = [
  { value: "us-mountain", label: "US/Mountain" },
  { value: "us-eastern", label: "US/Eastern" },
  { value: "us-pacific", label: "US/Pacific" },
  { value: "europe-london", label: "Europe/London" },
  { value: "europe-belgrade", label: "Europe/Belgrade" },
];
const CURRENCIES = [
  { value: "usd", label: "US Dollars" },
  { value: "eur", label: "Euros" },
  { value: "gbp", label: "Pounds Sterling" },
];
const ACCOUNT_TYPES = [
  { value: "account", label: "Account" },
  { value: "parent", label: "Parent account" },
  { value: "child", label: "Child account" },
];
const ACCOUNT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];
const VENDOR_NUMBERS = [
  { value: "none", label: "Not set" },
  { value: "vcn-1", label: "VCN-4471" },
  { value: "vcn-2", label: "VCN-4472" },
];
const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];
const CLOSING_DAYS = ["1", "15", "28", "30", "31"].map((d) => ({ value: d, label: d }));
const STATEMENT_RUNS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "never", label: "Never" },
];
const DATE_FORMATS = [
  { value: "mdy", label: "MM/DD/YYYY" },
  { value: "dmy", label: "DD/MM/YYYY" },
  { value: "iso", label: "YYYY-MM-DD" },
];
const INVOICE_TEMPLATES: TableRow[] = [
  { id: "TPL-1", name: "Standard invoice", use: "Default", updated: "12 Aug 2026" },
  { id: "TPL-2", name: "Usage summary", use: "Metered accounts", updated: "02 Sep 2026" },
  { id: "TPL-3", name: "Credit memo", use: "Credits", updated: "28 Jul 2026" },
];
const TEMPLATE_COLUMNS: TableColumn[] = [
  { key: "name", header: "Template" }, { key: "use", header: "Used for" }, { key: "updated", header: "Updated" },
];

export function FormPageDemo({ shell = true, notice = true, stage = "desktop", labels = "start", columns = 2, ...p }:
  Omit<FormPageProps, "children"> & { shell?: boolean; notice?: boolean; stage?: string; labels?: FormLabelPosition; columns?: FormColumns }) {
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("accounts");
  const [said, setSaid] = useState(true);
  const [saved, setSaved] = useState("");
  // The screen holds whether the top has scrolled away; the pattern only reports the crossing.
  const [compact, setCompact] = useState(false);
  // One form for the whole page, so the save in the page header submits every group at once.
  const formId = useId();

  const sections = [
    {
      title: "Account information",
      help: "What the account is and who it belongs to. The name is the only field that has to be filled in.",
      collapsible: true,
      content: (
        <>
          <Input label="Account name" name="name" placeholder="Enter a value" required />
          <Select label="Account type" name="type" options={ACCOUNT_TYPES} defaultValue="account" />
          <Lookup label="Parent account" name="parent" columns={ACCOUNT_LOOKUP_COLUMNS} rows={PARENT_ACCOUNTS} placeholder="Select a value" clearable />
          <Input label="Total due in collections" name="collections" placeholder="Enter a value" />
          <Select label="Invoice time zone" name="timeZone" options={TIME_ZONES} defaultValue="us-mountain" />
          <Select label="Status" name="status" options={ACCOUNT_STATUSES} defaultValue="active" />
          <Select label="Invoice currency" name="currency" options={CURRENCIES} defaultValue="usd" />
          <Input label="Legal entity" name="legalEntity" placeholder="Enter a value" />
          <Checkbox label="Restricted rate hierarchy" name="restrictedRates" />
          <Select label="Vendor customer number" name="vendorNumber" options={VENDOR_NUMBERS} defaultValue="none" />
          <Checkbox label="Allow different currency" name="differentCurrency" />
        </>
      ),
    },
    {
      title: "Billing profile information",
      help: "How and when this account is invoiced. These are the defaults every new invoice starts from.",
      collapsible: true,
      content: (
        <>
          <Select label="Default billing cycle" name="cycle" options={BILLING_CYCLES} defaultValue="monthly" />
          <Select label="Bill cycle closing day" name="closingDay" options={CLOSING_DAYS} defaultValue="31" />
          <DatePicker label="Period cutoff date" name="cutoff" defaultValue="2027-04-30" />
          <Lookup label="Invoice template" name="template" columns={TEMPLATE_COLUMNS} rows={INVOICE_TEMPLATES} placeholder="Enter a value" clearable />
          <Checkbox label="Manual closing" name="manualClosing" defaultChecked />
          <Checkbox label="Approve invoices before delivery" name="approve" />
          <Checkbox label="Deliver invoices by email" name="deliverEmail" defaultChecked />
          <Checkbox label="Deliver invoices by mail" name="deliverMail" />
          <Checkbox label="Allow invoice based billing" name="invoiceBased" />
        </>
      ),
    },
    {
      title: "Billing contact information",
      help: "Who the invoices go to. Left empty, the account's own contact is used.",
      collapsible: true,
      defaultOpen: false,
      content: (
        <>
          <Input label="Contact name" name="contactName" placeholder="Enter a value" />
          <Input label="Billing email" name="contactEmail" type="email" placeholder="billing@example.com" />
          <Input label="Phone" name="contactPhone" placeholder="Enter a value" />
          <Select label="Country" name="contactCountry" options={COUNTRIES} defaultValue="us" />
        </>
      ),
    },
    {
      title: "Statement information",
      help: "Whether this account gets statements, and how often.",
      collapsible: true,
      defaultOpen: false,
      content: (
        <>
          <Select label="Statement run" name="statementRun" options={STATEMENT_RUNS} defaultValue="monthly" />
          <Checkbox label="Include zero balances" name="zeroBalance" />
        </>
      ),
    },
    {
      title: "Locale information",
      help: "The language, dates and numbers this account's documents are written in.",
      collapsible: true,
      defaultOpen: false,
      content: (
        <>
          <Select label="Language" name="language" options={[{ value: "en", label: "English" }, { value: "de", label: "German" }, { value: "sr", label: "Serbian" }]} defaultValue="en" />
          <Select label="Date format" name="dateFormat" options={DATE_FORMATS} defaultValue="mdy" />
        </>
      ),
    },
  ];

  const page = (
    <FormPage
      {...p} label="Create account" onStickyChange={setCompact}
      header={
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }]}
          title="Create account" sticky={compact}
          actions={
            <>
              <Button size="sm" onClick={() => setSaved("")}>Cancel</Button>
              {/* The save sits outside the form and submits it by id, so one press saves every group. */}
              <Button size="sm" variant="primary" type="submit" form={formId}>Create</Button>
            </>
          }
        />
      }
      notice={
        notice && said ? (
          <Alert tone="info" dismissible onDismiss={() => setSaid(false)} actionLabel="Main action" onAction={() => {}}>
            Use this form to manage general account information as well as the default billing information for the account.
          </Alert>
        ) : undefined
      }
    >
      <Form
        id={formId} labelPosition={labels} columns={columns} sections={sections}
        onSubmit={(data) => setSaved(String(data.get("name") || "").trim() ? `Created ${String(data.get("name"))}.` : "Created the account.")}
      />
      {saved && <Alert tone="success">{saved}</Alert>}
    </FormPage>
  );

  if (!shell) return page;
  // In the frame, the way a screen would ship it.
  return (
    <div
      data-theme={dark ? "dark" : undefined}
      style={{
        height: 900, width: STAGE_WIDTHS[stage] ?? "100%", maxWidth: "100%", marginInline: "auto",
        border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden",
      }}
    >
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" searchShortcut="Ctrl+K" searchGroups={SHELL_SEARCH} searchScopes={SHELL_SEARCH_SCOPES}
            actions={SHELL_HEADER_ACTIONS} onAction={() => {}}
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
      >
        {page}
      </AppShell>
    </div>
  );
}
