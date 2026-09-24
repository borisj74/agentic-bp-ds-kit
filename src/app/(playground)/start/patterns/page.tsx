import shell from "@/playground/shell.module.css";
import docs from "@/playground/docs.module.css";
import { CodeBlock } from "@/playground/CodeBlock";
import { loadContract } from "@/playground/contracts";
import { components, patterns, slug } from "@/playground/nav";
import { AnchorNav } from "@/ui/AnchorNav/AnchorNav";
import { Badge } from "@/ui/Badge/Badge";
import { Link } from "@/ui/Link/Link";
import { Section } from "@/ui/Section/Section";

// The pattern sections come straight from each pattern's contract (intent, useWhen, composes, snippet), so a new
// pattern shows up here as soon as it is in contracts/index.json.
export default async function UsingPatterns() {
  const contracts = await Promise.all(patterns.map((p) => loadContract(slug(p.name), "patterns")));
  const known = new Set(components.map((c) => c.name));
  const sections = [
    { id: "how", label: "How patterns work" },
    { id: "steps", label: "How to use a pattern" },
    { id: "choose", label: "Which one?" },
    ...patterns.map((p) => ({ id: slug(p.name), label: p.name })),
  ];

  return (
    <>
      <div className={docs.head}>
        <h1 className={shell.pageTitle}>Using patterns</h1>
        <p className={shell.pageLead}>
          Patterns are blueprints for whole screens. Start every screen from one, and the layout, spacing and behavior
          come with it.
        </p>
      </div>
      <div className={docs.page}>
        <div className={docs.content}>
          <div id="how">
            <Section title="How patterns work">
              <div className={docs.prose}>
                <ul>
                  <li><strong>A pattern lays out a screen.</strong> It places the header, toolbar, content and footer in the right spots, at every width.</li>
                  <li><strong>It is built only from kit components.</strong> It adds no new parts of its own.</li>
                  <li><strong>It keeps no data.</strong> Your screen owns the rows, the form values and what is selected, and passes them in.</li>
                  <li><strong>It has slots.</strong> Props like <code>header</code>, <code>toolbar</code> and <code>children</code> take kit components you fill in.</li>
                </ul>
              </div>
            </Section>
          </div>

          <div id="steps">
            <Section title="How to use a pattern">
              <div className={docs.prose}>
                <ol>
                  <li><strong>Frame the page with AppShell</strong> when it is a full screen with the side navigation and top bar.</li>
                  <li><strong>Pick the page pattern</strong> that matches the screen, using the list below.</li>
                  <li><strong>Read its contract</strong> in <code>contracts/</code>: the slots, the options and the do-nots.</li>
                  <li><strong>Fill the slots with the kit components</strong> listed under &ldquo;Built from&rdquo;.</li>
                  <li><strong>Check it at every width</strong> with the Stage control on the pattern&apos;s page in this catalog.</li>
                  <li><strong>Missing something?</strong> Stop and decide: add the piece to the kit, or change the screen. Do not build a one-off.</li>
                </ol>
              </div>
            </Section>
          </div>

          <div id="choose">
            <Section title="Which one?">
              <div className={docs.prose}>
                <ul>
                  {patterns.map((p, i) => (
                    <li key={p.name}>
                      <strong>{p.name}</strong> — {contracts[i]?.useWhen?.[0] ?? contracts[i]?.intent}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          </div>

          {patterns.map((p, i) => {
            const c = contracts[i];
            if (!c) return null;
            const composes = (c as typeof c & { composes?: string[] }).composes ?? [];
            return (
              <div key={p.name} id={slug(p.name)}>
                <Section title={p.name} description={c.intent}>
                  <div className={docs.prose}>
                    {c.useWhen?.length > 0 && (
                      <>
                        <p className={docs.label}>Use it for</p>
                        <ul>{c.useWhen.map((u) => <li key={u}>{u}</li>)}</ul>
                      </>
                    )}
                    {composes.length > 0 && (
                      <>
                        <p className={docs.label}>Built from</p>
                        <div className={docs.chips}>
                          {composes.map((name) => <Badge key={name} intent={known.has(name) ? "info" : "neutral"}>{name}</Badge>)}
                        </div>
                      </>
                    )}
                    {c.doNot?.length > 0 && (
                      <>
                        <p className={docs.label}>Avoid</p>
                        <ul>{c.doNot.slice(0, 3).map((d) => <li key={d}>{d}</li>)}</ul>
                      </>
                    )}
                    {c.snippet && (
                      <>
                        <p className={docs.label}>Starting code</p>
                        <CodeBlock code={c.snippet} />
                      </>
                    )}
                    <p><Link href={`/patterns/${slug(p.name)}`}>Open {p.name} in the catalog</Link></p>
                  </div>
                </Section>
              </div>
            );
          })}
        </div>
        <div className={docs.rail}>
          <AnchorNav items={sections} spy offset={72} label="On this page" />
        </div>
      </div>
    </>
  );
}
