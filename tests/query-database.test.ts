import { describe, expect, test } from "bun:test";
import { findDatabase } from "../src/notion/database.ts";
import { extractPropertyValue } from "../src/notion/properties.ts";

describe("extractPropertyValue", () => {
	test("extracts title", () => {
		const prop = { type: "title", title: [{ plain_text: "My Task" }] };
		expect(extractPropertyValue(prop)).toBe("My Task");
	});

	test("extracts select", () => {
		const prop = { type: "select", select: { name: "In Progress" } };
		expect(extractPropertyValue(prop)).toBe("In Progress");
	});

	test("extracts multi_select", () => {
		const prop = {
			type: "multi_select",
			multi_select: [{ name: "CAS" }, { name: "CS Project" }],
		};
		expect(extractPropertyValue(prop)).toBe("CAS, CS Project");
	});

	test("extracts date", () => {
		const prop = { type: "date", date: { start: "2026-03-14" } };
		expect(extractPropertyValue(prop)).toBe("2026-03-14");
	});

	test("extracts date range", () => {
		const prop = {
			type: "date",
			date: { start: "2026-03-14", end: "2026-03-20" },
		};
		expect(extractPropertyValue(prop)).toBe("2026-03-14 → 2026-03-20");
	});

	test("extracts checkbox", () => {
		expect(extractPropertyValue({ type: "checkbox", checkbox: true })).toBe(
			"Yes",
		);
		expect(extractPropertyValue({ type: "checkbox", checkbox: false })).toBe(
			"No",
		);
	});

	test("extracts number", () => {
		expect(extractPropertyValue({ type: "number", number: 42 })).toBe("42");
	});

	test("handles null select", () => {
		expect(extractPropertyValue({ type: "select", select: null })).toBe("");
	});

	test("handles null date", () => {
		expect(extractPropertyValue({ type: "date", date: null })).toBe("");
	});

	test("extracts rich_text", () => {
		const prop = {
			type: "rich_text",
			rich_text: [{ plain_text: "Some text" }],
		};
		expect(extractPropertyValue(prop)).toBe("Some text");
	});

	test("extracts url", () => {
		const prop = { type: "url", url: "https://example.com" };
		expect(extractPropertyValue(prop)).toBe("https://example.com");
	});

	test("extracts created_time", () => {
		const prop = {
			type: "created_time",
			created_time: "2026-03-14T10:00:00.000Z",
		};
		expect(extractPropertyValue(prop)).toBe("2026-03-14");
	});
});

describe("findDatabase", () => {
	const databases = {
		Assignments: {
			data_source_id: "a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d",
			title_property: "Task",
		},
		"Side Quests": {
			data_source_id: "12345678-1234-1234-8234-123456789abc",
			title_property: "Name",
		},
		"Daily Notes": {
			data_source_id: "87654321-4321-4321-8321-cba987654321",
			title_property: "Date",
		},
	};

	test("exact match", () => {
		expect(findDatabase(databases, "Assignments").key).toBe("Assignments");
	});

	test("case-insensitive match", () => {
		expect(findDatabase(databases, "assignments").key).toBe("Assignments");
	});

	test("partial match", () => {
		expect(findDatabase(databases, "side").key).toBe("Side Quests");
	});

	test("throws on no match", () => {
		expect(() => findDatabase(databases, "nonexistent")).toThrow("not found");
	});

	test("returns correct id and titleProp", () => {
		const result = findDatabase(databases, "Daily Notes");
		expect(result.id).toBe("87654321-4321-4321-8321-cba987654321");
		expect(result.titleProp).toBe("Date");
	});
});
