import { createNotionClient } from "../notion/client.ts";
import { findDatabase } from "../notion/database.ts";
import { buildPropertyValue, type SchemaMap } from "../notion/properties.ts";
import type { AppConfig } from "../notion/types.ts";
import type { CreatePageOptions, CreatePageResult } from "./types.ts";

export async function createPage(
	config: AppConfig,
	options: CreatePageOptions,
): Promise<CreatePageResult> {
	const db = findDatabase(config.databases, options.database);
	const schemaEntry = config.schemas[db.key];

	if (!schemaEntry) {
		throw new Error(
			`No schema found for "${db.key}". Run refresh-schema-cache.`,
		);
	}

	const notion = createNotionClient(config.notionApiKey);
	const schema = schemaEntry.schema as SchemaMap;

	// Build properties starting with title
	const properties: Record<string, Record<string, unknown>> = {
		[db.titleProp]: buildPropertyValue(db.titleProp, options.title, schema),
	};

	// Add extra properties
	if (options.properties) {
		for (const [key, val] of Object.entries(options.properties)) {
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

	return {
		id: response.id,
		url: response.url,
		title: options.title,
	};
}
