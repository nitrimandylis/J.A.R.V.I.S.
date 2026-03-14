import { createNotionClient } from "../notion/client.ts";
import type { AppConfig } from "../notion/types.ts";
import type { DeletePageOptions, DeletePageResult } from "./types.ts";

export async function deletePage(
	config: AppConfig,
	options: DeletePageOptions,
): Promise<DeletePageResult> {
	const notion = createNotionClient(config.notionApiKey);

	const response = (await notion.pages.update({
		page_id: options.id,
		archived: true,
	})) as { id: string; url: string };

	return {
		id: response.id,
		url: response.url,
	};
}
