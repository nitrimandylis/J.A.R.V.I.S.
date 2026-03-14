#!/usr/bin/env bun

/**
 * Fetch upcoming calendar events for the next N days.
 *
 * Usage:
 *   bun run tools/check-calendar.ts [--days <n>] [--json]
 *
 * Examples:
 *   bun run tools/check-calendar.ts
 *   bun run tools/check-calendar.ts --days 7
 *   bun run tools/check-calendar.ts --json
 *
 * Requires: gws CLI authenticated (run `gws auth login -s calendar`)
 */

import { parseArgs } from "node:util";

const CALENDARS = ["Scheduled", "School Hours"] as const;

interface CalendarEntry {
	readonly id: string;
	readonly summary: string;
}

interface CalendarEvent {
	readonly summary?: string;
	readonly start?: { dateTime?: string; date?: string };
	readonly end?: { dateTime?: string; date?: string };
	readonly calendar: string;
}

interface EventsResponse {
	readonly items?: readonly CalendarEvent[];
}

interface CalendarListResponse {
	readonly items?: readonly CalendarEntry[];
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
			throw new Error(
				"Not authenticated. Run: gws auth login -s calendar",
			);
		}
		throw new Error(`gws failed: ${error.trim()}`);
	}
	return stdout.trim();
}

async function findCalendarIds(): Promise<
	ReadonlyMap<string, string>
> {
	const raw = await runGws(["calendar", "calendarList", "list", "--params", "{}"]);
	const data = JSON.parse(raw) as CalendarListResponse;
	const entries = data.items ?? [];

	const ids = new Map<string, string>();
	for (const cal of CALENDARS) {
		const match = entries.find(
			(e) => e.summary?.toLowerCase() === cal.toLowerCase(),
		);
		if (match) {
			ids.set(cal, match.id);
		}
	}
	return ids;
}

function formatDate(d: Date): string {
	return d.toISOString();
}

function getDateLabel(date: Date, today: Date): string {
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const months = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	];

	const diffMs = date.getTime() - today.getTime();
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
	const dayName = days[date.getDay()]!;
	const monthName = months[date.getMonth()]!;
	const dateNum = date.getDate();

	if (diffDays === 0) return `Today (${dayName}, ${monthName} ${dateNum})`;
	if (diffDays === 1) return `Tomorrow (${dayName}, ${monthName} ${dateNum})`;
	return `${dayName}, ${monthName} ${dateNum}`;
}

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			days: { type: "string", default: "4" },
			json: { type: "boolean", default: false },
		},
		strict: true,
	});

	const numDays = Math.min(Number.parseInt(values.days!, 10), 14);
	const calendarIds = await findCalendarIds();

	if (calendarIds.size === 0) {
		console.error(
			"Error: No matching calendars found. Expected: " +
				CALENDARS.join(", "),
		);
		process.exit(1);
	}

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const endDate = new Date(today);
	endDate.setDate(endDate.getDate() + numDays);

	// Fetch events from all calendars in parallel
	const allEvents: CalendarEvent[] = [];

	const fetches = Array.from(calendarIds.entries()).map(
		async ([calName, calId]) => {
			const raw = await runGws([
				"calendar",
				"events",
				"list",
				"--params",
				JSON.stringify({
					calendarId: calId,
					timeMin: formatDate(today),
					timeMax: formatDate(endDate),
					singleEvents: true,
					orderBy: "startTime",
					maxResults: 50,
				}),
			]);
			const data = JSON.parse(raw) as EventsResponse;
			const items = data.items ?? [];
			return items.map((e) => ({ ...e, calendar: calName }));
		},
	);

	const results = await Promise.all(fetches);
	for (const events of results) {
		allEvents.push(...events);
	}

	// Sort by start time
	allEvents.sort((a, b) => {
		const aTime = a.start?.dateTime ?? a.start?.date ?? "";
		const bTime = b.start?.dateTime ?? b.start?.date ?? "";
		return aTime.localeCompare(bTime);
	});

	// Deduplicate by summary + start time
	const seen = new Set<string>();
	const deduped = allEvents.filter((e) => {
		const key = `${e.summary}|${e.start?.dateTime ?? e.start?.date}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	// Filter out all-day background blocks (e.g. "School Hours" with no specific title)
	const filtered = deduped.filter((e) => {
		if (!e.start?.dateTime && e.start?.date) {
			// All-day event — skip if no meaningful title
			const title = (e.summary ?? "").trim().toLowerCase();
			if (!title || title === "school hours") return false;
		}
		return true;
	});

	if (values.json) {
		console.log(JSON.stringify(filtered, null, 2));
		return;
	}

	// Group by day
	const dayMap = new Map<string, CalendarEvent[]>();
	for (let d = 0; d < numDays; d++) {
		const date = new Date(today);
		date.setDate(date.getDate() + d);
		const key = date.toISOString().split("T")[0]!;
		dayMap.set(key, []);
	}

	for (const event of filtered) {
		const startStr = event.start?.dateTime ?? event.start?.date ?? "";
		const dateKey = startStr.split("T")[0]!;
		const bucket = dayMap.get(dateKey);
		if (bucket) {
			bucket.push(event);
		}
	}

	// Format output
	const lines: string[] = [];
	for (const [dateKey, events] of dayMap) {
		const date = new Date(dateKey + "T00:00:00");
		const label = getDateLabel(date, today);

		if (events.length === 0) {
			lines.push(`    ${label}: free`);
			continue;
		}

		const eventStrs = events.map((e) => {
			const title = e.summary ?? "Untitled";
			if (e.start?.dateTime) {
				const time = new Date(e.start.dateTime).toLocaleTimeString(
					"en-GB",
					{ hour: "2-digit", minute: "2-digit", hour12: false },
				);
				return `${title} @ ${time}`;
			}
			return title;
		});

		const busyTag = events.length >= 3 ? " — busy" : "";
		lines.push(
			`    ${label}: ${eventStrs.join(" · ")}${busyTag}`,
		);
	}

	// Replace leading spaces on first line with emoji
	if (lines.length > 0) {
		lines[0] = `📅  ${lines[0]!.trimStart()}`;
	}

	console.log(lines.join("\n"));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
