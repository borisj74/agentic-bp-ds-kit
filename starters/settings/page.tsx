"use client";
// Starter screen: a home made of tiles that each lead somewhere else. Sample tiles only.
// Change the tiles to the places your own home sends people. Each tile keeps its own intent, so the
// colors become part of how people find the same place again.
import { useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { SettingsPage } from "@/patterns/SettingsPage/SettingsPage";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Callout } from "@/ui/Callout/Callout";
import { NavTile, type NavTileIntent } from "@/ui/NavTile/NavTile";
import { PageHeader } from "@/ui/PageHeader/PageHeader";

const PLACES: { id: string; title: string; description: string; icon: string; intent: NavTileIntent }[] = [
  { id: "develop", title: "Develop", description: "Entities, workflows, functions, data presentations and APIs.", icon: "handyman", intent: "yellow" },
  { id: "connectors", title: "External connectors", description: "Application, data and tax connectors.", icon: "account_tree", intent: "olive" },
  { id: "security", title: "Security and users", description: "Roles, sharing groups, approvals and user management.", icon: "shield_person", intent: "red" },
  { id: "monitoring", title: "Monitoring and logs", description: "Process console, alerts, scheduled jobs and events.", icon: "monitor_heart", intent: "cyan" },
  { id: "system", title: "System", description: "Company setup, parameters, localization and email settings.", icon: "settings_applications", intent: "pink" },
  { id: "billing", title: "Billing", description: "Invoices, statements, templates and periods.", icon: "receipt_long", intent: "brand" },
  { id: "payments", title: "Payments", description: "Gateways, payment methods and retry rules.", icon: "credit_card", intent: "green" },
  { id: "revenue", title: "Financials and revenue", description: "Accounting periods, legal entities and revenue contracts.", icon: "paid", intent: "gray" },
];

export default function SettingsHomeStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("settings-settings-home");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [notice, setNotice] = useState(true);

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
        pageHeader={<PageHeader title="Settings" breadcrumbs={[{ label: "Home", href: "#" }]} />}
      >
        <SettingsPage
          label="Settings"
          intro={
            notice ? (
              <Callout
                intent="warning"
                closeButton
                onDismiss={() => setNotice(false)}
                actionLabel="Review users"
                onAction={() => {}}
              >
                Four users have not signed in for 90 days.
              </Callout>
            ) : undefined
          }
        >
          {PLACES.map((p) => (
            <NavTile
              key={p.id}
              title={p.title}
              description={p.description}
              icon={p.icon}
              intent={p.intent}
              onClick={() => {}}
            />
          ))}
        </SettingsPage>
      </AppShell>
    </div>
  );
}
