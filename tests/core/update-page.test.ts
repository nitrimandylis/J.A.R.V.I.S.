import { describe, expect, test } from "bun:test";
import type { UpdatePageResult } from "../../src/core/types.ts";
import { formatUpdateResult } from "../../src/presentation/notion-formatters.ts";

describe("formatUpdateResult", () => {
	test("formats properties-only update", () => {
		const result: UpdatePageResult = {
			id: "page-123",
			propertiesUpdated: true,
			contentAction: "none",
			blockCount: 0,
		};
		const output = formatUpdateResult(result);
		expect(output).toContain("Properties updated.");
		expect(output).toContain("Done: page-123");
		expect(output).not.toContain("block(s)");
	});

	test("formats content replace", () => {
		const result: UpdatePageResult = {
			id: "page-123",
			propertiesUpdated: false,
			contentAction: "replaced",
			blockCount: 5,
		};
		const output = formatUpdateResult(result);
		expect(output).toContain("Replaced content with 5 block(s).");
		expect(output).not.toContain("Properties updated.");
	});

	test("formats content append", () => {
		const result: UpdatePageResult = {
			id: "page-123",
			propertiesUpdated: false,
			contentAction: "appended",
			blockCount: 3,
		};
		expect(formatUpdateResult(result)).toContain("Appended 3 block(s).");
	});

	test("formats combined properties + content update", () => {
		const result: UpdatePageResult = {
			id: "page-123",
			propertiesUpdated: true,
			contentAction: "replaced",
			blockCount: 2,
		};
		const output = formatUpdateResult(result);
		expect(output).toContain("Properties updated.");
		expect(output).toContain("Replaced content with 2 block(s).");
		expect(output).toContain("Done: page-123");
	});
});
