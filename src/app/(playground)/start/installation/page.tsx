import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { Alert } from "@/ui/Alert/Alert";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Section } from "@/ui/Section/Section";

const SECTIONS = [
  { id: "before", label: "Before you start" },
  { id: "npm", label: "Option 1: One command" },
  { id: "template", label: "Option 2: GitHub template" },
  { id: "clone", label: "Option 3: Clone the kit" },
  { id: "run", label: "Run it" },
  { id: "assistant", label: "Work with the assistant" },
  { id: "updates", label: "Getting updates" },
  { id: "trouble", label: "If something goes wrong" },
];

export default function Installation() {
  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>Installation</h1>
        <p className={shell.pageLead}>
          Get your own copy of the kit running on your computer. Pick one of the three ways in; most people want the first.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="before">
            <Section title="Before you start">
              <div className={docs.prose}>
                <ul>
                  <li><strong>Node.js 20 or newer.</strong> Download it from nodejs.org. Check with <code>node -v</code>.</li>
                  <li><strong>A terminal:</strong> Terminal on a Mac, PowerShell on Windows, or the one in your code editor.</li>
                  <li><strong>An AI coding assistant,</strong> like Claude Code, to build screens. You can browse the catalog without one.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="npm">
            <Section title="Option 1: One command" description="Recommended. Makes a new folder with the latest release of the kit and installs it.">
              <div className={docs.prose}>
                <p>Run this in the folder where you keep your projects. Change <code>my-prototype</code> to any name.</p>
                <CodeBlock code="npm create agentic-bp-ds@latest my-prototype" />
                <p>Then go into the folder and start it:</p>
                <CodeBlock code={"cd my-prototype\nnpm run dev"} />
              </div>
            </Section>
          </div>

          <div id="template">
            <Section title="Option 2: GitHub template" description="For a prototype that lives in its own GitHub repository, to share or deploy.">
              <div className={docs.prose}>
                <ol>
                  <li>Open <code>github.com/borisj74/agentic-bp-ds-kit</code>.</li>
                  <li>Click <strong>Use this template</strong>, then <strong>Create a new repository</strong>, and name it.</li>
                  <li>Copy your new repository&apos;s address and clone it, then install and start it:</li>
                </ol>
                <CodeBlock code={"git clone <your repository address> my-prototype\ncd my-prototype\nnpm install\nnpm run dev"} />
              </div>
            </Section>
          </div>

          <div id="clone">
            <Section title="Option 3: Clone the kit" description="For changing the kit itself: adding a component or fixing one.">
              <div className={docs.prose}>
                <CodeBlock code={"git clone https://github.com/borisj74/agentic-bp-ds-kit.git\ncd agentic-bp-ds-kit\nnpm install\nnpm run dev"} />
              </div>
            </Section>
          </div>

          <div id="run">
            <Section title="Run it">
              <div className={docs.prose}>
                <p>With <code>npm run dev</code> running, open <strong>http://localhost:3000</strong>. The page updates as files change.</p>
                <ul>
                  <li><code>npm run dev</code> starts the catalog and your screens.</li>
                  <li><code>npm run build</code> checks that everything builds, as it would before deploying.</li>
                  <li><code>npm run lint</code> checks the code for common mistakes.</li>
                  <li><code>npm test</code> runs the unit, interaction and accessibility tests; <code>npm run test:watch</code> reruns them as files change.</li>
                  <li><code>npm run tokens</code> rebuilds the token CSS after editing <code>src/tokens/source</code>.</li>
                </ul>
                <p>Stop the server with <strong>Ctrl + C</strong> in the terminal.</p>
              </div>
            </Section>
          </div>

          <div id="assistant">
            <Section title="Work with the assistant">
              <div className={docs.prose}>
                <p>Open the prototype folder in your AI coding assistant. The rules come with the kit, so there is nothing to set up:</p>
                <ul>
                  <li><code>CLAUDE.md</code> holds the kit rules the assistant follows on every request.</li>
                  <li><code>/prototype-from-kit</code> runs the <strong>Prototype from kit</strong> skill, which walks the assistant through building a screen from the kit.</li>
                  <li><code>contracts/</code> tells it what each piece is for and which options it has.</li>
                </ul>
                <p>Then read <strong>Prompting</strong> in the sidebar before your first screen.</p>
              </div>
            </Section>
          </div>

          <div id="updates">
            <Section title="Getting updates">
              <div className={docs.prose}>
                <Alert tone="warning" title="Prototypes do not update on their own">
                  Each prototype is a copy of the kit from the day it was made. To use newer components, start a new
                  prototype with the command in Option 1 and move your screens across.
                </Alert>
                <p>
                  Working from a clone of the kit (Option 3)? Run <code>git pull</code> and then <code>npm install</code>.
                </p>
              </div>
            </Section>
          </div>

          <div id="trouble">
            <Section title="If something goes wrong">
              <div className={docs.prose}>
                <ul>
                  <li><strong>&ldquo;Node is too old&rdquo;:</strong> install Node.js 20 or newer, open a new terminal, and run the command again.</li>
                  <li><strong>&ldquo;The folder is not empty&rdquo;:</strong> pick a new folder name.</li>
                  <li><strong>The install stopped halfway:</strong> go into the folder and run <code>npm install</code>.</li>
                  <li><strong>Port 3000 is busy:</strong> the terminal shows another address, like localhost:3001. Open that one.</li>
                  <li><strong>The page is blank or out of date:</strong> stop the server, run <code>npm run dev</code> again and reload.</li>
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
