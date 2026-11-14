import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { slug, starters } from "@/playground/nav";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Callout } from "@/ui/Callout/Callout";
import { LinkList } from "@/ui/LinkList/LinkList";
import { Section } from "@/ui/Section/Section";

const SECTIONS = [
  { id: "what", label: "What this is" },
  { id: "steps", label: "Three steps" },
  { id: "prompts", label: "Example prompts" },
  { id: "words", label: "Words we use" },
  { id: "engineer", label: "When to ask an engineer" },
];

const PROMPTS = [
  "Change this list to show payments instead of invoices. Keep the same columns, but swap Due date for Paid on.",
  "Add a filter for the account owner next to the status filter, and a column that shows who owns the account.",
  "Turn the summary at the top into four numbers: total billed, total paid, overdue, and how many accounts are overdue.",
];

const WORDS = [
  { word: "Page", said: "A whole screen with real-looking content. It is what a starter gives you, and what you build." },
  { word: "Template", said: "A screen layout with empty slots that you fill in. The kit's patterns are the templates." },
  { word: "Organism", said: "A whole part of a screen, like a table or a page header." },
  { word: "Molecule", said: "A small group of controls that works as one, like a date picker." },
  { word: "Atom", said: "One control on its own, like a button." },
];

export default function StartHere() {
  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>Start here</h1>
        <p className={shell.pageLead}>
          For anyone who wants to show an idea as a working screen. You do not need to write code, and you do not
          need to read the rest of this catalog first.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="what">
            <Section title="What this is">
              <div className={docs.prose}>
                <p>
                  This kit is a set of ready-made screen parts for our product, plus the rules that keep them looking
                  like one product. You start from a screen that already works, then ask an AI assistant to change it
                  in your own words.
                </p>
                <p>
                  You will see the word <strong>contract</strong> around here. A contract is one file per part that
                  says what the part is for, which options it has and what not to do with it. The assistant reads
                  those files, which is why its screens come out looking right.
                </p>
              </div>
            </Section>
          </div>

          <div id="steps">
            <Section title="Three steps">
              <div className={docs.prose}>
                <h3>1. Pick a starting screen</h3>
                <p>Each one is a finished screen with sample content in it. Pick the one closest to what you have in mind.</p>
              </div>
              <LinkList
                label="Starting screens"
                items={starters.map((s) => ({
                  id: s.id,
                  label: `${s.title} — ${s.id}`,
                  description: s.about,
                  // Where it leads: the template this screen is built on, or the patterns page for the blank one.
                  href: s.template ? `/patterns/${slug(s.template)}` : "/patterns",
                  icon: s.template ? "dashboard" : "draft",
                }))}
              />
              <div className={docs.prose}>
                <h3>2. Run the command</h3>
                <p>
                  Already have a kit folder? This adds a screen to it. <code>--route</code> is the address it gets,
                  so this one opens at <code>/sales</code>:
                </p>
                <CodeBlock code="npm run new-screen -- --template dashboard --route sales" />
                <p>Then start it:</p>
                <CodeBlock code="npm run dev" />
                <p>
                  Starting from nothing, one command makes the folder with the kit and the screen together. Change
                  the name and the starter:
                </p>
                <CodeBlock code="npm create agentic-bp-ds@latest my-idea -- --template dashboard" />
                <Callout intent="warning" title="The one-command way is not live yet">
                  <code>--template</code> on that last command works from the next kit release onwards. Today it is
                  ignored, and you get the catalog with no screen in it. Until then, ask whoever set up your kit
                  folder for one, and use the <code>npm run new-screen</code> command above inside it.
                </Callout>

                <h3>3. Ask for changes in your own words</h3>
                <p>
                  Open the folder in Claude and say what you want different. You do not have to name files, components
                  or props. Describe the screen the way you would describe it to a colleague.
                </p>
                <Callout intent="info" title="Nothing here is real">
                  Every starter has made-up content, and nothing is saved anywhere. It is for showing an idea, not for
                  running a business on.
                </Callout>
              </div>
            </Section>
          </div>

          <div id="prompts">
            <Section title="Example prompts">
              <div className={docs.prose}>
                <p>Paste one of these and change the words to suit your screen.</p>
                {PROMPTS.map((p) => (
                  <CodeBlock key={p} code={p} wrap />
                ))}
              </div>
            </Section>
          </div>

          <div id="words">
            <Section title="Words we use">
              <div className={docs.prose}>
                <ul>
                  {WORDS.map((w) => (
                    <li key={w.word}>
                      <strong>{w.word}:</strong> {w.said}
                    </li>
                  ))}
                </ul>
                <p>
                  Template, organism, molecule and atom are the four sizes every part of the kit is labelled with, so
                  you can tell how big a thing is before you open it. A page is not one of them: a page is a template
                  with real content in it.
                </p>
              </div>
            </Section>
          </div>

          <div id="engineer">
            <Section title="When to ask an engineer">
              <div className={docs.prose}>
                <ul>
                  <li><strong>Installing:</strong> if the commands above do not run on your computer.</li>
                  <li><strong>Deploying:</strong> putting your screen on a web address other people can open.</li>
                  <li><strong>Connecting real data:</strong> showing real accounts, invoices or usage instead of sample content.</li>
                </ul>
                <p>Everything else — the look, the words, the columns, the fields, the flow — you can do yourself from here.</p>
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
