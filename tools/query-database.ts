#!/usr/bin/env bun

/**
 * Query any Notion database with optional filters.
 *
 * Usage:
 *   bun run tools/query-database.ts --database <name> [--status <s>] [--priority <p>] [--limit <n>] [--sort <prop:dir>] [--json]
 *
 * Examples:
 *   bun run tools/query-database.ts --database "Side Quests" --status "In Progress"
 *   bun run tools/query-database.ts --database assignments --status "To Do" --limit 5
 *   bun run tools/query-database.ts --database "Daily Notes" --sort "Date:descending" --limit 3
 */

import { parseArgs } from "node:util";
import { loadConfig } from "../src/config/loader.ts";
import { queryDatabase } from "../src/core/query-database.ts";
import { formatOutput } from "../src/presentation/format.ts";
import { formatQueryResult } from "../src/presentation/notion-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			database: { type: "string", short: "d" },
			status: { type: "string", short: "s" },
			priority: { type: "string", short: "p" },
			limit: { type: "string", short: "l" },
			sort: { type: "string" },
			json: { type: "boolean", default: false },
		},
		strict: true,
	});

	if (!values.database) {
		console.error("Error: --database is required");
		process.exit(1);
	}

	const config = await loadConfig();
	const result = await queryDatabase(config, {
		database: values.database,
		status: values.status,
		priority: values.priority,
		limit: values.limit ? Number.parseInt(values.limit, 10) : undefined,
		sort: values.sort,
	});

	const mode = values.json ? "json" : "human";
	console.log(formatOutput(result, mode, formatQueryResult));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
