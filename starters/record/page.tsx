"use client";
// Starter screen: one record. Sample data only; nothing is saved.
// Change the record name, the tabs, the numbers and the field rows to whatever your record holds.
import { useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Button } from "@/ui/Button/Button";
import { Callout } from "@/ui/Callout/Callout";
import { Cell } from "@/ui/Cell/Cell";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import { Tabs, type TabItem } from "@/ui/Tabs/Tabs";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

const TABS: TabItem[] = [
  { id: "details", label: "Details" },
  { id: "invoices", label: "Invoices", count: 12 },
  { id: "contacts", label: "Contacts", count: 4 },
  { id: "products", label: "Products", count: 7 },
];

const NUMBERS = [
  { id: "balance", title: "Open balance", metric: "$101,950" },
  { id: "overdue", title: "Overdue", metric: "$17,750", badge: "3 invoices" },
  { id: "mrr", title: "Monthly recurring", metric: "$8,400" },
  { id: "since", title: "Customer since", metric: "2021" },
];

const ACCOUNT_FIELDS = [
  { label: "Account name", value: "Apex Digital Services" },
  { label: "Account number", value: "ACC-40219" },
  { label: "Account type", value: "Customer" },
  { label: "Parent account", value: "Apex Group Holdings" },
  { label: "Status", value: "Active" },
  { label: "Owner", value: "Ana Petrovic" },
];

const BILLING_FIELDS = [
  { label: "Billing cycle", value: "Monthly" },
  { label: "Payment terms", value: "Net 30" },
  { label: "Invoice currency", value: "USD" },
  { label: "Invoice delivery", value: "Email" },
  { label: "Billing contact", value: "jordan.ellis@apexdigital.example" },
  { label: "Time zone", value: "US Mountain" },
];

const INVOICE_COLUMNS: TableColumn[] = [
  { key: "invoice", header: "Invoice" },
  { key: "date", header: "Date" },
  { key: "due", header: "Due" },
  { key: "amount", header: "Amount", numeric: true },
  { key: "status", header: "Status" },
];

const INVOICE_ROWS: TableRow[] = [
  { id: "r1", invoice: "INV-30211", date: "Aug 31, 2026", due: "Sep 30, 2026", amount: "$12,600.50", status: <Cell type="badge" label="Open" intent="info" /> },
  { id: "r2", invoice: "INV-29874", date: "Jul 31, 2026", due: "Aug 30, 2026", amount: "$11,470.00", status: <Cell type="badge" label="Overdue" intent="danger" /> },
  { id: "r3", invoice: "INV-29502", date: "Jun 30, 2026", due: "Jul 30, 2026", amount: "$11,470.00", status: <Cell type="badge" label="Paid" intent="success" /> },
];

export default function AccountRecordStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("accounts-account");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  const [tab, setTab] = useState("details");
  const [notice, setNotice] = useState(true);
  // The screen holds whether the top has scrolled away; the pattern only reports the crossing.
  const [compact, setCompact] = useState(false);

  const tabLabel = TABS.find((t) => t.id === tab)?.label ?? "Details";

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
      >
        <RecordPage
          label="Account"
          onStickyChange={setCompact}
          columns={2}
          header={
            <PageHeader
              breadcrumbs={[{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }]}
              title="Apex Digital Services"
              badge="Active"
              badgeIntent="success"
              sticky={compact}
              actions={
                <>
                  <Button size="sm">Clone</Button>
                  <Button size="sm" emphasis="strong" intent="brand">
                    Edit
                  </Button>
                </>
              }
            />
          }
          tabs={<Tabs label="What belongs to this account" items={TABS} value={tab} onChange={setTab} />}
          notice={
            notice ? (
              <Callout
                intent="warning"
                closeButton
                onDismiss={() => setNotice(false)}
                actionLabel="Review invoices"
                onAction={() => setTab("invoices")}
              >
                This account has 3 invoices past due, totalling $17,750.00.
              </Callout>
            ) : undefined
          }
          toolbar={
            <Toolbar
              label={`${tabLabel} actions`}
              onRefresh={() => {}}
              moreActions={[
                { id: "print", label: "Print", icon: "print" },
                { id: "export", label: "Export", icon: "download" },
              ]}
              onMoreSelect={() => {}}
              actions={<Button size="sm">Record payment</Button>}
            />
          }
          summary={<Scoreboard label="Account numbers" items={NUMBERS} />}
        >
          {tab === "details" ? (
            <>
              <Section title="Account information" collapsible>
                {ACCOUNT_FIELDS.map((f) => (
                  <FormDisplay key={f.label} label={f.label} value={f.value} />
                ))}
              </Section>
              <Section title="Billing information" collapsible>
                {BILLING_FIELDS.map((f) => (
                  <FormDisplay key={f.label} label={f.label} value={f.value} />
                ))}
              </Section>
              {/* A related list keeps the full width while the rows above sit in columns. */}
              <Section title="Recent invoices" actions={<Button size="sm" onClick={() => setTab("invoices")}>View all</Button>}>
                <Table columns={INVOICE_COLUMNS} rows={INVOICE_ROWS} />
              </Section>
            </>
          ) : (
            <Section title={tabLabel}>
              <EmptyState
                icon="folder_open"
                title={`${tabLabel} go here`}
                description="Each tab holds its own list or details. Fill this one in the same way as Details."
              />
            </Section>
          )}
        </RecordPage>
      </AppShell>
    </div>
  );
}
