import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { components, foundationPages, patterns } from "@/playground/nav";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { LinkList } from "@/ui/LinkList/LinkList";
import { Section } from "@/ui/Section/Section";
import { Tile } from "@/ui/Tile/Tile";

const SECTIONS = [
  { id: "what-it-is", label: "What it is" },
  { id: "what-it-is-not", label: "What it isn't" },
  { id: "what-to-expect", label: "What to expect" },
  { id: "whats-inside", label: "What's inside" },
  { id: "next", label: "Where to next" },
];

// Counts come from contracts/index.json and the sidebar's foundation list, so they never go stale.
export default function Overview() {
  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>Agentic BP DS</h1>
        <p className={shell.pageLead}>
          A code-first design system for prototyping product screens with an AI assistant. Describe a screen, and the
          assistant builds it from the kit&apos;s own components and patterns.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="what-it-is">
            <Section title="What it is">
              <div className={docs.prose}>
                <p>
                  A ready-made kit for building realistic, clickable screens quickly. Everything lives in code: there is
                  no separate design file to keep in step.
                </p>
                <ul>
                  <li><strong>Foundations:</strong> color, type, spacing, icons, radius, shadow and motion, as tokens.</li>
                  <li><strong>Components:</strong> buttons, fields, tables, menus, dialogs, charts and more, each in one folder.</li>
                  <li><strong>Patterns:</strong> whole-screen blueprints, like a list page or a record page, built from the components.</li>
                  <li><strong>Contracts:</strong> one file per piece that says what it is for, its options and what not to do. The assistant reads these before it builds.</li>
                  <li><strong>Rules for the assistant:</strong> <code>CLAUDE.md</code> and the <code>/prototype-from-kit</code> skill keep every screen consistent.</li>
                  <li><strong>This catalog:</strong> every piece, live, with its options and code to copy.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="what-it-is-not">
            <Section title="What it isn't">
              <div className={docs.prose}>
                <ul>
                  <li><strong>Not a production library.</strong> It is for prototypes, tests and conversations, not for shipping.</li>
                  <li><strong>Not connected to real data.</strong> Screens use sample data. Buttons only do something when the prototype wires them up.</li>
                  <li><strong>Not a design tool file.</strong> The code is the source of truth.</li>
                  <li><strong>Not a place for one-off parts.</strong> When a screen needs something the kit does not have, it gets added to the kit properly, or the screen changes.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="what-to-expect">
            <Section title="What to expect">
              <div className={docs.prose}>
                <ul>
                  <li><strong>Realistic screens in minutes,</strong> with real tables, forms, menus and dialogs you can click through.</li>
                  <li><strong>Consistency without effort:</strong> spacing, color, type and behavior come from the kit, so screens match each other.</li>
                  <li><strong>Desktop, tablet and phone:</strong> components and patterns adapt to the space they have.</li>
                  <li><strong>Light and dark themes,</strong> switched from the top bar.</li>
                  <li><strong>Keyboard and screen reader basics</strong> built into the components: labels, focus and keys.</li>
                  <li><strong>An assistant that stops and asks</strong> when a piece is missing, instead of inventing one.</li>
                </ul>
                <Alert intent="info" title="Your copy is a snapshot">
                  A prototype starts as a copy of the kit on the day you create it. Later kit changes do not reach it on
                  their own. Start a new prototype to get them.
                </Alert>
              </div>
            </Section>
          </div>

          <div id="whats-inside">
            <Section title="What's inside">
              <div className="layout-metrics">
                <Tile
                  title={`${foundationPages.length} foundation pages`} icon="palette" intent="purple" href="/foundations"
                  description={foundationPages.map((f) => f.label).join(", ")}
                />
                <Tile
                  title={`${components.length} components`} icon="widgets" intent="cyan" href="/components"
                  description="The building blocks: controls, fields, data, navigation, feedback and charts."
                />
                <Tile
                  title={`${patterns.length} patterns`} icon="dashboard" intent="green" href="/patterns"
                  description={patterns.map((p) => p.name).join(", ")}
                />
              </div>
            </Section>
          </div>

          <div id="next">
            <Section title="Where to next">
              <LinkList
                label="Start pages"
                items={[
                  { id: "install", label: "Installation", href: "/start/installation", icon: "download", description: "Get the kit running on your computer." },
                  { id: "patterns", label: "Using patterns", href: "/start/patterns", icon: "dashboard", description: "Pick the right blueprint for a screen and fill it in." },
                  { id: "prompting", label: "Prompting", href: "/start/prompting", icon: "chat", description: "How to ask the assistant for screens that come out right." },
                ]}
              />
            </Section>
          </div>
        </div>
        <div className={docs.rail}>
          <AnchorNav items={SECTIONS} spy offset={72} label="On this page" />
        </div>
      </div>
    </>
  );
}
