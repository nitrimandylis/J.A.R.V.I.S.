import { createNotionClient } from "../notion/client.ts";
import { findDatabase } from "../notion/database.ts";
import { extractAllProperties } from "../notion/properties.ts";
import type { AppConfig, NotionFilter, NotionSort } from "../notion/types.ts";
import type {
	QueryDatabaseOptions,
	QueryDatabaseResult,
	QueryRow,
} from "./types.ts";

export async function queryDatabase(
	config: AppConfig,
	options: QueryDatabaseOptions,
): Promise<QueryDatabaseResult> {
	const db = findDatabase(config.databases, options.database);
	const notion = createNotionClient(config.notionApiKey);

	// Build filters
	const filters: NotionFilter[] = [];
	if (options.status) {
		filters.push({ property: "Status", select: { equals: options.status } });
	}
	if (options.priority) {
		filters.push({
			property: "Priority",
			select: { equals: options.priority },
		});
	}

	// Build sorts
	const sorts: NotionSort[] = [];
	if (options.sort) {
		const [prop, dir] = options.sort.split(":");
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

	if (options.limit) {
		queryParams.page_size = Math.min(options.limit, 100);
	}

	const response = await notion.dataSources.query(
		queryParams as Parameters<typeof notion.dataSources.query>[0],
	);

	const rows: QueryRow[] = response.results.map(
		(page: Record<string, unknown>) => {
			const props = page.properties as Record<string, Record<string, unknown>>;
			const extracted = extractAllProperties(props);
			return {
				...extracted,
				_id: page.id as string,
				_url: page.url as string,
			};
		},
	);

	// Determine display columns from schema or first row
	const schema = config.schemas[db.key]?.schema;
	const displayColumns = schema
		? Object.keys(schema).filter((k) => k !== db.titleProp)
		: rows.length > 0
			? Object.keys(rows[0]!).filter(
					(k) => k !== "_url" && k !== "_id" && k !== db.titleProp,
				)
			: [];

	return {
		databaseKey: db.key,
		titleProp: db.titleProp,
		displayColumns,
		rows,
	};
}
