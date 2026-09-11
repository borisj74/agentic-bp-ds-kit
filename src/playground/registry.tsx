import type { ReactNode } from "react";
import { Accordion, type AccordionItem } from "@/ui/Accordion/Accordion";
import { Alert } from "@/ui/Alert/Alert";
import { AlertDialogDemo, AppHeaderDemo, ButtonFilterDemo, CellTreeDemo, SkeletonDemo, StepperDemo, type SkeletonDemoLayout, ToolbarDemo, DensityDemo, DrawerDemo, DropdownMenuDemo, FormDemo, ModalDemo, ToastDemo, calculate, type DrawerDemoContent, type FormDemoContent, type ModalDemoContent } from "./demos";
import type { DensityValue } from "@/ui/Density/Density";
import { AppHeader, type AppHeaderProps } from "@/ui/AppHeader/AppHeader";
import { Avatar } from "@/ui/Avatar/Avatar";
import { AvatarGroup, type AvatarGroupItem } from "@/ui/AvatarGroup/AvatarGroup";
import { Badge } from "@/ui/Badge/Badge";
import { BadgeAlt } from "@/ui/BadgeAlt/BadgeAlt";
import { BarChart, type BarChartProps } from "@/ui/BarChart/BarChart";
import { Breadcrumb, type BreadcrumbItem } from "@/ui/Breadcrumb/Breadcrumb";
import { Button } from "@/ui/Button/Button";
import { Cascader, type CascaderOption, type CascaderProps } from "@/ui/Cascader/Cascader";
import { Calendar, type CalendarEvent, type CalendarProps, type CalendarSource } from "@/ui/Calendar/Calendar";
import { Card, type CardProps } from "@/ui/Card/Card";
import { Carousel, type CarouselProps } from "@/ui/Carousel/Carousel";
import { Cell, type CellSize, type CellType } from "@/ui/Cell/Cell";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Command, type CommandGroup, type CommandProps } from "@/ui/Command/Command";
import { Count } from "@/ui/Count/Count";
import { ButtonFilter } from "@/ui/ButtonFilter/ButtonFilter";
import { ButtonGroup } from "@/ui/ButtonGroup/ButtonGroup";
import { DataGrid, type DataGridColumn, type DataGridProps, type DataGridRow } from "@/ui/DataGrid/DataGrid";
import { DatePicker, type DatePickerProps } from "@/ui/DatePicker/DatePicker";
import { DropdownMenu, type DropdownMenuEntry, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { FormDisplay, type FormDisplayProps } from "@/ui/FormDisplay/FormDisplay";
import { Empty, type EmptyProps } from "@/ui/Empty/Empty";
import { FormulaEditor, type FormulaEditorProps } from "@/ui/FormulaEditor/FormulaEditor";
import { HeaderCell } from "@/ui/HeaderCell/HeaderCell";
import { HelpPopover, type HelpPopoverProps } from "@/ui/HelpPopover/HelpPopover";
import { Icon } from "@/ui/Icon/Icon";
import { Input, type InputProps } from "@/ui/Input/Input";
import { LineChart, type LineChartProps } from "@/ui/LineChart/LineChart";
import { Logo } from "@/ui/Logo/Logo";
import { Lookup, type LookupProps } from "@/ui/Lookup/Lookup";
import { LogoAI } from "@/ui/LogoAI/LogoAI";
import { PageHeader, type PageHeaderProps } from "@/ui/PageHeader/PageHeader";
import { PieChart, type PieChartProps } from "@/ui/PieChart/PieChart";
import { Pagination, type PaginationProps } from "@/ui/Pagination/Pagination";
import { Progress, type ProgressProps } from "@/ui/Progress/Progress";
import { ProgressLegacy, type ProgressLegacyProps } from "@/ui/ProgressLegacy/ProgressLegacy";
import { RadioGroup, type RadioGroupOption } from "@/ui/RadioGroup/RadioGroup";
import { Scoreboard, type ScoreboardItem, type ScoreboardProps } from "@/ui/Scoreboard/Scoreboard";
import { Section, type SectionProps } from "@/ui/Section/Section";
import { SegmentedControl, type SegmentedControlProps } from "@/ui/SegmentedControl/SegmentedControl";
import { ShimmerText, type ShimmerTextProps } from "@/ui/ShimmerText/ShimmerText";
import { Skeleton } from "@/ui/Skeleton/Skeleton";
import { Spinner, type SpinnerProps } from "@/ui/Spinner/Spinner";
import { Stepper, type StepperProps } from "@/ui/Stepper/Stepper";
import { Select, type SelectProps } from "@/ui/Select/Select";
import { SideNav, type SideNavEntry, type SideNavItem, type SideNavProps } from "@/ui/SideNav/SideNav";
import { Switch, type SwitchProps } from "@/ui/Switch/Switch";
import { Tabs, type TabItem, type TabsProps } from "@/ui/Tabs/Tabs";
import { Table, type TableColumn, type TableProps, type TableRow } from "@/ui/Table/Table";
import { Textarea, type TextareaProps } from "@/ui/Textarea/Textarea";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import { Tooltip, type TooltipProps } from "@/ui/Tooltip/Tooltip";
import { TreeView, type TreeItem, type TreeViewProps } from "@/ui/TreeView/TreeView";

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
  /** Playground-only on/off switches, shown as a Content group, like Figma boolean properties. A key that is a real
   *  boolean prop sets it (labelled here instead of under States); other keys are read by normalize to drop parts. */
  toggles?: Record<string, { label: string; default: boolean }>;
  /** Control panel width in px on this page only, when its chips don't fit the default 248. */
  panelWidth?: number;
  /** Fills in props a combination needs, e.g. an icon for icon-only. */
  normalize?: (p: Props) => Props;
  card: ReactNode;
  /** Gallery card shows the start of a wide bar at full size, cropped and fading at the end, instead of shrinking it. */
  cardCrop?: boolean;
}

const STEPS = ["Setup", "Map Columns", "Billing IDs", "Usage IDs", "Activate"];

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
  progress: { value: 64, label: "Onboarding" },
  rating: { value: 4 },
  select: { label: "Status", value: "paid", options: [{ value: "draft", label: "Draft" }, { value: "paid", label: "Paid" }, { value: "void", label: "Void" }] },
  actions: { actions: [{ label: "View" }, { label: "Send" }] },
  actionIcons: { actions: [{ label: "Edit", icon: "edit" }, { label: "Download", icon: "download" }, { label: "Delete", icon: "delete" }] },
  actionMenu: { label: "Row actions", actions: [{ label: "View" }, { label: "Download" }, { label: "Delete", icon: "delete", variant: "danger" }] },
  checkbox: { label: "INV-1042" },
  tree: { label: "Acme Holdings" },
};

// Table samples. Contract examples name them as {invoiceColumns}, {invoices}, {total}, {accountColumns}, {accounts}.
const INVOICE_COLUMNS: TableColumn[] = [
  { key: "invoice", header: "Invoice", emphasis: true },
  { key: "status", header: "Status" },
  { key: "method", header: "Method" },
  { key: "amount", header: "Amount", numeric: true },
];
const INVOICES: TableRow[] = [
  ["INV001", "Paid", "Credit Card", "$250.00"], ["INV002", "Pending", "PayPal", "$150.00"], ["INV003", "Unpaid", "Bank Transfer", "$350.00"],
  ["INV004", "Paid", "Credit Card", "$450.00"], ["INV005", "Paid", "PayPal", "$550.00"], ["INV006", "Pending", "Bank Transfer", "$200.00"],
  ["INV007", "Unpaid", "Credit Card", "$300.00"],
].map(([invoice, status, method, amount]) => ({ id: invoice, invoice, status, method, amount }));
const ACCOUNT_COLUMNS: TableColumn[] = [
  { key: "account", header: "Account", width: "34%" },
  { key: "owner", header: "Owner" },
  { key: "status", header: "Status" },
  { key: "mrr", header: "MRR", numeric: true },
  { key: "actions", header: "", align: "end", width: "1%" },
];
const ACCOUNT_ACTIONS = [{ label: "View" }, { label: "Edit" }, { label: "Delete", variant: "danger" as const }];
const ACCOUNTS: TableRow[] = [
  { id: "acme", account: <Cell type="link" label="Acme Inc." href="#" />, owner: <Cell type="avatar" name="Maya Chen" src="/faces/maya-chen.jpg" />, status: <Cell type="badge" label="Active" tone="success" />, mrr: "$12,400", actions: <Cell type="actionMenu" align="end" actions={ACCOUNT_ACTIONS} /> },
  { id: "globex", account: <Cell type="link" label="Globex" href="#" />, owner: <Cell type="avatar" name="Noah Williams" src="/faces/noah-williams.jpg" />, status: <Cell type="badge" label="Trial" tone="info" />, mrr: "$3,150", actions: <Cell type="actionMenu" align="end" actions={ACCOUNT_ACTIONS} /> },
  { id: "initech", account: <Cell type="link" label="Initech" href="#" />, owner: <Cell type="avatar" name="Iris Okafor" src="/faces/iris-okafor.jpg" />, status: <Cell type="badge" label="Past due" tone="danger" />, mrr: "$980", actions: <Cell type="actionMenu" align="end" actions={ACCOUNT_ACTIONS} /> },
];
// Icon-only row actions: a kit Cell actionIcons, each button named by its label.
const ICON_ACTIONS = [{ label: "Edit", icon: "edit" }, { label: "Download", icon: "download" }, { label: "Delete", icon: "delete" }];
const ICON_ACTION_COLUMNS: TableColumn[] = [...INVOICE_COLUMNS, { key: "actions", header: "", align: "end", width: "1%" }];
const ICON_ACTION_ROWS: TableRow[] = INVOICES.slice(0, 4).map((r) => ({
  ...r, actions: <Cell type="actionIcons" align="end" label={`Actions for ${r.invoice}`} actions={ICON_ACTIONS} />,
}));
const TABLE_SAMPLES: Record<string, unknown> = {
  "{invoiceColumns}": INVOICE_COLUMNS, "{invoices}": INVOICES, "{total}": { label: "Total", value: "$2,250.00" },
  "{accountColumns}": ACCOUNT_COLUMNS, "{accounts}": ACCOUNTS,
  "{iconActionColumns}": ICON_ACTION_COLUMNS, "{invoicesWithActions}": ICON_ACTION_ROWS,
};
const tableProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in TABLE_SAMPLES ? TABLE_SAMPLES[v] : v])) as unknown as TableProps;

// DataGrid samples. Contract examples name them as {conditionColumns}, {conditions}, {lineItemColumns}, {lineItems}.
const CONDITION_COLUMNS: DataGridColumn[] = [
  { key: "field", header: "Field", type: "formula", placeholder: "Pick a field or write a formula", fields: [{ id: "Account.Status", label: "Account status" }, { id: "Invoice.Amount", label: "Invoice amount" }, { id: "Invoice.DueDate", label: "Due date" }], onCalculate: (f) => (f.trim() ? "Valid formula" : "Nothing to calculate") },
  { key: "condition", header: "Condition", type: "select", placeholder: "Choose", width: "200px", options: [{ value: "equals", label: "Equals" }, { value: "notEquals", label: "Does not equal" }, { value: "greater", label: "Greater than" }, { value: "less", label: "Less than" }, { value: "contains", label: "Contains" }] },
  { key: "value", header: "Value", placeholder: "Enter a value" },
];
const CONDITIONS: DataGridRow[] = [
  { id: "c1", field: "{!Account.Status}", condition: "equals", value: "Active" },
  { id: "c2", field: "{!Invoice.Amount}", condition: "greater", value: "1000" },
];
const LINE_ITEM_COLUMNS: DataGridColumn[] = [
  { key: "product", header: "Product" },
  { key: "sku", header: "SKU", readOnly: true, hug: true },
  { key: "qty", header: "Qty", type: "number", hug: true },
  { key: "price", header: "Unit price", type: "number" },
];
const LINE_ITEMS: DataGridRow[] = [
  { id: "l1", product: "Premium support", sku: "SUP-100", qty: "1", price: "1200.00" },
  { id: "l2", product: "Seat license", sku: "LIC-020", qty: "25", price: "40.00" },
];
const GRID_SAMPLES: Record<string, unknown> = {
  "{conditionColumns}": CONDITION_COLUMNS, "{conditions}": CONDITIONS, "{lineItemColumns}": LINE_ITEM_COLUMNS, "{lineItems}": LINE_ITEMS,
};
const gridProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in GRID_SAMPLES ? GRID_SAMPLES[v] : v])) as unknown as DataGridProps;

// Scoreboard samples. Contract examples name them as {trendKpis}, {chartKpis}, {sixKpis}.
const TREND_KPIS: ScoreboardItem[] = [
  { id: "open", title: "Open invoices", metric: "128", badge: "Month", trend: { value: "12%", unit: "MoM", status: "success", direction: "up" }, metadata: "Updated today" },
  { id: "overdue", title: "Overdue", metric: "$36,420", badge: "Month", trend: { value: "4.1%", unit: "MoM", status: "danger", direction: "up" }, metadata: "14 accounts" },
  { id: "dso", title: "Days to pay", metric: "32 days", trend: { value: "0%", unit: "MoM", status: "neutral", direction: "none" }, metadata: "Average across accounts" },
];
const CHART_KPIS: ScoreboardItem[] = [
  { id: "revenue", title: "Revenue", metric: "$482,900", badge: "YTD", chart: { points: [52, 58, 54, 66, 62, 74, 70, 82], status: "success" }, metadata: "Last 8 weeks" },
  { id: "churn", title: "Churn", metric: "2.4%", chart: { points: [30, 36, 32, 42, 40, 48, 44, 54], status: "danger" }, metadata: "Last 8 weeks" },
  { id: "seats", title: "Active seats", metric: "1,204", chart: { points: [1180, 1210, 1195, 1190, 1215, 1200, 1198, 1204] }, metadata: "Last 8 weeks" },
];
const SIX_KPIS: ScoreboardItem[] = [
  ...TREND_KPIS,
  { id: "paid", title: "Paid", metric: "$210,300", trend: { value: "8.2%", unit: "YoY", status: "success", direction: "up" }, metadata: "This month" },
  { id: "disputed", title: "Disputed", metric: "6", trend: { value: "2", status: "success", direction: "down" }, metadata: "Needs review" },
  { id: "credits", title: "Credits", metric: "$4,800", metadata: "This month" },
];
const SCORE_SAMPLES: Record<string, unknown> = { "{trendKpis}": TREND_KPIS, "{chartKpis}": CHART_KPIS, "{sixKpis}": SIX_KPIS };
const scoreProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in SCORE_SAMPLES ? SCORE_SAMPLES[v] : v])) as unknown as ScoreboardProps;

// Carousel sample: five numbered panels. Contract examples name them as {slides}. Vertical panels fill the short track.
const slides = (vertical: boolean) => Array.from({ length: 5 }, (_, i) => (
  <div
    key={i}
    style={{
      display: "grid", placeItems: "center", minHeight: vertical ? 0 : 160, boxSizing: "border-box",
      background: "var(--surface-flat)", border: "var(--border-width-thin) solid var(--border-neutral-faint)", borderRadius: "var(--radius-large)",
      fontSize: "var(--font-size-xlarge)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-neutral-strong)",
    }}
  >
    {i + 1}
  </div>
));

// Section samples. Contract examples name them as {editAction}, {addAction}, {accountRows}, {invoiceTable}.
const SECTION_SAMPLES: Record<string, ReactNode> = {
  "{editAction}": <Button size="sm" iconStart="edit">Edit</Button>,
  "{addAction}": <Button size="sm" iconStart="add">Add contact</Button>,
  "{accountRows}": (
    <div>
      <FormDisplay label="Account name" value="Northwind Traders" />
      <FormDisplay label="Account number" value="ACC-10482" />
      <FormDisplay label="Billing contact" value="Maria Anders" />
    </div>
  ),
  "{invoiceTable}": <Table size="sm" columns={INVOICE_COLUMNS} rows={INVOICES.slice(0, 3)} />,
};
const sectionProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in SECTION_SAMPLES ? SECTION_SAMPLES[v] : v])) as unknown as SectionProps;

// Empty samples. Contract examples name them as {createActions}, {uploadAction}, {avatar}, {messageAction}.
const EMPTY_SAMPLES: Record<string, ReactNode> = {
  "{createActions}": <><Button variant="primary">Create invoice</Button><Button>Import</Button></>,
  "{uploadAction}": <Button iconStart="upload">Upload files</Button>,
  "{avatar}": <Avatar name="Maya Chen" src="/faces/maya-chen.jpg" size="lg" />,
  "{messageAction}": <Button>Leave a message</Button>,
};
const emptyProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in EMPTY_SAMPLES ? EMPTY_SAMPLES[v] : v])) as unknown as EmptyProps;

// Chart samples, after the Persona Homepages charts. Contract examples name them as {months}, {revenue} and so on.
const M = 1_000_000;
const CHART_SAMPLES: Record<string, unknown> = {
  "{months}": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "{revenue}": [{ name: "Revenue", values: [3.4 * M, 3.6 * M, 4.2 * M, 4.4 * M, 4.6 * M, 4.9 * M] }],
  "{revenueByType}": [
    { name: "Recurring", values: [2.1 * M, 2.3 * M, 2.6 * M, 2.8 * M, 3.0 * M, 3.2 * M] },
    { name: "Non recurring", values: [1.3 * M, 1.3 * M, 1.6 * M, 1.6 * M, 1.6 * M, 1.7 * M] },
  ],
  "{days}": ["Apr 1", "Apr 5", "Apr 10", "Apr 15", "Apr 20", "Apr 25", "Apr 30"],
  "{approvals}": [
    { name: "20% to 49% approved", values: [0, 5800, 4800, 2600, 1100, 450, 150], tone: "orange" },
    { name: "50% to 79% approved", values: [0, 6000, 5100, 2100, 950, 450, 0], tone: "cyan" },
  ],
  "{severityDays}": ["Apr 1", "Apr 5", "Apr 10", "Apr 20", "Apr 25", "Apr 30"],
  "{severity}": [
    { name: "Regular", values: [1.0 * M, 1.1 * M, 1.3 * M, 1.4 * M, 1.5 * M, 1.7 * M] },
    { name: "Credit", values: [0.7 * M, 0.7 * M, 0.8 * M, 0.9 * M, 0.9 * M, 1.0 * M] },
    { name: "Debit", values: [0.5 * M, 0.6 * M, 0.6 * M, 0.6 * M, 0.7 * M, 0.7 * M] },
    { name: "Manual", values: [0.4 * M, 0.4 * M, 0.5 * M, 0.5 * M, 0.5 * M, 0.6 * M] },
    { name: "Void", values: [0.3 * M, 0.3 * M, 0.3 * M, 0.3 * M, 0.4 * M, 0.4 * M] },
    { name: "Draft", values: [0.1 * M, 0.1 * M, 0.1 * M, 0.1 * M, 0.1 * M, 0.15 * M] },
  ],
  "{weeks}": ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
  "{statuses}": [
    { name: "Current", values: [600000, 550000, 240000, 230000, 60000, 20000, 20000], tone: "pink" },
    { name: "Closing", values: [15000, 25000, 335000, 165000, 50000, 30000, 90000], tone: "orange" },
    { name: "Closed", values: [20000, 30000, 55000, 235000, 285000, 15000, 15000], tone: "gray" },
    { name: "Approved", values: [15000, 35000, 15000, 15000, 155000, 350000, 230000], tone: "cyan" },
    { name: "Sent", values: [10000, 15000, 10000, 10000, 60000, 185000, 145000], tone: "mint" },
    { name: "Paid", values: [15000, 20000, 20000, 20000, 65000, 75000, 175000], tone: "green" },
  ],
  "{customers}": ["Northwind Traders", "Acme Corporation", "Globex Industries", "Initech", "Umbrella Health Services", "Stark Logistics"],
  "{balances}": [{ name: "Open balance", values: [482000, 391500, 268200, 174900, 121300, 64800] }],
  "{payments}": [
    { label: "Card", value: 182400 }, { label: "ACH", value: 96300 }, { label: "Wire", value: 41800 }, { label: "Check", value: 12600 },
  ],
  "{statusShare}": [
    { label: "Paid", value: 58, tone: "green" }, { label: "Sent", value: 21, tone: "mint" }, { label: "Overdue", value: 13, tone: "red" }, { label: "Draft", value: 8, tone: "gray" },
  ],
};
// Charts sit on a white page panel: their faint grid lines are the stage gray.
const chartPanel = { width: "100%", padding: "var(--space-medium)", background: "var(--surface-flat)", borderRadius: "var(--radius-medium)", boxSizing: "border-box" } as const;
const chartProps = <T,>(p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in CHART_SAMPLES ? CHART_SAMPLES[v] : v])) as unknown as T;

// Calendar samples, laid around this week so today and the time line show. Contract examples name them {calendars} and {events}.
const CAL_SOURCES: CalendarSource[] = [
  { id: "pto", name: "PTO", tone: "orange" },
  { id: "personal", name: "Personal calendar", tone: "cyan" },
  { id: "shifts", name: "Open shifts", tone: "green" },
  { id: "holidays", name: "US holidays", tone: "purple" },
  { id: "billing", name: "Billing runs", tone: "pink" },
];
// A date n days after this week's Sunday, with an optional time.
const calDay = (n: number, time?: string) => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + n);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return time ? `${iso}T${time}` : iso;
};
const CAL_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Maria out of office", start: calDay(0), end: calDay(1), allDay: true, calendar: "pto" },
  { id: "e2", title: "Quarter close", start: calDay(2), allDay: true, calendar: "billing" },
  { id: "e3", title: "Support desk shift", start: calDay(0, "08:00"), end: calDay(0, "13:00"), calendar: "shifts" },
  { id: "e4", title: "Dentist", start: calDay(0, "09:30"), end: calDay(0, "12:00"), calendar: "personal" },
  { id: "e5", title: "Invoice review", start: calDay(2, "09:30"), end: calDay(2, "13:00"), calendar: "billing" },
  { id: "e6", title: "1:1 with Sam", start: calDay(2, "09:30"), end: calDay(2, "12:00"), calendar: "personal" },
  { id: "e7", title: "Release day", start: calDay(3), allDay: true, calendar: "personal" },
  { id: "e8", title: "Standup", start: calDay(3, "09:00"), end: calDay(3, "09:15"), calendar: "personal" },
  { id: "e9", title: "Pricing sync", start: calDay(3, "11:00"), end: calDay(3, "12:00"), calendar: "billing" },
  { id: "e10", title: "Design review", start: calDay(3, "13:00"), end: calDay(3, "14:30"), calendar: "personal" },
  { id: "e11", title: "Payroll check", start: calDay(3, "15:30"), end: calDay(3, "16:00"), calendar: "billing" },
  { id: "e12", title: "Onboarding shift", start: calDay(4, "12:00"), end: calDay(4, "17:30"), calendar: "shifts" },
  { id: "e13", title: "Month-end billing run", start: calDay(5, "06:00"), end: calDay(5, "08:00"), calendar: "billing" },
  { id: "e14", title: "Company holiday", start: calDay(8), allDay: true, calendar: "holidays" },
  { id: "e15", title: "Planning", start: calDay(9, "10:00"), end: calDay(9, "11:30"), calendar: "personal" },
  { id: "e16", title: "Sam on vacation", start: calDay(10), end: calDay(12), allDay: true, calendar: "pto" },
  { id: "e17", title: "Evening shift", start: calDay(-4, "16:00"), end: calDay(-4, "22:00"), calendar: "shifts" },
  { id: "e18", title: "Dunning run", start: calDay(-2, "07:00"), end: calDay(-2, "08:00"), calendar: "billing" },
];
const CAL_SAMPLES: Record<string, unknown> = { "{calendars}": CAL_SOURCES, "{events}": CAL_EVENTS };
const calendarProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in CAL_SAMPLES ? CAL_SAMPLES[v] : v])) as unknown as CalendarProps;

// Tree samples after the Dunav DS tree: an organization, projects and settings. Contract examples name them {workspace}, {open} and {checked}.
const leaf = (id: string, label: string): TreeItem => ({ id, label });
const TREE_ITEMS: TreeItem[] = [
  { id: "org", label: "Organization", children: [
    { id: "eng", label: "Engineering", children: [leaf("eng-1", "Noah Pierre"), leaf("eng-2", "Lana Steiner"), leaf("eng-3", "Kari Rasmussen")] },
    { id: "design", label: "Design", children: [leaf("sienna", "Sienna Hewitt"), leaf("ammar", "Ammar Foley"), leaf("caitlyn", "Caitlyn King")] },
    { id: "product", label: "Product", children: [leaf("prod-1", "Olivia Rhye"), leaf("prod-2", "Phoenix Baker")] },
    { id: "marketing", label: "Marketing", children: [leaf("mkt-1", "Lori Bryson")] },
    { id: "sales", label: "Sales", children: [leaf("sales-1", "Zahir Mays"), leaf("sales-2", "Andi Lane")] },
    { id: "finance", label: "Finance", children: [leaf("fin-1", "Demi Wilkinson")] },
  ] },
  { id: "projects", label: "Projects", children: [
    { id: "powersurge", label: "Powersurge", children: [
      { id: "brief", label: "Client brief", children: [leaf("brief-1", "Brief_v1"), leaf("brief-2", "Brief_v2")] },
      leaf("deliverables", "Deliverables"),
    ] },
    { id: "ikigai", label: "Ikigai Labs", children: [leaf("ikigai-1", "Kickoff notes"), leaf("ikigai-2", "Roadmap")] },
  ] },
  { id: "settings", label: "Settings", children: [leaf("members", "Members"), leaf("billing", "Billing")] },
];
const TREE_SAMPLES: Record<string, unknown> = {
  "{workspace}": TREE_ITEMS,
  "{open}": ["org", "design", "projects", "powersurge", "brief"],
  "{checked}": ["design"],
};
const treeProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in TREE_SAMPLES ? TREE_SAMPLES[v] : v])) as unknown as TreeViewProps;

// Cascader samples after the Figma field picker: invoice fields, with related records that open more fields.
// Contract examples name them {fields}, {path} and {locations}.
const f = (value: string, type: string): CascaderOption => ({ value, label: value, type });
const USER_FIELDS: CascaderOption[] = [
  f("Created", "Date"), f("DefaultFlag", "Num"), f("DisplayFlag", "Num"), f("Email", "Text"), f("Id", "Num"), f("Tzname", "Text"),
  f("Updated", "Date"), f("UtcOffset", "Num"),
];
const CASCADER_FIELDS: CascaderOption[] = [
  { value: "AccountingPeriod", label: "AccountingPeriod", path: "Id", relation: "parent", children: [f("Id", "Num"), f("Name", "Text"), f("StartDate", "Date"), f("EndDate", "Date")] },
  f("AchBankAcctNum", "Text"), f("AchToken", "Num"), f("Address1", "Text"), f("AllocatedToExtAc", "Date"), f("Amount", "Num"),
  { value: "ApproveInvoice", label: "ApproveInvoice", path: "Id", relation: "parent", children: [f("ApprovedBy", "Text"), f("ApprovedDate", "Date"), f("Status", "Text")] },
  f("Autoallocate", "Num"), f("BankTransactionId", "Num"),
  { value: "BillingProfile", label: "BillingProfile", path: "Id", relation: "parent", children: [
    { value: "Account", label: "Account", path: "Id", relation: "parent", children: [
      f("AccountNumber", "Text"), f("Name", "Text"), f("Status", "Text"),
      { value: "Owner", label: "Owner", path: "User.Id", relation: "parent", children: USER_FIELDS },
    ] },
    f("BillingCycle", "Text"), f("Currency", "Text"), f("PaymentTerms", "Text"),
  ] },
  { value: "BpPayout", label: "BpPayout", path: "Id", relation: "parent", children: [f("Amount", "Num"), f("PayoutDate", "Date")] },
  { value: "Bppay_Payout_Report_Detail", label: "Bppay_Payout_Report_Detail", path: "Payment.ItemId", relation: "children", children: [f("Amount", "Num"), f("Fee", "Num"), f("ReportDate", "Date")] },
  { value: "Bppay_Payout", label: "Bppay_Payout", path: "Payment.Id", relation: "children", children: [f("Amount", "Num"), f("Status", "Text")] },
  { value: "C_Remittancesets", label: "C_Remittancesets", path: "Payment.Id", relation: "children", children: [f("Name", "Text"), f("Total", "Num")] },
  { value: "CreatedUserIdObj", label: "CreatedUserIdObj", path: "User.Id", relation: "parent", children: USER_FIELDS },
  f("DueDate", "Date"), f("InvoiceNumber", "Text"),
];
const CASCADER_LOCATIONS: CascaderOption[] = [
  { value: "na", label: "North America", children: [
    { value: "us", label: "United States", children: [{ value: "nyc", label: "New York" }, { value: "sf", label: "San Francisco" }, { value: "austin", label: "Austin" }] },
    { value: "ca", label: "Canada", children: [{ value: "toronto", label: "Toronto" }, { value: "vancouver", label: "Vancouver" }] },
  ] },
  { value: "eu", label: "Europe", children: [
    { value: "de", label: "Germany", children: [{ value: "berlin", label: "Berlin" }, { value: "munich", label: "Munich" }] },
    { value: "rs", label: "Serbia", children: [{ value: "belgrade", label: "Belgrade" }, { value: "novisad", label: "Novi Sad" }] },
  ] },
];
const CASCADER_SAMPLES: Record<string, unknown> = {
  "{fields}": CASCADER_FIELDS,
  "{path}": ["BillingProfile", "Account", "Owner", "Email"],
  "{locations}": CASCADER_LOCATIONS,
};
const cascaderProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in CASCADER_SAMPLES ? CASCADER_SAMPLES[v] : v])) as unknown as CascaderProps;

// Lookup samples after the Figma product lookup. Contract examples name them {productColumns} and {products}.
const PRODUCT_COLUMNS: TableColumn[] = [
  { key: "name", header: "Product name", width: "22%" },
  { key: "id", header: "ID" },
  { key: "method", header: "Rating method" },
  { key: "type", header: "Product type" },
  { key: "level", header: "Product level" },
  { key: "status", header: "Status" },
  { key: "rate", header: "Rate", numeric: true },
  { key: "created", header: "Created" },
];
const product = (id: string, name: string, method: string, type: string, level: string, active: boolean, rate: string, created: string): TableRow => ({
  id, name, method, type, level, rate, created,
  status: <Cell size="sm" type="badge" label={active ? "Active" : "Deactivated"} tone={active ? "success" : "neutral"} />,
});
const PRODUCTS: TableRow[] = [
  product("13980", "On-Demand Virtual Training - Gold", "One Time Charge", "Training", "Gold", false, "$3,000.00", "06/04/2022"),
  product("13981", "On-Demand Virtual Training - Silver", "One Time Charge", "Training", "Silver", false, "$2,000.00", "06/04/2022"),
  product("13982", "On-Demand Virtual Training - Bronze", "One Time Charge", "Training", "Bronze", false, "$1,000.00", "06/04/2022"),
  product("13984", "Software Maintenance - Dedicated", "Subscription", "Maintenance", "Gold", true, "$14,000.00", "06/04/2022"),
  product("13985", "Software Maintenance - Basic", "Subscription", "Maintenance", "Silver", false, "$6,000.00", "06/04/2022"),
  product("13987", "Software Maintenance - Dedicated Support", "Subscription", "Support", "Enterprise", true, "$12,000.00", "06/04/2022"),
  product("13988", "Software Maintenance - Dedicated Bronze", "Subscription", "Maintenance", "Bronze", true, "$10,000.00", "06/04/2022"),
  product("13989", "Software Subscription - Gold", "Subscription", "API", "Enterprise", true, "$12,000.00", "06/04/2022"),
  product("13990", "Software Subscription - Silver", "Subscription", "Software", "Silver", false, "$225,000.00", "06/04/2022"),
  product("13991", "Software Subscription - Bronze", "Subscription", "Software", "Bronze", false, "$200,000.00", "06/04/2022"),
  product("13992", "Implementation - Gold", "One Time Charge", "Implementation", "Gold", false, "$80,000.00", "06/04/2022"),
  product("13993", "Implementation - Silver", "One Time Charge", "Implementation", "Silver", false, "$70,000.00", "06/04/2022"),
  product("13994", "Implementation - Bronze", "One Time Charge", "Implementation", "Bronze", false, "$60,000.00", "06/04/2022"),
  product("13995", "BB Product - Subscription", "Subscription", "Software", "Gold", false, "$1,000.00", "06/13/2022"),
  product("13996", "BB Product - Hardware", "One Time Charge", "Other", "Gold", false, "$1,000.00", "06/13/2022"),
  product("13997", "Backup & Disaster Recovery", "Subscription", "Disaster Recovery Services", "Enterprise", false, "$375,000.00", "07/08/2022"),
  product("13998", "24x7 Toll Free Support", "Subscription", "Support", "Enterprise", false, "$0.00", "07/08/2022"),
  product("13999", "Ajanta's Revenue Subscription", "Subscription", "Support", "Enterprise", false, "$0.00", "09/23/2022"),
];
const LOOKUP_SAMPLES: Record<string, unknown> = { "{productColumns}": PRODUCT_COLUMNS, "{products}": PRODUCTS };
const lookupProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in LOOKUP_SAMPLES ? LOOKUP_SAMPLES[v] : v])) as unknown as LookupProps;

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
  BarChart: {
    // Sample data swaps in for its {names}; a white panel like a page. Keyed so switching a control plays the motion again.
    render: (p) => <div style={chartPanel}><BarChart key={JSON.stringify(p)} {...chartProps<BarChartProps>(p)} /></div>,
    preview: { label: "Invoices by status by time", categories: "{weeks}", series: "{statuses}", format: "currency", stacked: true },
    hint: "Switch orientation. Hover or use the arrow keys for the tooltip. Turn stacked, values, grid, legend and animate on and off.",
    block: true,
    card: <div style={{ width: "100%" }}><BarChart label="Invoices by status" categories={["W1", "W2", "W3", "W4"]} series={[{ name: "Paid", values: [3, 5, 4, 6] }, { name: "Sent", values: [2, 2, 3, 2] }]} stacked showLegend={false} height={96} animate={false} /></div>,
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
  LineChart: {
    // Sample data swaps in for its {names}; a white panel like a page. Keyed so switching a control plays the motion again.
    render: (p) => <div style={chartPanel}><LineChart key={JSON.stringify(p)} {...chartProps<LineChartProps>(p)} /></div>,
    preview: { label: "Revenue by period", categories: "{months}", series: "{revenue}", format: "currency", area: true, showPoints: true, showValues: true },
    hint: "Hover or use the arrow keys for the tooltip. Turn area, stacked, points, values, grid, legend and animate on and off.",
    block: true,
    card: <div style={{ width: "100%" }}><LineChart label="Revenue" categories={["Jan", "Feb", "Mar", "Apr", "May"]} series={[{ name: "Revenue", values: [3, 3.4, 4.1, 4.3, 4.8] }]} area showLegend={false} height={96} animate={false} /></div>,
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
  Calendar: {
    // Sample calendars and events swap in for their {names}. Keyed so switching controls starts fresh.
    render: (p) => <Calendar key={JSON.stringify(p)} {...calendarProps(p)} />,
    preview: { label: "Team calendar", calendars: "{calendars}", defaultEvents: "{events}" },
    // view is the controlled view; the switch inside changes it here.
    hide: ["view"],
    snippet: { onEventsChange: "{setEvents}" },
    hint: "Switch views and weeks. Click an empty day or time to add an event, an event to edit or delete it, Calendars to show or hide one. In Month, the arrow keys move the day.",
    block: true,
    wide: true,
    card: <div style={{ width: 400 }}><Calendar label="Team calendar" calendars={CAL_SOURCES} defaultEvents={CAL_EVENTS} readOnly /></div>,
  },
  Cascader: {
    // Sample fields swap in for their {names}. Keyed so switching controls starts fresh. Field keeps a form-like width;
    // panel gets the page width, like the field picker in a modal.
    render: (p) => (
      <div style={{ width: p.variant === "panel" ? "100%" : 360, maxWidth: "100%" }}>
        <Cascader key={JSON.stringify(p)} {...cascaderProps(p)} />
      </div>
    ),
    preview: { label: "Invoice field", options: "{fields}", defaultValue: "{path}", searchable: true },
    snippet: { onChange: "{setPath}" },
    hint: "Open the field and walk the columns: [+] opens a related record's fields, » its child records. Type to search every path. Switch variant to panel for the inline field picker.",
    block: true,
    card: <div style={{ width: "100%" }}><Cascader label="Invoice field" hideLabel options={CASCADER_FIELDS} defaultValue={["BillingProfile", "Account", "Owner", "Email"]} size="sm" /></div>,
  },
  Card: {
    // Figma's card is 554 wide; 420 here so two sit side by side in the variants.
    render: (p) => (
      <div style={{ width: 420, maxWidth: "100%" }}>
        <Card key={JSON.stringify(p)} {...(p as unknown as CardProps)} />
      </div>
    ),
    preview: {
      badge: "New", overline: "Req 6787686", title: "Alpha Logic wireless ergonomic mouse",
      description: "Rechargeable, 6 buttons and a thumb rest. Works with Windows and macOS over Bluetooth or the USB receiver.",
      amount: "$49.00", message: "In stock", icon: "mouse",
    },
    hide: ["selected"],
    // The Figma card's boolean properties. Footer is the real selectable prop; the rest drop parts in normalize.
    toggles: {
      showHeader: { label: "Header slot", default: true },
      showBadge: { label: "Badge", default: true },
      showOverline: { label: "Overline", default: true },
      showTitle: { label: "Title", default: true },
      showDescription: { label: "Secondary", default: true },
      showAmount: { label: "Tertiary", default: true },
      showMessage: { label: "Item message", default: true },
      showImage: { label: "Image", default: true },
      selectable: { label: "Footer", default: true },
    },
    normalize: ({ showHeader, showBadge, showOverline, showTitle, showDescription, showAmount, showMessage, showImage, badge, overline, title, description, amount, message, icon, ...p }) => ({
      ...p,
      ...(showHeader && showBadge ? { badge } : {}),
      ...(showHeader && showOverline ? { overline } : {}),
      ...(showTitle ? { title } : {}),
      ...(showDescription ? { description } : {}),
      ...(showAmount ? { amount } : {}),
      ...(showMessage ? { message } : {}),
      ...(showImage ? { icon } : {}),
    }),
    hint: "Turn each part of the card on and off, like the Figma switches. Click the card to pick it; switch the message tone and disabled.",
    card: (
      <div style={{ width: 300 }}>
        <Card badge="New" title="Alpha Logic wireless mouse" amount="$49.00" selectable defaultSelected />
      </div>
    ),
  },
  Carousel: {
    // Sample panels swap in for {slides}. Keyed so a changed layout starts on the first slide. Vertical gets a narrow column.
    render: (p) => (
      <div style={{ width: p.orientation === "vertical" ? 320 : "100%", maxWidth: "100%", margin: "0 auto" }}>
        <Carousel key={JSON.stringify(p)} {...(p as unknown as CarouselProps)} items={slides(p.orientation === "vertical")} />
      </div>
    ),
    preview: { items: "{slides}", showIndex: true },
    snippet: { items: "{slides}" },
    hint: "Page with the buttons, swipe or the arrow keys. Switch orientation, slides per view and align; turn on loop.",
    block: true,
    card: <div style={{ width: 400 }}><Carousel items={slides(false)} slidesPerView={2} /></div>,
  },
  Cell: {
    // tree previews in a real Table of parent and child accounts, so the chevrons open and close rows.
    render: (p) => (p.type === "tree"
      ? <div style={{ width: 640, maxWidth: "100%" }}><CellTreeDemo size={p.size as CellSize | undefined} checkbox={Boolean(p.checkbox)} showLines={p.showLines !== false} /></div>
      : <Cell {...(p as object)} />),
    preview: { type: "text", label: "INV-1042" },
    // expanded belongs to each tree row; the tree preview keeps its own open rows.
    hide: ["expanded"],
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
        {/* Two results and no hints: the search and the start of the list. */}
        <Command groups={[{ items: [{ id: "invoices", label: "Invoices", icon: "receipt_long" }, { id: "customers", label: "Customers", icon: "group" }] }]} hints={false} />
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
  DataGrid: {
    // Sample columns and rows swap in for their {names}. Keyed so switching controls starts fresh.
    render: (p) => <DataGrid key={JSON.stringify(p)} {...gridProps(p)} />,
    preview: { label: "Conditions", columns: "{conditionColumns}", defaultRows: "{conditions}", canAddRows: true, canRemoveRows: true },
    snippet: { onRowsChange: "{setRules}" },
    hint: "Click a cell to edit it: Field opens the formula editor, Condition is a select, Value is text. Enter saves, Escape cancels. Add and remove rows.",
    block: true,
    wide: true,
    card: <div style={{ width: 400 }}><DataGrid label="Conditions" columns={CONDITION_COLUMNS} defaultRows={CONDITIONS.slice(0, 2)} canRemoveRows /></div>,
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
    card: <div style={{ width: "80%" }}><DatePicker size="sm" label="Invoice date" defaultValue="2027-01-08" /></div>,
  },
  Drawer: {
    // A kit Button opens the real Drawer. content is playground-only: it picks the sample body.
    render: (p) => <DrawerDemo {...(p as { title: string })} content={p.content as DrawerDemoContent | undefined} />,
    preview: { title: "Invoice INV-1042" },
    hide: ["open"],
    snippet: { open: "{open}", onClose: "{close}" },
    extras: { content: { values: ["details", "form"], default: "details" } },
    hint: "Click the button to open it. Switch size and content. Escape, the close button, or a click behind it closes.",
    // Four long size chips need more room than the default panel.
    panelWidth: 300,
    card: <Button>Open drawer</Button>,
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
  Empty: {
    // Sample actions and media swap in for their {names}. The switches drop parts, like Figma boolean properties.
    // Its icon well is the stage gray, so it sits on a white page panel.
    render: (p) => (
      <div style={{ width: 480, maxWidth: "100%", padding: "var(--space-medium)", background: "var(--surface-flat)", borderRadius: "var(--radius-medium)" }}>
        <Empty {...emptyProps(p)} />
      </div>
    ),
    preview: { icon: "receipt_long", title: "No invoices yet", description: "Create an invoice or import them from a file.", actions: "{createActions}" },
    toggles: {
      showIcon: { label: "Icon", default: true },
      showDescription: { label: "Description", default: true },
      showActions: { label: "Actions", default: true },
    },
    normalize: ({ showIcon, showDescription, showActions, icon, description, actions, ...p }) => ({
      ...p, ...(showIcon ? { icon } : {}), ...(showDescription ? { description } : {}), ...(showActions ? { actions } : {}),
    }),
    hint: "Turn the icon, description and actions on and off; outlined adds the border.",
    card: <Empty icon="receipt_long" title="No invoices yet" />,
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
      <div style={{ width: 440 }}>
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
        <FormDisplay label="Account type" value="Customer" />
        <FormDisplay label="Terms" value="Net 30" />
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
    card: <div style={{ width: 400 }}><FormulaEditor label="Formula" hideLabel defaultValue="{!Amount} * 0.9" /></div>,
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
      // How it is met on a page: the help icon beside a field label, which opens the popover.
      <div style={{ width: "80%" }}><Input size="sm" label="Tax ID" help="The number on your tax registration." placeholder="12-3456789" /></div>
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
    card: <div style={{ width: "80%" }}><Select size="sm" label="Status" defaultValue="paid" options={[{ value: "paid", label: "Paid" }, { value: "draft", label: "Draft" }]} /></div>,
  },
  Scoreboard: {
    // Sample cards swap in for their {names}. Keyed so switching controls starts fresh.
    render: (p) => <Scoreboard key={JSON.stringify(p)} {...scoreProps(p)} />,
    preview: { items: "{trendKpis}" },
    hide: ["selected", "defaultSelected"],
    extras: { cards: { values: ["trends", "charts", "six"], default: "trends" } },
    normalize: ({ cards, ...p }) => ({ ...p, items: cards === "charts" ? "{chartKpis}" : cards === "six" ? "{sixKpis}" : "{trendKpis}" }),
    hint: "Switch between trends, spark charts and six cards. Turn on selectable to pick a card.",
    block: true,
    wide: true,
    card: <div style={{ width: 380 }}><Scoreboard items={CHART_KPIS.slice(0, 2)} /></div>,
  },
  Section: {
    // Sample content and actions swap in for their {names}. Keyed so a changed default open state applies again.
    render: (p) => <Section key={JSON.stringify(p)} {...sectionProps(p)} />,
    preview: { title: "Account information", help: "Details from the account record. Edit them on the account.", collapsible: true, actions: "{editAction}", children: "{accountRows}" },
    hide: ["open"],
    extras: { content: { values: ["body", "header only"], default: "body" } },
    normalize: ({ content, children, ...p }) => (content === "header only" ? p : { ...p, children }),
    hint: "Click the chevron to fold the section. Turn collapsible off for a static heading; content header only drops the body.",
    block: true,
    card: (
      <div style={{ width: 380 }}>
        <Section title="Account information" collapsible actions={<Button size="sm" iconStart="edit">Edit</Button>}>
          <FormDisplay label="Account name" value="Northwind Traders" />
        </Section>
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
  ShimmerText: {
    render: ({ children, ...p }) => <ShimmerText {...(p as Omit<ShimmerTextProps, "children">)}>{(children as string) || "Generating response…"}</ShimmerText>,
    preview: { children: "Generating response…" },
    hint: "Switch size and speed. The light runs through the letters left to right; with reduced motion it stays still.",
    card: <ShimmerText size="lg">Generating response…</ShimmerText>,
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
      // The rail and the pinned menu's first items; the nav fills this height and the preview fades the rest.
      <div style={{ display: "flex", height: 200 }}>
        <SideNav items={SIDE_NAV_SECTIONS} endItems={SIDE_NAV_END} defaultCurrent="revenue-general-ledger" defaultPinned />
      </div>
    ),
  },
  Skeleton: {
    // SkeletonDemo puts kit Skeletons in real layouts, each wrapping its real content. Keyed so switches restart the motion.
    // On a white panel, like a page: the skeleton gray is the stage gray.
    render: ({ layout, ...p }) => (
      <div style={{ ...chartPanel, width: "auto" }}>
        <SkeletonDemo key={JSON.stringify(p) + String(layout)} layout={layout as SkeletonDemoLayout} {...(p as object)} />
      </div>
    ),
    preview: { lines: 3 },
    hide: ["children", "label"],
    extras: { layout: { values: ["single", "card", "list", "table"], default: "single" } },
    // Variants stack shapes and animations top to bottom, like rows of a page.
    column: true,
    hint: "Switch layout for a card, a list or table rows while they load. Turn Loading off to swap in the real content. Pick shimmer, pulse or none.",
    card: (
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-small)", alignItems: "center", width: 220 }}>
        <Skeleton shape="circle" animation="none" />
        <div style={{ display: "grid" }}><Skeleton size="sm" width="50%" animation="none" label="" /><Skeleton size="sm" width="80%" animation="none" label="" /></div>
      </div>
    ),
  },
  Spinner: {
    render: (p) => <Spinner {...(p as SpinnerProps)} />,
    preview: { size: "md" },
    hint: "Switch size. Show label writes it beside the ring; screen readers always hear it. With reduced motion the ticks stay still.",
    card: <div style={{ display: "flex", gap: "var(--space-large)", alignItems: "center" }}><Spinner size="sm" /><Spinner /><Spinner size="lg" /></div>,
  },
  Stepper: {
    // The stage walks the steps with Back and Next; Variants show the Stepper alone.
    render: ({ walk, ...p }) => {
      const props = { ...(p as unknown as StepperProps), steps: (p.steps as string[] | undefined) ?? STEPS };
      return walk ? <StepperDemo {...props} /> : <Stepper {...props} />;
    },
    toggles: { walk: { label: "Back and Next", default: true } },
    preview: { steps: STEPS, current: 2 },
    hide: ["steps", "onStepClick"],
    block: true,
    hint: "Switch size. Next and Back walk the steps; click a done step to go back. Fill spreads the steps across the width.",
    card: <div style={{ width: 240 }}><Stepper steps={["Setup", "Columns", "Review"]} current={2} fill /></div>,
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
  Table: {
    // Sample columns and rows swap in for their {names}. Keyed so the selectable switch starts fresh.
    render: (p) => <Table key={JSON.stringify(p)} {...tableProps(p)} />,
    preview: { caption: "A list of your recent invoices.", columns: "{invoiceColumns}", rows: "{invoices}", footer: "{total}" },
    hide: ["selected"],
    extras: { data: { values: ["invoices", "empty"], default: "invoices" } },
    normalize: ({ data, ...p }) => (data === "empty" ? { ...p, rows: [] } : p),
    hint: "Switch size and turn on selectable for the checkbox column. Data empty shows the empty row.",
    block: true,
    card: (
      <div style={{ width: "100%" }}>
        <Table size="sm" columns={INVOICE_COLUMNS.slice(0, 2).concat(INVOICE_COLUMNS[3])} rows={INVOICES.slice(0, 2)} />
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
  Toast: {
    // A kit Button shows the real Toast. duration is fixed at the 5 second default here; the Variants show null.
    render: (p) => <ToastDemo {...(p as { title: string })} />,
    preview: { title: "Saved successfully", description: "Your changes have been saved.", actionLabel: "Undo" },
    hide: ["open"],
    snippet: { open: "{saved}", onClose: "{close}", onAction: "{undo}" },
    hint: "Click the button to show it. The top bar counts down 5 seconds; point at the toast to pause it. Switch the tone.",
    card: <Button>Show toast</Button>,
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
      <div style={{ width: 720 }}>
        <Toolbar filters={<></>} onSearchChange={() => {}} views={[{ id: "list", label: "List View" }]} onRefresh={() => {}}
          actions={<><Button size="sm">Export</Button><Button size="sm" variant="primary">Create</Button></>} />
      </div>
    ),
    cardCrop: true,
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
  TreeView: {
    // Sample items swap in for their {names}. Keyed so switching controls starts fresh. A white side-panel width: the guide lines are the stage gray.
    render: (p) => <div style={{ ...chartPanel, width: 400, maxWidth: "100%" }}><TreeView key={JSON.stringify(p)} {...treeProps(p)} /></div>,
    preview: { label: "Workspace", defaultItems: "{workspace}", defaultExpanded: "{open}", selection: "multiple", defaultSelected: "{checked}", showIcons: true, reorderable: true },
    snippet: { onItemsChange: "{setItems}" },
    hint: "Simple: selection single, icons and drag off. Advanced: selection multiple, icons and reorderable on. Click chevrons to open folders; drag a handle above, below or onto a folder; Alt with the arrows moves a row.",
    card: (
      <div style={{ width: "100%" }}>
        <TreeView label="Workspace" items={[{ id: "org", label: "Organization", children: [TREE_ITEMS[0].children![1]] }]} expanded={["org", "design"]} selection="multiple" selected={["sienna", "ammar"]} showIcons size="sm" />
      </div>
    ),
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
  Lookup: {
    // Sample products swap in for their {names}. Keyed so switching controls starts fresh. A form-like width.
    render: (p) => (
      <div style={{ width: p.labelPosition === "start" ? 440 : 320, maxWidth: "100%" }}>
        <Lookup key={JSON.stringify(p)} {...lookupProps(p)} />
      </div>
    ),
    preview: { label: "Product", columns: "{productColumns}", rows: "{products}", required: true },
    snippet: { onChange: "{setProductId}" },
    extras: { message: { values: ["none", "hint", "error"], default: "none" } },
    normalize: ({ message, ...p }) =>
      message === "error" ? { ...p, error: "Pick a product to continue." } : message === "hint" ? { ...p, hint: "Only active products can be billed." } : p,
    hint: "Click the field or the lookup button: search, page through the table and click a row to pick it. The × clears the pick.",
    card: <div style={{ width: "80%" }}><Lookup label="Product" columns={PRODUCT_COLUMNS} rows={PRODUCTS} defaultValue="13984" size="sm" /></div>,
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
      <div style={{ width: 560 }}>
        <PageHeader breadcrumbs={[{ label: "Billing", href: "#" }, { label: "Invoices", href: "#" }]} icon="folder_open" title="INV-1042" badge="Draft"
          actions={<><Button size="sm">Send</Button><Button size="sm" variant="primary">Approve</Button></>} />
      </div>
    ),
    cardCrop: true,
  },
  Pagination: {
    // Keyed so a changed total or starting page starts fresh. Full width, like the footer of a table.
    render: (p) => <Pagination key={JSON.stringify(p)} {...(p as unknown as PaginationProps)} />,
    preview: { total: 59 },
    extras: { rows: { values: ["59", "500"], default: "59" } },
    normalize: ({ rows, ...p }) => ({ ...p, total: Number(rows ?? p.total) }),
    snippet: { onPageChange: "{setPage}" },
    hint: "Click the pages and arrows, and pick rows per page. Rows 500 shows the ellipsis. Turn the range and the Select on and off.",
    block: true,
    card: <div style={{ width: 560 }}><Pagination total={59} /></div>,
    cardCrop: true,
  },
  PieChart: {
    // Sample data swaps in for its {names}; a white panel like a page. Keyed so switching a control plays the motion again.
    render: (p) => <div style={{ ...chartPanel, width: "auto" }}><PieChart key={JSON.stringify(p)} {...chartProps<PieChartProps>(p)} /></div>,
    preview: { label: "Payments by method", data: "{payments}", format: "currency" },
    hint: "Hover or use the arrow keys for each slice. Switch size and legend place; turn donut, total, legend and animate on and off.",
    card: <PieChart label="Payments" data={[{ label: "Card", value: 5 }, { label: "ACH", value: 3 }, { label: "Wire", value: 2 }]} size="sm" showLegend={false} animate={false} />,
  },
  Progress: {
    // Its track is the stage gray, so it sits on a white page panel. A bar fills its container, so it gets a 240 column; rings size themselves.
    render: (p) => {
      const ring = p.shape === "circle" || p.shape === "semicircle";
      return (
        <div style={{ width: ring ? "auto" : 240, maxWidth: "100%", padding: "var(--space-medium)", background: "var(--surface-flat)", borderRadius: "var(--radius-medium)" }}>
          <Progress {...(p as unknown as ProgressProps)} />
        </div>
      );
    },
    preview: { label: "Budget spent", value: 60, showValue: true },
    extras: { value: { values: ["0", "30", "60", "100"], default: "60" } },
    normalize: ({ value, ...p }) => ({ ...p, value: Number(value ?? p.value) }),
    hint: "Switch shape, size and thresholds; turn on reference lines and the value. Value moves it between the zones.",
    card: (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 120 }}><Progress label="Upload" value={60} /></div>
        <Progress label="Setup" value={60} shape="circle" size="sm" />
      </div>
    ),
  },
  ProgressLegacy: {
    // Figma's bar is 180 wide (224 with the label on the right). Its track is the stage gray, so it sits on a white page panel.
    render: (p) => (
      <div style={{ width: p.labelPosition === "right" ? 224 : 180, maxWidth: "100%", padding: "var(--space-small)", background: "var(--surface-flat)", borderRadius: "var(--radius-medium)" }}>
        <ProgressLegacy {...(p as unknown as ProgressLegacyProps)} />
      </div>
    ),
    preview: { label: "Upload", value: 25 },
    extras: { value: { values: ["25", "50", "100"], default: "25" } },
    normalize: ({ value, ...p }) => ({ ...p, value: Number(value ?? p.value) }),
    hint: "Switch the value, where the label sits, and whether it shows.",
    card: (
      <div style={{ display: "grid", gap: 8, width: 180 }}>
        <ProgressLegacy label="Upload" value={25} />
        <ProgressLegacy label="Upload" value={100} />
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
