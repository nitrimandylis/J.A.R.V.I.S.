---
name: check-calendar
description: Fetch upcoming Google Calendar events. Use when Nick asks "what's on my calendar", "check my schedule", "what do I have today", "any events coming up", or "what's happening this week". Also used as part of the start/briefing skill.
---

# Check Calendar

## How to Run
```bash
bun run tools/check-calendar.ts [--days <n>] [--json]
```

This tool uses the `gws` CLI (Google Workspace CLI) to fetch events from the `Scheduled` and `School Hours` calendars for the next 4 days (configurable via `--days`).

## Auth Setup
If the tool fails with an auth error, run:
```bash
gws auth login -s calendar
```

## Output
The tool handles all formatting. It outputs a day-by-day view with events sorted by time, deduplication, and noise filtering built in.
