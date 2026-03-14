import type {
	DatabaseRegistry,
	SchemaRegistry,
} from "../../src/notion/types.ts";

export const mockDatabases: DatabaseRegistry = Object.freeze({
	"Test DB": {
		data_source_id: "a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d",
		title_property: "Name",
	},
	"Another DB": {
		data_source_id: "12345678-1234-1234-8234-123456789abc",
		title_property: "Title",
	},
});

export const mockSchemas: SchemaRegistry = Object.freeze({
	"Test DB": {
		data_source_id: "a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d",
		title_property: "Name",
		schema: {
			Name: { type: "title" },
			Status: { type: "select", options: ["To Do", "Done"] },
		},
	},
});

export function createMockQueryResponse(
	pages: readonly Record<string, unknown>[],
) {
	return {
		results: pages.map((props, i) => ({
			id: `page-${i}`,
			url: `https://notion.so/page-${i}`,
			properties: props,
		})),
		has_more: false,
		next_cursor: null,
	};
}

export function mockTitleProperty(text: string) {
	return { title: [{ plain_text: text }] };
}

export function mockSelectProperty(name: string) {
	return { select: { name } };
}

export function mockMultiSelectProperty(names: readonly string[]) {
	return { multi_select: names.map((name) => ({ name })) };
}
