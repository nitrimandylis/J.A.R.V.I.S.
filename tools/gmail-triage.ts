#!/usr/bin/env bun

/**
 * Check unread Gmail messages and surface ones that need attention.
 *
 * Usage:
 *   bun run tools/gmail-triage.ts [--limit <n>] [--json]
 *
 * Examples:
 *   bun run tools/gmail-triage.ts
 *   bun run tools/gmail-triage.ts --limit 30
 *   bun run tools/gmail-triage.ts --json
 *
 * Requires: gws CLI authenticated (run `gws auth login -s gmail`)
 */

import { parseArgs } from "node:util";

const NOISE_PATTERNS = [
	"noreply",
	"no-reply",
	"donotreply",
	"notifications@",
	"updates@",
	"newsletter@",
	"mailer-daemon",
	"linkedin.com",
	"github.com",
	"accounts.google",
	"noreply@google",
	"spotify.com",
	"marketing@",
	"promo@",
	"digest@",
	"info@",
	"support@",
	"billing@",
] as const;

interface MessageListResponse {
	readonly messages?: readonly { id: string; threadId: string }[];
	readonly resultSizeEstimate?: number;
}

interface MessageHeader {
	readonly name: string;
	readonly value: string;
}

interface MessageResponse {
	readonly id: string;
	readonly payload?: {
		readonly headers?: readonly MessageHeader[];
	};
}

async function runGws(args: readonly string[]): Promise<string> {
	const proc = Bun.spawn(["gws", ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		const error = stderr || stdout;
		if (error.includes("401") || error.includes("No credentials")) {
			throw new Error("Not authenticated. Run: gws auth login -s gmail");
		}
		throw new Error(`gws failed: ${error.trim()}`);
	}
	return stdout.trim();
}

function getHeader(
	msg: MessageResponse,
	name: string,
): string {
	const header = msg.payload?.headers?.find(
		(h) => h.name.toLowerCase() === name.toLowerCase(),
	);
	return header?.value ?? "";
}

function isNoise(from: string): boolean {
	const lower = from.toLowerCase();
	return NOISE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function extractSenderName(from: string): string {
	// "Name <email>" → "Name", or just the email
	const match = from.match(/^"?([^"<]+)"?\s*</);
	if (match) return match[1]!.trim();
	return from.split("@")[0] ?? from;
}

function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return `${str.slice(0, maxLen - 1)}…`;
}

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			limit: { type: "string", default: "20" },
			json: { type: "boolean", default: false },
		},
		strict: true,
	});

	const maxResults = Math.min(Number.parseInt(values.limit!, 10), 50);

	// List unread messages
	const listRaw = await runGws([
		"gmail",
		"users",
		"messages",
		"list",
		"--params",
		JSON.stringify({
			userId: "me",
			q: "is:unread",
			maxResults,
		}),
	]);
	const listData = JSON.parse(listRaw) as MessageListResponse;
	const messageRefs = listData.messages ?? [];
	const totalUnread = messageRefs.length;

	if (totalUnread === 0) {
		if (values.json) {
			console.log(JSON.stringify({ total: 0, filtered: [] }, null, 2));
		} else {
			console.log("📬  Inbox clear.");
		}
		return;
	}

	// Fetch message details (in parallel, batches of 5)
	const messages: MessageResponse[] = [];
	const BATCH_SIZE = 5;

	for (let i = 0; i < messageRefs.length; i += BATCH_SIZE) {
		const batch = messageRefs.slice(i, i + BATCH_SIZE);
		const fetches = batch.map(async (ref) => {
			const raw = await runGws([
				"gmail",
				"users",
				"messages",
				"get",
				"--params",
				JSON.stringify({
					userId: "me",
					id: ref.id,
					format: "metadata",
					metadataHeaders: "From,Subject",
				}),
			]);
			return JSON.parse(raw) as MessageResponse;
		});
		const results = await Promise.all(fetches);
		messages.push(...results);
	}

	// Filter noise
	const actionable = messages.filter((msg) => {
		const from = getHeader(msg, "From");
		return !isNoise(from);
	});

	if (values.json) {
		const output = actionable.map((msg) => ({
			id: msg.id,
			from: getHeader(msg, "From"),
			subject: getHeader(msg, "Subject"),
		}));
		console.log(
			JSON.stringify({ total: totalUnread, filtered: output }, null, 2),
		);
		return;
	}

	if (actionable.length === 0) {
		console.log(
			`📬  Inbox clear (${totalUnread} unread, all filtered as noise).`,
		);
		return;
	}

	console.log(
		`📬  ${actionable.length} unread (filtered from ${totalUnread} total):`,
	);
	for (const msg of actionable) {
		const subject = truncate(getHeader(msg, "Subject") || "(no subject)", 50);
		const sender = extractSenderName(getHeader(msg, "From"));
		console.log(`    "${subject}" — ${sender}`);
	}
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
