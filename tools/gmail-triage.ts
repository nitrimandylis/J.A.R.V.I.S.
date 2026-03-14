#!/usr/bin/env bun

/**
 * Check unread Gmail messages and surface ones that need attention.
 *
 * Usage:
 *   bun run tools/gmail-triage.ts [--limit <n>] [--json]
 *
 * Examples:
 *   bun run tools/gmail-triage.ts
 *   bun run tools/gmail-triage.ts --limit 30
 *   bun run tools/gmail-triage.ts --json
 *
 * Requires: gws CLI authenticated (run `gws auth login -s gmail`)
 */

import { parseArgs } from "node:util";
import { gmailTriage } from "../src/core/gmail-triage.ts";
import { formatOutput } from "../src/presentation/format.ts";
import { formatGmailResult } from "../src/presentation/google-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			limit: { type: "string", default: "20" },
			json: { type: "boolean", default: false },
		},
		strict: true,
	});

	const result = await gmailTriage({
		limit: Number.parseInt(values.limit!, 10),
	});

	const mode = values.json ? "json" : "human";
	console.log(formatOutput(result, mode, formatGmailResult));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
