#!/usr/bin/env node
/**
 * npm run review -- <path...>
 *
 * Reviews screens against the kit's contracts. Readable text by default, --json for machines.
 * Exit 1 when there is any error, 0 otherwise.
 */
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { RULES, reviewFiles, summarize } from "./index.mjs";
import { SCORE_NAME, formatScore, scoreOf } from "./score.mjs";
import { INSPECT_ENV, LIVE_RULES, formatLive, liveResult, reviewUrl } from "./live.mjs";

export const REVIEW_HELP = `Usage: agentic-bp-ds-kit review <path...>
       agentic-bp-ds-kit review --url <url>

Reviews screens built from the kit against their contracts: raw values, primitive tokens,
local cousins, closed enums, one strong brand Button, and the bigger piece to reuse.

Paths can be files or folders. Folders are walked for .tsx and .css files.

--url checks a running screen instead of its code: it fetches the server-rendered HTML and lists the
kit pieces it finds, grouped by level. Start the dev server with ${INSPECT_ENV}=1, so each kit piece
wears its name tag. Development only: a production build never carries the tags.

Options:
  --url <url>    Check a running screen, like http://localhost:3000/invoices
  --json         One JSON object: { summary, score, files, counts, findings }
  --score        Print the ${SCORE_NAME} score and its formula
  --all          Include the kit's own folders (src/ui, src/patterns, src/tokens, tests)
  -h, --help     Show this help

Rules:
${RULES.map((r) => "  " + r).join("\n")}

Rules for --url:
${LIVE_RULES.map((r) => "  " + r).join("\n")}

Exit code: 1 when there is any error, 0 otherwise.`;

export function formatText({ files, findings, tally }, { score = false } = {}) {
  const lines = [];
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, rows] of byFile) {
    lines.push("");
    lines.push(file);
    for (const f of rows) {
      lines.push(`  ${f.line}  ${f.severity}  ${f.rule}  ${f.message}`);
      lines.push(`      fix: ${f.fix}`);
      if (f.contract) lines.push(`      contract: ${f.contract}`);
    }
  }
  lines.push("");
  lines.push(summarize({ files, findings }));
  if (score) {
    lines.push("");
    lines.push(formatScore(scoreOf({ tally, findings })));
  }
  return lines.join("\n").replace(/^\n/, "");
}

export function formatJson({ files, findings, tally }) {
  const counts = { error: 0, warn: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return JSON.stringify(
    { summary: summarize({ files, findings }), score: scoreOf({ tally, findings }), files, counts, findings },
    null,
    2,
  );
}

export async function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        url: { type: "string" },
        json: { type: "boolean" },
        score: { type: "boolean" },
        all: { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    });
  } catch (error) {
    console.error(`review: ${error.message}`);
    return 1;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(REVIEW_HELP);
    return 0;
  }
  if (values.url) {
    if (positionals.length > 0) {
      console.error("review: --url checks a running screen, so it takes no paths.");
      return 1;
    }
    let run;
    try {
      run = await reviewUrl(values.url);
    } catch (error) {
      console.error(`review: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
    console.log(values.json ? JSON.stringify(liveResult(run), null, 2) : formatLive(run));
    return run.findings.some((f) => f.severity === "error") ? 1 : 0;
  }

  if (positionals.length === 0) {
    console.error("review: say which file or folder to review. Try --help.");
    return 1;
  }

  let result;
  try {
    result = reviewFiles(positionals, { all: Boolean(values.all) });
  } catch (error) {
    console.error(`review: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  console.log(values.json ? formatJson(result) : formatText(result, { score: Boolean(values.score) }));
  return result.findings.some((f) => f.severity === "error") ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
