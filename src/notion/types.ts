import type { Client } from "@notionhq/client";

export interface DatabaseEntry {
	readonly data_source_id: string;
	readonly title_property: string;
}

export interface DatabaseRegistry {
	readonly [name: string]: DatabaseEntry;
}

export interface SchemaProperty {
	readonly type: string;
	readonly options?: readonly string[];
}

export interface DatabaseSchema {
	readonly data_source_id: string;
	readonly title_property: string;
	readonly schema: Readonly<Record<string, SchemaProperty>>;
	readonly sqlite?: string;
}

export interface SchemaRegistry {
	readonly [name: string]: DatabaseSchema;
}

export interface AppConfig {
	readonly databases: DatabaseRegistry;
	readonly schemas: SchemaRegistry;
	readonly notionApiKey: string;
	readonly githubPat?: string;
}

export type NotionClient = Client;

export interface NotionFilter {
	readonly property: string;
	readonly select?: { readonly equals: string };
	readonly checkbox?: { readonly equals: boolean };
	readonly date?: {
		readonly equals?: string;
		readonly before?: string;
		readonly after?: string;
		readonly on_or_before?: string;
		readonly on_or_after?: string;
	};
}

export interface NotionSort {
	readonly property: string;
	readonly direction: "ascending" | "descending";
}

export interface QueryOptions {
	readonly database: string;
	readonly filters?: readonly NotionFilter[];
	readonly filterOperator?: "and" | "or";
	readonly sorts?: readonly NotionSort[];
	readonly limit?: number;
}

export interface CreatePageOptions {
	readonly database: string;
	readonly title: string;
	readonly properties?: Readonly<Record<string, unknown>>;
}

export interface UpdatePageOptions {
	readonly pageId: string;
	readonly properties: Readonly<Record<string, unknown>>;
}
