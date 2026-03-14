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
import { fetchPageContent } from "../src/notion/blocks.ts";
import { createNotionClient } from "../src/notion/client.ts";
import { extractAllProperties } from "../src/notion/properties.ts";

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
	const notion = createNotionClient(config.notionApiKey);

	const page = (await notion.pages.retrieve({
		page_id: values.id,
	})) as {
		id: string;
		url: string;
		created_time: string;
		last_edited_time: string;
		archived: boolean;
		properties: Record<string, Record<string, unknown>>;
		parent: Record<string, unknown>;
	};

	const props = extractAllProperties(page.properties);

	// Fetch page content (blocks) unless --no-content is set
	const skipContent = values["no-content"] ?? false;
	const content = skipContent ? "" : await fetchPageContent(notion, values.id);

	if (values.json) {
		console.log(
			JSON.stringify(
				{
					id: page.id,
					url: page.url,
					archived: page.archived,
					created: page.created_time,
					last_edited: page.last_edited_time,
					properties: props,
					content: content || null,
				},
				null,
				2,
			),
		);
		return;
	}

	// Find title property
	const titleEntry = Object.entries(page.properties).find(
		([_, v]) => v.type === "title",
	);
	const title = titleEntry ? (props[titleEntry[0]] ?? "Untitled") : "Untitled";

	console.log(`${title}`);
	console.log(`ID: ${page.id}`);
	console.log(`URL: ${page.url}`);
	console.log(`Created: ${page.created_time.split("T")[0]}`);
	console.log(`Edited: ${page.last_edited_time.split("T")[0]}`);
	if (page.archived) {
		console.log("Status: ARCHIVED");
	}
	console.log("");

	for (const [key, value] of Object.entries(props)) {
		if (titleEntry && key === titleEntry[0]) continue;
		console.log(`${key}: ${value}`);
	}

	if (content) {
		console.log("\n--- Content ---\n");
		console.log(content);
	}
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
