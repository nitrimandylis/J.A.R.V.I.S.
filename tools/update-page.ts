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
import {
	appendBlocks,
	markdownToBlocks,
	replacePageContent,
} from "../src/notion/blocks.ts";
import { createNotionClient } from "../src/notion/client.ts";
import { findDatabase } from "../src/notion/database.ts";
import {
	buildPropertyByType,
	buildPropertyValue,
	type SchemaMap,
} from "../src/notion/properties.ts";

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
	const notion = createNotionClient(config.notionApiKey);

	// Update properties if provided
	if (values.props) {
		const extraProps = JSON.parse(values.props) as Record<string, unknown>;
		const properties: Record<string, Record<string, unknown>> = {};

		if (values.database) {
			const db = findDatabase(config.databases, values.database);
			const schemaEntry = config.schemas[db.key];

			if (schemaEntry) {
				const schema = schemaEntry.schema as SchemaMap;
				for (const [key, val] of Object.entries(extraProps)) {
					properties[key] = buildPropertyValue(key, val, schema);
				}
			} else {
				for (const [key, val] of Object.entries(extraProps)) {
					properties[key] = buildPropertyByType("rich_text", val);
				}
			}
		} else {
			for (const [key, val] of Object.entries(extraProps)) {
				if (key === "Status") {
					properties[key] = buildPropertyByType("select", val);
				} else if (typeof val === "boolean") {
					properties[key] = buildPropertyByType("checkbox", val);
				} else if (typeof val === "number") {
					properties[key] = buildPropertyByType("number", val);
				} else {
					properties[key] = buildPropertyByType("rich_text", val);
				}
			}
		}

		await notion.pages.update({
			page_id: values.id,
			properties: properties as Parameters<
				typeof notion.pages.update
			>[0]["properties"],
		});
		console.log("Properties updated.");
	}

	// Update content if provided
	if (values.content) {
		if (values.append) {
			const blocks = markdownToBlocks(values.content);
			await appendBlocks(notion, values.id, blocks);
			console.log(`Appended ${blocks.length} block(s).`);
		} else {
			await replacePageContent(notion, values.id, values.content);
			const blockCount = markdownToBlocks(values.content).length;
			console.log(`Replaced content with ${blockCount} block(s).`);
		}
	}

	console.log(`Done: ${values.id}`);
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
