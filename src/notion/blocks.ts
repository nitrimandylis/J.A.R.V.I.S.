import type { NotionClient } from "./types.ts";

interface RichText {
	readonly plain_text: string;
	readonly annotations?: {
		readonly bold?: boolean;
		readonly italic?: boolean;
		readonly strikethrough?: boolean;
		readonly underline?: boolean;
		readonly code?: boolean;
	};
}

interface NotionBlock {
	readonly id: string;
	readonly type: string;
	readonly has_children: boolean;
	readonly [key: string]: unknown;
}

/**
 * Extract plain text from a rich_text array.
 */
function richTextToString(richText: readonly RichText[]): string {
	return richText.map((t) => t.plain_text).join("");
}

/**
 * Convert a single Notion block to a human-readable string.
 * Returns the text with appropriate markdown-like formatting.
 */
function blockToString(block: NotionBlock, depth: number = 0): string {
	const indent = "  ".repeat(depth);
	const type = block.type;
	const data = block[type] as Record<string, unknown> | undefined;

	if (!data) return "";

	const richText = data.rich_text as readonly RichText[] | undefined;
	const text = richText ? richTextToString(richText) : "";

	switch (type) {
		case "paragraph":
			return text ? `${indent}${text}` : "";

		case "heading_1":
			return `${indent}# ${text}`;

		case "heading_2":
			return `${indent}## ${text}`;

		case "heading_3":
			return `${indent}### ${text}`;

		case "bulleted_list_item":
			return `${indent}- ${text}`;

		case "numbered_list_item":
			return `${indent}1. ${text}`;

		case "to_do": {
			const checked = data.checked as boolean;
			return `${indent}- [${checked ? "x" : " "}] ${text}`;
		}

		case "toggle":
			return `${indent}> ${text}`;

		case "quote":
			return `${indent}> ${text}`;

		case "callout": {
			const icon = data.icon as { emoji?: string } | undefined;
			const emoji = icon?.emoji ?? "";
			return `${indent}${emoji} ${text}`.trim();
		}

		case "code": {
			const language = (data.language as string) ?? "";
			return `${indent}\`\`\`${language}\n${indent}${text}\n${indent}\`\`\``;
		}

		case "divider":
			return `${indent}---`;

		case "image": {
			const imageData = data as {
				type?: string;
				file?: { url?: string };
				external?: { url?: string };
				caption?: readonly RichText[];
			};
			const url =
				imageData.type === "file"
					? imageData.file?.url
					: imageData.external?.url;
			const caption = imageData.caption
				? richTextToString(imageData.caption)
				: "";
			return `${indent}[Image${caption ? `: ${caption}` : ""}]${url ? ` ${url}` : ""}`;
		}

		case "bookmark": {
			const bookmarkUrl = (data.url as string) ?? "";
			const caption = data.caption as readonly RichText[] | undefined;
			const captionText = caption ? richTextToString(caption) : "";
			return `${indent}[Bookmark: ${captionText || bookmarkUrl}]`;
		}

		case "link_preview": {
			const previewUrl = (data.url as string) ?? "";
			return `${indent}[Link: ${previewUrl}]`;
		}

		case "table_of_contents":
			return `${indent}[Table of Contents]`;

		case "child_page": {
			const pageTitle = (data.title as string) ?? "Untitled";
			return `${indent}[Child Page: ${pageTitle}]`;
		}

		case "child_database": {
			const dbTitle = (data.title as string) ?? "Untitled";
			return `${indent}[Child Database: ${dbTitle}]`;
		}

		case "embed": {
			const embedUrl = (data.url as string) ?? "";
			return `${indent}[Embed: ${embedUrl}]`;
		}

		case "equation": {
			const expression = (data.expression as string) ?? "";
			return `${indent}$${expression}$`;
		}

		default:
			return text ? `${indent}${text}` : "";
	}
}

/**
 * Fetch all blocks (content) for a page, handling pagination.
 * Returns blocks as a flat array.
 */
export async function fetchAllBlocks(
	notion: NotionClient,
	pageId: string,
): Promise<readonly NotionBlock[]> {
	const blocks: NotionBlock[] = [];
	let cursor: string | undefined;

	do {
		const response = (await notion.blocks.children.list({
			block_id: pageId,
			start_cursor: cursor,
			page_size: 100,
		})) as {
			results: NotionBlock[];
			has_more: boolean;
			next_cursor: string | null;
		};

		blocks.push(...response.results);
		cursor = response.has_more
			? (response.next_cursor ?? undefined)
			: undefined;
	} while (cursor);

	return blocks;
}

// ─── Writing ────────────────────────────────────────────────────────

type BlockInput = Record<string, unknown>;

function richText(content: string): Array<{ text: { content: string } }> {
	return [{ text: { content } }];
}

/**
 * Parse a single line into a Notion block object.
 */
function lineToBlock(line: string): BlockInput | null {
	// Headings
	if (line.startsWith("### ")) {
		return {
			object: "block",
			type: "heading_3",
			heading_3: { rich_text: richText(line.slice(4)) },
		};
	}
	if (line.startsWith("## ")) {
		return {
			object: "block",
			type: "heading_2",
			heading_2: { rich_text: richText(line.slice(3)) },
		};
	}
	if (line.startsWith("# ")) {
		return {
			object: "block",
			type: "heading_1",
			heading_1: { rich_text: richText(line.slice(2)) },
		};
	}

	// To-do items
	if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
		return {
			object: "block",
			type: "to_do",
			to_do: { rich_text: richText(line.slice(6)), checked: true },
		};
	}
	if (line.startsWith("- [ ] ")) {
		return {
			object: "block",
			type: "to_do",
			to_do: { rich_text: richText(line.slice(6)), checked: false },
		};
	}

	// Bulleted list
	if (line.startsWith("- ")) {
		return {
			object: "block",
			type: "bulleted_list_item",
			bulleted_list_item: { rich_text: richText(line.slice(2)) },
		};
	}

	// Numbered list (matches "1. ", "2. ", etc.)
	const numberedMatch = line.match(/^\d+\.\s+(.*)/);
	if (numberedMatch) {
		return {
			object: "block",
			type: "numbered_list_item",
			numbered_list_item: { rich_text: richText(numberedMatch[1]!) },
		};
	}

	// Quote
	if (line.startsWith("> ")) {
		return {
			object: "block",
			type: "quote",
			quote: { rich_text: richText(line.slice(2)) },
		};
	}

	// Divider
	if (line === "---" || line === "***" || line === "___") {
		return { object: "block", type: "divider", divider: {} };
	}

	// Empty line → skip
	if (line.trim() === "") return null;

	// Default → paragraph
	return {
		object: "block",
		type: "paragraph",
		paragraph: { rich_text: richText(line) },
	};
}

/**
 * Parse markdown-like text into Notion block objects.
 * Handles headings, lists, to-dos, quotes, code blocks, dividers, and paragraphs.
 */
export function markdownToBlocks(markdown: string): readonly BlockInput[] {
	const lines = markdown.split("\n");
	const blocks: BlockInput[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!;

		// Code blocks (fenced)
		if (line.startsWith("```")) {
			const language = line.slice(3).trim() || "plain text";
			const codeLines: string[] = [];
			i++;
			while (i < lines.length && !lines[i]!.startsWith("```")) {
				codeLines.push(lines[i]!);
				i++;
			}
			blocks.push({
				object: "block",
				type: "code",
				code: {
					rich_text: richText(codeLines.join("\n")),
					language,
				},
			});
			i++; // skip closing ```
			continue;
		}

		const block = lineToBlock(line);
		if (block) {
			blocks.push(block);
		}
		i++;
	}

	return blocks;
}

/**
 * Delete all existing blocks from a page.
 */
export async function clearPageContent(
	notion: NotionClient,
	pageId: string,
): Promise<void> {
	const blocks = await fetchAllBlocks(notion, pageId);
	for (const block of blocks) {
		await notion.blocks.delete({ block_id: block.id });
	}
}

/**
 * Append blocks to a page. Notion API limits to 100 blocks per call,
 * so this batches automatically.
 */
export async function appendBlocks(
	notion: NotionClient,
	pageId: string,
	blocks: readonly BlockInput[],
): Promise<void> {
	const BATCH_SIZE = 100;
	for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
		const batch = blocks.slice(i, i + BATCH_SIZE);
		await notion.blocks.children.append({
			block_id: pageId,
			children: batch as Parameters<
				typeof notion.blocks.children.append
			>[0]["children"],
		});
	}
}

/**
 * Replace all content on a page with new markdown-like text.
 * Clears existing blocks, then appends new ones.
 */
export async function replacePageContent(
	notion: NotionClient,
	pageId: string,
	markdown: string,
): Promise<void> {
	await clearPageContent(notion, pageId);
	const blocks = markdownToBlocks(markdown);
	if (blocks.length > 0) {
		await appendBlocks(notion, pageId, blocks);
	}
}

// ─── Reading ────────────────────────────────────────────────────────

/**
 * Recursively fetch blocks and their children, converting to readable text.
 */
export async function fetchPageContent(
	notion: NotionClient,
	pageId: string,
	depth: number = 0,
): Promise<string> {
	const blocks = await fetchAllBlocks(notion, pageId);
	const lines: string[] = [];

	for (const block of blocks) {
		const line = blockToString(block, depth);
		if (line !== "") {
			lines.push(line);
		}

		// Recursively fetch children (nested lists, toggles, etc.)
		if (block.has_children) {
			const childContent = await fetchPageContent(notion, block.id, depth + 1);
			if (childContent) {
				lines.push(childContent);
			}
		}
	}

	return lines.join("\n");
}
