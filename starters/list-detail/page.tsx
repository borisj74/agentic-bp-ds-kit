"use client";
// Starter screen: a list with the picked record open beside it. Sample data only; nothing is saved.
// Change the list items and the detail rows to whatever your records hold.
import { useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { ListDetail } from "@/patterns/ListDetail/ListDetail";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Badge } from "@/ui/Badge/Badge";
import { Button } from "@/ui/Button/Button";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { ListView, type ListViewItem } from "@/ui/ListView/ListView";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Section } from "@/ui/Section/Section";

type Invoice = ListViewItem & {
  account: string;
  amount: string;
  period: string;
  due: string;
  status: string;
};

const INVOICES: Invoice[] = [
  { id: "INV-1042", primary: "INV-1042", secondary: "Apex Digital Services · $4,820.00", badge: "Overdue", badgeIntent: "danger", account: "Apex Digital Services", amount: "$4,820.00", period: "October 2026", due: "Nov 1, 2026", status: "Overdue" },
  { id: "INV-1043", primary: "INV-1043", secondary: "Northwind Traders · $1,260.00", badge: "Paid", badgeIntent: "success", account: "Northwind Traders", amount: "$1,260.00", period: "October 2026", due: "Nov 15, 2026", status: "Paid" },
  { id: "INV-1044", primary: "INV-1044", secondary: "Globex Corporation · $980.00", badge: "Draft", account: "Globex Corporation", amount: "$980.00", period: "November 2026", due: "Dec 1, 2026", status: "Draft" },
  { id: "INV-1045", primary: "INV-1045", secondary: "Initech Group · $2,150.00", badge: "Sent", badgeIntent: "info", account: "Initech Group", amount: "$2,150.00", period: "November 2026", due: "Dec 5, 2026", status: "Sent" },
  { id: "INV-1046", primary: "INV-1046", secondary: "Umbrella Health · $3,400.00", badge: "Sent", badgeIntent: "info", account: "Umbrella Health", amount: "$3,400.00", period: "November 2026", due: "Dec 12, 2026", status: "Sent" },
];

export default function InvoiceQueueStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("billing-invoices");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  // The screen keeps which record is open; the pattern only places it.
  const [openId, setOpenId] = useState<string | null>("INV-1042");
  const invoice = INVOICES.find((i) => i.id === openId);

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
        pageHeader={
          <PageHeader
            title="Invoices"
            icon="receipt_long"
            breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]}
          />
        }
      >
        <ListDetail
          label="Invoices"
          layout="side"
          open={Boolean(invoice)}
          onBack={() => setOpenId(null)}
          backLabel="Back to invoices"
          title={invoice?.primary}
          actions={
            invoice && (
              <Button size="sm" emphasis="strong" intent="brand" iconStart="send">
                Send
              </Button>
            )
          }
          list={
            <ListView
              label="Invoices"
              items={INVOICES}
              selection="single"
              interaction="drill"
              selected={openId ? [openId] : []}
              onOpen={setOpenId}
            />
          }
          empty={<EmptyState icon="receipt_long" title="Pick an invoice" description="Its details show here." />}
          detail={
            invoice && (
              <Section title="Invoice details">
                {/* The rows stack flush in one plain box, so the label column reads as one fill. */}
                <div>
                  <FormDisplay label="Account" value={invoice.account} labelPosition="start" />
                  <FormDisplay label="Amount" value={invoice.amount} labelPosition="start" />
                  <FormDisplay label="Billing period" value={invoice.period} labelPosition="start" />
                  <FormDisplay label="Due date" value={invoice.due} labelPosition="start" />
                  <FormDisplay
                    label="Status"
                    value={<Badge intent={invoice.badgeIntent ?? "neutral"}>{invoice.status}</Badge>}
                    labelPosition="start"
                  />
                </div>
              </Section>
            )
          }
        />
      </AppShell>
    </div>
  );
}
