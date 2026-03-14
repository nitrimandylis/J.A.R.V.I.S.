/**
 * Human-readable formatters for Google service results.
 * Pure functions: structured result → string.
 */

import type { CheckCalendarResult, GmailTriageResult } from "../core/types.ts";

function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return `${str.slice(0, maxLen - 1)}…`;
}

export function formatCalendarResult(result: CheckCalendarResult): string {
	const lines: string[] = [];

	for (const day of result.days) {
		if (day.events.length === 0) {
			lines.push(`    ${day.label}: free`);
			continue;
		}

		const eventStrs = day.events.map((e) => {
			if (e.startTime) {
				const time = new Date(e.startTime).toLocaleTimeString("en-GB", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				});
				return `${e.summary} @ ${time}`;
			}
			return e.summary;
		});

		const busyTag = day.events.length >= 3 ? " — busy" : "";
		lines.push(`    ${day.label}: ${eventStrs.join(" · ")}${busyTag}`);
	}

	// Replace leading spaces on first line with emoji
	if (lines.length > 0) {
		lines[0] = `📅  ${lines[0]!.trimStart()}`;
	}

	return lines.join("\n");
}

export function formatGmailResult(result: GmailTriageResult): string {
	if (result.totalUnread === 0) {
		return "📬  Inbox clear.";
	}

	if (result.actionable.length === 0) {
		return `📬  Inbox clear (${result.totalUnread} unread, all filtered as noise).`;
	}

	const lines: string[] = [];
	lines.push(
		`📬  ${result.actionable.length} unread (filtered from ${result.totalUnread} total):`,
	);

	for (const msg of result.actionable) {
		const subject = truncate(msg.subject || "(no subject)", 50);
		lines.push(`    "${subject}" — ${msg.senderName}`);
	}

	return lines.join("\n");
}
