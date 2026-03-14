import { describe, expect, test } from "bun:test";
import { extractAllProperties } from "../src/notion/properties.ts";

describe("extractAllProperties", () => {
	test("extracts all non-empty properties", () => {
		const properties = {
			Name: { type: "title", title: [{ plain_text: "Test Page" }] },
			Status: { type: "select", select: { name: "Done" } },
			Notes: { type: "rich_text", rich_text: [] },
			Count: { type: "number", number: 42 },
		};

		const result = extractAllProperties(
			properties as Record<string, Record<string, unknown>>,
		);
		expect(result).toEqual({
			Name: "Test Page",
			Status: "Done",
			Count: "42",
		});
		// Empty rich_text should not appear
		expect(result).not.toHaveProperty("Notes");
	});

	test("handles mixed property types", () => {
		const properties = {
			Title: { type: "title", title: [{ plain_text: "My Item" }] },
			Tags: {
				type: "multi_select",
				multi_select: [{ name: "A" }, { name: "B" }],
			},
			Due: { type: "date", date: { start: "2026-03-14" } },
			Done: { type: "checkbox", checkbox: true },
			URL: { type: "url", url: "https://example.com" },
		};

		const result = extractAllProperties(
			properties as Record<string, Record<string, unknown>>,
		);
		expect(result.Title).toBe("My Item");
		expect(result.Tags).toBe("A, B");
		expect(result.Due).toBe("2026-03-14");
		expect(result.Done).toBe("Yes");
		expect(result.URL).toBe("https://example.com");
	});
});
