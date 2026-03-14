import { describe, expect, test } from "bun:test";
import { markdownToBlocks } from "../src/notion/blocks.ts";

describe("markdownToBlocks", () => {
	test("parses heading 1", () => {
		const blocks = markdownToBlocks("# Title");
		expect(blocks).toEqual([
			{
				object: "block",
				type: "heading_1",
				heading_1: { rich_text: [{ text: { content: "Title" } }] },
			},
		]);
	});

	test("parses heading 2", () => {
		const blocks = markdownToBlocks("## Subtitle");
		expect(blocks[0]).toMatchObject({ type: "heading_2" });
	});

	test("parses heading 3", () => {
		const blocks = markdownToBlocks("### Section");
		expect(blocks[0]).toMatchObject({ type: "heading_3" });
	});

	test("parses bulleted list items", () => {
		const blocks = markdownToBlocks("- Item 1\n- Item 2");
		expect(blocks).toHaveLength(2);
		expect(blocks[0]).toMatchObject({
			type: "bulleted_list_item",
			bulleted_list_item: {
				rich_text: [{ text: { content: "Item 1" } }],
			},
		});
	});

	test("parses numbered list items", () => {
		const blocks = markdownToBlocks("1. First\n2. Second");
		expect(blocks).toHaveLength(2);
		expect(blocks[0]).toMatchObject({
			type: "numbered_list_item",
			numbered_list_item: {
				rich_text: [{ text: { content: "First" } }],
			},
		});
	});

	test("parses unchecked to-do", () => {
		const blocks = markdownToBlocks("- [ ] Task");
		expect(blocks[0]).toMatchObject({
			type: "to_do",
			to_do: {
				rich_text: [{ text: { content: "Task" } }],
				checked: false,
			},
		});
	});

	test("parses checked to-do", () => {
		const blocks = markdownToBlocks("- [x] Done task");
		expect(blocks[0]).toMatchObject({
			type: "to_do",
			to_do: {
				rich_text: [{ text: { content: "Done task" } }],
				checked: true,
			},
		});
	});

	test("parses quote", () => {
		const blocks = markdownToBlocks("> Quote text");
		expect(blocks[0]).toMatchObject({
			type: "quote",
			quote: { rich_text: [{ text: { content: "Quote text" } }] },
		});
	});

	test("parses divider", () => {
		const blocks = markdownToBlocks("---");
		expect(blocks[0]).toMatchObject({ type: "divider", divider: {} });
	});

	test("parses code block", () => {
		const blocks = markdownToBlocks("```typescript\nconst x = 1;\n```");
		expect(blocks[0]).toMatchObject({
			type: "code",
			code: {
				rich_text: [{ text: { content: "const x = 1;" } }],
				language: "typescript",
			},
		});
	});

	test("parses code block without language", () => {
		const blocks = markdownToBlocks("```\nhello\n```");
		expect(blocks[0]).toMatchObject({
			type: "code",
			code: { language: "plain text" },
		});
	});

	test("parses paragraph", () => {
		const blocks = markdownToBlocks("Just some text");
		expect(blocks[0]).toMatchObject({
			type: "paragraph",
			paragraph: {
				rich_text: [{ text: { content: "Just some text" } }],
			},
		});
	});

	test("skips empty lines", () => {
		const blocks = markdownToBlocks("Line 1\n\nLine 2");
		expect(blocks).toHaveLength(2);
	});

	test("parses mixed content", () => {
		const md = `## What I worked on
- Built JARVIS engine
- Migrated from cortex
## Tomorrow
- [ ] Fix tests
- [x] Update docs`;
		const blocks = markdownToBlocks(md);
		expect(blocks).toHaveLength(6);
		expect(blocks[0]).toMatchObject({ type: "heading_2" });
		expect(blocks[1]).toMatchObject({ type: "bulleted_list_item" });
		expect(blocks[4]).toMatchObject({
			type: "to_do",
			to_do: { checked: false },
		});
		expect(blocks[5]).toMatchObject({
			type: "to_do",
			to_do: { checked: true },
		});
	});
});
