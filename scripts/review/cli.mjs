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

export const REVIEW_HELP = `Usage: agentic-bp-ds-kit review <path...>

Reviews screens built from the kit against their contracts: raw values, primitive tokens,
local cousins, closed enums, one strong brand Button, and the bigger piece to reuse.

Paths can be files or folders. Folders are walked for .tsx and .css files.

Options:
  --json         One JSON object: { summary, score, files, counts, findings }
  --score        Print the ${SCORE_NAME} score and its formula
  --all          Include the kit's own folders (src/ui, src/patterns, src/tokens, tests)
  -h, --help     Show this help

Rules:
${RULES.map((r) => "  " + r).join("\n")}

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

export function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
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
  process.exit(main());
}
