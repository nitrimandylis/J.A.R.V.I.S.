import { describe, expect, test } from "bun:test";
import type { QueryDatabaseResult } from "../../src/core/types.ts";
import { formatQueryResult } from "../../src/presentation/notion-formatters.ts";

describe("formatQueryResult", () => {
	test("formats empty results", () => {
		const result: QueryDatabaseResult = {
			databaseKey: "Assignments",
			titleProp: "Task",
			displayColumns: ["Status", "Due"],
			rows: [],
		};
		expect(formatQueryResult(result)).toBe("No results found in Assignments.");
	});

	test("formats rows with display columns", () => {
		const result: QueryDatabaseResult = {
			databaseKey: "Assignments",
			titleProp: "Task",
			displayColumns: ["Status", "Due"],
			rows: [
				{
					Task: "TOK Essay",
					Status: "To Do",
					Due: "2026-03-20",
					_id: "page-1",
					_url: "https://notion.so/page-1",
				},
				{
					Task: "Math IA",
					Status: "In Progress",
					Due: "",
					_id: "page-2",
					_url: "https://notion.so/page-2",
				},
			],
		};

		const output = formatQueryResult(result);
		expect(output).toContain("Assignments — 2 result(s)");
		expect(output).toContain("• TOK Essay [page-1]");
		expect(output).toContain("Status: To Do | Due: 2026-03-20");
		expect(output).toContain("• Math IA [page-2]");
		// Due is empty for Math IA, so only Status shown
		expect(output).toContain("  Status: In Progress");
	});

	test("handles rows with no title", () => {
		const result: QueryDatabaseResult = {
			databaseKey: "Test DB",
			titleProp: "Name",
			displayColumns: [],
			rows: [{ _id: "page-1", _url: "https://notion.so/page-1" }],
		};

		const output = formatQueryResult(result);
		expect(output).toContain("• Untitled [page-1]");
	});
});
