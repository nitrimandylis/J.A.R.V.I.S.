---
name: check-calendar
description: Use when Nick wants to check his upcoming calendar events for today and the next few days
---

# Check Calendar

## When to Use
Trigger phrases:
- "what's on my calendar"
- "check my schedule"
- "what do I have today"
- "any events coming up"
- "what's happening this week"

Also runs automatically as part of `/start`.

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
