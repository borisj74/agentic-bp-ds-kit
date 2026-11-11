import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { Callout } from "@/ui/Callout/Callout";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Badge } from "@/ui/Badge/Badge";
import { Section } from "@/ui/Section/Section";

const SECTIONS = [
  { id: "what", label: "What it is" },
  { id: "who", label: "Who it is for" },
  { id: "run", label: "Run it" },
  { id: "tools", label: "The five tools" },
  { id: "wiring", label: "Wiring it up" },
  { id: "prompts", label: "Copy prompt uses it" },
  { id: "check", label: "Check it works" },
];

// Every example below is a real call against this repo, trimmed where the answer is long.
const TOOLS = [
  {
    name: "list",
    answers:
      "Every component and every screen pattern in contracts/index.json, split by kind, each with its category, contract path, tags and a one-line intent. Today: 84 components and 10 patterns.",
    call: "list",
    result: `{
  "kit": "0.10.1",
  "count": 94,
  "components": [
    {
      "name": "Accordion",
      "kind": "component",
      "category": "layout",
      "contract": "contracts/accordion.json",
      "tags": ["disclosure", "collapse", "faq", "expand", "sections"],
      "intent": "List of short sections where one opens at a time."
    },
    ... 83 more
  ],
  "patterns": [ ... 10 patterns, same shape with "kind": "pattern" ]
}`,
  },
  {
    name: "get",
    answers:
      "One component or pattern, by display name or contract file stem — Button, button, ListPage and listpage all land. You get the full contract JSON, the kind, a usage summary and the exact import line.",
    call: 'get { "name": "listpage" }',
    result: `{
  "kit": "0.10.1",
  "name": "ListPage",
  "kind": "pattern",
  "contractPath": "contracts/listpage.json",
  "import": "import { ListPage } from \\"@/patterns/ListPage/ListPage\\";",
  "usage": "...",
  "contract": { ... the whole contract file }
}`,
  },
  {
    name: "search",
    answers:
      "Components and patterns whose name, category, tags, intent, usage, useWhen or doNot lines contain every word of the query, ignoring case. Matches come back split by kind.",
    call: 'search { "query": "empty state" }',
    result: `{
  "kit": "0.10.1",
  "query": "empty state",
  "count": 9,
  "components": [
    {
      "name": "EmptyState",
      "kind": "component",
      "category": "feedback",
      "contract": "contracts/emptystate.json",
      "intent": "What a list, page or panel shows when it has nothing yet: an icon, a title, a line of help and the action that fills it.",
      "matchedQuery": "empty state"
    },
    ... Illustration, Skeleton
  ],
  "patterns": [ ... ChatWindow and the rest ]
}`,
  },
  {
    name: "get_tokens",
    answers:
      "The semantic color roles, read from src/tokens/source/semantic.txt. Narrow them with category — background, border, icon, link, outline, surface or text — and with theme: light, dark or both (the default).",
    call: 'get_tokens { "category": "background", "theme": "light" }',
    result: `{
  "kit": "0.10.1",
  "source": "src/tokens/source/semantic.txt",
  "category": "background",
  "theme": "light",
  "count": 132,
  "tokens": [
    { "name": "--bg-neutral-min", "source": "background/neutral/min", "category": "background", "light": "{ui/neutral/0}" },
    { "name": "--bg-neutral-min-hover", "source": "background/neutral/min/hover", "category": "background", "light": "{ui/neutral/100}" },
    ... 130 more
  ],
  "note": "Components must use semantic CSS variables from src/tokens/semantic.css, not primitive --ref-* or --ui-* ramps."
}`,
  },
  {
    name: "get_rules",
    answers:
      "The kit rules an agent has to follow, as nine short lines, plus the full text of CLAUDE.md and AGENTS.md so nothing has to be looked up by hand.",
    call: "get_rules",
    result: `{
  "kit": "0.10.1",
  "rules": [
    "Before writing UI, read contracts/index.json, then only the matching contract file(s).",
    "If a contract exists, import it from @/ui/<Name>/<Name>. Never invent a local cousin.",
    ... 7 more
  ],
  "documents": { "CLAUDE.md": "...", "AGENTS.md": "..." },
  "primarySource": "CLAUDE.md"
}`,
  },
];

const CLAUDE_CODE_JSON = `{
  "mcpServers": {
    "agentic-bp-ds-kit": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/agentic-bp-ds-kit/bin/mcp.mjs"],
      "cwd": "/absolute/path/to/agentic-bp-ds-kit"
    }
  }
}`;

const CURSOR_JSON = `{
  "mcpServers": {
    "agentic-bp-ds-kit": {
      "command": "node",
      "args": ["/absolute/path/to/agentic-bp-ds-kit/bin/mcp.mjs"],
      "cwd": "/absolute/path/to/agentic-bp-ds-kit"
    }
  }
}`;

export default function McpServer() {
  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>MCP server</h1>
        <p className={shell.pageLead}>
          A read-only server that lets your coding assistant ask the kit what it holds — every contract and every
          semantic token — instead of reading the repo file by file.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="what">
            <Section title="What it is">
              <div className={docs.prose}>
                <p>
                  A small MCP server that speaks over stdio. Your assistant starts it, asks it questions and gets JSON
                  back. It only reads: there is no tool that writes a file or changes the kit.
                </p>
                <p>
                  It answers from <code>contracts/</code> and <code>src/tokens/source/semantic.txt</code> as they are on
                  disk, at the moment of the question. So there is no second copy of the catalog to fall behind: add a
                  contract or a token and the next answer already has it.
                </p>
                <p>
                  It shipped in <strong>v0.10.1</strong> with five tools: <code>list</code>, <code>get</code>,{" "}
                  <code>search</code>, <code>get_tokens</code> and <code>get_rules</code>.
                </p>
              </div>
            </Section>
          </div>

          <div id="who">
            <Section title="Who it is for">
              <div className={docs.prose}>
                <p>
                  Someone working <strong>on the kit itself</strong>, with an editor pointed at a clone of this
                  repository: adding a component, changing one, or checking what the kit already has before building.
                </p>
                <Callout intent="info" title="It is not part of a prototype">
                  A prototype made with <code>npm create agentic-bp-ds@latest</code> does not get the server. The
                  installer drops <code>bin/</code>, <code>mcp/</code> and the server&apos;s test, and takes the{" "}
                  <code>bin</code> entry, the <code>mcp</code> script and its two dependencies out of{" "}
                  <code>package.json</code>. A prototype carries the contracts, which is all it needs.
                </Callout>
                <p>
                  Building screens rather than components? You do not need this page. The contracts travel with every
                  copy of the kit, and <strong>Prompting</strong> covers how to ask for a screen.
                </p>
              </div>
            </Section>
          </div>

          <div id="run">
            <Section title="Run it">
              <div className={docs.prose}>
                <p>
                  From a clone of the kit, after <code>npm install</code>:
                </p>
                <CodeBlock code="npm run mcp" />
                <p>Or through the kit&apos;s own command, which does the same thing:</p>
                <CodeBlock code="npx agentic-bp-ds-kit mcp" />
                <p>
                  Both run <code>bin/mcp.mjs</code>. Nothing is printed: the server talks the protocol on standard
                  output and waits, so a quiet terminal means it started. Stop it with <strong>Ctrl + C</strong>. Add{" "}
                  <code>--help</code> to the <code>npx</code> command for the tool list in the terminal.
                </p>
                <p>
                  You rarely start it by hand. Normally your editor starts it for you, from the settings below.
                </p>
              </div>
            </Section>
          </div>

          <div id="tools">
            <Section title="The five tools">
              <div className={docs.prose}>
                <p>
                  <code>list</code>, <code>get</code> and <code>search</code> all serve <strong>components and screen
                  patterns together</strong>, each row labelled with its <code>kind</code>. That is on purpose: the
                  kit&apos;s first rule for a screen is to use the pattern that covers it, and an assistant that cannot
                  see the patterns cannot follow it.
                </p>
                <p>Every answer carries the kit version it came from, so an old reply is easy to spot.</p>
                {TOOLS.map((t) => (
                  <div key={t.name} className={docs.prose}>
                    <p className={docs.label}>
                      <code>{t.name}</code>
                    </p>
                    <p>{t.answers}</p>
                    <div>
                      <Badge intent="info">Call</Badge>
                    </div>
                    <CodeBlock wrap code={t.call} />
                    <div>
                      <Badge intent="success">Comes back</Badge>
                    </div>
                    <CodeBlock code={t.result} />
                  </div>
                ))}
                <p>
                  Ask for something the kit does not have and you get a plain answer, not an invention:{" "}
                  <code>get</code> with <code>{'{ "name": "Nope" }'}</code> replies{" "}
                  <em>Nothing in the kit is called &ldquo;Nope&rdquo;. Use list or search.</em>
                </p>
              </div>
            </Section>
          </div>

          <div id="wiring">
            <Section title="Wiring it up">
              <div className={docs.prose}>
                <p>
                  Both editors start the server themselves. Put the real path to your clone in both places, and use an
                  absolute one.
                </p>
                <p className={docs.label}>Claude Code — .mcp.json at the project root</p>
                <CodeBlock code={CLAUDE_CODE_JSON} />
                <p className={docs.label}>Cursor — .cursor/mcp.json</p>
                <CodeBlock code={CURSOR_JSON} />
                <p>
                  Restart the editor after adding it. The server then shows up as{" "}
                  <code>agentic-bp-ds-kit</code> with its five tools.
                </p>
              </div>
            </Section>
          </div>

          <div id="prompts">
            <Section title="Copy prompt uses it">
              <div className={docs.prose}>
                <p>
                  Every component page in the catalog has a <strong>Copy prompt</strong> control with three targets.
                  Pick <strong>MCP</strong> and the prompt you copy tells the assistant to call <code>get</code> for
                  that piece and follow what comes back, instead of pasting a contract into the message:
                </p>
                <CodeBlock
                  wrap
                  code={'Call the Agentic BP DS MCP tool `get` with name "badge" and follow what it returns. Other read-only tools: list, search, get_tokens, get_rules.'}
                />
                <p>
                  The other two targets, Claude Code and Cursor, point at the contract file instead, for when the server
                  is not wired up.
                </p>
              </div>
            </Section>
          </div>

          <div id="check">
            <Section title="Check it works">
              <div className={docs.prose}>
                <p>The kit&apos;s own test walks every tool and checks each one answers:</p>
                <CodeBlock code="npm test -- tests/mcp.test.ts" />
                <p>
                  If your editor cannot see the server, the usual causes are a relative path in the settings, a{" "}
                  <code>cwd</code> pointing somewhere other than the repository root, or{" "}
                  <code>npm install</code> never having run in the clone.
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
