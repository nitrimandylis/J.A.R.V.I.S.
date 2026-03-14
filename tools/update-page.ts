#!/usr/bin/env bun

/**
 * Update properties and/or content of an existing Notion page.
 *
 * Usage:
 *   bun run tools/update-page.ts --id <page-id> [--props <json>] [--content <markdown>] [--append] [--database <name>]
 *
 * Examples:
 *   bun run tools/update-page.ts --id "abc123" --props '{"Status":"Done"}' --database assignments
 *   bun run tools/update-page.ts --id "abc123" --content "## Notes\n- Item 1\n- Item 2"
 *   bun run tools/update-page.ts --id "abc123" --content "- New item" --append
 *   bun run tools/update-page.ts --id "abc123" --props '{"Mood":"Great"}' --content "## Summary\nGreat day." --database "Daily Notes"
 */

import { parseArgs } from "node:util";
import { loadConfig } from "../src/config/loader.ts";
import { updatePage } from "../src/core/update-page.ts";
import { formatUpdateResult } from "../src/presentation/notion-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			id: { type: "string" },
			props: { type: "string", short: "p" },
			content: { type: "string", short: "c" },
			append: { type: "boolean", default: false },
			database: { type: "string", short: "d" },
		},
		strict: true,
	});

	if (!values.id) {
		console.error("Error: --id is required");
		process.exit(1);
	}
	if (!values.props && !values.content) {
		console.error("Error: --props and/or --content is required");
		process.exit(1);
	}

	const config = await loadConfig();
	const properties = values.props
		? (JSON.parse(values.props) as Record<string, unknown>)
		: undefined;

	const result = await updatePage(config, {
		id: values.id,
		database: values.database,
		properties,
		content: values.content,
		append: values.append,
	});
	console.log(formatUpdateResult(result));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
