import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { Callout } from "@/ui/Callout/Callout";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Section } from "@/ui/Section/Section";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";

const SECTIONS = [
  { id: "what", label: "What it is" },
  { id: "setup", label: "Set it up" },
  { id: "tools", label: "Tools" },
  { id: "run", label: "Run it by hand" },
  { id: "prompts", label: "Copy prompt uses it" },
  { id: "check", label: "Check it works" },
];

/** Code text in a table cell, the same look as code in running prose. */
function Mono({ text }: { text: string }) {
  return <code className={docs.mono}>{text}</code>;
}

const TOOL_COLUMNS: TableColumn[] = [
  { key: "tool", header: "Tool", width: "116px" },
  { key: "args", header: "Arguments", width: "182px", maxWidth: "182px" },
  // A Table cell keeps its value on one line, so a long sentence would end in an ellipsis. The Returns lines are
  // short enough to read whole at the reading width; the nuance each one leaves out is in the prose above.
  { key: "returns", header: "Returns" },
];

const TOOLS: { name: string; args: string; returns: string }[] = [
  { name: "list", args: "none", returns: "Every component and pattern, one line each" },
  { name: "get", args: "name", returns: "One piece: its whole contract and import line" },
  { name: "search", args: "query", returns: "Pieces that match every word of the query" },
  { name: "get_tokens", args: "category, theme", returns: "Semantic colour roles and their values" },
  { name: "get_rules", args: "none", returns: "The kit rules, CLAUDE.md and AGENTS.md" },
];

const CLAUDE_CODE_ADD = "claude mcp add agentic-bp-ds-kit -- node /absolute/path/to/agentic-bp-ds-kit/bin/mcp.mjs";

const CURSOR_JSON = `{
  "mcpServers": {
    "agentic-bp-ds-kit": {
      "command": "node",
      "args": ["/absolute/path/to/agentic-bp-ds-kit/bin/mcp.mjs"]
    }
  }
}`;

export default function McpServer() {
  const toolRows: TableRow[] = TOOLS.map((t) => ({
    id: t.name,
    tool: <Mono text={t.name} />,
    args: t.args,
    returns: t.returns,
  }));

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
                  A small server that speaks MCP over stdio. Your editor starts it, asks it questions and gets JSON
                  back. It only reads: no tool writes a file or changes the kit.
                </p>
                <p>
                  Answers come from <code>contracts/</code> and <code>src/tokens/source/semantic.txt</code> as they are
                  on disk, at the moment of the question, so there is no second copy of the catalog to fall behind.
                  Every answer carries the kit version it came from. It shipped in <strong>v0.10.1</strong> with five
                  tools.
                </p>
                <p>
                  It is for someone working <strong>on the kit itself</strong>, with an editor pointed at a clone of
                  this repository. Building screens rather than components? You do not need this page —{" "}
                  <strong>Prompting</strong> covers how to ask for a screen.
                </p>
                <Callout intent="info" title="It is not part of a prototype">
                  A prototype made with <code>npm create agentic-bp-ds@latest</code> does not get the server. The
                  installer drops <code>bin/</code>, <code>mcp/</code> and the server&apos;s test. A prototype carries
                  the contracts, which is all it needs.
                </Callout>
              </div>
            </Section>
          </div>

          <div id="setup">
            <Section title="Set it up">
              <div className={docs.prose}>
                <p>
                  Each editor starts the server itself, so it takes one setting and nothing to run. Put the real path
                  to your clone in, and use an absolute one — the server reads the repository it was started from, so
                  it does not matter which folder you are in. Restart the editor after adding it; the server then shows
                  up as <code>agentic-bp-ds-kit</code> with the five tools below.
                </p>
              </div>
              <Section title="Claude Code" line="thin">
                <div className={docs.prose}>
                  <p>One command, run from anywhere:</p>
                  <CodeBlock wrap code={CLAUDE_CODE_ADD} />
                  <p>
                    That adds it for you alone. Add <code>--scope project</code> to write it to a{" "}
                    <code>.mcp.json</code> at the root of the project you are in, which you can then commit for
                    everyone on it.
                  </p>
                </div>
              </Section>
              <Section title="Cursor" line="thin">
                <div className={docs.prose}>
                  <p>
                    Cursor has no command for this: save the file yourself as <code>.cursor/mcp.json</code> in the
                    project.
                  </p>
                  <CodeBlock code={CURSOR_JSON} />
                </div>
              </Section>
            </Section>
          </div>

          <div id="tools">
            <Section title="Tools">
              <div className={docs.prose}>
                <p>
                  Five read-only tools. <code>list</code>, <code>get</code> and <code>search</code> serve{" "}
                  <strong>components and screen patterns together</strong>, each row labelled with its{" "}
                  <code>kind</code>: the kit&apos;s first rule for a screen is to use the pattern that covers it, and an
                  assistant that cannot see the patterns cannot follow it.
                </p>
                <p>
                  <code>get</code> takes a display name or a contract file stem, so <code>Button</code>,{" "}
                  <code>button</code>, <code>ListPage</code> and <code>listpage</code> all land. <code>get_tokens</code>{" "}
                  takes two optional filters: <code>category</code> — background, border, icon, link, outline, surface
                  or text — and <code>theme</code>: light, dark or both.
                </p>
                <Table size="sm" columns={TOOL_COLUMNS} rows={toolRows} caption="The five MCP tools" />
                <p>
                  Ask for something the kit does not have and you get a plain answer, not an invention:{" "}
                  <code>get</code> with <code>{'{ "name": "Nope" }'}</code> replies{" "}
                  <em>Nothing in the kit is called &ldquo;Nope&rdquo;. Use list or search.</em>
                </p>
              </div>
            </Section>
          </div>

          <div id="run">
            <Section title="Run it by hand">
              <div className={docs.prose}>
                <p>
                  You rarely need this — your editor starts the server for you. From a clone of the kit, after{" "}
                  <code>npm install</code>:
                </p>
                <CodeBlock code="npm run mcp" />
                <p>
                  Or <code>npx agentic-bp-ds-kit mcp</code>, which does the same thing. Both run{" "}
                  <code>bin/mcp.mjs</code>. Nothing is printed: the server talks the protocol on standard output and
                  waits, so a quiet terminal means it started. Stop it with <strong>Ctrl + C</strong>. Add{" "}
                  <code>--help</code> for the tool list in the terminal.
                </p>
              </div>
            </Section>
          </div>

          <div id="prompts">
            <Section title="Copy prompt uses it">
              <div className={docs.prose}>
                <p>
                  Every component and pattern page has a <strong>Copy prompt</strong> row. Its <strong>MCP</strong>{" "}
                  button copies a prompt that tells the assistant to call <code>get</code> for that piece and follow
                  what comes back, instead of pasting a contract into the message:
                </p>
                <CodeBlock
                  wrap
                  code={'Call the Agentic BP DS MCP tool `get` with name "badge" and follow what it returns. Other read-only tools: list, search, get_tokens, get_rules.'}
                />
                <p>The other buttons in that row point at the contract file instead, for when the server is not wired up.</p>
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
                  <code>cwd</code> pointing somewhere other than the repository root, or <code>npm install</code> never
                  having run in the clone.
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
