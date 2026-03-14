/**
 * Output format dispatcher.
 * Routes between JSON serialization and human-readable formatting.
 */

import type { OutputMode } from "../core/types.ts";

export function formatOutput<T>(
	result: T,
	mode: OutputMode,
	humanFormatter: (result: T) => string,
): string {
	if (mode === "json") {
		return JSON.stringify(result, null, 2);
	}
	return humanFormatter(result);
}
