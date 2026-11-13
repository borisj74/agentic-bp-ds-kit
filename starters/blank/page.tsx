"use client";
// Starter screen: the frame and a page title, with the page itself still empty.
// Start here when none of the other starters fits. Put your content where the EmptyState is, and pick a
// pattern from @/patterns when the screen takes shape: ListPage, RecordPage, FormPage, Dashboard,
// ListDetail, SettingsPage or GuidedProcessPage.
import { useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Section } from "@/ui/Section/Section";

export default function BlankStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("home");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

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
        pageHeader={<PageHeader title="New screen" breadcrumbs={[{ label: "Home", href: "#" }]} />}
      >
        <Section title="Your content">
          <EmptyState
            icon="draft"
            title="Nothing here yet"
            description="Replace this with your screen. Ask your assistant for the screen you want in your own words, and it will pick a pattern from the kit and fill it in."
          />
        </Section>
      </AppShell>
    </div>
  );
}
