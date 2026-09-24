import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Badge } from "@/ui/Badge/Badge";
import { Section } from "@/ui/Section/Section";

const SECTIONS = [
  { id: "first", label: "Before you prompt" },
  { id: "start", label: "Start every screen the same way" },
  { id: "anatomy", label: "What a good prompt says" },
  { id: "examples", label: "Examples" },
  { id: "steps", label: "Work in small steps" },
  { id: "missing", label: "When a piece is missing" },
  { id: "check", label: "Check the result" },
  { id: "clean", label: "Keep the kit clean" },
  { id: "checklist", label: "Checklist" },
];

const EXAMPLES = [
  {
    title: "A list of records",
    weak: "Make an invoices page.",
    better:
      "/prototype-from-kit An Invoices list using ListPage inside AppShell.\nColumns: Invoice number (a link), Account, Status (Paid, Overdue, Draft as badges), Due date, Amount (right-aligned).\nToolbar: search, filters for Status and Due date, and one primary action, New invoice.\n20 sample rows, 10 per page. Show the empty state when the filters match nothing.\nIt must work on a phone.",
  },
  {
    title: "A form",
    weak: "Add a form to create a customer.",
    better:
      "/prototype-from-kit A New account page using FormPage.\nSections: Account (Name, required; Type: Customer or Partner; Parent account as a Lookup), Billing (Currency, Billing cycle, Payment terms), Address (two columns).\nSave is the one primary action; Cancel goes back to the account list.\nAfter saving, go to the account and show a success message.",
  },
  {
    title: "From a screenshot",
    weak: "Make it look like this screenshot.",
    better:
      "Here is a screenshot of our current account page. Rebuild it with RecordPage.\nKeep the tabs, the summary numbers and the account details.\nIgnore the old side menu and the colors; use the kit's.\nIf something in the screenshot has no kit component, stop and tell me which, before building.",
  },
];

export default function Prompting() {
  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>Prompting</h1>
        <p className={shell.pageLead}>
          The assistant builds exactly what you describe, from the kit. The clearer the screen in your head, the better
          the screen on the page.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="first">
            <Section title="Before you prompt">
              <div className={docs.prose}>
                <ul>
                  <li><strong>Know the screen.</strong> What is it for, who uses it, and what they do there? One sentence is enough.</li>
                  <li><strong>Find the pattern.</strong> Look through <strong>Using patterns</strong> and name the one that fits.</li>
                  <li><strong>Gather the content.</strong> Real column names, fields, actions and a few sample values make a big difference.</li>
                  <li><strong>For anything bigger than one screen, ask for a plan first.</strong> &ldquo;Advise first, before you change anything&rdquo; gets you a plan to agree on, not a surprise.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="start">
            <Section title="Start every screen the same way">
              <div className={docs.prose}>
                <p>
                  <code>/prototype-from-kit</code> is the kit&apos;s <strong>Prototype from kit</strong> skill: a short set of
                  instructions that comes with every copy of the kit, in <code>.claude/skills/prototype-from-kit</code>.
                  Typing it at the start of a message tells the assistant to build the screen the kit&apos;s way:
                </p>
                <ol>
                  <li>Look the screen up in the kit&apos;s index, <code>contracts/index.json</code>.</li>
                  <li>Read only the contracts for the pieces it needs.</li>
                  <li>Use a pattern when one fits the screen, instead of laying it out by hand.</li>
                  <li>Build only from kit components, with the options their contracts list.</li>
                  <li>Stop and ask when the kit is missing something, instead of inventing it.</li>
                </ol>
                <p>Begin with the skill, the pattern and one sentence about the screen:</p>
                <CodeBlock wrap code="/prototype-from-kit A Contracts list using ListPage inside AppShell, for finance managers who review renewals." />
              </div>
            </Section>
          </div>

          <div id="anatomy">
            <Section title="What a good prompt says">
              <div className={docs.prose}>
                <ol>
                  <li><strong>The screen and its pattern:</strong> &ldquo;a RecordPage for an account&rdquo;, not &ldquo;a page with details&rdquo;.</li>
                  <li><strong>The content:</strong> columns, fields, sections, tabs, and sample data.</li>
                  <li><strong>The actions:</strong> which buttons, which one is primary (only one), and what each one does.</li>
                  <li><strong>The states:</strong> empty, loading, error, success messages, validation.</li>
                  <li><strong>The widths that matter:</strong> &ldquo;must work on a phone&rdquo; or &ldquo;desktop only&rdquo;.</li>
                  <li><strong>What to leave out:</strong> parts of a screenshot to ignore, or features for later.</li>
                </ol>
              </div>
            </Section>
          </div>

          <div id="examples">
            <Section title="Examples">
              <div className={docs.prose}>
                {EXAMPLES.map((e) => (
                  <div key={e.title} className={docs.prose}>
                    <p className={docs.label}>{e.title}</p>
                    <div className={docs.compare}>
                      <div className={docs.compareItem}>
                        <div><Badge intent="warning">Too vague</Badge></div>
                        <CodeBlock wrap code={e.weak} />
                      </div>
                      <div className={docs.compareItem}>
                        <div><Badge intent="success">Clear</Badge></div>
                        <CodeBlock wrap code={e.better} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div id="steps">
            <Section title="Work in small steps">
              <div className={docs.prose}>
                <ul>
                  <li><strong>One screen at a time.</strong> Get it right, then move to the next one.</li>
                  <li><strong>One change per message</strong> once the screen exists: &ldquo;Add a Status filter to the toolbar&rdquo;.</li>
                  <li><strong>Point at the thing.</strong> Select the element on the page, or name the component and where it sits.</li>
                  <li><strong>Say what is wrong and what you want instead,</strong> not only &ldquo;fix it&rdquo;.</li>
                  <li><strong>Save good states.</strong> Ask the assistant to commit when a screen looks right, so you can always go back.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="missing">
            <Section title="When a piece is missing">
              <div className={docs.prose}>
                <p>
                  The kit tells the assistant to stop and ask when a screen needs something it does not have. That is on
                  purpose: it keeps every prototype built from the same parts. You have two good answers:
                </p>
                <ul>
                  <li><strong>Add it to the kit:</strong> &ldquo;Add a Rating component to the kit: contract first, then the component, then its catalog page.&rdquo;</li>
                  <li><strong>Change the screen:</strong> &ldquo;Use a Select with 1 to 5 instead.&rdquo;</li>
                </ul>
                <Alert intent="warning">Avoid &ldquo;just build something quick for this screen&rdquo;. One-off parts drift from the kit and break the next time things change.</Alert>
              </div>
            </Section>
          </div>

          <div id="check">
            <Section title="Check the result">
              <div className={docs.prose}>
                <ul>
                  <li><strong>Ask the assistant to check it in the browser</strong> and show you a screenshot before you review.</li>
                  <li><strong>Try it at phone and tablet widths,</strong> and in dark mode from the top bar.</li>
                  <li><strong>Click through it:</strong> menus open, dialogs close with Escape, forms show errors, buttons do what they say.</li>
                  <li><strong>Ask for a review</strong> when a screen is done: &ldquo;Review this screen against the kit rules. Report only.&rdquo;</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="clean">
            <Section title="Keep the kit clean">
              <div className={docs.prose}>
                <ul>
                  <li>Ask for kit components by name, and use only the options their contracts list.</li>
                  <li>One primary button per view.</li>
                  <li>No colors or spacing typed in by hand: the kit&apos;s tokens and layout classes cover them.</li>
                  <li>Describe goals, not other products: &ldquo;a dense table for power users&rdquo;, not &ldquo;make it like product X&rdquo;.</li>
                  <li>Keep secrets out of prompts: no passwords, keys or real customer data.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="checklist">
            <Section title="Checklist">
              <div className={docs.prose}>
                <ul>
                  <li>Started with <code>/prototype-from-kit</code> and named a pattern.</li>
                  <li>Gave real content: columns, fields, actions, sample data.</li>
                  <li>Said which button is primary, and which states to show.</li>
                  <li>Said which widths matter.</li>
                  <li>Asked for a plan first on anything bigger than one screen.</li>
                  <li>Checked it in the browser at every width before calling it done.</li>
                </ul>
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
