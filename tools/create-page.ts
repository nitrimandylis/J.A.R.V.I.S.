#!/usr/bin/env bun

/**
 * Create a new page in any Notion database.
 *
 * Usage:
 *   bun run tools/create-page.ts --database <name> --title <text> [--props <json>]
 *
 * Examples:
 *   bun run tools/create-page.ts --database "Daily Notes" --title "2026-03-14"
 *   bun run tools/create-page.ts --database assignments --title "TOK Essay" --props '{"Status":"To Do","Subject":"TOK"}'
 *   bun run tools/create-page.ts --database "Side Quests" --title "New Project" --props '{"Status":"Idea","Category":"CS Project"}'
 */

import { parseArgs } from "node:util";
import { loadConfig } from "../src/config/loader.ts";
import { createPage } from "../src/core/create-page.ts";
import { formatCreateResult } from "../src/presentation/notion-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			database: { type: "string", short: "d" },
			title: { type: "string", short: "t" },
			props: { type: "string", short: "p" },
		},
		strict: true,
	});

	if (!values.database) {
		console.error("Error: --database is required");
		process.exit(1);
	}
	if (!values.title) {
		console.error("Error: --title is required");
		process.exit(1);
	}

	const config = await loadConfig();
	const properties = values.props
		? (JSON.parse(values.props) as Record<string, unknown>)
		: undefined;

	const result = await createPage(config, {
		database: values.database,
		title: values.title,
		properties,
	});
	console.log(formatCreateResult(result));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
