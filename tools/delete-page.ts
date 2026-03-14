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
import { createNotionClient } from "../src/notion/client.ts";

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
	const notion = createNotionClient(config.notionApiKey);

	// Archive the page (Notion's version of delete)
	const response = (await notion.pages.update({
		page_id: values.id,
		archived: true,
	})) as { id: string; url: string };

	console.log(`Archived: ${response.id} (${response.url})`);
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
