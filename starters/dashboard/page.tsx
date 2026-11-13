"use client";
// Starter screen: a dashboard. Sample numbers only; nothing is read from real data.
// Change the groups, the numbers and the charts to whatever your team watches every morning.
import { useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { Dashboard } from "@/patterns/Dashboard/Dashboard";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { BarChart } from "@/ui/BarChart/BarChart";
import { Button } from "@/ui/Button/Button";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { LineChart } from "@/ui/LineChart/LineChart";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import { Timeline, type TimelineItem } from "@/ui/Timeline/Timeline";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

const AR_NUMBERS = [
  { id: "open-ar", title: "Open AR", metric: "$1.2M", trend: { value: "3.2", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "overdue", title: "Overdue", metric: "$312k", trend: { value: "8.4", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "dso", title: "DSO", metric: "42", trend: { value: "5.2", unit: "% MoM", direction: "up" as const, status: "danger" as const } },
  { id: "collection", title: "Collection rate", metric: "96%", trend: { value: "2.1", unit: "% MoM", direction: "up" as const, status: "success" as const } },
];

const BILLING_NUMBERS = [
  { id: "billed", title: "Billed this month", metric: "$5.1M", trend: { value: "4.4", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "payments", title: "Payments received", metric: "$4.2M", trend: { value: "5.1", unit: "% MoM", direction: "up" as const, status: "success" as const } },
  { id: "credits", title: "Credits applied", metric: "$84k", trend: { value: "11.2", unit: "% MoM", direction: "down" as const, status: "success" as const } },
  { id: "unapplied", title: "Unapplied cash", metric: "$128k", trend: { value: "6.4", unit: "% MoM", direction: "down" as const, status: "success" as const } },
];

const AGING_BUCKETS = ["Current", "1-30", "31-60", "61-90", "91-120", "120+"];
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

const ACCOUNT_COLUMNS: TableColumn[] = [
  { key: "account", header: "Account" },
  { key: "current", header: "Current", numeric: true },
  { key: "overdue", header: "Overdue", numeric: true },
  { key: "total", header: "Total", numeric: true, emphasis: true },
];

const ACCOUNT_ROWS: TableRow[] = [
  { id: "apex", account: "Apex Digital Services", current: "$84,200", overdue: "$17,750", total: "$101,950" },
  { id: "bright", account: "Bright Future Labs", current: "$61,080", overdue: "$12,250", total: "$73,330" },
  { id: "northwind", account: "Northwind Retail", current: "$44,500", overdue: "$25,570", total: "$70,070" },
  { id: "helios", account: "Helios Cloud", current: "$38,120", overdue: "$7,520", total: "$45,640" },
];

const CLOSE_TASKS: TimelineItem[] = [
  { id: "t1", title: "Review and approve invoices", timestamp: "Nov 4", subtitle: "Jordan Ellis", icon: "check_circle", intent: "success" },
  { id: "t2", title: "Post recurring charges", timestamp: "Nov 6", subtitle: "Priya Raman", icon: "check_circle", intent: "success" },
  { id: "t3", title: "Reconcile unapplied cash", timestamp: "Due Nov 28", subtitle: "Billing Operations", icon: "schedule", intent: "warning" },
  { id: "t4", title: "Run revenue recognition", timestamp: "Due Nov 30", subtitle: "Finance", icon: "schedule", intent: "warning" },
];

const PERIODS = [
  { id: "mtd", label: "Month to date" },
  { id: "qtd", label: "Quarter to date" },
  { id: "ytd", label: "Year to date" },
];

const SAVED = [
  { id: "billing", label: "Billing Dashboard" },
  { id: "collections", label: "Collections Dashboard" },
  { id: "revenue", label: "Revenue Dashboard" },
];

export default function BillingDashboardStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("home-home-dashboards");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  const [saved, setSaved] = useState("billing");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("");

  const name = SAVED.find((d) => d.id === saved)?.label ?? "Dashboard";

  return (
    <div data-theme={dark ? "dark" : undefined} style={{ height: "100dvh" }}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen}
            onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2"
            searchShortcut="Ctrl+K"
            user={{ name: "Ana Petrovic" }}
            company={{ name: "Northwind Holdings" }}
            darkMode={dark}
            onDarkModeChange={setDark}
            density={density}
            onDensityChange={setDensity}
            onUserSettings={() => {}}
            onLogout={() => {}}
          />
        }
        nav={
          <AppNav
            items={APP_NAV}
            endItems={APP_NAV_END}
            current={section}
            onNavigate={setSection}
            expanded={navOpen}
          />
        }
        navOpen={navOpen}
        onNavClose={() => setNavOpen(false)}
        pageHeader={<PageHeader title="Home Dashboards" breadcrumbs={[{ label: "Home", href: "#" }]} />}
      >
        <Dashboard
          label={name}
          name={name}
          meta="Updated 09:45 UTC"
          toolbar={
            <Toolbar
              label={name}
              searchValue={query}
              onSearchChange={setQuery}
              searchPlaceholder="Search"
              filterCount={period ? 1 : 0}
              filters={
                <Dropdown
                  trigger="filter"
                  size="sm"
                  label="Period"
                  text={PERIODS.find((o) => o.id === period)?.label}
                  toggle={period ? "on" : undefined}
                  onToggle={period ? () => setPeriod("") : undefined}
                  items={PERIODS.map((o) => ({ ...o, selected: o.id === period }))}
                  onSelect={(id) => setPeriod((was) => (was === id ? "" : id))}
                />
              }
              views={SAVED}
              view={saved}
              onViewChange={setSaved}
              onRefresh={() => {}}
              actions={
                <Button size="sm" iconStart="download">
                  Export
                </Button>
              }
            />
          }
        >
          <Section title="Receivables" help="What is owed, and how old it is." collapsible>
            <Scoreboard label="Receivables summary" items={AR_NUMBERS} selectable defaultSelected="open-ar" scroll />
            {/* Two charts side by side come from the layout class, never a grid of our own. */}
            <div className="layout-split">
              <BarChart
                label="AR aging by bucket"
                title="AR Aging"
                showHeader
                categories={AGING_BUCKETS}
                series={[{ name: "Balance", values: [230, 60, 22, 8, 3, 1], intent: "orange" }]}
                height={220}
              />
              <LineChart
                label="DSO by month"
                title="DSO By Month"
                showHeader
                categories={MONTHS}
                series={[{ name: "DSO", values: [38, 51, 43, 57, 45, 42], intent: "cyan" }]}
                showPoints
                height={220}
              />
            </div>
            <Section title="Balances by account" collapsible>
              <Table columns={ACCOUNT_COLUMNS} rows={ACCOUNT_ROWS} />
            </Section>
          </Section>

          <Section title="Billing" help="What was invoiced and collected this period." collapsible>
            <Scoreboard label="Billing summary" items={BILLING_NUMBERS} scroll />
            <BarChart
              label="Invoices by status"
              title="Invoices By Status"
              showHeader
              orientation="horizontal"
              categories={["Draft", "Waiting", "Open", "Sent", "Paid"]}
              series={[{ name: "Invoices", values: [8, 12, 25, 15, 44], intent: "purple" }]}
              showValues
              height={240}
            />
          </Section>

          <Section title="Month-end close" help="What has to happen before the period can close." collapsible>
            <Timeline label="Close tasks" items={CLOSE_TASKS} />
          </Section>
        </Dashboard>
      </AppShell>
    </div>
  );
}
