import type { SchemaProperty } from "./types.ts";

export type SchemaMap = Readonly<Record<string, SchemaProperty>>;

/**
 * Extract a human-readable string from a Notion property value.
 */
export function extractPropertyValue(prop: Record<string, unknown>): string {
	if (!prop || typeof prop !== "object") return "";

	const type = prop.type as string;

	switch (type) {
		case "title":
			return ((prop.title as Array<{ plain_text: string }>) ?? [])
				.map((t) => t.plain_text)
				.join("");
		case "rich_text":
			return ((prop.rich_text as Array<{ plain_text: string }>) ?? [])
				.map((t) => t.plain_text)
				.join("");
		case "select":
			return (prop.select as { name: string } | null)?.name ?? "";
		case "multi_select":
			return ((prop.multi_select as Array<{ name: string }>) ?? [])
				.map((s) => s.name)
				.join(", ");
		case "checkbox":
			return prop.checkbox ? "Yes" : "No";
		case "number":
			return prop.number?.toString() ?? "";
		case "url":
			return (prop.url as string) ?? "";
		case "date": {
			const date = prop.date as { start?: string; end?: string } | null;
			if (!date) return "";
			return date.end ? `${date.start} → ${date.end}` : (date.start ?? "");
		}
		case "created_time":
			return (prop.created_time as string)?.split("T")[0] ?? "";
		case "last_edited_time":
			return (prop.last_edited_time as string)?.split("T")[0] ?? "";
		case "email":
			return (prop.email as string) ?? "";
		case "phone_number":
			return (prop.phone_number as string) ?? "";
		case "files":
			return ((prop.files as Array<{ name: string }>) ?? [])
				.map((f) => f.name)
				.join(", ");
		default:
			return JSON.stringify(prop[type] ?? "");
	}
}

/**
 * Build a Notion API property value from a user-provided value,
 * using the schema to determine the correct format.
 */
export function buildPropertyValue(
	key: string,
	value: unknown,
	schema: SchemaMap,
): Record<string, unknown> {
	const propSchema = schema[key];
	if (!propSchema) {
		throw new Error(
			`Unknown property "${key}". Available: ${Object.keys(schema).join(", ")}`,
		);
	}
	return buildPropertyByType(propSchema.type, value);
}

/**
 * Build a Notion API property value from a type string.
 * Used when schema lookup is handled externally.
 */
export function buildPropertyByType(
	type: string,
	value: unknown,
): Record<string, unknown> {
	switch (type) {
		case "title":
			return { title: [{ text: { content: String(value) } }] };
		case "rich_text":
		case "text":
			return { rich_text: [{ text: { content: String(value) } }] };
		case "select":
			return { select: { name: String(value) } };
		case "multi_select": {
			const items = Array.isArray(value)
				? value
				: String(value)
						.split(",")
						.map((s) => s.trim());
			return { multi_select: items.map((name: string) => ({ name })) };
		}
		case "checkbox":
			return {
				checkbox: value === true || value === "true" || value === "Yes",
			};
		case "number":
			return { number: Number(value) };
		case "url":
			return { url: String(value) };
		case "date":
			return { date: { start: String(value) } };
		case "email":
			return { email: String(value) };
		case "phone_number":
			return { phone_number: String(value) };
		default:
			return { rich_text: [{ text: { content: String(value) } }] };
	}
}

/**
 * Extract all properties from a Notion page into a flat key-value map.
 */
export function extractAllProperties(
	properties: Record<string, Record<string, unknown>>,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(properties)) {
		const extracted = extractPropertyValue(value);
		if (extracted) {
			result[key] = extracted;
		}
	}
	return result;
}
