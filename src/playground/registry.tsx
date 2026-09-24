import type { ReactNode } from "react";
import { Accordion, type AccordionItem } from "@/ui/Accordion/Accordion";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav, type AnchorNavProps } from "@/ui/AnchorNav/AnchorNav";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import type { ListDetailLayout } from "@/patterns/ListDetail/ListDetail";
import { AppShellDemo, DashboardDemo, FormPageDemo, AccountFlowDemo, GuidedProcessDemo, GuidedProcessPageDemo, SettingsPageDemo, ListDetailDemo, type ListDetailVariant, ListPageDemo, RecordPageDemo, AlertDialogDemo, AnchorNavDemo, ChatComposerDemo, ChatHeaderDemo, ChatListDemo, ChatMessageDemo, ChatWindowDemo, CHAT_GROUPS, PLAYBOOK_ITEMS, LegendDemo, AppHeaderDemo, ButtonFilterDemo, CellTreeDemo, SkeletonDemo, StepperDemo, type SkeletonDemoLayout, ToolbarDemo, DensityDemo, DrawerDemo, DropdownMenuDemo, FormDemo, ModalDemo, ToastDemo, calculate, type DrawerDemoContent, type FormDemoContent, type ModalDemoContent } from "./demos";
import { Density, type DensityValue } from "@/ui/Density/Density";
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
import { Cell, type CellSize, type CellTreeToggle, type CellType } from "@/ui/Cell/Cell";
import { ChatComposer, type ChatComposerProps } from "@/ui/ChatComposer/ChatComposer";
import { ChatHeader, type ChatHeaderProps } from "@/ui/ChatHeader/ChatHeader";
import { ChatList, type ChatListProps } from "@/ui/ChatList/ChatList";
import { ChatMessage, type ChatMessageProps } from "@/ui/ChatMessage/ChatMessage";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Command, type CommandGroup, type CommandProps } from "@/ui/Command/Command";
import { Conveyor, type ConveyorProps } from "@/ui/Conveyor/Conveyor";
import { Count } from "@/ui/Count/Count";
import { ButtonFilter } from "@/ui/ButtonFilter/ButtonFilter";
import { ButtonGroup } from "@/ui/ButtonGroup/ButtonGroup";
import { DataGrid, type DataGridColumn, type DataGridProps, type DataGridRow } from "@/ui/DataGrid/DataGrid";
import { DatePicker, type DatePickerProps } from "@/ui/DatePicker/DatePicker";
import { DropdownMenu, type DropdownMenuEntry, type DropdownMenuProps } from "@/ui/DropdownMenu/DropdownMenu";
import { Form, type FormProps } from "@/ui/Form/Form";
import { GuidedProcess, type GuidedProcessAction, type GuidedProcessPanelProps, type GuidedProcessStep } from "@/ui/GuidedProcess/GuidedProcess";
import { FormDisplay, type FormDisplayProps } from "@/ui/FormDisplay/FormDisplay";
import { Empty, type EmptyProps } from "@/ui/Empty/Empty";
import { FormulaEditor, type FormulaEditorProps } from "@/ui/FormulaEditor/FormulaEditor";
import { HeaderCell } from "@/ui/HeaderCell/HeaderCell";
import { HelpPopover, type HelpPopoverProps } from "@/ui/HelpPopover/HelpPopover";
import { Icon } from "@/ui/Icon/Icon";
import { Illustration, type IllustrationName, type IllustrationProps } from "@/ui/Illustration/Illustration";
import { Input, type InputProps } from "@/ui/Input/Input";
import { LineChart, type LineChartProps } from "@/ui/LineChart/LineChart";
import { Logo } from "@/ui/Logo/Logo";
import { Legend, type LegendProps } from "@/ui/Legend/Legend";
import { Link } from "@/ui/Link/Link";
import { LinkList, type LinkListItem } from "@/ui/LinkList/LinkList";
import { ListView, type ListViewItem } from "@/ui/ListView/ListView";
import { Lookup, type LookupProps, type LookupRow } from "@/ui/Lookup/Lookup";
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
import { SideNav, type SideNavProps } from "@/ui/SideNav/SideNav";
import { Switch, type SwitchProps } from "@/ui/Switch/Switch";
import { Tabs, type TabItem, type TabsProps } from "@/ui/Tabs/Tabs";
import { Table, type TableColumn, type TableProps, type TableRow } from "@/ui/Table/Table";
import { Textarea, type TextareaProps } from "@/ui/Textarea/Textarea";
import { Tile } from "@/ui/Tile/Tile";
import { Timeline, type TimelineItem, type TimelineProps } from "@/ui/Timeline/Timeline";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import { Tooltip, type TooltipProps } from "@/ui/Tooltip/Tooltip";
import { TreeView, type TreeItem, type TreeViewProps } from "@/ui/TreeView/TreeView";
import { UsageList, type UsageListItem } from "@/ui/UsageList/UsageList";

export type Props = Record<string, unknown>;
// Contract examples name the sample as {sections} and {endSections}; swap in the real arrays.
const sideNavProps = (p: Props) => ({
  ...p,
  items: typeof p.items === "string" || !p.items ? APP_NAV : p.items,
  endItems: typeof p.endItems === "string" ? APP_NAV_END : p.endItems,
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
  /** Patterns only: the whole screen, rendered at page size and scaled down to the card. The patterns gallery
   *  shows this instead of card, so a blueprint reads as the screen it builds. */
  page?: ReactNode;
}

const STEPS = ["Setup", "Map Columns", "Billing IDs", "Usage IDs", "Activate"];

// A plan's usage: one limit well under, one past 80%, one fully used.
const USAGE_ITEMS: UsageListItem[] = [
  { id: "storage", label: "Storage", used: 32, limit: 50, unit: "GB" },
  { id: "api", label: "API calls", used: 8420, limit: 10000, note: "Resets on Oct 1" },
  { id: "seats", label: "Seats", used: 12, limit: 12, note: "All seats in use" },
];
// ListView sample rows: invoices with a status badge, split into two groups when the Groups switch is on.
const LIST_VIEW_ITEMS: ListViewItem[] = [
  { id: "inv-1042", primary: "INV-1042", secondary: "Apex Digital Services · $4,820.00", icon: "receipt_long", badge: "Overdue", badgeTone: "danger", group: "due" },
  { id: "inv-1044", primary: "INV-1044", secondary: "Globex Corporation · $980.00", icon: "receipt_long", badge: "Draft", group: "due" },
  { id: "inv-1045", primary: "INV-1045", secondary: "Initech · $2,150.00", icon: "receipt_long", badge: "Sent", badgeTone: "info", group: "due" },
  { id: "inv-1043", primary: "INV-1043", secondary: "Northwind Traders · $1,260.00", icon: "receipt_long", badge: "Paid", badgeTone: "success", group: "done" },
  { id: "inv-1041", primary: "INV-1041", secondary: "Umbrella Corp · $3,400.00", icon: "receipt_long", badge: "Paid", badgeTone: "success", group: "done" },
];
const LIST_VIEW_GROUPS = [{ id: "due", title: "Due" }, { id: "done", title: "Settled" }];

const QUICK_LINK_ITEMS: LinkListItem[] = [
  { id: "tax", label: "Tax Related List" }, { id: "subscription", label: "Subscription Configuration" },
  { id: "portal", label: "Customer Portal" }, { id: "orders", label: "Orders" }, { id: "documents", label: "Document Information" },
];

const GUIDED_STEPS: GuidedProcessStep[] = [
  { title: "Choose the file", tasks: [{ label: "Pick where it comes from", done: true }, { label: "Upload the file" }, { label: "Pick the month" }] },
  { title: "Map the columns", tasks: [{ label: "Account column", done: true }, { label: "Quantity column" }, { label: "Date column" }] },
  { title: "Check the rows", tasks: [{ label: "Look over the preview" }, { label: "Decide on rows with errors" }] },
  { title: "Import", tasks: [{ label: "Name the batch" }, { label: "Submit" }] },
];
const GUIDED_ACTIONS: GuidedProcessAction[] = [
  { id: "cancel", label: "Cancel", icon: "close" }, { id: "save", label: "Save", icon: "save" }, { id: "skip", label: "Skip", icon: "skip_next" }, { id: "continue", label: "Continue" },
];

const PAGE_SECTION_ITEMS = [
  { id: "demo-details", label: "Details" },
  { id: "demo-billing", label: "Billing" },
  { id: "demo-usage", label: "Usage" },
  { id: "demo-history", label: "History" },
];
const ANCHOR_SAMPLES: Record<string, unknown> = { "{sections}": PAGE_SECTION_ITEMS };

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
  { key: "qty", header: "Qty", type: "number", hug: true, setForAll: true },
  { key: "price", header: "Unit price", type: "number" },
];
const LINE_ITEMS: DataGridRow[] = [
  { id: "l1", product: "Premium support", sku: "SUP-100", qty: "1", price: "1200.00" },
  { id: "l2", product: "Seat license", sku: "LIC-020", qty: "25", price: "40.00" },
];
// Dates and details: subscriptions with date cells, each opening to its rate bands in a nested grid.
const TERM_COLUMNS: DataGridColumn[] = [
  { key: "product", header: "Product" },
  { key: "start", header: "Start date", type: "date" },
  { key: "end", header: "End date", type: "date" },
  { key: "qty", header: "Qty", type: "number", hug: true },
];
const TERMS: DataGridRow[] = [
  { id: "t1", product: "API calls (per 10K)", start: "2026-08-01", end: "", qty: "1" },
  { id: "t2", product: "Seat license", start: "2026-08-01", end: "2027-07-31", qty: "25" },
];
const BAND_COLUMNS: DataGridColumn[] = [
  { key: "currency", header: "Currency", type: "select", width: "140px", options: [{ value: "EUR", label: "EUR" }, { value: "USD", label: "USD" }, { value: "GBP", label: "GBP" }, { value: "JPY", label: "JPY" }] },
  { key: "upper", header: "Upper band", type: "number", placeholder: "No limit" },
  { key: "rate", header: "Rate", type: "number" },
];
const BANDS: DataGridRow[] = [
  { id: "b1", currency: "EUR", upper: "10000", rate: "0.00" },
  { id: "b2", currency: "EUR", upper: "100000", rate: "1.20" },
  { id: "b3", currency: "EUR", upper: "", rate: "0.85" },
];
const bandDetail = (row: DataGridRow) => (
  <DataGrid label={`Rate bands, ${row.product}`} size="sm" columns={BAND_COLUMNS} defaultRows={BANDS} rowNumbers={false} stickyFirstColumn={false} canAddRows canRemoveRows />
);
const GRID_SAMPLES: Record<string, unknown> = {
  "{conditionColumns}": CONDITION_COLUMNS, "{conditions}": CONDITIONS, "{lineItemColumns}": LINE_ITEM_COLUMNS, "{lineItems}": LINE_ITEMS,
  "{termColumns}": TERM_COLUMNS, "{terms}": TERMS, "{bandDetail}": bandDetail,
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
const CHIPS = ["All", "Open", "Overdue", "Paid", "Disputed", "Credits", "Drafts", "Voided", "In review", "Scheduled", "Recurring", "One-off", "Metered", "Prepaid", "Trials", "Churned"];

// Nine cards: more than a strip holds, which is what a Conveyor is for.
const NINE_KPIS: ScoreboardItem[] = [
  ...SIX_KPIS,
  { id: "refunds", title: "Refunds", metric: "$1,240", trend: { value: "0.3%", unit: "MoM", status: "success", direction: "down" }, metadata: "This month" },
  { id: "trials", title: "Trials", metric: "48", badge: "Week", metadata: "12 converting" },
  { id: "usage", title: "Metered usage", metric: "4.2M", trend: { value: "6%", unit: "MoM", status: "success", direction: "up" }, metadata: "Events billed" },
];
const ACTIVITY_MENU = [
  { id: "open", label: "Open record" },
  { id: "pin", label: "Pin to top" },
  { divider: true as const },
  { id: "delete", label: "Delete", icon: "delete", danger: true },
];
const ACTIVITY: TimelineItem[] = [
  {
    id: "call", title: "Call with Maya Chen", timestamp: "2 hours ago", subtitle: "Logged by Ana Petrovic", icon: "call",
    notes: "Walked through the March overage. Maya will send the usage export so we can rebill the metered lines before the run.",
    links: [{ label: "INV-1042", href: "#" }, { label: "Acme Inc.", href: "#" }],
    action: { label: "Add follow-up" }, menu: ACTIVITY_MENU,
  },
  {
    id: "invoice", title: "Invoice sent", timestamp: "Yesterday, 16:20", subtitle: "Billing run 2027-03", icon: "receipt_long", tone: "success",
    notes: "INV-1042 for $36,420 went out to billing@acme.com.", links: [{ label: "View invoice", href: "#" }], menu: ACTIVITY_MENU,
  },
  {
    id: "note", title: "Note added", timestamp: "8 Jan 2027, 09:05", subtitle: "Ana Petrovic", icon: "edit_note",
    notes: "Account moved to net 45 terms for the rest of the year.",
  },
];
const TONES: TimelineItem[] = [
  { id: "t1", title: "Payment received", timestamp: "Today", icon: "payments", tone: "success", notes: "$210,300 cleared." },
  { id: "t2", title: "Credit limit reached", timestamp: "Yesterday", icon: "warning", tone: "warning", notes: "The account is at 98% of its limit." },
  { id: "t3", title: "Payment failed", timestamp: "6 Jan 2027", icon: "error", tone: "danger", notes: "The card on file was declined." },
  { id: "t4", title: "Account created", timestamp: "2 Jan 2027", icon: "add_business", tone: "brand" },
];
const SHORT: TimelineItem[] = [
  { id: "s1", title: "Invoice sent", timestamp: "2 hours ago", icon: "receipt_long", tone: "success" },
  { id: "s2", title: "Draft saved", timestamp: "Yesterday", icon: "edit_note" },
];
const TIMELINE_SAMPLES: Record<string, unknown> = { "{activity}": ACTIVITY, "{tones}": TONES, "{short}": SHORT };
const timelineProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in TIMELINE_SAMPLES ? TIMELINE_SAMPLES[v] : v])) as unknown as TimelineProps;

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
  // Two subsections with thin lines, for the Thin lines example.
  "{thinSubsections}": (
    <>
      <Section title="Payment method" line="thin">
        <FormDisplay label="Card" value="Visa ending 4242" />
      </Section>
      <Section title="Invoice delivery" line="thin">
        <FormDisplay label="Send to" value="billing@northwind.com" />
      </Section>
    </>
  ),
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
  // A month of daily use split by balance: free credits run out on day 3, the plan on day 18, then the top-up takes over.
  "{monthDays}": Array.from({ length: 21 }, (_, i) => `Sep ${i + 1}`),
  "{creditsByBalance}": [
    { name: "Free credits", values: [62, 58, 30, ...Array(18).fill(0)], tone: "green" },
    { name: "AI Plan", values: [0, 0, 38, 70, 74, 66, 60, 72, 68, 70, 75, 68, 62, 70, 66, 64, 72, 5, 0, 0, 0], tone: "cyan" },
    { name: "Top-up", values: [...Array(17).fill(0), 55, 38, 41, 42], tone: "orange" },
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
  // A usage trend that turns into a forecast after today, against the plan limit.
  "{usageDays}": ["Sep 1", "Sep 4", "Sep 7", "Sep 10", "Sep 13", "Sep 16", "Sep 19", "Sep 22", "Sep 25", "Sep 28"],
  "{usageForecast}": [{ name: "API calls", values: [4200, 5100, 5600, 6300, 7000, 7600, 8300, 9000, 9700, 10400], tone: "cyan", projectedFrom: 5 }],
  "{usageLimit}": [{ value: 10000, label: "Limit", tone: "red" }],
  "{today}": { category: 4, label: "Today" },
  "{paymentShare}": [
    { label: "Card", value: 55 }, { label: "ACH", value: 29 }, { label: "Wire", value: 13 }, { label: "Check", value: 3 },
  ],
  "{statusShare}": [
    { label: "Paid", value: 58, tone: "green" }, { label: "Sent", value: 21, tone: "mint" }, { label: "Overdue", value: 13, tone: "red" }, { label: "Draft", value: 8, tone: "gray" },
  ],
};
const CHAT_FILES = [{ id: "raw", label: "Raw-Data.xls" }, { id: "photo", label: "Photo1.jpg" }];
const CHAT_TURN_MENU = [
  { id: "edit", label: "Edit message", icon: "edit" },
  { id: "copy", label: "Copy message", icon: "content_copy" },
];
const LEGEND_SERIES = [{ label: "Recurring" }, { label: "Non recurring" }, { label: "Credits" }];
const LEGEND_WITH_VALUES = [
  { label: "Recurring", value: "$3.2M" }, { label: "Non recurring", value: "$1.7M" }, { label: "Credits", value: "$0.4M" },
];
const LEGEND_SAMPLES: Record<string, unknown> = { "{series}": LEGEND_SERIES, "{seriesWithValues}": LEGEND_WITH_VALUES };
const legendProps = (p: Props) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" && v in LEGEND_SAMPLES ? LEGEND_SAMPLES[v] : v])) as unknown as LegendProps;

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
const product = (id: string, name: string, method: string, type: string, level: string, active: boolean, rate: string, created: string): LookupRow => ({
  id, name, method, type, level, rate, created,
  status: <Cell size="sm" type="badge" label={active ? "Active" : "Deactivated"} tone={active ? "success" : "neutral"} />,
});
const PRODUCTS: LookupRow[] = [
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
    preview: {
      label: "Invoices by status by time", title: "Invoices by status", subtitle: "Last 7 weeks, all accounts",
      categories: "{weeks}", series: "{statuses}", format: "currency", stacked: true,
    },
    extras: { bars: { values: ["stacked", "ranked"], default: "stacked" } },
    // Ranked: one series sorted longest first, with the top and bottom bars picked out, as in the Figma.
    normalize: ({ bars, ...p }) =>
      bars === "ranked"
        ? { ...p, title: "Open balance by customer", subtitle: "Top six, this period", categories: "{customers}", series: "{balances}", orientation: "horizontal", stacked: false, highlight: [0, 5] }
        : p,
    hint: "Switch the bars and the orientation. Ranked picks out the top and bottom bar in the highlight tone. Turn the title, stacked, values, grid, legend and animate on and off.",
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
  ListDetail: {
    // The pattern in the frame on Billing › Invoices, driven the way a screen would drive it: the open invoice lives in the screen.
    render: ({ shell, stage, open, variant, layout }) => (
      <ListDetailDemo
        key={`${open}-${variant}-${layout}`} shell={shell !== false} stage={String(stage ?? "desktop")} picked={open !== false}
        variant={(variant as ListDetailVariant | undefined) ?? "plain"} layout={(layout as ListDetailLayout | undefined) ?? "side"}
      />
    ),
    // Open over the contract default, so the preview starts with an invoice showing.
    preview: { open: true },
    hide: ["list", "detail", "open", "title", "actions", "empty", "onBack", "backLabel", "label"],
    toggles: { shell: { label: "In the app frame", default: true } },
    extras: {
      variant: { values: ["plain", "groups", "template", "actions", "nested", "tree"], default: "plain" },
      stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" },
    },
    hint: "Pick invoices and the pane beside the list follows. Switch the list: groups splits it by status under headers that fold, template adds avatars, unread dots and status lines, actions puts every invoice action in a More menu, nested starts at the accounts, where a click steps into one's invoices with Back to return, and tree opens an account's invoices right under it. Set layout to stacked for the record under the list, or inline for the record under its row. Set the stage to phone: the list shows alone, a row opens the invoice over it, and Back returns. Turn the frame off to see the pattern on its own.",
    block: true,
    wide: true,
    page: <ListDetailDemo shell />,
    card: (
      <div style={{ width: 340, display: "grid", gridTemplateColumns: "2fr 3fr", border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", background: "var(--surface-flat)", overflow: "hidden" }}>
        <div style={{ borderInlineEnd: "var(--border-width-thin) solid var(--border-neutral-subtle)", padding: "var(--space-xsmall)", display: "flex", flexDirection: "column", gap: "var(--space-xsmall)" }}>
          <Skeleton shape="text" /><Skeleton shape="text" /><Skeleton shape="text" />
        </div>
        <div style={{ padding: "var(--space-xsmall)", display: "flex", flexDirection: "column", gap: "var(--space-xsmall)" }}>
          <Skeleton shape="text" width="60%" /><Skeleton shape="text" /><Skeleton shape="text" />
        </div>
      </div>
    ),
  },
  SettingsPage: {
    // The pattern in the frame, driven the way a screen would drive it: which place is chosen lives in the screen.
    render: ({ shell, notice, stage, ...p }) => (
      <SettingsPageDemo {...(p as Record<string, unknown>)} shell={shell !== false} notice={Boolean(notice)} stage={String(stage ?? "desktop")} />
    ),
    preview: {},
    hide: ["children", "intro", "label"],
    toggles: {
      notice: { label: "Something to say first", default: false },
      shell: { label: "In the app frame", default: true },
    },
    extras: { stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" } },
    hint: "Stage narrows the box the frame lives in, so watch the tiles and the rail on a phone. Every place under Settings, each tile its own color. Pick one and the side nav follows. Turn the notice on for a line that has to be read before the tiles, and the frame off to see the settings home on its own.",
    block: true,
    wide: true,
    page: <SettingsPageDemo shell />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <Tile title="Security & Users" description="Roles, sharing groups and approvals." icon="shield_person" tone="red" href="#" />
        <Tile title="Billing" description="Invoices, statements, templates and periods." icon="receipt_long" tone="brand" href="#" />
      </div>
    ),
  },
  Legend: {
    // On the stage the keys switch, so the toggling shows; Variants show the plain key.
    render: ({ toggles, ...p }) => {
      const props = legendProps(p);
      return <div style={{ ...chartPanel, width: p.orientation === "column" ? "auto" : "100%" }}>
        {toggles ? <LegendDemo {...props} /> : <Legend {...props} />}
      </div>;
    },
    preview: { items: "{seriesWithValues}", orientation: "row", shape: "square" },
    hide: ["items", "hidden", "defaultHidden", "onHiddenChange", "decorative"],
    toggles: { toggles: { label: "Keys switch series", default: true } },
    hint: "Switch the direction, shape, size and place. With the switch on, each key is a button: press one to drop that series, press it again to bring it back.",
    card: <Legend size="sm" items={LEGEND_SERIES} />,
  },
  LineChart: {
    // Sample data swaps in for its {names}; a white panel like a page. Keyed so switching a control plays the motion again.
    render: (p) => <div style={chartPanel}><LineChart key={JSON.stringify(p)} {...chartProps<LineChartProps>(p)} /></div>,
    preview: {
      label: "Revenue by period", title: "Revenue by period", subtitle: "Last 6 months, all accounts",
      categories: "{months}", series: "{revenue}", format: "currency", area: true, showPoints: true, showValues: true,
    },
    hint: "Hover or use the arrow keys for the tooltip. Turn the title, area, stacked, points, values, grid, legend and animate on and off. Variants has a limit line, a dashed forecast and a today marker.",
    block: true,
    card: <div style={{ width: "100%" }}><LineChart label="Revenue" categories={["Jan", "Feb", "Mar", "Apr", "May"]} series={[{ name: "Revenue", values: [3, 3.4, 4.1, 4.3, 4.8] }]} area showLegend={false} height={96} animate={false} /></div>,
  },
  ListPage: {
    // The pattern, driven the way a screen would drive it: the filters, the ticks and the page live in the screen.
    render: ({ state, shell, stage, ...p }) => (
      <ListPageDemo
        {...(p as Record<string, unknown>)}
        state={(state as "ready" | "loading" | "empty" | "error") ?? "ready"}
        shell={shell !== false}
        stage={String(stage ?? "desktop")}
      />
    ),
    preview: { state: "ready" },
    hide: ["children", "toolbar", "pagination", "bulk", "empty", "error", "onRetry", "label", "loadingRows"],
    toggles: { shell: { label: "In the app frame", default: true } },
    extras: { stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" } },
    hint: "Stage narrows the box the frame lives in, so watch the list on a phone. Switch between Table View, List View and Card View: the same records, laid out three ways. Tick rows and the bar over the list becomes what can be done to them. Search, set a filter, change the page size, and switch the state to see the loading, empty and failed lists. Turn the frame off to see the list on its own.",
    block: true,
    wide: true,
    page: <ListPageDemo state="ready" shell />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <Toolbar label="Invoices" views={[{ id: "table", label: "Table View" }]} onRefresh={() => {}} actions={<Button size="sm" variant="primary" iconStart="add">New</Button>} />
        <Pagination total={248} defaultPage={2} showPageSize={false} />
      </div>
    ),
  },
  Link: {
    // Examples without href act in place, so the page does not jump.
    render: ({ children, ...p }) => <Link {...(p as object)}>{(children as string) || "View recent invoices"}</Link>,
    preview: { children: "View recent invoices" },
    hide: ["onClick"],
    hint: "Switch tone, external and disabled. Without href the link acts in place, as a button that looks like a link.",
    card: <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-neutral)" }}>Legal entity: <Link>Parent Co</Link></span>,
  },
  LinkList: {
    render: (p) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <LinkList {...(p as object)} items={(p.items as LinkListItem[] | undefined) ?? QUICK_LINK_ITEMS} />
      </div>
    ),
    preview: { label: "Quick links", items: QUICK_LINK_ITEMS },
    hide: ["items"],
    hint: "A record's quick links. Each row is one link with a chevron; Variants show icons, descriptions and links that open in a new tab.",
    card: <div style={{ width: 220 }}><LinkList label="Quick links" items={QUICK_LINK_ITEMS.slice(0, 3)} /></div>,
  },
  ListView: {
    // Keyed so switching a control starts fresh. The Groups switch splits the sample under two headers; examples pass their own items.
    render: ({ grouped, ...p }) => (
      // Full width up to 720, so two captioned lists share a row of Variants without spilling into each other.
      <div style={{ width: "100%", maxWidth: 720, minWidth: 0, background: "var(--surface-flat)", textAlign: "start" }}>
        <ListView
          key={JSON.stringify(p) + String(grouped)} {...(p as object)} label={(p.label as string) ?? "Invoices"}
          items={(p.items as ListViewItem[] | undefined) ?? LIST_VIEW_ITEMS}
          groups={(p.groups as never) ?? (grouped ? LIST_VIEW_GROUPS : undefined)}
        />
      </div>
    ),
    preview: { label: "Invoices", selection: "single", interaction: "drill", items: LIST_VIEW_ITEMS },
    hide: ["items", "groups", "selected", "collapsed"],
    toggles: { grouped: { label: "Groups", default: false } },
    block: true,
    // Variants stack top to bottom, so each list has the width it would have on a page.
    column: true,
    hint: "Switch selection and interaction: single picks one row, multiple adds checkboxes; drill opens a record, drag reorders by hand. Turn Groups on to split the list under headers, then try the header size, collapsible and sticky.",
    card: (
      <div style={{ width: "100%", background: "var(--surface-flat)" }}>
        <ListView label="Invoices" selection="single" defaultSelected={["inv-1043"]} items={LIST_VIEW_ITEMS.slice(2, 4)} />
      </div>
    ),
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
    hint: "Turn each part of the card on and off. Click the card to pick it; switch the message tone and disabled.",
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
      ? <div style={{ width: 640, maxWidth: "100%" }}><CellTreeDemo size={p.size as CellSize | undefined} checkbox={Boolean(p.checkbox)} showLines={p.showLines !== false} treeToggle={p.treeToggle as CellTreeToggle | undefined} /></div>
      : <Cell {...(p as object)} />),
    preview: { type: "text", label: "INV-1042" },
    // expanded belongs to each tree row; the tree preview keeps its own open rows.
    hide: ["expanded"],
    // Fills sample data for the picked type so every type previews with real content.
    normalize: (p) => ({ ...CELL_SAMPLES[(p.type as CellType) ?? "text"], ...p, ...(p.type !== "text" && p.label === "INV-1042" ? { label: CELL_SAMPLES[p.type as CellType]?.label } : {}) }),
    hint: "Pick a type, size and states. Each type fills in sample data.",
    card: <div style={{ display: "grid" }}><Cell type="avatar" size="sm" name="Maya Chen" label="maya@acme.com" src="/faces/maya-chen.jpg" /><Cell type="badge" size="sm" label="Paid" tone="success" /></div>,
  },
  ChatComposer: {
    // The stage wires the box up, so sending, the attachments and the switches all work.
    render: ({ wired, ...p }) => {
      const props = { ...(p as unknown as ChatComposerProps), attachments: (p.attachments === "{files}" ? CHAT_FILES : p.attachments) as ChatComposerProps["attachments"] };
      return wired ? <ChatComposerDemo {...props} /> : <div style={{ width: "100%", maxWidth: 460 }}><ChatComposer {...props} /></div>;
    },
    preview: { scopeLabel: "Accounts page", defaultScoped: true },
    hide: ["value", "defaultValue", "scoped", "attachments", "addMenu", "onSend", "onChange", "onAdd", "onAttachmentRemove", "onScopedChange", "onSelectingChange", "onDictatingChange", "onModeChange", "label", "hints"],
    toggles: { wired: { label: "Working box", default: true } },
    hint: "Type and press Enter to send. Add a file, take a chip off, or turn on field selection and dictation: each one goes red and says how to stop. Deep Thought stays lit while it is on.",
    block: true,
    card: <div style={{ width: 300 }}><ChatComposer placeholder="Ask questions" /></div>,
  },
  ChatHeader: {
    render: (p) => <ChatHeaderDemo {...(p as unknown as ChatHeaderProps)} />,
    preview: { chatsCount: 7, playbooksCount: 9 },
    hide: ["menu", "onNewChat", "onExpandedChange", "onClose", "onPlanModeChange", "onMenuSelect", "label", "chatsCount", "playbooksCount"],
    hint: "Open the options menu for Chats 7, Playbooks 9, Plan Mode and Settings. Switch Plan Mode and it stays ticked, with a badge beside the name; the full-screen button turns into the way back.",
    block: true,
    card: <div style={{ width: 300, border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden" }}><ChatHeader chatsCount={7} playbooksCount={9} onNewChat={() => {}} onClose={() => {}} /></div>,
  },
  ChatList: {
    // Sample chats and playbooks swap in for their {names}; the stage wires the rows and their menus up.
    render: ({ holds, ...p }) => {
      const props = holds === "playbooks"
        ? { title: "Playbooks", items: PLAYBOOK_ITEMS }
        : { title: "Chats", groups: CHAT_GROUPS };
      return <ChatListDemo {...(p as unknown as ChatListProps)} {...props} />;
    },
    preview: { title: "Chats" },
    hide: ["title", "items", "groups", "selected", "query", "more", "createLabel", "closeLabel", "onSelect", "onQueryChange", "onCreate", "onClose", "onItemMenuSelect"],
    extras: { holds: { values: ["chats", "playbooks"], default: "chats" } },
    hint: "Switch between saved chats and playbooks. Open a row, fold a group away, search to narrow the rows, or use a row's menu.",
    block: true,
    card: <div style={{ width: 300, height: 180, overflow: "hidden", border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)" }}><ChatList title="Chats" groups={CHAT_GROUPS} searchable={false} selected="unpaid" /></div>,
  },
  ChatMessage: {
    // The stage runs a short conversation, so the vote, the menu and the suggestions all work.
    render: ({ conversation, ...p }) => {
      const author = (p.author as "user" | "assistant") ?? "assistant";
      if (conversation) return <ChatMessageDemo {...(p as unknown as ChatMessageProps)} />;
      // One turn on its own: the person asks in a bubble, the assistant answers with its buttons.
      const sample = author === "user"
        ? { text: "How many accounts are inactive?", person: { name: "Ana Petrovic" }, menu: CHAT_TURN_MENU }
        : { text: "42 accounts have had no activity for 90 days or more.", suggestions: [{ id: "new", label: "Create a new account" }] };
      return <div style={{ width: "100%", maxWidth: 460 }}><ChatMessage {...sample} {...(p as unknown as ChatMessageProps)} author={author} /></div>;
    },
    preview: { author: "assistant" },
    hide: ["children", "sections", "actions", "pressed", "suggestions", "menu", "person", "label", "onAction", "onSuggestion", "onMenuSelect"],
    toggles: { conversation: { label: "Whole conversation", default: false } },
    hint: "Switch the author for a person’s turn or the assistant’s. Turn on the whole conversation for a question and an answer with its workings, buttons and suggestions, where the vote and the menu work.",
    block: true,
    card: <div style={{ width: 300 }}><ChatMessage author="assistant" text="Summary of results" actions={[]} /></div>,
  },
  ChatWindow: {
    // The pattern, driven the way a screen would drive it: the panel, the notice and the turns live outside it.
    render: ({ started, page, ...p }) => <ChatWindowDemo {...(p as Record<string, unknown>)} started={Boolean(started)} page={String(page ?? "accounts")} />,
    preview: { size: "panel" },
    hide: ["composer", "children", "empty", "starters", "onStarter", "art", "artAnimated", "autoFocus", "panel", "panelOpen", "title", "notice", "onNoticeDismiss", "onNewChat", "expanded", "onExpandedChange", "onClose", "chatsCount", "playbooksCount", "planMode", "onPlanModeChange", "menu", "onMenuSelect"],
    toggles: { started: { label: "Conversation started", default: false } },
    extras: { page: { values: ["accounts", "product", "invoice", "none"], default: "accounts" } },
    hint: "Switch between the docked column and full screen. Change the page the assistant was opened from: the scope row takes its name, and goes when there is nothing to scope to. Pick a suggestion or type to start; open Chats or Playbooks from the options menu, and watch where the panel lands in each size.",
    block: true,
    wide: true,
    page: <ChatWindowDemo started size="panel" />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <ChatHeader title="Assistant" chatsCount={7} onNewChat={() => {}} onClose={() => {}} />
        <ChatMessage author="assistant" text="312 invoices are overdue, worth $1.2M in total." />
      </div>
    ),
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
  Conveyor: {
    // The run inside is a Scoreboard with its own scrolling off, or a row of filter chips.
    render: ({ content, ...p }) => {
      const down = p.orientation === "vertical";
      const run = content === "chips"
        ? <div style={{ display: "flex", flexDirection: down ? "column" : "row", alignItems: down ? "flex-start" : "center", gap: "var(--space-xsmall)", padding: "var(--space-xxsmall)" }}>
            {CHIPS.map((t) => <span key={t} style={{ flex: "none" }}><Badge tone="neutral">{t}</Badge></span>)}
          </div>
        : <Scoreboard items={NINE_KPIS} scroll={false} label="Key metrics" />;
      const inside = <Conveyor {...(p as unknown as ConveyorProps)}>{run}</Conveyor>;
      return down ? <div style={{ height: 220, maxWidth: 280 }}>{inside}</div> : inside;
    },
    preview: { label: "Key metrics" },
    hide: ["children", "step"],
    extras: { content: { values: ["scorecards", "chips"], default: "scorecards" } },
    hint: "Switch what is inside and the direction. The arrows show only when there is something to scroll, and turn off at the ends.",
    block: true,
    wide: true,
    card: <div style={{ width: 300 }}><Conveyor label="Key metrics"><Scoreboard items={NINE_KPIS.slice(0, 4)} scroll={false} /></Conveyor></div>,
  },
  Count: {
    render: (p) => <Count {...(p as object)} count={Number(p.count ?? 3)} />,
    preview: { count: 3, label: "unread messages" },
    extras: { value: { values: ["3", "42", "150"], default: "3" } },
    normalize: ({ value, ...p }) => ({ ...p, count: Number(value ?? p.count) }),
    hint: "Switch size, tone and value. 150 shows as 99+ with the default max.",
    card: <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Count count={3} /><Count tone="danger" count={12} /><Count tone="neutral" count={150} /></div>,
  },
  Dashboard: {
    // The pattern in the frame, driven the way a screen would drive it: the dashboard, the open groups and
    // the filters live in the screen.
    render: ({ state, shell, stage, ...p }) => (
      <DashboardDemo
        {...(p as Record<string, unknown>)}
        state={(state as "ready" | "loading" | "empty") ?? "ready"}
        shell={shell !== false}
        stage={String(stage ?? "desktop")}
      />
    ),
    preview: { state: "ready" },
    hide: ["children", "toolbar", "name", "empty", "loadingTiles", "label"],
    toggles: { stickyToolbar: { label: "Bar stays put", default: true }, shell: { label: "In the app frame", default: true } },
    extras: { stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" } },
    hint: "Stage narrows the box the frame lives in, so watch the numbers and the bar on a phone. Fold a group of numbers away, pick another saved dashboard from the bar, and scroll: the page header shrinks to one compact line and the bar stays under it. Switch the state to see the loading and empty dashboards. Turn the frame off to see the dashboard on its own.",
    block: true,
    wide: true,
    page: <DashboardDemo state="ready" shell />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <Scoreboard items={TREND_KPIS.slice(0, 3)} label="Dashboard numbers" />
        <BarChart label="Aging" categories={["Current", "1-30", "31-60", "61-90"]} series={[{ name: "Balance", values: [230, 60, 22, 8], tone: "orange" }]} height={96} />
      </div>
    ),
  },
  DataGrid: {
    // Sample columns and rows swap in for their {names}. Keyed so switching controls starts fresh.
    render: (p) => <DataGrid key={JSON.stringify(p)} {...gridProps(p)} />,
    preview: { label: "Conditions", columns: "{conditionColumns}", defaultRows: "{conditions}", canAddRows: true, canRemoveRows: true },
    snippet: { onRowsChange: "{setRules}" },
    hint: "Click a cell to edit it: Field opens the formula editor, Condition is a select, Value is text. Enter saves, Escape cancels. Add and remove rows.",
    block: true,
    wide: true,
    card: <div style={{ width: 400 }}><DataGrid label="Conditions" columns={CONDITION_COLUMNS} defaultRows={CONDITIONS.slice(0, 2)} canInsertRows canRemoveRows /></div>,
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
  FormPage: {
    // The pattern in the frame, driven the way a screen would drive it: the values, the folds and what has
    // been saved live in the screen.
    render: ({ shell, notice, stage, labels, columns, ...p }) => (
      <FormPageDemo
        {...(p as Record<string, unknown>)}
        shell={shell !== false} notice={notice !== false} stage={String(stage ?? "desktop")}
        labels={labels === "top" ? "top" : "start"}
        columns={columns === "3" ? 3 : columns === "1" ? 1 : 2}
      />
    ),
    preview: {},
    hide: ["children", "header", "notice", "onStickyChange", "label"],
    toggles: {
      sticky: { label: "Top stays put", default: true },
      stickyNotice: { label: "Notice stays put", default: true },
      notice: { label: "Something to read first", default: true },
      shell: { label: "In the app frame", default: true },
    },
    extras: {
      labels: { values: ["start", "top"], default: "start" },
      columns: { values: ["1", "2", "3"], default: "2" },
      stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" },
    },
    hint: "Fill in the new account: the name is the only field that has to be filled in, and Create in the bar saves every group at once. Fold a group away, open one of the three that start closed, and scroll: the name and the notice stay at the top while the fields pass under them. Labels switches the whole form between a label column at the start of each field and a label over it. Columns lays the fields out in one, two or three; three gives way to two when the page is too narrow for them. Stage narrows the box the frame lives in, so watch the two columns become one on a phone.",
    block: true,
    wide: true,
    page: <FormPageDemo shell />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <PageHeader title="Create account" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }]} actions={<><Button size="sm">Cancel</Button><Button size="sm" variant="primary">Create</Button></>} />
        <Input size="sm" label="Account name" labelPosition="start" placeholder="Enter a value" required />
        <Select size="sm" label="Status" labelPosition="start" options={[{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }]} defaultValue="active" />
      </div>
    ),
  },
  AccountFlow: {
    // The flow in the frame, walked the way a screen would walk it: which page is showing and what was saved
    // live in the screen.
    render: ({ stage, start }) => (
      <AccountFlowDemo
        stage={String(stage ?? "desktop")}
        start={start === "account" || start === "newAccount" || start === "newProduct" ? start : "list"}
      />
    ),
    preview: {},
    hide: ["view", "list", "account", "newAccount", "newProduct"],
    extras: {
      start: { values: ["list", "account", "newAccount", "newProduct"], default: "list" },
      stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" },
    },
    hint: "Walk the accounts flow: open an account from its blue Account ID, switch to Account Products and add one with New account product, or press New for a new account and Submit it. Cancel and the trail go back. Start jumps straight to a page; Stage narrows the box the frame lives in.",
    block: true,
    wide: true,
    page: <AccountFlowDemo />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <PageHeader title="Account" actions={<><Button size="sm">Export</Button><Button size="sm" variant="primary">New</Button></>} />
        <Table
          size="sm" columns={[{ key: "accountId", header: "Account ID" }, { key: "name", header: "Account name" }]}
          rows={[
            { id: "72082", accountId: <Cell type="link" size="sm" label="72082" onClick={() => {}} />, name: "Anton Test BI Aug05" },
            { id: "72081", accountId: <Cell type="link" size="sm" label="72081" onClick={() => {}} />, name: "Anton Test Rob Sub 8" },
          ]}
        />
      </div>
    ),
  },
  GuidedProcess: {
    // Part picks the piece. The panel stage walks the process with Start, Back and Next; Variants show each part
    // alone at the size it has in a page.
    render: ({ walk, ...p }) => {
      const steps = (p.steps as GuidedProcessStep[] | undefined) ?? GUIDED_STEPS;
      if (p.part === "footer") {
        return (
          <div style={{ width: "100%" }}>
            <GuidedProcess part="footer" updated={String(p.updated ?? "Last updated on September 13, 12:43 PM")} actions={(p.actions as GuidedProcessAction[] | undefined) ?? GUIDED_ACTIONS} onAction={() => {}} />
          </div>
        );
      }
      if (p.part === "steps") {
        return (
          <div style={{ display: "grid", width: 458, maxWidth: "100%", minHeight: 560 }}>
            <GuidedProcess part="steps" steps={steps} current={Number(p.current ?? 2)} side={p.side === "start" ? "start" : "end"} />
          </div>
        );
      }
      if (p.part === "header") {
        return (
          <div style={{ width: "100%" }}>
            <GuidedProcess part="header" title={String(p.title ?? "Import usage")} stepTitle={String(p.stepTitle ?? "Map the columns")} current={Number(p.current ?? 2)} total={steps.length} />
          </div>
        );
      }
      const props = { ...(p as unknown as GuidedProcessPanelProps), part: "panel" as const, steps };
      if (walk) return <GuidedProcessDemo {...props} />;
      // Contract examples carry no handlers, so give a not-started panel its Start and Cancel.
      const intro = props.started === false ? { onStart: () => {}, onCancel: () => {} } : {};
      return (
        // A grid with a minimum height, so a tall panel grows the box instead of spilling out of it.
        <div style={{ display: "grid", width: 458, maxWidth: "100%", minHeight: props.placement === "band" ? undefined : 560 }}>
          <GuidedProcess {...props} {...intro} />
        </div>
      );
    },
    toggles: { walk: { label: "Start, Back and Next", default: true } },
    preview: { part: "panel", title: "Import usage", subtitle: "Bring a month of metered usage in from a file.", steps: GUIDED_STEPS, current: 1, started: false, placement: "side", shade: 1 },
    hide: ["steps", "onStart", "onCancel", "actions", "onAction", "onClose", "onStepsOpen"],
    block: true,
    hint: "Part picks the piece: the panel for one step, the steps beside the page, the header over a step, or the footer under it. On the panel, press Start, then Next and Back; shade darkens columns further along, and placement band is the shorter panel that stacks on a narrow page. Side on the steps flips the notch for a panel on the start edge.",
    card: (
      <div style={{ width: 220 }}>
        <GuidedProcess placement="band" title="Import usage" steps={[{ title: "Choose the file", status: "success" }, { title: "Map the columns" }]} current={1} />
      </div>
    ),
  },
  GuidedProcessPage: {
    // The pattern in the frame, driven the way a screen would drive it.
    render: ({ shell, stage, side }) => (
      <GuidedProcessPageDemo shell={shell !== false} stage={String(stage ?? "desktop")} side={side === "start" ? "start" : "end"} />
    ),
    preview: { side: "end" },
    hide: ["view", "intro", "header", "children", "footer", "steps", "stepsOpen", "onStepsClose", "label"],
    toggles: { shell: { label: "In the app frame", default: true } },
    extras: { stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" } },
    hint: "Press Start in the first column, then walk the import: Continue moves on, Skip moves on and marks the step to look at again, Save writes the time in the footer, and Submit on the last step sends the batch. Cancel goes back to the columns. Side puts the steps panel at the end or the start of the page. Stage narrows the box: under 1024 the columns stack, the steps become a drawer opened by the 4 | 6 counter, the quieter footer actions fold into the More menu, and on a phone they are icon buttons.",
    block: true,
    wide: true,
    page: <GuidedProcessPageDemo shell />,
    card: (
      <div style={{ width: 340, height: 180, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 130px", border: "var(--border-width-thin) solid var(--border-neutral-subtle)", borderRadius: "var(--radius-medium)", overflow: "hidden", background: "var(--surface-flat)" }}>
        <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) auto", minWidth: 0 }}>
          <div style={{ display: "grid", alignContent: "start", gap: "var(--space-xsmall)", padding: "var(--space-small)" }}>
            <span style={{ font: "var(--font-weight-regular) var(--font-size-regular) / var(--line-height-tight) var(--font-sans)", color: "var(--text-neutral-strong)" }}>Map the columns</span>
            <Input size="sm" label="Account column" placeholder="Column A" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "var(--space-xsmall)", background: "var(--surface-sunken)", borderTop: "var(--border-width-thin) solid var(--border-neutral-faint)" }}>
            <Button size="sm">Continue</Button>
          </div>
        </div>
        <div style={{ display: "grid", minHeight: 0, overflow: "hidden" }}>
          <GuidedProcess part="steps" steps={[{ title: "File", status: "success" }, { title: "Columns" }, { title: "Import" }]} current={2} />
        </div>
      </div>
    ),
  },
  AnchorNav: {
    // The stage shows the nav beside a short scrolling page, so the caret follows as it moves.
    render: ({ items, ...p }) =>
      items && items !== "{sections}"
        ? <AnchorNav {...(p as unknown as AnchorNavProps)} items={(ANCHOR_SAMPLES["{sections}"] as AnchorNavProps["items"])} />
        : <AnchorNavDemo {...(p as unknown as AnchorNavProps)} />,
    preview: { variant: "rail" },
    hide: ["items", "active", "defaultActive", "offset"],
    hint: "Switch the variant. Scroll the page beside it, or click a row: the caret and the strong line follow the section the page is at.",
    block: true,
    card: <div style={{ width: 220 }}><AnchorNav items={PAGE_SECTION_ITEMS.slice(0, 3)} defaultActive="demo-billing" spy={false} /></div>,
  },
  AppShell: {
    // The pattern, driven the way a screen would drive it: which section, which page and whether the
    // assistant is open all live in the screen.
    render: ({ assistant, stage, ...p }) => <AppShellDemo {...(p as Record<string, unknown>)} assistant={Boolean(assistant)} stage={String(stage ?? "desktop")} />,
    preview: { width: "full" },
    hide: ["children", "header", "nav", "pageHeader", "onPageHeaderStick", "assistant", "assistantOpen"],
    toggles: {
      assistant: { label: "Assistant open", default: false },
      stickyPageHeader: { label: "Page header stays put", default: true },
    },
    extras: { stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" } },
    hint: "Open the menu button to widen the rail, walk the side nav, and press Ask the assistant to bring the assistant in beside the page. Scroll the page: the page header stays at the top and shrinks to one compact line whose trail ends in the page name. Stage narrows the box the frame lives in, so watch the rail go on a phone. Width caps the page to a reading column; it does not resize the frame.",
    block: true,
    wide: true,
    page: <AppShellDemo assistant stage="desktop" width="full" />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <AppHeader search={false} />
        <PageHeader title="Accounts" breadcrumbs={[{ label: "Home", href: "#" }]} actions={<Button size="sm" variant="primary">New account</Button>} />
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
    // Real kit controls with no size set; the Density around them sets the density tokens.
    render: (p) => <DensityDemo value={p.value as DensityValue | undefined} />,
    preview: {},
    snippet: { children: "<App />" },
    hint: "Switch the value: spacing, control heights, icons and text inside follow the Compact, Default or Comfortable tokens. Controls keep their own size.",
    column: true,
    card: (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Density value="compact"><Button>Compact</Button></Density>
        <Density value="default"><Button>Default</Button></Density>
        <Density value="comfortable"><Button>Comfortable</Button></Density>
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
  RecordPage: {
    // The pattern in the frame, driven the way a screen would drive it: the tab and the notice live outside it.
    render: ({ sticky, shell, stage }) => <RecordPageDemo sticky={sticky !== false} shell={shell !== false} stage={String(stage ?? "desktop")} />,
    preview: { sticky: true },
    hide: ["children", "header", "tabs", "notice", "toolbar", "summary", "onStickyChange", "label"],
    toggles: { sticky: { label: "Top stays put", default: true }, shell: { label: "In the app frame", default: true } },
    extras: { stage: { values: ["desktop", "laptop", "tablet", "phone"], default: "desktop" } },
    hint: "Stage narrows the box the frame lives in, so watch the record on a phone. Walk the record's tabs, fold a section of details away, dismiss the notice, and scroll: the name stays at the top and shrinks to one compact line whose trail ends in the record, while the tabs and the bar scroll away under it. Turn the frame off to see the record on its own.",
    block: true,
    wide: true,
    page: <RecordPageDemo sticky shell />,
    card: (
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: "var(--space-small)" }}>
        <PageHeader title="Apex Digital Services" badge="Active" badgeTone="success" />
        <Tabs label="Record parts" items={[{ id: "details", label: "Details" }, { id: "contacts", label: "Contacts", count: 4 }, { id: "invoices", label: "Invoices", count: 12 }]} />
      </div>
    ),
  },
  Scoreboard: {
    // Sample cards swap in for their {names}. Keyed so switching controls starts fresh.
    render: (p) => <Scoreboard key={JSON.stringify(p)} {...scoreProps(p)} />,
    preview: { items: "{trendKpis}" },
    hide: ["selected", "defaultSelected"],
    extras: { cards: { values: ["trends", "charts", "six"], default: "trends" } },
    normalize: ({ cards, ...p }) => ({ ...p, items: cards === "charts" ? "{chartKpis}" : cards === "six" ? "{sixKpis}" : "{trendKpis}" }),
    hint: "Switch between trends, spark charts and six cards. Past four cards the strip sits in a Conveyor, with arrows when the cards do not fit. Turn on selectable to pick a card.",
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
    hint: "Click the chevron to fold the section. Turn collapsible off for a static heading; content header only drops the body. Line thin makes the rule under the title 1px; Variants shows thin subsections.",
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
        <SideNav items={APP_NAV} endItems={APP_NAV_END} defaultCurrent="revenue-general-ledger" defaultPinned />
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
  Tile: {
    render: (p) => <Tile {...(p as { title: string })} />,
    preview: { title: "Security & Users", description: "Includes roles, sharing groups, approvals, authentication, and user management.", icon: "shield_person", tone: "red", href: "#" },
    hide: ["onClick"],
    hint: "Walk the tones: each tile in a grid takes its own, so the color becomes part of how people find the place again. A tile is a link, not a choice; comparing options is Card.",
    card: <div style={{ width: 300 }}><Tile title="Billing" description="Invoices, statements, templates and periods." icon="receipt_long" tone="brand" href="#" /></div>,
  },
  Timeline: {
    render: (p) => <Timeline {...timelineProps(p)} />,
    preview: { items: "{activity}" },
    hide: ["items", "onMenuSelect"],
    extras: { entries: { values: ["activity", "tones", "short"], default: "activity" } },
    normalize: ({ entries, ...p }) => ({ ...p, items: entries === "tones" ? "{tones}" : entries === "short" ? "{short}" : "{activity}" }),
    hint: "Switch the entries and the size. The line joins the entries and stops at the last one. Each entry can carry notes, links, one action and a More menu.",
    block: true,
    card: <div style={{ width: 300 }}><Timeline items={SHORT} size="sm" /></div>,
  },
  Toast: {
    // A kit Button shows the real Toast. With an action label it waits to be closed; clear the label for the 5 second countdown.
    render: (p) => <ToastDemo {...(p as { title: string })} />,
    preview: { title: "Saved successfully", description: "Your changes have been saved.", actionLabel: "Undo" },
    hide: ["open"],
    snippet: { open: "{saved}", onClose: "{close}", onAction: "{undo}" },
    hint: "Click the button to show it. With Undo it stays until closed, so people can reach the action; clear the action label and the top bar counts down 5 seconds (point at the toast to pause it). Switch the tone.",
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
    hint: "Simple: selection single, icons and drag off. Advanced: selection multiple, icons and reorderable on. Click chevrons to open folders; drag a row above, below or onto a folder, or click its handle for the Move menu; Alt with the arrows moves the focused row.",
    card: (
      <div style={{ width: "100%" }}>
        <TreeView label="Workspace" items={[{ id: "org", label: "Organization", children: [TREE_ITEMS[0].children![1]] }]} expanded={["org", "design"]} selection="multiple" selected={["sienna", "ammar"]} showIcons size="sm" />
      </div>
    ),
  },
  UsageList: {
    // A white panel like a Section's content; examples pass their own items.
    render: (p) => (
      <div style={{ width: 420, maxWidth: "100%", padding: "var(--space-medium)", background: "var(--surface-flat)", borderRadius: "var(--radius-medium)" }}>
        <UsageList {...(p as object)} items={(p.items as UsageListItem[] | undefined) ?? USAGE_ITEMS} />
      </div>
    ),
    preview: { label: "Plan usage", items: USAGE_ITEMS },
    hide: ["items"],
    hint: "A plan's limits. Bars turn amber at 80% of a limit and red at 100%; Variants show use over a limit and a list with nothing close.",
    card: <div style={{ width: 240 }}><UsageList label="Plan usage" items={USAGE_ITEMS.slice(1)} /></div>,
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
    // actionButtons and titleIcon are playground-only: one adds a secondary and the one primary Button as actions,
    // the other puts the optional icon before the title. No icon by default.
    render: ({ actionButtons, titleIcon, ...p }) => (
      <PageHeader
        {...(p as unknown as PageHeaderProps)} onMoreSelect={() => {}}
        icon={titleIcon === "on" ? "folder_open" : (p as unknown as PageHeaderProps).icon}
        actions={actionButtons === "off" ? undefined : <><Button size="sm">Send</Button><Button size="sm" variant="primary">Approve</Button></>}
      />
    ),
    preview: {
      breadcrumbs: [{ label: "Home", href: "#" }, { label: "Billing", href: "#" }, { label: "Invoices", href: "#" }],
      title: "INV-1042",
      badge: "Draft",
      moreActions: [
        { id: "duplicate", label: "Duplicate", icon: "content_copy" },
        { id: "pdf", label: "Download PDF", icon: "download" },
        { divider: true },
        { id: "delete", label: "Delete", icon: "delete", danger: true },
      ],
    },
    snippet: { actions: "{actions}" },
    extras: { titleIcon: { values: ["off", "on"], default: "off" }, actionButtons: { values: ["on", "off"], default: "on" } },
    hint: "Toggle sticky and shadow, pick a badge tone, turn the title icon on, and turn the action buttons off. More opens the overflow menu.",
    block: true,
    wide: true,
    card: (
      <div style={{ width: 560 }}>
        <PageHeader breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }, { label: "Invoices", href: "#" }]} title="INV-1042" badge="Draft"
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
    // Sample data swaps in for its {names}; a white panel like a page, wide enough for the legend beside the pie.
    // Percent reads each value as a share, so it gets shares that add up to 100 rather than dollar amounts.
    // Keyed so switching a control plays the motion again.
    render: (p) => {
      const data = p.format === "percent" && p.data === "{payments}" ? "{paymentShare}" : p.data;
      return <div style={{ ...chartPanel, maxWidth: 520 }}><PieChart key={JSON.stringify(p)} {...chartProps<PieChartProps>({ ...p, data })} /></div>;
    },
    preview: { label: "Payments by method", title: "Payments by method", subtitle: "This period", data: "{payments}", format: "currency" },
    hint: "Hover or use the arrow keys for each slice. Switch size and legend place; turn the title, donut, total, legend and animate on and off.",
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
  Illustration: {
    render: (p) => <Illustration {...(p as unknown as IllustrationProps)} name={(p.name as IllustrationName) || "ai-chip"} />,
    preview: { name: "ai-chip", size: "md" },
    hide: ["label"],
    hint: "Pick the artwork and how big it is drawn. Set it moving and the glass walks over the message; it holds still for anyone who asks for less motion. The colors belong to the drawing, so they stay put in light and dark.",
    card: <Illustration name="ai-chip" size="sm" />,
  },
  Icon: {
    render: (p) => <Icon {...(p as object)} name={(p.name as string) || "search"} />,
    preview: { name: "search", size: "lg" },
    card: <div style={{ display: "flex", gap: 12 }}><Icon name="search" size="lg" /><Icon name="check_circle" size="lg" tone="success" /><Icon name="warning" size="lg" tone="warning" filled /></div>,
  },
};
