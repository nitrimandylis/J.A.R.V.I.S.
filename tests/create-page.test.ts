import { describe, expect, test } from "bun:test";
import {
	buildPropertyByType,
	buildPropertyValue,
	type SchemaMap,
} from "../src/notion/properties.ts";

const schema: SchemaMap = {
	Task: { type: "title" },
	Status: { type: "select", options: ["To Do", "In Progress", "Done"] },
	Tags: { type: "multi_select", options: ["School", "Personal"] },
	Notes: { type: "text" },
	Done: { type: "checkbox" },
	Hours: { type: "number" },
	Link: { type: "url" },
	Due: { type: "date" },
};

describe("buildPropertyValue (schema-aware)", () => {
	test("builds title", () => {
		expect(buildPropertyValue("Task", "My Task", schema)).toEqual({
			title: [{ text: { content: "My Task" } }],
		});
	});

	test("builds select", () => {
		expect(buildPropertyValue("Status", "To Do", schema)).toEqual({
			select: { name: "To Do" },
		});
	});

	test("builds multi_select from comma string", () => {
		expect(buildPropertyValue("Tags", "School, Personal", schema)).toEqual({
			multi_select: [{ name: "School" }, { name: "Personal" }],
		});
	});

	test("builds multi_select from array", () => {
		expect(buildPropertyValue("Tags", ["School", "Personal"], schema)).toEqual({
			multi_select: [{ name: "School" }, { name: "Personal" }],
		});
	});

	test("builds checkbox", () => {
		expect(buildPropertyValue("Done", true, schema)).toEqual({
			checkbox: true,
		});
		expect(buildPropertyValue("Done", "true", schema)).toEqual({
			checkbox: true,
		});
		expect(buildPropertyValue("Done", "false", schema)).toEqual({
			checkbox: false,
		});
	});

	test("builds number", () => {
		expect(buildPropertyValue("Hours", 5, schema)).toEqual({ number: 5 });
	});

	test("builds url", () => {
		expect(buildPropertyValue("Link", "https://example.com", schema)).toEqual({
			url: "https://example.com",
		});
	});

	test("builds date", () => {
		expect(buildPropertyValue("Due", "2026-03-14", schema)).toEqual({
			date: { start: "2026-03-14" },
		});
	});

	test("builds text/rich_text", () => {
		expect(buildPropertyValue("Notes", "Some notes", schema)).toEqual({
			rich_text: [{ text: { content: "Some notes" } }],
		});
	});

	test("throws on unknown property", () => {
		expect(() => buildPropertyValue("Unknown", "value", schema)).toThrow(
			"Unknown property",
		);
	});
});

describe("buildPropertyByType (type-only)", () => {
	test("builds select by type", () => {
		expect(buildPropertyByType("select", "Done")).toEqual({
			select: { name: "Done" },
		});
	});

	test("builds checkbox by type", () => {
		expect(buildPropertyByType("checkbox", true)).toEqual({ checkbox: true });
	});

	test("defaults to rich_text for unknown type", () => {
		expect(buildPropertyByType("unknown_type", "value")).toEqual({
			rich_text: [{ text: { content: "value" } }],
		});
	});
});
