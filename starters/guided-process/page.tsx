"use client";
// Starter screen: a process walked one page per step. Sample fields only; nothing is saved.
// Change the steps and the fields of each step to whatever your process asks for. The screen owns
// whether it has started, which step is on, and whether the steps drawer is open.
import { useId, useState, type ReactNode } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { GuidedProcessPage } from "@/patterns/GuidedProcessPage/GuidedProcessPage";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Callout } from "@/ui/Callout/Callout";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Form } from "@/ui/Form/Form";
import {
  GuidedProcess,
  type GuidedProcessAction,
  type GuidedProcessShade,
  type GuidedProcessStatus,
  type GuidedProcessStep,
} from "@/ui/GuidedProcess/GuidedProcess";
import { Input } from "@/ui/Input/Input";
import { Select } from "@/ui/Select/Select";

const STEPS = [
  { title: "Choose the file", tasks: ["Pick where it comes from", "Upload the file", "Pick the month"] },
  { title: "Map the columns", tasks: ["Account column", "Quantity column", "Date column"] },
  { title: "Check the rows", tasks: ["Look over the preview", "Decide on rows with errors"] },
  { title: "Import", tasks: ["Name the batch", "Submit"] },
];

const SOURCES = [
  { value: "file", label: "A file from my computer" },
  { value: "sftp", label: "The nightly SFTP drop" },
];
const MONTHS = [
  { value: "2026-10", label: "October 2026" },
  { value: "2026-11", label: "November 2026" },
];
const COLUMNS = [
  { value: "a", label: "Column A" },
  { value: "b", label: "Column B" },
  { value: "c", label: "Column C" },
  { value: "d", label: "Column D" },
];

export default function ImportUsageStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("mediation-usage-reload");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  const [started, setStarted] = useState(false);
  const [at, setAt] = useState(1);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [updated, setUpdated] = useState("Not saved yet");
  // The Submit on the last step sits in the footer and sends the step's form by id.
  const formId = useId();
  const last = STEPS.length;

  const reset = () => {
    setStarted(false);
    setAt(1);
    setSkipped([]);
    setDone(false);
    setStepsOpen(false);
  };

  const steps = STEPS.map((s, i): GuidedProcessStep => {
    const n = i + 1;
    const past = done || n < at;
    const status: GuidedProcessStatus | undefined = past ? (skipped.includes(n) ? "warning" : "success") : undefined;
    return {
      title: s.title,
      status,
      statusText: status === "warning" ? "Skipped" : undefined,
      tasks: s.tasks.map((label, j) => ({ label, done: past || (n === at && started && j === 0) })),
    };
  });

  const fields: Record<number, ReactNode> = {
    1: (
      <>
        <Select label="Where it comes from" name="source" options={SOURCES} defaultValue="file" />
        <Select label="Month" name="month" options={MONTHS} defaultValue="2026-11" />
        <Input label="Usage file" name="file" type="file" />
      </>
    ),
    2: (
      <>
        <Select label="Account column" name="account" options={COLUMNS} defaultValue="a" />
        <Select label="Quantity column" name="quantity" options={COLUMNS} defaultValue="c" />
        <Select label="Date column" name="date" options={COLUMNS} defaultValue="d" />
      </>
    ),
    3: (
      <>
        <Input label="Rows to preview" name="preview" type="number" defaultValue="25" />
        <Checkbox label="Skip rows with errors" name="skipErrors" defaultChecked />
      </>
    ),
    4: (
      <>
        <Input label="Batch name" name="batch" placeholder="Enter a value" required />
        <Checkbox label="Email me when it finishes" name="email" defaultChecked />
      </>
    ),
  };

  const actions: GuidedProcessAction[] = done
    ? []
    : [
        { id: "cancel", label: "Cancel", icon: "close" },
        { id: "save", label: "Save", icon: "save" },
        ...(at < last
          ? [
              { id: "skip", label: "Skip", icon: "skip_next" },
              { id: "continue", label: "Continue" },
            ]
          : [
              {
                id: "submit",
                label: "Submit",
                emphasis: "strong" as const,
                intent: "brand" as const,
                type: "submit" as const,
                form: formId,
              },
            ]),
      ];

  const onAction = (id: string) => {
    if (id === "cancel") reset();
    if (id === "save") setUpdated("Saved a moment ago");
    if (id === "skip") {
      setSkipped((s) => [...s, at]);
      setAt(at + 1);
    }
    if (id === "continue") setAt(at + 1);
  };

  // Before Start: one column per step, darker along the way; the first carries the name, Start and Cancel.
  const intro = steps.map((s, i) => (
    <GuidedProcess
      key={s.title}
      steps={steps}
      current={i + 1}
      started={false}
      shade={((i % 5) + 1) as GuidedProcessShade}
      title={i === 0 ? "Import usage" : undefined}
      subtitle={i === 0 ? "Bring a month of metered usage in from a file." : undefined}
      onStart={i === 0 ? () => setStarted(true) : undefined}
      onCancel={i === 0 ? reset : undefined}
    />
  ));

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
        <GuidedProcessPage
          view={started ? "step" : "intro"}
          intro={intro}
          side="end"
          label={STEPS[at - 1].title}
          stepsOpen={stepsOpen}
          onStepsClose={() => setStepsOpen(false)}
          header={
            <GuidedProcess
              part="header"
              title="Import usage"
              stepTitle={STEPS[at - 1].title}
              current={at}
              total={last}
              onStepsOpen={() => setStepsOpen(true)}
            />
          }
          steps={
            <GuidedProcess
              part="steps"
              steps={steps}
              current={at}
              side="end"
              onClose={() => setStepsOpen(false)}
            />
          }
          footer={<GuidedProcess part="footer" updated={updated} actions={actions} onAction={onAction} />}
        >
          {done ? (
            <Callout intent="success" actionLabel="Import another" onAction={reset}>
              Imported the November 2026 usage.
            </Callout>
          ) : (
            <Form key={at} id={formId} columns={2} onSubmit={() => setDone(true)}>
              {fields[at]}
            </Form>
          )}
        </GuidedProcessPage>
      </AppShell>
    </div>
  );
}
