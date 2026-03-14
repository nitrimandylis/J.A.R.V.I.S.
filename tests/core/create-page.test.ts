import { describe, expect, test } from "bun:test";
import type { CreatePageResult } from "../../src/core/types.ts";
import { formatCreateResult } from "../../src/presentation/notion-formatters.ts";

describe("formatCreateResult", () => {
	test("formats created page", () => {
		const result: CreatePageResult = {
			id: "page-123",
			url: "https://notion.so/page-123",
			title: "My New Page",
		};
		expect(formatCreateResult(result)).toBe(
			"Created: My New Page (ID: page-123, URL: https://notion.so/page-123)",
		);
	});
});
