import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";
import { axeViolations } from "./axe";

// Every starter page, rendered the way the kit ships it: no React errors and no axe violations. A kit change
// that breaks a starter fails here.
import ListStarter from "../starters/list/page";
import RecordStarter from "../starters/record/page";
import FormStarter from "../starters/form/page";
import DashboardStarter from "../starters/dashboard/page";
import ListDetailStarter from "../starters/list-detail/page";
import SettingsStarter from "../starters/settings/page";
import GuidedProcessStarter from "../starters/guided-process/page";
import BlankStarter from "../starters/blank/page";

const STARTERS: [string, ComponentType][] = [
  ["list", ListStarter],
  ["record", RecordStarter],
  ["form", FormStarter],
  ["dashboard", DashboardStarter],
  ["list-detail", ListDetailStarter],
  ["settings", SettingsStarter],
  ["guided-process", GuidedProcessStarter],
  ["blank", BlankStarter],
];

let errors: string[] = [];
beforeEach(() => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(" ").slice(0, 300));
  });
});
afterEach(() => vi.restoreAllMocks());

describe.each(STARTERS)("the %s starter", (_id, Starter) => {
  it("renders with no React errors and no axe violations", async () => {
    const view = render(<Starter />);
    const problems = [
      ...errors.map((e) => `React: ${e}`),
      ...(await axeViolations()).map((v) => `axe ${v}`),
    ];
    view.unmount();
    cleanup();
    expect(problems.join("\n")).toBe("");
  });
});
