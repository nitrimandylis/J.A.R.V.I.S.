import type { DatabaseRegistry } from "./types.ts";

export interface ResolvedDatabase {
	readonly key: string;
	readonly id: string;
	readonly titleProp: string;
}

export function findDatabase(
	databases: DatabaseRegistry,
	name: string,
): ResolvedDatabase {
	// Exact match
	if (databases[name]) {
		return {
			key: name,
			id: databases[name]!.data_source_id,
			titleProp: databases[name]!.title_property,
		};
	}
	// Case-insensitive match
	const lower = name.toLowerCase();
	for (const [key, entry] of Object.entries(databases)) {
		if (key.toLowerCase() === lower) {
			return { key, id: entry.data_source_id, titleProp: entry.title_property };
		}
	}
	// Partial match
	for (const [key, entry] of Object.entries(databases)) {
		if (
			key.toLowerCase().includes(lower) ||
			lower.includes(key.toLowerCase())
		) {
			return { key, id: entry.data_source_id, titleProp: entry.title_property };
		}
	}
	const available = Object.keys(databases).join(", ");
	throw new Error(`Database "${name}" not found. Available: ${available}`);
}
