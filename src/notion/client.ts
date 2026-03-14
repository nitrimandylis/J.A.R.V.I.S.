import { Client } from "@notionhq/client";
import type { NotionClient } from "./types.ts";

export function createNotionClient(apiKey: string): NotionClient {
	if (!apiKey || apiKey.trim() === "") {
		throw new Error("Notion API key is required");
	}
	return new Client({ auth: apiKey });
}
