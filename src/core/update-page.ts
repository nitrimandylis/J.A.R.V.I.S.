import {
	appendBlocks,
	markdownToBlocks,
	replacePageContent,
} from "../notion/blocks.ts";
import { createNotionClient } from "../notion/client.ts";
import { findDatabase } from "../notion/database.ts";
import {
	buildPropertyByType,
	buildPropertyValue,
	type SchemaMap,
} from "../notion/properties.ts";
import type { AppConfig } from "../notion/types.ts";
import type { UpdatePageOptions, UpdatePageResult } from "./types.ts";

export async function updatePage(
	config: AppConfig,
	options: UpdatePageOptions,
): Promise<UpdatePageResult> {
	const notion = createNotionClient(config.notionApiKey);
	let propertiesUpdated = false;
	let contentAction: "replaced" | "appended" | "none" = "none";
	let blockCount = 0;

	// Update properties if provided
	if (options.properties) {
		const properties: Record<string, Record<string, unknown>> = {};

		if (options.database) {
			const db = findDatabase(config.databases, options.database);
			const schemaEntry = config.schemas[db.key];

			if (schemaEntry) {
				const schema = schemaEntry.schema as SchemaMap;
				for (const [key, val] of Object.entries(options.properties)) {
					properties[key] = buildPropertyValue(key, val, schema);
				}
			} else {
				for (const [key, val] of Object.entries(options.properties)) {
					properties[key] = buildPropertyByType("rich_text", val);
				}
			}
		} else {
			for (const [key, val] of Object.entries(options.properties)) {
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
			page_id: options.id,
			properties: properties as Parameters<
				typeof notion.pages.update
			>[0]["properties"],
		});
		propertiesUpdated = true;
	}

	// Update content if provided
	if (options.content) {
		if (options.append) {
			const blocks = markdownToBlocks(options.content);
			await appendBlocks(notion, options.id, blocks);
			contentAction = "appended";
			blockCount = blocks.length;
		} else {
			await replacePageContent(notion, options.id, options.content);
			blockCount = markdownToBlocks(options.content).length;
			contentAction = "replaced";
		}
	}

	return {
		id: options.id,
		propertiesUpdated,
		contentAction,
		blockCount,
	};
}
