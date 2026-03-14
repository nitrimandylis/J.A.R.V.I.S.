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
import { checkCalendar } from "../src/core/check-calendar.ts";
import { formatOutput } from "../src/presentation/format.ts";
import { formatCalendarResult } from "../src/presentation/google-formatters.ts";

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			days: { type: "string", default: "4" },
			json: { type: "boolean", default: false },
		},
		strict: true,
	});

	const result = await checkCalendar({
		days: Number.parseInt(values.days!, 10),
	});

	const mode = values.json ? "json" : "human";
	console.log(formatOutput(result, mode, formatCalendarResult));
}

main().catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});
