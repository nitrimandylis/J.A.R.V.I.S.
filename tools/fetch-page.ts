#!/usr/bin/env bun

/**
 * Fetch a single Notion page by ID, displaying all properties and content.
 *
 * Usage:
 *   bun run tools/fetch-page.ts --id <page-id> [--json] [--no-content]
 *
 * Examples:
 *   bun run tools/fetch-page.ts --id "323ec135-a993-8156-911d-ebb7472ebe5d"
 *   bun run tools/fetch-page.ts --id "323ec135a9938156911debb7472ebe5d" --json
 *   bun run tools/fetch-page.ts --id "323ec135a9938156911debb7472ebe5d" --no-content
 */

import { parseArgs } from "node:util";
import { loadConfig } from "../src/config/loader.ts";
import { fetchPage } from "../src/core/fetch-page.ts";
import { formatOutput } from "../src/presentation/format.ts";
import { formatPageResult } from "../src/presentation/notion-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			id: { type: "string" },
			json: { type: "boolean", default: false },
			"no-content": { type: "boolean", default: false },
		},
		strict: true,
	});

	if (!values.id) {
		console.error("Error: --id is required");
		process.exit(1);
	}

	const config = await loadConfig();
	const result = await fetchPage(config, {
		id: values.id,
		includeContent: !(values["no-content"] ?? false),
	});

	const mode = values.json ? "json" : "human";
	console.log(formatOutput(result, mode, formatPageResult));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
