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
import { createNotionClient } from "../src/notion/client.ts";
import { findDatabase } from "../src/notion/database.ts";
import {
	buildPropertyValue,
	type SchemaMap,
} from "../src/notion/properties.ts";

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
	const db = findDatabase(config.databases, values.database);
	const schemaEntry = config.schemas[db.key];

	if (!schemaEntry) {
		console.error(
			`Error: No schema found for "${db.key}". Run refresh-schema-cache.`,
		);
		process.exit(1);
	}

	const notion = createNotionClient(config.notionApiKey);
	const schema = schemaEntry.schema as SchemaMap;

	// Build properties starting with title
	const properties: Record<string, Record<string, unknown>> = {
		[db.titleProp]: buildPropertyValue(db.titleProp, values.title, schema),
	};

	// Parse additional props
	if (values.props) {
		const extraProps = JSON.parse(values.props) as Record<string, unknown>;
		for (const [key, val] of Object.entries(extraProps)) {
			properties[key] = buildPropertyValue(key, val, schema);
		}
	}

	const response = (await notion.pages.create({
		parent: {
			type: "data_source_id",
			data_source_id: db.id,
		} as Parameters<typeof notion.pages.create>[0]["parent"],
		properties: properties as Parameters<
			typeof notion.pages.create
		>[0]["properties"],
	})) as { id: string; url: string };

	console.log(
		`Created: ${values.title} (ID: ${response.id}, URL: ${response.url})`,
	);
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
