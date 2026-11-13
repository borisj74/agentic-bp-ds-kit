import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Badge } from "@/ui/Badge/Badge";
import { Callout } from "@/ui/Callout/Callout";
import { Section } from "@/ui/Section/Section";
// The score's name and formula come from the one module that defines them, so this page never drifts from the CLI.
import { SCORE_FORMULA, SCORE_NAME } from "../../../../../scripts/review/score.mjs";

const SECTIONS = [
  { id: "what", label: `What ${SCORE_NAME} means` },
  { id: "formula", label: "The formula" },
  { id: "rules", label: "The rules" },
  { id: "local", label: "Run it yourself" },
  { id: "pr", label: "On a pull request" },
];

const RULES = [
  {
    rule: "bp/raw-value",
    severity: "error",
    says: "A colour, spacing, radius or shadow typed in by hand, where a token or a layout class belongs.",
    bad: '.card { padding: 13px; color: #1a73e8; }',
    good: '.card { padding: var(--space-small); color: var(--text-brand); }',
  },
  {
    rule: "bp/primitive-token",
    severity: "error",
    says: "A primitive ramp token (--ref-* or --ui-*) instead of the semantic role built on it.",
    bad: ".card { background: var(--ui-neutral-100); }",
    good: ".card { background: var(--bg-neutral-subtle); }",
  },
  {
    rule: "bp/local-cousin",
    severity: "error",
    says: "A piece built or borrowed next to the screen when the kit already has a contract for it.",
    bad: 'import { Dialog } from "./Dialog";',
    good: 'import { Modal } from "@/ui/Modal/Modal";',
  },
  {
    rule: "bp/closed-enum",
    severity: "error",
    says: "A prop value the contract does not list, or a Button look that is not an allowed pair.",
    bad: '<Button emphasis="strong" intent="neutral">Save</Button>',
    good: '<Button emphasis="strong" intent="brand">Save</Button>',
  },
  {
    rule: "bp/one-primary",
    severity: "error",
    says: "More than one strong brand Button in a view. One screen, one main action.",
    bad: '<Button emphasis="strong" intent="brand">Save</Button>\n<Button emphasis="strong" intent="brand">Send</Button>',
    good: '<Button emphasis="strong" intent="brand">Save</Button>\n<Button emphasis="minimal" intent="brand">Send</Button>',
  },
  {
    rule: "bp/use-pattern",
    severity: "warn",
    says: "The screen lays out by hand what a pattern already draws.",
    bad: "<AppShell>\n  <Toolbar />\n  <DataGrid />\n  <Pagination />\n</AppShell>",
    good: "<ListPage toolbar={...} columns={...} rows={...} />",
  },
  {
    rule: "bp/use-bigger-piece",
    severity: "warn",
    says: "Enough of a bigger piece's parts are in the file that the bigger piece is the one to use.",
    bad: "<Card>\n  <Avatar />\n  <Badge />\n  <Button />\n</Card>",
    good: "<MetricCard ... />",
  },
  {
    rule: "bp/screen-frame",
    severity: "warn",
    says: "A full screen with no AppShell and the whole side nav, breadcrumbs that do not start at Home, or a page grid of its own.",
    bad: '<div style={{ display: "grid" }}>rows</div>',
    good: '<AppShell nav={<AppNav items={APP_NAV} endItems={APP_NAV_END} />}>\n  <div className="layout-content">rows</div>\n</AppShell>',
  },
];

export default function Review() {
  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>Review</h1>
        <p className={shell.pageLead}>
          The kit reads a screen and says where it drifts from its own contracts. {SCORE_NAME} is that read as one
          number, so you can see at a glance how much of a screen comes from the kit.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="what">
            <Section title={`What ${SCORE_NAME} means`}>
              <div className={docs.prose}>
                <p>
                  {SCORE_NAME} is the share of a screen that is drawn with the kit, less what the review found wrong.
                  It counts every element that draws something on the page, then asks how many of those are kit
                  components or patterns. Every error takes five points off.
                </p>
                <ul>
                  <li><strong>100</strong> — every element comes from the kit and nothing is wrong.</li>
                  <li><strong>80 to 99</strong> — mostly the kit, with a few plain elements or a small mistake.</li>
                  <li><strong>Under 80</strong> — the screen is building its own UI beside the kit, or it has errors to fix.</li>
                </ul>
                <p>
                  A plain <code>&lt;div&gt;</code> or <code>&lt;span&gt;</code> counts against the share, because a
                  screen built from the kit needs very few of them. Layout classes from{" "}
                  <code>src/tokens/layout.css</code> are the exception the kit expects, so a screen never reaches 100
                  by accident, and 94 on a starter screen is a healthy number.
                </p>
                <Callout intent="info" closeButton title="The score never fails a pull request">
                  It is a report, not a gate. The errors under it are what to fix.
                </Callout>
              </div>
            </Section>
          </div>

          <div id="formula">
            <Section title="The formula">
              <div className={docs.prose}>
                <CodeBlock wrap code={SCORE_FORMULA} />
                <ul>
                  <li><strong>kit elements</strong> — elements whose tag is a component or pattern in <code>contracts/index.json</code>.</li>
                  <li><strong>all UI elements</strong> — every element that draws something: kit pieces, plain HTML tags and anything else the screen renders. Tags that draw nothing, like <code>&lt;title&gt;</code> or a fragment, are left out.</li>
                  <li><strong>errors</strong> — the review&apos;s errors. Warnings cost nothing.</li>
                  <li>A file with no elements at all, like a CSS module on its own, scores 100.</li>
                </ul>
                <p>The same numbers come back in <code>--json</code>, under <code>score</code>, so an agent reads what you read.</p>
              </div>
            </Section>
          </div>

          <div id="rules">
            <Section title="The rules">
              <div className={docs.prose}>
                <p>Errors cost five points each. Warnings point at a better piece to use.</p>
                {RULES.map((r) => (
                  <div key={r.rule} className={docs.prose}>
                    <p>
                      <code>{r.rule}</code>{" "}
                      <Badge intent={r.severity === "error" ? "danger" : "warning"}>{r.severity}</Badge>
                    </p>
                    <p>{r.says}</p>
                    <div className={docs.compare}>
                      <div className={docs.compareItem}>
                        <div><Badge intent="danger">Off the kit</Badge></div>
                        <CodeBlock wrap code={r.bad} />
                      </div>
                      <div className={docs.compareItem}>
                        <div><Badge intent="success">From the kit</Badge></div>
                        <CodeBlock wrap code={r.good} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div id="local">
            <Section title="Run it yourself">
              <div className={docs.prose}>
                <p>Point it at a file or a folder. Folders are walked for <code>.tsx</code> and <code>.css</code> files.</p>
                <CodeBlock code="npm run review -- --score src/app/invoices" />
                <p>Add <code>--json</code> for one object an agent can read, with the score, the counts and every finding.</p>
                <CodeBlock code="npm run review -- --score --json src/app/invoices" />
                <p>
                  The review is for screens, so the kit&apos;s own folders are skipped. <code>--all</code> includes
                  them. It exits 1 when there is any error, 0 otherwise. <code>npm run review -- --help</code> lists
                  the rules.
                </p>
              </div>
            </Section>
          </div>

          <div id="pr">
            <Section title="On a pull request">
              <div className={docs.prose}>
                <p>
                  <code>.github/workflows/kit-review.yml</code> runs the review on the <code>.tsx</code> and{" "}
                  <code>.css</code> files a pull request touches under <code>src/app</code>, <code>src/patterns</code>{" "}
                  and <code>starters</code>, and posts one comment with the score and the top ten findings. Every push
                  updates that same comment.
                </p>
                <p>
                  It only reports. The workflow never fails a pull request because of the score or the findings. To
                  turn it off, delete the workflow file.
                </p>
              </div>
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
