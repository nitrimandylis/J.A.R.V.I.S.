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
import { createNotionClient } from "../src/notion/client.ts";
import { findDatabase } from "../src/notion/database.ts";
import { extractAllProperties } from "../src/notion/properties.ts";
import type { NotionFilter, NotionSort } from "../src/notion/types.ts";

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
	const db = findDatabase(config.databases, values.database);
	const notion = createNotionClient(config.notionApiKey);

	// Build filters
	const filters: NotionFilter[] = [];
	if (values.status) {
		filters.push({ property: "Status", select: { equals: values.status } });
	}
	if (values.priority) {
		filters.push({
			property: "Priority",
			select: { equals: values.priority },
		});
	}

	// Build sorts
	const sorts: NotionSort[] = [];
	if (values.sort) {
		const [prop, dir] = values.sort.split(":");
		if (prop) {
			sorts.push({
				property: prop,
				direction: dir === "descending" ? "descending" : "ascending",
			});
		}
	}

	// Build query params
	const queryParams: Record<string, unknown> = {
		data_source_id: db.id,
	};

	if (filters.length === 1) {
		queryParams.filter = filters[0];
	} else if (filters.length > 1) {
		queryParams.filter = { and: filters };
	}

	if (sorts.length > 0) {
		queryParams.sorts = sorts;
	}

	if (values.limit) {
		queryParams.page_size = Math.min(Number.parseInt(values.limit, 10), 100);
	}

	const response = await notion.dataSources.query(
		queryParams as Parameters<typeof notion.dataSources.query>[0],
	);

	const rows = response.results.map((page: Record<string, unknown>) => {
		const props = page.properties as Record<string, Record<string, unknown>>;
		const row = extractAllProperties(props);
		row._id = page.id as string;
		row._url = page.url as string;
		return row;
	});

	if (values.json) {
		console.log(JSON.stringify(rows, null, 2));
		return;
	}

	if (rows.length === 0) {
		console.log(`No results found in ${db.key}.`);
		return;
	}

	console.log(`${db.key} — ${rows.length} result(s)\n`);

	const schema = config.schemas[db.key]?.schema;
	const displayCols = schema
		? Object.keys(schema).filter((k) => k !== db.titleProp)
		: Object.keys(rows[0]!).filter(
				(k) => k !== "_url" && k !== "_id" && k !== db.titleProp,
			);

	for (const row of rows) {
		const title = row[db.titleProp] ?? "Untitled";
		const details = displayCols
			.map((col) => {
				const val = row[col];
				return val ? `${col}: ${val}` : null;
			})
			.filter(Boolean)
			.join(" | ");
		console.log(`• ${title} [${row._id}]`);
		if (details) {
			console.log(`  ${details}`);
		}
	}
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
