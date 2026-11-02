"use client";
import { useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { AlertDialog } from "@/ui/AlertDialog/AlertDialog";
import { AppHeader } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Button } from "@/ui/Button/Button";
import { Callout } from "@/ui/Callout/Callout";
import { Cell } from "@/ui/Cell/Cell";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Table } from "@/ui/Table/Table";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import { RESULT_INTENT, resultLabel, type Intent } from "../anomaly-detection/data";
import { blockText, recordOf } from "../anomaly-detection-nodes/graph";
import { isChoosing, resultOf, type RuleRecord } from "./tree";

// Where a rule stands, in a word. How far a run has got belongs on the rule's own page, as a progress bar.
function statusOf(r: RuleRecord): { label: string; intent: Intent } {
  switch (r.stage) {
    case "build": return r.live ? { label: "Active", intent: "success" } : { label: "Draft", intent: "neutral" };
    case "training": return { label: "Training", intent: "info" };
    case "results": return resultOf(r.rule).kind === "poor" ? { label: "Needs changes", intent: "warning" } : { label: "Results ready", intent: "info" };
    case "applying": return { label: "Applying", intent: "info" };
    case "ready": return { label: "Ready to turn on", intent: "info" };
    case "on": return r.paused ? { label: "Paused", intent: "neutral" } : { label: "Active", intent: "success" };
  }
}

export function RulesList({ records, onOpen, onCreate, onCopy, onDelete }: {
  records: RuleRecord[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const shown = records.filter((r) => !q || r.rule.name.toLowerCase().includes(q));
  const doomed = records.find((r) => r.id === deleting);
  return (
    <div style={{ height: "100dvh" }}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)} environment="DEV" searchShortcut="Ctrl+K"
            user={{ name: "Sayra Bunch" }} company={{ name: "CCC" }}
          />
        }
        nav={<AppNav items={APP_NAV} endItems={APP_NAV_END} current="settings-ai-settings" expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        pageHeader={
          <PageHeader
            title="Anomaly detection"
            breadcrumbs={[{ label: "Home", href: "#" }, { label: "Settings", href: "#" }]}
            actions={<Button size="sm" emphasis="strong" intent="brand" iconStart="add" onClick={onCreate}>New rule</Button>}
          />
        }
      >
        <Callout closeButton intent="info" title="Anomaly detection finds unusual records">
          Each rule learns what normal looks like for one kind of record, then flags the ones that don&apos;t fit.
        </Callout>
        <ListPage
          label="Anomaly detection rules"
          state={shown.length === 0 ? "empty" : "ready"}
          toolbar={<Toolbar label="Rules" searchPlaceholder="Search rules" searchValue={query} onSearchChange={setQuery} />}
          empty={<EmptyState headingLevel={2} icon="search_off" title="No rules found" description="Try a different name, or start a new rule." />}
        >
          <Table
            rowLabel="id"
            columns={[
              { key: "name", header: "Name", emphasis: true },
              { key: "checks", header: "What it checks" },
              { key: "status", header: "Status" },
              { key: "result", header: "Result" },
              { key: "trained", header: "Last trained" },
              { key: "actions", header: "", alignment: "end" },
            ]}
            rows={shown.map((r) => {
              const status = statusOf(r);
              return {
                id: r.id,
                name: <Cell type="link" label={r.rule.name || "Untitled rule"} onClick={() => onOpen(r.id)} />,
                checks: isChoosing(r.rule) ? "Not picked yet" : `${recordOf(r.rule.start.record).label} · ${blockText(r.rule.start)}`,
                status: <Cell type="badge" label={status.label} intent={status.intent} />,
                result: r.result ? <Cell type="badge" label={resultLabel(r.result)} intent={RESULT_INTENT[r.result.kind]} /> : "Not trained yet",
                trained: r.trained,
                actions: (
                  <Cell
                    type="actionMenu" label="Rule actions" alignment="end"
                    actions={[
                      { label: "Open", icon: "edit", onClick: () => onOpen(r.id) },
                      { label: "Copy", icon: "content_copy", onClick: () => onCopy(r.id) },
                      { label: "Delete", icon: "delete", emphasis: "strong", intent: "danger", onClick: () => setDeleting(r.id) },
                    ]}
                  />
                ),
              };
            })}
          />
        </ListPage>
      </AppShell>

      <AlertDialog
        open={Boolean(doomed)} title={`Delete ${doomed?.rule.name || "this rule"}?`} description="This can't be undone."
        cancelLabel="Keep rule" actionLabel="Delete rule" actionIntent="danger"
        onCancel={() => setDeleting(null)} onAction={() => { if (deleting) onDelete(deleting); setDeleting(null); }}
      />
    </div>
  );
}
