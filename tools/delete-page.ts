#!/usr/bin/env bun

/**
 * Archive (soft-delete) a Notion page by ID.
 * Notion does not support permanent deletion via API — pages are archived.
 *
 * Usage:
 *   bun run tools/delete-page.ts --id <page-id>
 *
 * Examples:
 *   bun run tools/delete-page.ts --id "323ec135-a993-81ea-aa17-fcfafa4055a9"
 */

import { parseArgs } from "node:util";
import { loadConfig } from "../src/config/loader.ts";
import { deletePage } from "../src/core/delete-page.ts";
import { formatDeleteResult } from "../src/presentation/notion-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			id: { type: "string" },
		},
		strict: true,
	});

	if (!values.id) {
		console.error("Error: --id is required");
		process.exit(1);
	}

	const config = await loadConfig();
	const result = await deletePage(config, { id: values.id });
	console.log(formatDeleteResult(result));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
