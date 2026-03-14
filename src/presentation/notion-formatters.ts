/**
 * Human-readable formatters for Notion operation results.
 * Pure functions: structured result → string.
 */

import type {
	CreatePageResult,
	DeletePageResult,
	PageResult,
	QueryDatabaseResult,
	UpdatePageResult,
} from "../core/types.ts";

export function formatDeleteResult(result: DeletePageResult): string {
	return `Archived: ${result.id} (${result.url})`;
}

export function formatCreateResult(result: CreatePageResult): string {
	return `Created: ${result.title} (ID: ${result.id}, URL: ${result.url})`;
}

export function formatPageResult(result: PageResult): string {
	const lines: string[] = [];

	lines.push(result.title);
	lines.push(`ID: ${result.id}`);
	lines.push(`URL: ${result.url}`);
	lines.push(`Created: ${result.created.split("T")[0]}`);
	lines.push(`Edited: ${result.lastEdited.split("T")[0]}`);
	if (result.archived) {
		lines.push("Status: ARCHIVED");
	}
	lines.push("");

	for (const [key, value] of Object.entries(result.properties)) {
		if (key === result.titleProperty) continue;
		lines.push(`${key}: ${value}`);
	}

	if (result.content) {
		lines.push("\n--- Content ---\n");
		lines.push(result.content);
	}

	return lines.join("\n");
}

export function formatQueryResult(result: QueryDatabaseResult): string {
	if (result.rows.length === 0) {
		return `No results found in ${result.databaseKey}.`;
	}

	const lines: string[] = [];
	lines.push(`${result.databaseKey} — ${result.rows.length} result(s)\n`);

	for (const row of result.rows) {
		const title = row[result.titleProp] ?? "Untitled";
		const details = result.displayColumns
			.map((col) => {
				const val = row[col];
				return val ? `${col}: ${val}` : null;
			})
			.filter(Boolean)
			.join(" | ");
		lines.push(`• ${title} [${row._id}]`);
		if (details) {
			lines.push(`  ${details}`);
		}
	}

	return lines.join("\n");
}

export function formatUpdateResult(result: UpdatePageResult): string {
	const lines: string[] = [];

	if (result.propertiesUpdated) {
		lines.push("Properties updated.");
	}

	if (result.contentAction === "appended") {
		lines.push(`Appended ${result.blockCount} block(s).`);
	} else if (result.contentAction === "replaced") {
		lines.push(`Replaced content with ${result.blockCount} block(s).`);
	}

	lines.push(`Done: ${result.id}`);
	return lines.join("\n");
}
