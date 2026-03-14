import { fetchPageContent } from "../notion/blocks.ts";
import { createNotionClient } from "../notion/client.ts";
import { extractAllProperties } from "../notion/properties.ts";
import type { AppConfig } from "../notion/types.ts";
import type { FetchPageOptions, PageResult } from "./types.ts";

export async function fetchPage(
	config: AppConfig,
	options: FetchPageOptions,
): Promise<PageResult> {
	const notion = createNotionClient(config.notionApiKey);

	const page = (await notion.pages.retrieve({
		page_id: options.id,
	})) as {
		id: string;
		url: string;
		created_time: string;
		last_edited_time: string;
		archived: boolean;
		properties: Record<string, Record<string, unknown>>;
	};

	const props = extractAllProperties(page.properties);

	const includeContent = options.includeContent ?? true;
	const content = includeContent
		? await fetchPageContent(notion, options.id)
		: null;

	// Find title property and its value
	const titleEntry = Object.entries(page.properties).find(
		([_, v]) => v.type === "title",
	);
	const titleProperty = titleEntry ? titleEntry[0] : "";
	const title = titleEntry ? (props[titleEntry[0]] ?? "Untitled") : "Untitled";

	return {
		id: page.id,
		url: page.url,
		archived: page.archived,
		created: page.created_time,
		lastEdited: page.last_edited_time,
		title,
		titleProperty,
		properties: props,
		content: content || null,
	};
}
