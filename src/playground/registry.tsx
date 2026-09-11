import type { ReactNode } from "react";
import { Accordion, type AccordionItem } from "@/ui/Accordion/Accordion";
import { Alert } from "@/ui/Alert/Alert";
import { AlertDialogDemo, AppHeaderDemo, ButtonFilterDemo, ToolbarDemo, DensityDemo, DropdownMenuDemo, FormDemo, ModalDemo, calculate, type FormDemoContent, type ModalDemoContent } from "./demos";
import type { DensityValue } from "@/ui/Density/Density";
import { AppHeader, type AppHeaderProps } from "@/ui/AppHeader/AppHeader";
import { Avatar } from "@/ui/Avatar/Avatar";
import { AvatarGroup, type AvatarGroupItem } from "@/ui/AvatarGroup/AvatarGroup";
import { Badge } from "@/ui/Badge/Badge";
import { BadgeAlt } from "@/ui/BadgeAlt/BadgeAlt";
import { Breadcrumb, type BreadcrumbItem } from "@/ui/Breadcrumb/Breadcrumb";
import { Button } from "@/ui/Button/Button";
import { Cell, type CellType } from "@/ui/Cell/Cell";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Command, type CommandGroup, type CommandProps } from "@/ui/Command/Command";
import { Count } from "@/ui/Count/Count";
import { ButtonFilter } from "@/ui/ButtonFilter/ButtonFilter";
import { ButtonGroup } from "@/ui/ButtonGroup/ButtonGroup";
import { DatePicker, type DatePickerProps } from "@/ui/DatePicker/DatePicker";
import { DropdownMenu, type DropdownMenuEntry, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { FormDisplay, type FormDisplayProps } from "@/ui/FormDisplay/FormDisplay";
import { FormulaEditor, type FormulaEditorProps } from "@/ui/FormulaEditor/FormulaEditor";
import { HeaderCell } from "@/ui/HeaderCell/HeaderCell";
import { HelpPopover, type HelpPopoverProps } from "@/ui/HelpPopover/HelpPopover";
import { Icon } from "@/ui/Icon/Icon";
import { Input, type InputProps } from "@/ui/Input/Input";
import { Logo } from "@/ui/Logo/Logo";
import { LogoAI } from "@/ui/LogoAI/LogoAI";
import { PageHeader, type PageHeaderProps } from "@/ui/PageHeader/PageHeader";
import { RadioGroup, type RadioGroupOption } from "@/ui/RadioGroup/RadioGroup";
import { SegmentedControl, type SegmentedControlProps } from "@/ui/SegmentedControl/SegmentedControl";
import { Select, type SelectProps } from "@/ui/Select/Select";
import { SideNav, type SideNavEntry, type SideNavItem, type SideNavProps } from "@/ui/SideNav/SideNav";
import { Switch, type SwitchProps } from "@/ui/Switch/Switch";
import { Tabs, type TabItem, type TabsProps } from "@/ui/Tabs/Tabs";
import { Textarea, type TextareaProps } from "@/ui/Textarea/Textarea";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import { Tooltip, type TooltipProps } from "@/ui/Tooltip/Tooltip";

export type Props = Record<string, unknown>;
// SideNav sample: the app sections and menus from the Figma secondary navigation. "-" is a divider.
const menu = (section: string, labels: string[]) =>
  labels.map((l) => (l === "-" ? { divider: true as const } : { id: `${section}-${l.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label: l }));
const SIDE_NAV_SECTIONS: SideNavEntry[] = [
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
const SIDE_NAV_END: SideNavItem[] = [
  { id: "recycle", label: "Recycle Bin", icon: "recycling" },
  { id: "processes", label: "Processes", icon: "tune" },
];
// Contract examples name the sample as {sections} and {endSections}; swap in the real arrays.
const sideNavProps = (p: Props) => ({
  ...p,
  items: typeof p.items === "string" || !p.items ? SIDE_NAV_SECTIONS : p.items,
  endItems: typeof p.endItems === "string" ? SIDE_NAV_END : p.endItems,
}) as unknown as SideNavProps;

export interface Entry {
  render: (p: Props) => ReactNode;
  /** Starting props for the Preview tab, on top of contract defaults. */
  preview: Props;
  /** Master hint. Defaults to "Toggle ... to preview every X combination." */
  hint?: string;
  /** Contract props kept out of the control panel, e.g. a controlled open flag. */
  hide?: string[];
  /** Code-only props for snippets, e.g. { onCancel: "{close}" }. Values in braces print as expressions. */
  snippet?: Props;
  /** Full-width piece. Stage and examples stack it at a readable width. */
  block?: boolean;
  /** Variants stack their items top to bottom instead of side by side, like form fields. */
  column?: boolean;
  /** Variants stack their items top to bottom with no gap, like rows of one list. */
  flush?: boolean;
  /** With block: use the whole stage width instead of 720px, for full-width bars like AppHeader. */
  wide?: boolean;
  /** Playground-only radio controls that are not contract props. normalize turns them into real props. */
  extras?: Record<string, { values: string[]; default: string }>;
  /** Fills in props a combination needs, e.g. an icon for icon-only. */
  normalize?: (p: Props) => Props;
  card: ReactNode;
}

const CELL_SAMPLES: Record<CellType, Props> = {
  text: { label: "INV-1042" },
  link: { label: "Acme Inc.", href: "#" },
  avatar: { name: "Maya Chen", label: "maya@acme.com", src: "/faces/maya-chen.jpg" },
  avatarGroup: { label: "Owners", people: [{ name: "Maya Chen", src: "/faces/maya-chen.jpg" }, { name: "Noah Williams", src: "/faces/noah-williams.jpg" }, { name: "Iris Okafor", src: "/faces/iris-okafor.jpg" }, { name: "Jordan Lee", src: "/faces/jordan-lee.jpg" }] },
  file: { label: "invoice-1042.pdf" },
  payment: { label: "Visa ending 4242" },
  badge: { label: "Paid", tone: "success" },
  badges: { badges: [{ label: "Usage", tone: "info" }, { label: "Annual", tone: "neutral" }] },
  trendPositive: { value: "12%" },
  trendNegative: { value: "4%" },
  rating: { value: 4 },
  select: { label: "Status", value: "paid", options: [{ value: "draft", label: "Draft" }, { value: "paid", label: "Paid" }, { value: "void", label: "Void" }] },
  actions: { actions: [{ label: "View" }, { label: "Send" }] },
  actionIcons: { actions: [{ label: "Edit", icon: "edit" }, { label: "Download", icon: "download" }, { label: "Delete", icon: "delete" }] },
  actionMenu: { label: "Row actions", actions: [{ label: "View" }, { label: "Download" }, { label: "Delete", icon: "delete", variant: "danger" }] },
};

const MENU_ITEMS: DropdownMenuEntry[] = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { id: "archive", label: "Archive", disabled: true },
  { divider: true },
  { id: "delete", label: "Delete", icon: "delete", danger: true },
];
const COMMAND_GROUPS: CommandGroup[] = [
  {
    heading: "Records",
    items: [
      { id: "invoices", label: "Invoices", description: "Billing › Invoices", icon: "receipt_long" },
      { id: "customers", label: "Customers", description: "Accounts › Customers", icon: "group" },
      { id: "subscriptions", label: "Subscriptions", description: "Billing › Subscriptions", icon: "autorenew" },
    ],
  },
  {
    heading: "Reports",
    items: [
      { id: "revenue", label: "Revenue by month", icon: "bar_chart" },
      { id: "aging", label: "Accounts receivable aging", icon: "bar_chart" },
    ],
  },
  {
    heading: "Actions",
    items: [
      { id: "new-invoice", label: "Create invoice", icon: "add", shortcut: "N" },
      { id: "export", label: "Export all data", icon: "download", disabled: true },
    ],
  },
];
const FILTER_ITEMS: DropdownMenuEntry[] = [
  { id: "paid", label: "Paid", checkbox: true, selected: true },
  { id: "due", label: "Due", checkbox: true, selected: true },
  { id: "overdue", label: "Overdue", checkbox: true, selected: false },
];

export const registry: Record<string, Entry> = {
  Accordion: {
    // Keyed by props so defaultOpen applies again when the example changes.
    render: (p) => <Accordion key={JSON.stringify(p)} {...(p as object)} items={(p.items as AccordionItem[] | undefined) ?? []} />,
    preview: {
      defaultOpen: "hours",
      items: [
        { id: "hours", title: "Hours", content: "Weekdays 9 to 5. Closed on public holidays." },
        { id: "address", title: "Address", content: "Knez Mihailova 1, Belgrade." },
        { id: "parking", title: "Parking", content: "Free parking behind the building for the first two hours." },
      ],
    },
    hint: "Open one item at a time. Clicking the open item closes it.",
    block: true,
    card: <div style={{ width: "85%" }}><Accordion items={[{ id: "a", title: "Hours", content: "" }, { id: "b", title: "Address", content: "" }]} /></div>,
  },
  Alert: {
    // Keyed by props so a dismissed Alert comes back when a control changes.
    render: ({ children, ...p }) => <Alert key={JSON.stringify(p) + String(children)} {...(p as object)}>{(children as string) || "Alert message goes here"}</Alert>,
    preview: { children: "Alert message goes here", actionLabel: "Main action", dismissible: true },
    block: true,
    card: <div style={{ width: "85%" }}><Alert tone="success">Your changes are saved.</Alert></div>,
  },
  AlertDialog: {
    render: (p) => <AlertDialogDemo {...(p as { title: string; description: string; actionLabel: string })} />,
    preview: { title: "Leave this page?", description: "You have unsaved changes. Continue without saving?", actionLabel: "Continue" },
    hide: ["open"],
    snippet: { open: "{open}", onCancel: "{close}", onAction: "{confirm}" },
    hint: "Open the dialog, then switch size and action variant. Escape cancels. Clicking the backdrop does not.",
    card: <Button>Show dialog</Button>,
  },
  Avatar: {
    render: (p) => <Avatar {...(p as { name: string })} />,
    preview: { name: "Maya Chen", src: "/faces/maya-chen.jpg" },
    extras: { appearance: { values: ["photo", "initials"], default: "photo" } },
    normalize: ({ appearance, ...p }) => (appearance === "initials" ? { ...p, src: undefined } : p),
    hint: "Switch size and appearance to preview a photo or initials from the name.",
    card: <div style={{ display: "flex", gap: 8 }}><Avatar name="Maya Chen" src="/faces/maya-chen.jpg" /><Avatar name="Boris Jovanovic" /></div>,
  },
  AvatarGroup: {
    render: (p) => <AvatarGroup {...(p as object)} items={(p.items as AvatarGroupItem[] | undefined) ?? []} />,
    preview: {
      label: "Assignees",
      items: [
        { name: "Maya Chen", src: "/faces/maya-chen.jpg" },
        { name: "Ada Jones" },
        { name: "Noah Williams", src: "/faces/noah-williams.jpg" },
        { name: "Leo" },
        { name: "Iris Okafor", src: "/faces/iris-okafor.jpg" },
        { name: "Rio Vale" },
      ],
    },
    hint: "Switch size and shape across a stack of six people: three faces plus a +3 count.",
    card: <AvatarGroup label="Assignees" items={[{ name: "Maya Chen", src: "/faces/maya-chen.jpg" }, { name: "Ada Jones" }, { name: "Noah Williams", src: "/faces/noah-williams.jpg" }, { name: "Leo" }, { name: "Mira" }]} />,
  },
  Badge: {
    render: ({ children, ...p }) => <Badge {...(p as object)}>{(children as string) || "Badge"}</Badge>,
    preview: { tone: "info", children: "In progress" },
    normalize: (p) => (p.iconOnly && !p.icon ? { ...p, icon: "info" } : p),
    card: <div style={{ display: "flex", gap: 8 }}><Badge tone="success">Paid</Badge><Badge tone="warning">Pending</Badge><Badge tone="danger" emphasis="strong">Overdue</Badge></div>,
  },
  BadgeAlt: {
    render: ({ children, ...p }) => <BadgeAlt {...(p as object)}>{(children as string) || "In progress"}</BadgeAlt>,
    preview: { tone: "info", children: "In progress" },
    card: <div style={{ display: "flex", gap: 8 }}><BadgeAlt tone="success">Active</BadgeAlt><BadgeAlt tone="warning">Pending</BadgeAlt><BadgeAlt tone="brand">Beta</BadgeAlt></div>,
  },
  Breadcrumb: {
    render: (p) => <Breadcrumb {...(p as object)} items={(p.items as BreadcrumbItem[] | undefined) ?? []} />,
    preview: { items: [{ label: "Home", href: "#" }, { label: "Invoices", href: "#" }, { label: "INV-1042" }] },
    extras: { trail: { values: ["short", "collapsed"], default: "short" } },
    normalize: ({ trail, ...p }) =>
      trail === "collapsed"
        ? { ...p, maxItems: 4, items: [{ label: "Home", href: "#" }, { label: "Customers", href: "#" }, { label: "Acme Corp", href: "#" }, { label: "Accounts", href: "#" }, { label: "ACC-2231", href: "#" }, { label: "Settings" }] }
        : p,
    hint: "Switch separator and trail. The current page is never a link. The ellipsis is visual only.",
    card: <Breadcrumb items={[{ label: "Home", href: "#" }, { label: "Invoices", href: "#" }, { label: "INV-1042" }]} />,
  },
  Button: {
    render: ({ children, ...p }) => <Button {...(p as object)}>{(children as string) || "Continue"}</Button>,
    preview: { variant: "primary", children: "Continue" },
    // type is the HTML button type (button / submit / reset), not a visual option.
    hide: ["type"],
    normalize: (p) => (p.iconOnly && !p.iconStart ? { ...p, iconStart: "search", children: "Search" } : p),
    card: <div style={{ display: "flex", gap: 8 }}><Button variant="primary">Primary</Button><Button>Secondary</Button></div>,
  },
  ButtonFilter: {
    // ButtonFilterDemo keeps on/off in local state. Keyed so switching controls starts fresh.
    render: (p) => <ButtonFilterDemo key={JSON.stringify(p)} {...(p as object)} />,
    preview: { children: "Status", onToggle: "{toggleStatus}" },
    extras: { filters: { values: ["none", "1", "3"], default: "none" }, value: { values: ["none", "Pending"], default: "none" } },
    normalize: ({ filters, value, ...p }) => ({ ...p, count: filters === "none" || !filters ? 0 : Number(filters), value: value === "none" ? undefined : value }),
    hint: "Pick a value or applied filters to set it: it turns blue and splits. Click the name to switch it on and off; off is dashed. Turn off has dropdown for a plain chip.",
    card: <div style={{ display: "flex", gap: 8 }}><ButtonFilter>Status</ButtonFilter><ButtonFilter value="Pending" onToggle={() => {}}>Status</ButtonFilter></div>,
  },
  ButtonGroup: {
    render: ({ children, ...p }) => (
      <ButtonGroup {...(p as object)}>
        {((children as Props[] | undefined) ?? []).map(({ children: text, ...b }, i) => <Button key={i} {...(b as object)}>{text as string}</Button>)}
      </ButtonGroup>
    ),
    preview: {
      label: "Plan period",
      children: [{ variant: "secondary", children: "Day" }, { variant: "secondary", children: "Week" }, { variant: "secondary", children: "Month" }],
    },
    card: <ButtonGroup label="Plan period"><Button>Day</Button><Button>Week</Button><Button>Month</Button></ButtonGroup>,
  },
  Logo: {
    render: (p) => <Logo {...(p as object)} />,
    preview: {},
    card: <Logo />,
  },
  LogoAI: {
    render: (p) => <LogoAI {...(p as object)} />,
    preview: {},
    card: <div style={{ display: "flex", gap: 16, alignItems: "center" }}><LogoAI /><LogoAI tone="filled" /></div>,
  },
  Cell: {
    render: (p) => <Cell {...(p as object)} />,
    preview: { type: "text", label: "INV-1042" },
    // Fills sample data for the picked type so every type previews with real content.
    normalize: (p) => ({ ...CELL_SAMPLES[(p.type as CellType) ?? "text"], ...p, ...(p.type !== "text" && p.label === "INV-1042" ? { label: CELL_SAMPLES[p.type as CellType]?.label } : {}) }),
    hint: "Pick a type, size and states. Each type fills in sample data.",
    card: <div style={{ display: "grid" }}><Cell type="avatar" size="sm" name="Maya Chen" label="maya@acme.com" src="/faces/maya-chen.jpg" /><Cell type="badge" size="sm" label="Paid" tone="success" /></div>,
  },
  Checkbox: {
    // The Checked switch sets the start value; the checkbox itself stays clickable. Keyed so switches re-apply.
    render: ({ checked, ...p }) => <Checkbox key={JSON.stringify(p) + String(checked)} {...(p as { label: string })} defaultChecked={Boolean(checked ?? p.defaultChecked)} />,
    preview: { label: "Send me product updates" },
    hide: ["defaultChecked"],
    hint: "Toggle size, checked, indeterminate, error, disabled and hidden label. The checkbox itself is clickable too.",
    card: <div style={{ display: "grid", gap: 8 }}><Checkbox label="Send me product updates" defaultChecked /><Checkbox label="Accept terms" /></div>,
  },
  Command: {
    // Keyed so a changed default query starts fresh. 480px wide, close to the Figma global search.
    render: (p) => (
      <div style={{ width: 480, maxWidth: "100%" }}>
        <Command key={JSON.stringify(p)} {...(p as unknown as CommandProps)} groups={(p.groups as CommandGroup[] | undefined) ?? []} />
      </div>
    ),
    preview: { groups: COMMAND_GROUPS },
    hint: "Type to filter. Arrow keys move the highlight and Enter picks. Escape clears. Toggle the key hints.",
    card: (
      <div style={{ width: "85%" }}>
        {/* One result and no hints so the card preview fits its frame. */}
        <Command groups={[{ items: [{ id: "invoices", label: "Invoices", icon: "receipt_long" }] }]} hints={false} />
      </div>
    ),
  },
  Count: {
    render: (p) => <Count {...(p as object)} count={Number(p.count ?? 3)} />,
    preview: { count: 3, label: "unread messages" },
    extras: { value: { values: ["3", "42", "150"], default: "3" } },
    normalize: ({ value, ...p }) => ({ ...p, count: Number(value ?? p.count) }),
    hint: "Switch size, tone and value. 150 shows as 99+ with the default max.",
    card: <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Count count={3} /><Count tone="danger" count={12} /><Count tone="neutral" count={150} /></div>,
  },
  DatePicker: {
    // Keyed so a changed default value applies again. The wrapper gives the full-width field a form-like width.
    render: (p) => (
      <div style={{ width: p.labelPosition === "start" ? 440 : 320, maxWidth: "100%" }}>
        <DatePicker key={JSON.stringify(p)} {...(p as unknown as DatePickerProps)} />
      </div>
    ),
    preview: { label: "Invoice date" },
    extras: { message: { values: ["none", "hint", "error"], default: "none" } },
    normalize: ({ message, ...p }) =>
      message === "error" ? { ...p, error: "Pick a date to continue." } : message === "hint" ? { ...p, hint: "Shown on the invoice." } : p,
    hint: "Click the field to open the calendar. Switch mode to range for two dates. Picks save on Apply.",
    column: true,
    card: (
      <div style={{ display: "grid", gap: 8, width: "80%" }}>
        <DatePicker size="sm" label="Invoice date" defaultValue="2027-01-08" />
        <DatePicker size="sm" mode="range" label="Billing period" defaultValue={{ start: "2027-01-08", end: "2027-01-14" }} />
      </div>
    ),
  },
  DropdownMenu: {
    // Keyed by props so a control change starts closed. The demo keeps picks in state; the menu is the real kit piece.
    render: (p) => <DropdownMenuDemo key={JSON.stringify(p)} {...(p as unknown as DropdownMenuProps)} items={(p.items as DropdownMenuEntry[] | undefined) ?? []} />,
    preview: { label: "Actions", items: MENU_ITEMS },
    hide: ["open"],
    // The filter trigger gets filter options and a count so it previews like a real filter.
    normalize: (p) => (p.trigger === "filter" && p.items === MENU_ITEMS ? { ...p, label: "Status", count: 2, items: FILTER_ITEMS } : p),
    hint: "Click the trigger to open the menu. Switch trigger, variant, size and align.",
    card: (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <DropdownMenu label="Actions" items={MENU_ITEMS} />
        <DropdownMenu label="Status" trigger="filter" count={2} items={FILTER_ITEMS} />
        <DropdownMenu label="Row actions" iconOnly variant="tertiary" items={MENU_ITEMS} />
      </div>
    ),
  },
  HeaderCell: {
    // The Checked switch sets the start value; the checkbox stays clickable. Keyed so switches re-apply.
    render: ({ checked, ...p }) => <HeaderCell key={JSON.stringify(p) + String(checked)} {...(p as object)} defaultChecked={Boolean(checked ?? p.defaultChecked)} />,
    preview: { label: "Customer", sortable: true, sort: "asc" },
    hide: ["defaultChecked"],
    hint: "Switch size, align and sort. Toggle checkbox for select-all.",
    card: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "85%" }}>
        <HeaderCell size="sm" label="Customer" sortable sort="asc" />
        <HeaderCell size="sm" label="Status" />
        <Cell size="sm" type="link" label="Acme Inc." href="#" />
        <Cell size="sm" type="badge" label="Paid" tone="success" />
      </div>
    ),
  },
  Form: {
    // FormDemo fills the real Form with sample kit fields. content and message are playground-only. Keyed so defaults re-apply.
    // Start labels and two columns need more room; narrow stages drop to one column on their own.
    render: ({ content, ...p }) => (
      <div style={{ width: (p.columns === 2 ? 640 : 480) + (p.labelPosition === "start" ? 160 : 0), maxWidth: "100%" }}>
        <FormDemo key={JSON.stringify(p) + String(content)} {...(p as FormProps)} content={content as FormDemoContent | undefined} />
      </div>
    ),
    preview: { title: "Company details", description: "Shown on every invoice you send." },
    snippet: { onSubmit: "{save}", actions: "{actions}", children: '<Input label="Company" name="company" required />' },
    extras: { content: { values: ["fields", "sections", "details"], default: "fields" }, message: { values: ["none", "error"], default: "none" } },
    normalize: ({ message, ...p }) => (message === "error" ? { ...p, error: "We couldn't save your changes. Try again." } : p),
    hint: "Switch variant, content and message. The fields are live; Save submits.",
    column: true,
    card: (
      <div style={{ width: "80%" }}>
        <Form actions={<Button size="sm" variant="primary" type="submit">Save</Button>}>
          <Input size="sm" label="Company" defaultValue="Acme Inc." />
        </Form>
      </div>
    ),
  },
  AppHeader: {
    // Full-width bar. AppHeaderDemo wires the account menu (dark mode and density in local state). Keyed so controls re-apply.
    render: (p) => <AppHeaderDemo key={JSON.stringify(p)} {...(p as unknown as AppHeaderProps)} />,
    preview: {
      onNavToggle: "{toggleNav}",
      environment: "UAT-2",
      searchShortcut: "Ctrl+K",
      searchScopes: [
        { value: "products", label: "Products" },
        { value: "accounts", label: "Accounts" },
        { value: "invoices", label: "Invoices" },
      ],
      searchGroups: [
        {
          heading: "Recent",
          items: [
            { id: "r1", label: "Acme Inc. — renewal quote", icon: "description" },
            { id: "r2", label: "Premium support plan", icon: "radio_button_unchecked" },
            { id: "r3", label: "Q3 revenue report", icon: "bar_chart" },
            { id: "r4", label: "INV-1042", icon: "description" },
          ],
        },
      ],
      actions: [
        { id: "help", label: "Help", icon: "help" },
        { id: "news", label: "What's new", icon: "campaign" },
        { id: "feedback", label: "Feedback", icon: "chat_info" },
      ],
      user: { name: "Maya Chen", src: "/faces/maya-chen.jpg" },
      company: { name: "Acme Inc." },
    },
    snippet: { onSearch: "{openSearch}", onUserSettings: "{openSettings}", onDarkModeChange: "{setDarkMode}", onDensityChange: "{setDensity}", onLogout: "{logOut}" },
    hint: "This stage is narrow, so the header is compact: menu button, logo symbol, search as an icon. Variants show it full width. Click the avatar for the account menu.",
    block: true,
    wide: true,
    card: (
      <div style={{ width: "285%", zoom: 0.35 }}>
        <AppHeader environment="UAT-2" searchShortcut="Ctrl+K" actions={[{ id: "help", label: "Help", icon: "help" }]} user={{ name: "Maya Chen", src: "/faces/maya-chen.jpg" }} company={{ name: "Acme Inc." }} />
      </div>
    ),
  },
  Density: {
    // Real kit controls with no size set; the Density around them picks sm, md or lg.
    render: (p) => <DensityDemo value={p.value as DensityValue | undefined} />,
    preview: {},
    snippet: { children: "<App />" },
    hint: "Switch the value: every control inside picks small, medium or large. A control's own size still wins.",
    column: true,
    card: (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button size="sm">Compact</Button>
        <Button size="md">Default</Button>
        <Button size="lg">Comfortable</Button>
      </div>
    ),
  },
  FormDisplay: {
    // The wrapper gives the full-width row a form-like width.
    render: (p) => (
      <div style={{ width: 440, maxWidth: "100%" }}>
        <FormDisplay {...(p as unknown as FormDisplayProps)} />
      </div>
    ),
    preview: { label: "Account type", value: "Customer", labelPosition: "start", help: "Set when the account is created." },
    hint: "Switch label position. The line under the row is built in.",
    flush: true,
    card: (
      <div style={{ width: "80%" }}>
        <FormDisplay label="Account type" value="Customer" labelPosition="start" />
        <FormDisplay label="Terms" value="Net 30" labelPosition="start" />
      </div>
    ),
  },
  FormulaEditor: {
    // onCalculate="{calculate}" in a contract example turns on the playground's sample Calculate. Keyed so defaults re-apply.
    render: (p) => (
      <div style={{ width: p.labelPosition === "start" ? 840 : 720, maxWidth: "100%" }}>
        <FormulaEditor key={JSON.stringify(p)} {...(p as unknown as FormulaEditorProps)} onCalculate={p.onCalculate ? calculate : undefined} />
      </div>
    ),
    preview: {
      label: "Discount formula",
      defaultValue: "{!Amount} * (1 - {!Account.Discount})",
      hint: "Runs when the invoice is created.",
      fields: [
        { id: "Amount", label: "Amount" },
        { id: "Account.Discount", label: "Account discount" },
        { id: "Invoice.Quantity", label: "Quantity" },
      ],
      onCalculate: "{calculate}",
    },
    hint: "Switch size and label position. Insert a field, operator or function, then Check syntax or Calculate. The editor is live.",
    column: true,
    card: (
      <div style={{ width: "125%", zoom: 0.7 }}>
        <FormulaEditor label="Formula" hideLabel defaultValue="{!Amount} * 0.9" />
      </div>
    ),
  },
  HelpPopover: {
    // trigger is playground-only: a ? icon Button, or a real Input whose help prop opens HelpPopover.
    // The Open switch pins it; off means uncontrolled (hover, focus, click). Keyed so it re-places.
    render: ({ trigger, ...p }) =>
      trigger === "field" ? (
        <div style={{ width: 320, maxWidth: "100%" }}>
          <Input label={(p.title as string) || "Tax ID"} help={p.content as string} placeholder="EU123456789" />
        </div>
      ) : (
        <HelpPopover key={JSON.stringify(p)} {...(p as unknown as Omit<HelpPopoverProps, "children">)} open={p.open ? true : undefined}>
          <Button variant="tertiary" size="sm" iconOnly iconStart="help_center">{`About ${(p.title as string) || "this"}`}</Button>
        </HelpPopover>
      ),
    preview: { title: "Tax ID", content: "The number on your tax registration, like EU123456789. We print it on every invoice.", open: true },
    snippet: { children: '<Button variant="tertiary" size="sm" iconOnly iconStart="help_center">About Tax ID</Button>' },
    extras: { trigger: { values: ["icon", "field"], default: "icon" } },
    hint: "Switch placement and trigger. Open pins the panel; turn it off, then hover, Tab or click the ? icon.",
    card: (
      <HelpPopover title="Tax ID" content="The number on your tax registration.">
        <Button variant="tertiary" size="sm" iconOnly iconStart="help_center">About Tax ID</Button>
      </HelpPopover>
    ),
  },
  Input: {
    // Keyed so a changed default value applies again. The wrapper gives the full-width field a form-like width.
    render: (p) => (
      <div style={{ width: p.labelPosition === "start" ? 440 : 320, maxWidth: "100%" }}>
        <Input key={JSON.stringify(p)} {...(p as unknown as InputProps)} />
      </div>
    ),
    preview: { label: "Email", type: "email", placeholder: "you@example.com" },
    // Types (file included) live in Variants; the code sample still shows the preview's type. multiple is file-only.
    hide: ["type", "multiple"],
    snippet: { type: "email" },
    column: true,
    extras: { message: { values: ["none", "hint", "error"], default: "none" } },
    normalize: ({ message, ...p }) =>
      message === "error" ? { ...p, error: "Enter a full email address, like maya@acme.com." } : message === "hint" ? { ...p, hint: "We never share your email." } : p,
    hint: "Switch size, label position, type and message. Toggle hidden label, required, invalid and disabled. The field is live.",
    card: (
      <div style={{ display: "grid", gap: 8, width: "80%" }}>
        <Input size="sm" label="Email" required placeholder="you@example.com" />
        <Input size="sm" label="Search" hideLabel iconStart="search" placeholder="Search" />
      </div>
    ),
  },
  Select: {
    // Keyed so switching multiple starts with an empty value of the right shape.
    render: (p) => (
      <div style={{ width: p.labelPosition === "start" ? 440 : 320, maxWidth: "100%" }}>
        <Select key={JSON.stringify(p)} {...(p as unknown as SelectProps)} options={(p.options as SelectProps["options"] | undefined) ?? []} />
      </div>
    ),
    preview: {
      label: "Country",
      placeholder: "Select a country",
      // Long enough to show scrolling and search.
      options: ["Australia", "Austria", "Belgium", "Brazil", "Canada", "Croatia", "Denmark", "France", "Germany", "India", "Ireland", "Italy", "Japan", "Serbia", "Spain", "United Kingdom", "United States"]
        .map((n) => ({ value: n.toLowerCase().replace(/ /g, "-"), label: n })),
    },
    // Item check lives in Variants.
    hide: ["itemCheck"],
    extras: { message: { values: ["none", "hint", "error"], default: "none" } },
    normalize: ({ message, ...p }) =>
      message === "error" ? { ...p, error: "Pick a country to continue." } : message === "hint" ? { ...p, hint: "Used for tax on invoices." } : p,
    hint: "Click the field to open the list. Toggle multiple to pick several. Switch size, label position and message.",
    column: true,
    card: (
      <div style={{ display: "grid", gap: 8, width: "80%" }}>
        <Select size="sm" label="Status" defaultValue="paid" options={[{ value: "paid", label: "Paid" }, { value: "draft", label: "Draft" }]} />
        <Select size="sm" label="Tags" multiple maxVisible={1} defaultValue={["usage", "annual"]} options={[{ value: "usage", label: "Usage" }, { value: "annual", label: "Annual" }]} />
      </div>
    ),
  },
  SegmentedControl: {
    // Keyed so a changed default value applies again; the options stay clickable.
    render: (p) => (
      <div style={{ width: p.fullWidth ? 360 : "auto", maxWidth: "100%" }}>
        <SegmentedControl key={JSON.stringify(p)} {...(p as unknown as SegmentedControlProps)} />
      </div>
    ),
    preview: {
      label: "Density & text size",
      options: [
        { value: "compact", label: "Compact" },
        { value: "default", label: "Default" },
        { value: "comfortable", label: "Comfortable" },
      ],
      defaultValue: "default",
    },
    hint: "Switch size and toggle hidden label, full width and disabled. Click an option or use the arrow keys.",
    column: true,
    card: (
      <SegmentedControl label="View" hideLabel size="sm" defaultValue="board"
        options={[{ value: "list", label: "List", icon: "view_list" }, { value: "board", label: "Board", icon: "view_kanban" }]} />
    ),
  },
  SideNav: {
    // A page-sized frame, tall enough for the whole rail: the nav fills its height, the sunken area stands in for the page. Keyed so the pin control re-applies.
    render: (p) => (
      <div key={JSON.stringify(p)} style={{ display: "flex", height: 720, border: "var(--border-width-thin) solid var(--border-neutral-subtle)", background: "var(--surface-sunken)" }}>
        <SideNav {...sideNavProps(p)} />
      </div>
    ),
    preview: { items: "{sections}", endItems: "{endSections}" },
    hide: ["pinned"],
    snippet: { onNavigate: "{openPage}" },
    hint: "Hover a section for its menu; click one to open its first page. Toggle expanded for labels and default pinned to dock the menu. Tab and Enter work too.",
    block: true,
    wide: true,
    card: (
      <div style={{ display: "flex", height: 520, zoom: 0.4 }}>
        <SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} defaultCurrent="revenue-general-ledger" defaultPinned />
      </div>
    ),
  },
  Switch: {
    // The Checked switch sets the start value; the switch itself stays clickable. Keyed so controls re-apply.
    render: ({ checked, ...p }) => (
      <div style={{ width: p.hideLabel ? "auto" : 320, maxWidth: "100%" }}>
        <Switch key={JSON.stringify(p) + String(checked)} {...(p as unknown as SwitchProps)} defaultChecked={Boolean(checked ?? p.defaultChecked)} />
      </div>
    ),
    preview: { label: "Email notifications", description: "Get an email when an invoice is paid.", checked: true },
    hide: ["defaultChecked"],
    hint: "Switch size and toggle checked, hidden label and disabled. The switch itself flips too.",
    column: true,
    card: (
      <div style={{ display: "grid", gap: 12, width: "80%" }}>
        <Switch size="sm" label="Email notifications" defaultChecked />
        <Switch size="sm" label="Auto-pay" />
      </div>
    ),
  },
  Tabs: {
    // Keyed so a changed default selection applies again; the tabs stay clickable.
    render: (p) => (
      <div style={{ width: p.expand ? 480 : "auto", maxWidth: "100%" }}>
        <Tabs key={JSON.stringify(p)} {...(p as unknown as TabsProps)} items={(p.items as TabItem[] | undefined) ?? []} />
      </div>
    ),
    preview: {
      label: "Account sections",
      items: [
        { id: "overview", label: "Overview", content: "Balance, plan and the last five invoices." },
        { id: "invoices", label: "Invoices", count: 5, countLabel: "invoices", content: "Every invoice for this account, newest first." },
        { id: "payments", label: "Payments", content: "Payment methods and payment history." },
      ],
    },
    hint: "Switch size and toggle expand and border. Click a tab or use the arrow keys.",
    card: (
      <Tabs label="Account sections" items={[{ id: "overview", label: "Overview" }, { id: "invoices", label: "Invoices", count: 5 }, { id: "payments", label: "Payments" }]} />
    ),
  },
  Toolbar: {
    // ToolbarDemo wires real filter chips with local value and on/off. Keyed so the open control re-applies.
    render: (p) => <ToolbarDemo key={JSON.stringify(p)} {...p} />,
    preview: {
      filters: "{filterChips}", onReset: "{resetFilters}", onApply: "{applyFilters}",
      filterHelp: "Filters narrow the list. Switch a filter off to keep it without applying it.",
      onSearchChange: "{setQuery}", searchGroups: "{quickLinks}", onSearchViewAll: "{searchAll}",
      views: "{views}", onRefresh: "{reload}", moreActions: "{moreActions}", actions: "{actions}",
    },
    hide: ["filtersOpen"],
    hint: "Click the search and type Sales for quick navigation. Click Filters to open the filter bar; pick a Status or Period, then click its name to switch it off and on.",
    block: true,
    wide: true,
    card: (
      <div style={{ width: "250%", zoom: 0.4 }}>
        <Toolbar filters={<></>} onSearchChange={() => {}} views={[{ id: "list", label: "List View" }]} onRefresh={() => {}}
          actions={<><Button size="sm">Export</Button><Button size="sm" variant="primary">Create</Button></>} />
      </div>
    ),
  },
  Tooltip: {
    // A kit Button is the trigger; trigger is playground-only. Open pins the bubble while you switch placement. Keyed so it re-places.
    // The Open switch pins it; off means uncontrolled (hover and focus), not forced shut.
    render: ({ trigger, ...p }) => (
      <Tooltip key={JSON.stringify(p)} {...(p as unknown as Omit<TooltipProps, "children">)} open={p.open ? true : undefined}>
        {trigger === "icon" ? <Button variant="tertiary" iconOnly iconStart="download">Download invoice</Button> : <Button>Export</Button>}
      </Tooltip>
    ),
    preview: { content: "Export includes all projects", open: true },
    snippet: { children: "<Button>Export</Button>" },
    extras: { trigger: { values: ["button", "icon"], default: "button" } },
    hint: "Switch placement and trigger. Open pins the bubble; turn it off, then hover or Tab to the button.",
    card: <Tooltip content="Export includes all projects"><Button size="sm">Export</Button></Tooltip>,
  },
  Textarea: {
    // Keyed so a changed default value applies again. The wrapper gives the full-width field a form-like width.
    render: (p) => (
      <div style={{ width: p.labelPosition === "start" ? 520 : 400, maxWidth: "100%" }}>
        <Textarea key={JSON.stringify(p)} {...(p as unknown as TextareaProps)} />
      </div>
    ),
    preview: { label: "Notes", placeholder: "Add a note for your team" },
    extras: { message: { values: ["none", "hint", "error"], default: "none" } },
    normalize: ({ message, ...p }) =>
      message === "error" ? { ...p, error: "Add at least 10 characters so the note is clear." } : message === "hint" ? { ...p, hint: "Only your team can see notes." } : p,
    hint: "Switch size, type, label position and message. Toggle hidden label, required, invalid and disabled. The field is live and resizable.",
    column: true,
    card: (
      <div style={{ width: "80%" }}>
        <Textarea size="sm" label="Notes" placeholder="Add a note for your team" />
      </div>
    ),
  },
  Modal: {
    // A kit Button opens the real Modal. content is playground-only: it picks the sample body.
    render: (p) => <ModalDemo {...(p as { title: string })} content={p.content as ModalDemoContent | undefined} />,
    preview: { title: "Modal title", description: "One line that explains the task." },
    hide: ["open"],
    snippet: { open: "{open}", onClose: "{close}" },
    extras: { content: { values: ["text", "form"], default: "text" } },
    hint: "Click the button to open it. Switch size and content. Escape, the ×, or a backdrop click closes.",
    card: <Button>Open modal</Button>,
  },
  PageHeader: {
    // actionButtons is playground-only: it adds a secondary and the one primary Button as actions.
    render: ({ actionButtons, ...p }) => (
      <PageHeader
        {...(p as unknown as PageHeaderProps)} onMoreSelect={() => {}}
        actions={actionButtons === "off" ? undefined : <><Button size="sm">Send</Button><Button size="sm" variant="primary">Approve</Button></>}
      />
    ),
    preview: {
      breadcrumbs: [{ label: "Billing", href: "#" }, { label: "Invoices", href: "#" }],
      icon: "folder_open",
      title: "INV-1042",
      badge: "Draft",
      moreActions: [
        { id: "duplicate", label: "Duplicate" },
        { id: "pdf", label: "Download PDF" },
        { divider: true },
        { id: "delete", label: "Delete", danger: true },
      ],
    },
    snippet: { actions: "{actions}" },
    extras: { actionButtons: { values: ["on", "off"], default: "on" } },
    hint: "Toggle sticky and shadow, pick a badge tone, and turn the action buttons off. More opens the overflow menu.",
    block: true,
    wide: true,
    card: (
      <div style={{ width: "250%", zoom: 0.4 }}>
        <PageHeader breadcrumbs={[{ label: "Billing", href: "#" }, { label: "Invoices", href: "#" }]} icon="folder_open" title="INV-1042" badge="Draft"
          actions={<><Button size="sm">Send</Button><Button size="sm" variant="primary">Approve</Button></>} />
      </div>
    ),
  },
  RadioGroup: {
    // Keyed by props so switching layout or state starts fresh; the radios stay clickable.
    render: (p) => <RadioGroup key={JSON.stringify(p)} {...(p as { legend: string })} options={(p.options as RadioGroupOption[] | undefined) ?? []} />,
    preview: {
      legend: "Billing cycle",
      defaultValue: "annual",
      options: [
        { value: "monthly", label: "Monthly", description: "Pay month to month. Cancel anytime." },
        { value: "annual", label: "Annual", description: "Two months free.", badge: "Save 16%", badgeTone: "success" },
      ],
    },
    extras: { message: { values: ["none", "hint", "error"], default: "none" } },
    normalize: ({ message, ...p }) =>
      message === "error" ? { ...p, error: "Select a billing cycle to continue." } : message === "hint" ? { ...p, hint: "You can change this later." } : p,
    hint: "Switch size, orientation, layout and message. Descriptions and badges show in card layout.",
    card: <RadioGroup legend="Billing cycle" defaultValue="annual" options={[{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }]} />,
  },
  Icon: {
    render: (p) => <Icon {...(p as object)} name={(p.name as string) || "search"} />,
    preview: { name: "search", size: "lg" },
    card: <div style={{ display: "flex", gap: 12 }}><Icon name="search" size="lg" /><Icon name="check_circle" size="lg" tone="success" /><Icon name="warning" size="lg" tone="warning" filled /></div>,
  },
};
