import { describe, expect, test } from "bun:test";
import type { PageResult } from "../../src/core/types.ts";
import { formatPageResult } from "../../src/presentation/notion-formatters.ts";

describe("formatPageResult", () => {
	test("formats page with properties", () => {
		const result: PageResult = {
			id: "page-123",
			url: "https://notion.so/page-123",
			archived: false,
			created: "2026-03-14T10:00:00Z",
			lastEdited: "2026-03-14T12:00:00Z",
			title: "My Page",
			titleProperty: "Name",
			properties: { Name: "My Page", Status: "To Do" },
			content: null,
		};

		const output = formatPageResult(result);
		expect(output).toContain("My Page");
		expect(output).toContain("ID: page-123");
		expect(output).toContain("URL: https://notion.so/page-123");
		expect(output).toContain("Created: 2026-03-14");
		expect(output).toContain("Status: To Do");
		expect(output).not.toContain("Name: My Page"); // title prop excluded from details
	});

	test("formats archived page", () => {
		const result: PageResult = {
			id: "page-456",
			url: "https://notion.so/page-456",
			archived: true,
			created: "2026-03-14T10:00:00Z",
			lastEdited: "2026-03-14T12:00:00Z",
			title: "Archived Page",
			titleProperty: "Title",
			properties: { Title: "Archived Page" },
			content: null,
		};

		expect(formatPageResult(result)).toContain("Status: ARCHIVED");
	});

	test("formats page with content", () => {
		const result: PageResult = {
			id: "page-789",
			url: "https://notion.so/page-789",
			archived: false,
			created: "2026-03-14T10:00:00Z",
			lastEdited: "2026-03-14T12:00:00Z",
			title: "Content Page",
			titleProperty: "Name",
			properties: { Name: "Content Page" },
			content: "## Heading\n- Item 1",
		};

		const output = formatPageResult(result);
		expect(output).toContain("--- Content ---");
		expect(output).toContain("## Heading\n- Item 1");
	});
});
