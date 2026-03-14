import { describe, expect, test } from "bun:test";
import type {
	CheckCalendarResult,
	GmailTriageResult,
} from "../../src/core/types.ts";
import {
	formatCalendarResult,
	formatGmailResult,
} from "../../src/presentation/google-formatters.ts";

describe("formatCalendarResult", () => {
	test("formats free days", () => {
		const result: CheckCalendarResult = {
			days: [
				{ dateKey: "2026-03-15", label: "Today (Sun, Mar 15)", events: [] },
			],
			totalEvents: 0,
		};
		const output = formatCalendarResult(result);
		expect(output).toContain("📅");
		expect(output).toContain("Today (Sun, Mar 15): free");
	});

	test("formats days with events", () => {
		const result: CheckCalendarResult = {
			days: [
				{
					dateKey: "2026-03-15",
					label: "Today (Sun, Mar 15)",
					events: [
						{
							summary: "Math Class",
							startTime: "2026-03-15T09:00:00+02:00",
							startDate: null,
							calendar: "School Hours",
						},
						{
							summary: "CS Lab",
							startTime: "2026-03-15T11:00:00+02:00",
							startDate: null,
							calendar: "School Hours",
						},
					],
				},
			],
			totalEvents: 2,
		};
		const output = formatCalendarResult(result);
		expect(output).toContain("Math Class @ ");
		expect(output).toContain(" · CS Lab @ ");
	});

	test("shows busy tag for 3+ events", () => {
		const result: CheckCalendarResult = {
			days: [
				{
					dateKey: "2026-03-15",
					label: "Today (Sun, Mar 15)",
					events: [
						{
							summary: "A",
							startTime: "2026-03-15T09:00:00Z",
							startDate: null,
							calendar: "Scheduled",
						},
						{
							summary: "B",
							startTime: "2026-03-15T10:00:00Z",
							startDate: null,
							calendar: "Scheduled",
						},
						{
							summary: "C",
							startTime: "2026-03-15T11:00:00Z",
							startDate: null,
							calendar: "Scheduled",
						},
					],
				},
			],
			totalEvents: 3,
		};
		expect(formatCalendarResult(result)).toContain("— busy");
	});
});

describe("formatGmailResult", () => {
	test("formats empty inbox", () => {
		const result: GmailTriageResult = { totalUnread: 0, actionable: [] };
		expect(formatGmailResult(result)).toBe("📬  Inbox clear.");
	});

	test("formats all-noise inbox", () => {
		const result: GmailTriageResult = { totalUnread: 5, actionable: [] };
		expect(formatGmailResult(result)).toContain(
			"5 unread, all filtered as noise",
		);
	});

	test("formats actionable messages", () => {
		const result: GmailTriageResult = {
			totalUnread: 10,
			actionable: [
				{
					id: "msg-1",
					from: "Alice <alice@example.com>",
					subject: "Meeting tomorrow",
					senderName: "Alice",
				},
				{
					id: "msg-2",
					from: "bob@example.com",
					subject: "Project update",
					senderName: "bob",
				},
			],
		};
		const output = formatGmailResult(result);
		expect(output).toContain("2 unread (filtered from 10 total):");
		expect(output).toContain('"Meeting tomorrow" — Alice');
		expect(output).toContain('"Project update" — bob');
	});

	test("truncates long subjects", () => {
		const result: GmailTriageResult = {
			totalUnread: 1,
			actionable: [
				{
					id: "msg-1",
					from: "sender@example.com",
					subject: "A".repeat(60),
					senderName: "sender",
				},
			],
		};
		const output = formatGmailResult(result);
		expect(output).toContain("…");
	});
});
