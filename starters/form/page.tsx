"use client";
// Starter screen: a form that creates one record. Sample data only; nothing is saved.
// Change the groups and the fields to whatever your record needs. One Form holds every group, so the
// save at the top submits the whole page.
import { useId, useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { FormPage } from "@/patterns/FormPage/FormPage";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Button } from "@/ui/Button/Button";
import { Callout } from "@/ui/Callout/Callout";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { DatePicker } from "@/ui/DatePicker/DatePicker";
import { Form, type FormSection } from "@/ui/Form/Form";
import { Input } from "@/ui/Input/Input";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Select } from "@/ui/Select/Select";

const ACCOUNT_TYPES = [
  { value: "customer", label: "Customer" },
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
];
const CURRENCIES = [
  { value: "usd", label: "US Dollar" },
  { value: "eur", label: "Euro" },
  { value: "gbp", label: "British Pound" },
];
const CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];
const TERMS = [
  { value: "net15", label: "Net 15" },
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
];
const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "de", label: "Germany" },
  { value: "rs", label: "Serbia" },
];

export default function CreateAccountStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("accounts-account");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  const [notice, setNotice] = useState(true);
  const [saved, setSaved] = useState("");
  // The screen holds whether the top has scrolled away; the pattern only reports the crossing.
  const [compact, setCompact] = useState(false);
  // One form for the whole page, so the save in the page header submits every group at once.
  const formId = useId();

  const sections: FormSection[] = [
    {
      title: "Account information",
      help: "What the account is and who it belongs to. The name is the only field that has to be filled in.",
      collapsible: true,
      content: (
        <>
          <Input label="Account name" name="name" placeholder="Enter a value" required />
          <Select label="Account type" name="type" options={ACCOUNT_TYPES} defaultValue="customer" />
          <Input label="Account number" name="number" placeholder="Enter a value" />
          <Select label="Invoice currency" name="currency" options={CURRENCIES} defaultValue="usd" />
        </>
      ),
    },
    {
      title: "Billing profile",
      help: "How and when this account is invoiced. These are the defaults every new invoice starts from.",
      collapsible: true,
      content: (
        <>
          <Select label="Billing cycle" name="cycle" options={CYCLES} defaultValue="monthly" />
          <Select label="Payment terms" name="terms" options={TERMS} defaultValue="net30" />
          <DatePicker label="First invoice date" name="firstInvoice" defaultValue="2026-12-01" />
          <Checkbox label="Deliver invoices by email" name="deliverEmail" defaultChecked />
          <Checkbox label="Approve invoices before delivery" name="approve" />
        </>
      ),
    },
    {
      title: "Billing contact",
      help: "Who the invoices go to. Left empty, the account's own contact is used.",
      collapsible: true,
      defaultExpanded: false,
      content: (
        <>
          <Input label="Contact name" name="contactName" placeholder="Enter a value" />
          <Input label="Billing email" name="contactEmail" type="email" placeholder="billing@example.com" />
          <Input label="Phone" name="contactPhone" placeholder="Enter a value" />
          <Select label="Country" name="contactCountry" options={COUNTRIES} defaultValue="us" />
        </>
      ),
    },
  ];

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
        <FormPage
          label="Create account"
          onStickyChange={setCompact}
          columns={2}
          header={
            <PageHeader
              breadcrumbs={[{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }]}
              title="Create account"
              sticky={compact}
              actions={
                <>
                  <Button size="sm" onClick={() => setSaved("")}>
                    Cancel
                  </Button>
                  {/* The save sits outside the form and submits it by id, so one press saves every group. */}
                  <Button size="sm" emphasis="strong" intent="brand" type="submit" form={formId}>
                    Create
                  </Button>
                </>
              }
            />
          }
          notice={
            notice ? (
              <Callout intent="info" closeButton onDismiss={() => setNotice(false)}>
                Fill in the account and its billing defaults. You can change any of this later on the account itself.
              </Callout>
            ) : undefined
          }
        >
          <Form
            id={formId}
            labelPosition="start"
            sections={sections}
            onSubmit={(data) => {
              const name = String(data.get("name") || "").trim();
              setSaved(name ? `Created ${name}.` : "Created the account.");
            }}
          />
          {saved && <Callout intent="success">{saved}</Callout>}
        </FormPage>
      </AppShell>
    </div>
  );
}
