import { runGws } from "./gws.ts";
import type {
	CalendarDayGroup,
	CalendarEvent,
	CheckCalendarOptions,
	CheckCalendarResult,
} from "./types.ts";

const CALENDARS = ["Scheduled", "School Hours"] as const;

interface CalendarEntry {
	readonly id: string;
	readonly summary: string;
}

interface RawCalendarEvent {
	readonly summary?: string;
	readonly start?: { dateTime?: string; date?: string };
	readonly end?: { dateTime?: string; date?: string };
}

interface EventsResponse {
	readonly items?: readonly RawCalendarEvent[];
}

interface CalendarListResponse {
	readonly items?: readonly CalendarEntry[];
}

async function findCalendarIds(): Promise<ReadonlyMap<string, string>> {
	const raw = await runGws([
		"calendar",
		"calendarList",
		"list",
		"--params",
		"{}",
	]);
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
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
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

export async function checkCalendar(
	options: CheckCalendarOptions = {},
): Promise<CheckCalendarResult> {
	const numDays = Math.min(options.days ?? 4, 14);
	const calendarIds = await findCalendarIds();

	if (calendarIds.size === 0) {
		throw new Error(
			`No matching calendars found. Expected: ${CALENDARS.join(", ")}`,
		);
	}

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const endDate = new Date(today);
	endDate.setDate(endDate.getDate() + numDays);

	// Fetch events from all calendars in parallel
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
			return items.map(
				(e): CalendarEvent => ({
					summary: e.summary ?? "Untitled",
					startTime: e.start?.dateTime ?? null,
					startDate: e.start?.date ?? null,
					calendar: calName,
				}),
			);
		},
	);

	const results = await Promise.all(fetches);
	const allEvents = results.flat();

	// Sort by start time
	allEvents.sort((a, b) => {
		const aTime = a.startTime ?? a.startDate ?? "";
		const bTime = b.startTime ?? b.startDate ?? "";
		return aTime.localeCompare(bTime);
	});

	// Deduplicate by summary + start time
	const seen = new Set<string>();
	const deduped = allEvents.filter((e) => {
		const key = `${e.summary}|${e.startTime ?? e.startDate}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	// Filter out all-day background blocks
	const filtered = deduped.filter((e) => {
		if (!e.startTime && e.startDate) {
			const title = e.summary.trim().toLowerCase();
			if (!title || title === "school hours") return false;
		}
		return true;
	});

	// Group by day
	const dayGroups: CalendarDayGroup[] = [];
	const dayMap = new Map<string, CalendarEvent[]>();

	for (let d = 0; d < numDays; d++) {
		const date = new Date(today);
		date.setDate(date.getDate() + d);
		const key = date.toISOString().split("T")[0]!;
		dayMap.set(key, []);
	}

	for (const event of filtered) {
		const startStr = event.startTime ?? event.startDate ?? "";
		const dateKey = startStr.split("T")[0]!;
		const bucket = dayMap.get(dateKey);
		if (bucket) {
			bucket.push(event);
		}
	}

	for (const [dateKey, events] of dayMap) {
		const date = new Date(`${dateKey}T00:00:00`);
		dayGroups.push({
			dateKey,
			label: getDateLabel(date, today),
			events,
		});
	}

	return {
		days: dayGroups,
		totalEvents: filtered.length,
	};
}
