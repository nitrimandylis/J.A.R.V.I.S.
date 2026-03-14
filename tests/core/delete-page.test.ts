import { describe, expect, test } from "bun:test";
import type { DeletePageResult } from "../../src/core/types.ts";
import { formatDeleteResult } from "../../src/presentation/notion-formatters.ts";

describe("formatDeleteResult", () => {
	test("formats archived page", () => {
		const result: DeletePageResult = {
			id: "abc-123",
			url: "https://notion.so/abc-123",
		};
		expect(formatDeleteResult(result)).toBe(
			"Archived: abc-123 (https://notion.so/abc-123)",
		);
	});
});
