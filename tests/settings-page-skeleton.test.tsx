import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsPage } from "@/patterns/SettingsPage/SettingsPage";
import { Callout } from "@/ui/Callout/Callout";
import { NavTile, type NavTileIntent } from "@/ui/NavTile/NavTile";
import { axeViolations } from "./axe";

// A booting SettingsPage draws its own tiles: one tile-shaped skeleton per place it was given, each with a bar
// where its name will be, a line where its description will be and a block where its square is. loadingShape
// rows keeps the old fixed grid for a home with nothing to follow yet.

const PLACES: { id: string; title: string; description: string; icon: string; intent: NavTileIntent }[] = [
  { id: "develop", title: "Develop", description: "Includes entities, workflows, functions, data presentations, OAuth, and APIs.", icon: "handyman", intent: "yellow" },
  { id: "connectors", title: "External Connectors", description: "Includes application, data and tax connectors.", icon: "account_tree", intent: "olive" },
  { id: "security", title: "Security & Users", description: "Includes roles, sharing groups, approvals, authentication, and user management.", icon: "shield_person", intent: "red" },
  { id: "monitoring", title: "Monitoring & Logs", description: "Includes process console, alerts, scheduled jobs, logs, events and recycle bin.", icon: "monitor_heart", intent: "cyan" },
  { id: "system", title: "System", description: "Includes company setup, system parameters, reference, localization, and email settings.", icon: "settings_applications", intent: "pink" },
  { id: "ai", title: "AI Settings", description: "Includes assistants, prompts and the data they are allowed to read.", icon: "auto_awesome", intent: "purple" },
  { id: "billing", title: "Billing", description: "Includes invoices, statements, templates, periods and tiered pricing.", icon: "receipt_long", intent: "brand" },
  { id: "payments", title: "Payments", description: "Includes gateways, payment methods and retry rules.", icon: "credit_card", intent: "green" },
  { id: "financials", title: "Financials & Revenue", description: "Includes accounting periods, legal entities and revenue contracts.", icon: "paid", intent: "gray" },
  { id: "collections", title: "Collections", description: "Includes collection modules and dunning templates.", icon: "account_balance", intent: "orange" },
];

const bars = (root: ParentNode = document) => root.querySelectorAll('[aria-busy="true"]');
const byClass = (name: string, root: ParentNode = document) => root.querySelectorAll(`[class~="${name}"]`);
// The tile boxes in the grid: a booting NavTile draws a plain div where its link will be, while the rows
// fallback's blocks are the Skeleton's own spans.
const tiles = () => byClass("grid")[0].querySelectorAll(":scope > div");
// Nothing a keyboard can reach: while the home is bars, every real control is behind inert.
const reachable = () => document.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");

const home = (props: Partial<Parameters<typeof SettingsPage>[0]> = {}, places = PLACES) =>
  render(
    <SettingsPage label="Settings" loading {...props}>
      {places.map((s) => (
        <NavTile key={s.id} title={s.title} description={s.description} icon={s.icon} intent={s.intent} href={`#${s.id}`} />
      ))}
    </SettingsPage>,
  );

describe("a booting SettingsPage follows the real tiles", () => {
  it("draws one tile skeleton per place, not a fixed six", () => {
    home();
    expect(tiles()).toHaveLength(PLACES.length);
    // Each tile: the title bar, the description line and the icon block.
    for (const tile of tiles()) expect(bars(tile)).toHaveLength(3);
    // No real tile text with them: the tiles are bars, in the grid's own places.
    expect(screen.queryByText("Develop")).not.toBeInTheDocument();
  });

  it("leaves out the parts a tile does not carry", () => {
    home({}, [{ ...PLACES[0], description: "", icon: "" }]);
    // No description and no square: the name's bar alone.
    expect(bars(tiles()[0])).toHaveLength(1);
  });

  it("steps the title bar to the length of the name", () => {
    const short = home({}, [PLACES[6]]);
    expect(bars(tiles()[0])[0]).toHaveStyle({ width: "var(--skeleton-bar-sm)" });
    short.unmount();
    home({}, [PLACES[2]]);
    expect(bars(tiles()[0])[0]).toHaveStyle({ width: "var(--skeleton-bar-md)" });
  });

  it("keeps the tiles out of reach and out of the reading order", () => {
    home();
    expect(reachable()).toHaveLength(0);
    expect(document.querySelectorAll("[inert]").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Billing/ })).not.toBeInTheDocument();
  });

  it("says what is loading once, however many tiles it draws", () => {
    home();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading Settings");
  });

  it("holds the intro's own height, and leaves no hole without one", () => {
    const plain = home();
    expect(byClass("introBoot")).toHaveLength(0);
    expect(byClass("intro")).toHaveLength(0);
    plain.unmount();
    home({ intro: <Callout intent="warning">Four users have not signed in for 90 days.</Callout> });
    // The real notice is in the tree, out of sight, with one block over it.
    const boot = byClass("introBoot")[0];
    expect(boot).toBeInTheDocument();
    expect(byClass("introGhost", boot)).toHaveLength(1);
    expect(bars(boot)).toHaveLength(1);
    expect(byClass("introGhost", boot)[0].querySelector("[class~='alert']")).toBeInTheDocument();
  });

  it("has nothing for axe to report", async () => {
    const { container } = home();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("the rows fallback", () => {
  it("draws loadingTiles plain blocks instead of the tiles", () => {
    const six = home({ loadingShape: "rows" });
    expect(tiles()).toHaveLength(0);
    expect(bars(byClass("grid")[0])).toHaveLength(6);
    six.unmount();
    home({ loadingShape: "rows", loadingTiles: 3 });
    expect(bars(byClass("grid")[0])).toHaveLength(3);
  });
});

describe("the ready settings home", () => {
  it("draws the real tiles, each one a link", () => {
    home({ loading: false });
    expect(bars()).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(PLACES.length);
    expect(screen.getByRole("link", { name: /Security & Users/ })).toHaveAttribute("href", "#security");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
