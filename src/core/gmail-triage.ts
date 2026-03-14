import { runGws } from "./gws.ts";
import type {
	EmailMessage,
	GmailTriageOptions,
	GmailTriageResult,
} from "./types.ts";

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

function getHeader(msg: MessageResponse, name: string): string {
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
	const match = from.match(/^"?([^"<]+)"?\s*</);
	if (match) return match[1]!.trim();
	return from.split("@")[0] ?? from;
}

export async function gmailTriage(
	options: GmailTriageOptions = {},
): Promise<GmailTriageResult> {
	const maxResults = Math.min(options.limit ?? 20, 50);

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
		return { totalUnread: 0, actionable: [] };
	}

	// Fetch message details in parallel batches
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

	// Filter noise and build result
	const actionable: EmailMessage[] = messages
		.filter((msg) => !isNoise(getHeader(msg, "From")))
		.map((msg) => {
			const from = getHeader(msg, "From");
			return {
				id: msg.id,
				from,
				subject: getHeader(msg, "Subject"),
				senderName: extractSenderName(from),
			};
		});

	return { totalUnread, actionable };
}
