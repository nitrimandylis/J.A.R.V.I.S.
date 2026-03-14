/**
 * Shared helper for running the `gws` CLI tool.
 * Used by check-calendar and gmail-triage core functions.
 */

export async function runGws(args: readonly string[]): Promise<string> {
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
			throw new Error("Not authenticated. Run: gws auth login -s calendar");
		}
		throw new Error(`gws failed: ${error.trim()}`);
	}
	return stdout.trim();
}
