import type { AppNavEntry, AppNavItem } from "@/ui/AppNav/AppNav";

// The app's full navigation: every rail section and every link in its menu, top to bottom. Every screen in an
// AppShell passes these to the kit AppNav as they are, so each prototype carries the same whole nav. Do not trim,
// reorder or invent links; mark the screen's own page with current instead. "-" is a divider.
const menu = (section: string, labels: string[]) =>
  labels.map((l) => (l === "-" ? { divider: true as const } : { id: `${section}-${l.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label: l }));

export const APP_NAV: AppNavEntry[] = [
  { id: "home", label: "Home", icon: "home", children: menu("home", ["Home Dashboards", "Approval Management", "Alert Groups", "Grouped Activity"]) },
  { id: "accounts", label: "Accounts", icon: "group", children: menu("accounts", ["Account", "Contract", "Contacts", "Account Products", "Account Packages", "Revenue Contract", "Account Docs", "-", "Orders", "Service Call"]) },
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

export const APP_NAV_END: AppNavItem[] = [
  { id: "recycle", label: "Recycle Bin", icon: "recycling" },
  { id: "processes", label: "Processes", icon: "tune" },
];

// Where a nav id lands: the section it sits under and the page's own name, for the trail and the title.
export function appNavPlace(id: string): { section: string; page: string; icon?: string } {
  for (const entry of APP_NAV) {
    if ("divider" in entry) continue;
    if (entry.id === id) return { section: entry.label, page: entry.label, icon: entry.icon };
    for (const child of entry.children ?? []) {
      if ("divider" in child) continue;
      if (child.id === id) return { section: entry.label, page: child.label, icon: entry.icon };
    }
  }
  const end = APP_NAV_END.find((e) => e.id === id);
  return end ? { section: end.label, page: end.label, icon: end.icon } : { section: "Home", page: "Home", icon: "home" };
}
